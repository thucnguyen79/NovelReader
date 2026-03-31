import { getSetting } from '../database/database';
import { getTargetLanguageName } from '../i18n/i18n';

interface GeminiCandidate {
  content?: {
    parts?: Array<{ text?: string }>;
  };
  finishReason?: string; // 'STOP' | 'MAX_TOKENS' | 'SAFETY' | 'RECITATION' | 'OTHER'
}

interface GeminiResponse {
  candidates?: GeminiCandidate[];
  error?: { message: string, code?: number, status?: string };
}

export async function getApiKey(): Promise<string | null> {
  return getSetting('geminiApiKey');
}

export async function getGeminiModel(): Promise<string> {
  const model = await getSetting('geminiModel');
  return model || 'gemini-1.5-flash';
}

let lastRequestTime = 0;
const MIN_API_DELAY_MS = 4500; // Limits to ~13 RPM (Max is 15 RPM)

/**
 * Translates a single chunk of text via Gemini API.
 * Checks `finishReason` to detect truncated output.
 * Returns { text, isComplete } so callers can decide to retry.
 */
async function callGeminiAPI(
  text: string,
  contextSummary: string,
  apiKey: string,
  retryCount: number = 0
): Promise<{ text: string; isComplete: boolean }> {
  // Global Rate Limiter
  const now = Date.now();
  const timeSinceLastReq = now - lastRequestTime;
  if (timeSinceLastReq < MIN_API_DELAY_MS && lastRequestTime !== 0) {
    await new Promise(resolve => setTimeout(resolve, MIN_API_DELAY_MS - timeSinceLastReq));
  }
  lastRequestTime = Date.now();

  const prompt = buildTranslationPrompt(text, contextSummary, await getTranslationLanguage());
  const model = await getGeminiModel();
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

  const response = await fetch(`${url}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      safetySettings: [
        { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
      ],
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 8192,
      },
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    if (response.status === 404) {
      throw new Error(`Mô hình "${model}" không tồn tại hoặc API Key của bạn không có quyền truy cập. Hãy vào Cài đặt đổi sang mô hình khác.`);
    }
    if (response.status === 429) {
      if (errText.includes('limit: 0')) {
        throw new Error(`API Key không hỗ trợ mô hình "${model}" (Limit = 0). Hãy vào Cài đặt đổi mô hình.`);
      }
      if (errText.includes('Quota exceeded') || errText.includes('exceeded your current quota')) {
        throw new Error(`API Key đã hết hạn mức cho mô hình "${model}". Vui lòng đổi Key hoặc chờ sang ngày mới.`);
      }
      if (retryCount < 2) {
        console.log(`[Gemini] Rate limit 429. Retry ${retryCount + 1}/2 in 30s...`);
        await new Promise(resolve => setTimeout(resolve, 30000));
        return callGeminiAPI(text, contextSummary, apiKey, retryCount + 1);
      }
    }
    throw new Error(`Gemini API error (${response.status}): ${errText}`);
  }

  const data: GeminiResponse = await response.json();

  if (data.error) {
    if (data.error.code === 429) {
      if (typeof data.error.message === 'string') {
        if (data.error.message.includes('limit: 0')) {
          throw new Error('API Key không hỗ trợ mô hình này (Limit = 0). Hãy vào Cài đặt đổi mô hình.');
        }
        if (data.error.message.includes('Quota exceeded') || data.error.message.includes('exceeded your current quota')) {
          throw new Error(`API Key đã hết hạn mức cho mô hình "${await getGeminiModel()}". Vui lòng đổi Key hoặc chờ sang ngày mới.`);
        }
      }
      if (retryCount < 2) {
        console.log(`[Gemini] Rate limit 429 (body). Retry ${retryCount + 1}/2 in 30s...`);
        await new Promise(resolve => setTimeout(resolve, 30000));
        return callGeminiAPI(text, contextSummary, apiKey, retryCount + 1);
      }
    }
    throw new Error(`Gemini API: ${data.error.message}`);
  }

  const candidate = data.candidates?.[0];
  const finishReason = candidate?.finishReason || 'UNKNOWN';
  const resultText = candidate?.content?.parts?.[0]?.text?.trim() || '';

  console.log(`[Gemini] finishReason=${finishReason}, inputChars=${text.length}, outputChars=${resultText.length}`);

  if (!resultText) {
    if (finishReason === 'SAFETY') {
      console.warn('[Gemini] Response blocked by SAFETY filter. Will attempt sub-splitting.');
      return { text: '', isComplete: false };
    }
    throw new Error('Không nhận được kết quả dịch từ Gemini.');
  }

  const isComplete = finishReason === 'STOP';
  if (!isComplete) {
    console.warn(`[Gemini] Incomplete translation: finishReason=${finishReason}`);
  }

  return { text: resultText, isComplete };
}

/**
 * Self-healing translateText: if Gemini returns a truncated response,
 * automatically splits the input in half and retries both halves.
 * Max recursion depth prevents infinite loops.
 */
export async function translateText(
  text: string,
  contextSummary: string = '',
  apiKey: string,
  _splitDepth: number = 0
): Promise<string> {
  const MAX_SPLIT_DEPTH = 3; // Max 3 levels of sub-splitting (chunk → 1/2 → 1/4 → 1/8)

  const { text: translated, isComplete } = await callGeminiAPI(text, contextSummary, apiKey);

  // If complete or we've reached max split depth, return what we have
  if (isComplete || _splitDepth >= MAX_SPLIT_DEPTH) {
    if (!translated && _splitDepth >= MAX_SPLIT_DEPTH) {
      // Safety blocked even at smallest chunk — return original text as fallback
      console.warn('[Gemini] Cannot translate even at smallest chunk size. Returning original.');
      return text;
    }
    return translated;
  }

  // Incomplete response — split the text in half and translate each half separately
  console.log(`[Gemini] Self-healing: splitting chunk (depth=${_splitDepth + 1}, chars=${text.length})`);

  const lines = text.split('\n');
  if (lines.length <= 1) {
    // Single line that can't be split further — return whatever we got
    return translated || text;
  }

  const midLine = Math.ceil(lines.length / 2);
  const firstHalf = lines.slice(0, midLine).join('\n');
  const secondHalf = lines.slice(midLine).join('\n');

  const t1 = await translateText(firstHalf, contextSummary, apiKey, _splitDepth + 1);
  const t2 = await translateText(secondHalf, t1.slice(-300), apiKey, _splitDepth + 1);

  return t1 + '\n' + t2;
}

async function getTranslationLanguage(): Promise<string> {
  const lang = await getSetting('translationLanguage');
  return lang || 'vi';
}

function buildTranslationPrompt(text: string, contextSummary: string, targetLang: string = 'vi'): string {
  const langName = getTargetLanguageName(targetLang);
  let prompt = `You are a professional translator specializing in novels and fiction. Translate the following text into ${langName}.

CRITICAL RULES:
- You MUST translate EVERY SINGLE sentence in the text below. Do NOT skip, summarize, or omit anything.
- Translate naturally with literary style, not word-by-word
- Preserve emotions, tone, and atmosphere of the story
- Keep character names as-is or transliterate naturally
- Return ONLY the translated text, no notes, comments, or explanations
- Do NOT add any website tips, author notes, or metadata from original source`;

  if (contextSummary) {
    prompt += `\n\nPrevious context for continuity:\n${contextSummary}`;
  }

  prompt += `\n\nText to translate:\n${text}`;

  return prompt;
}

export function splitTextIntoChunks(text: string, maxChunkSize: number = 2500): string[] {
  const paragraphs = text.split('\n');
  const chunks: string[] = [];
  let currentChunk = '';

  for (const paragraph of paragraphs) {
    if (!paragraph.trim()) continue;

    if (currentChunk.length + paragraph.length + 1 > maxChunkSize && currentChunk.length > 0) {
      chunks.push(currentChunk.trim());
      currentChunk = '';
    }
    currentChunk += (currentChunk ? '\n' : '') + paragraph.trim();
  }

  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  return chunks.length > 0 ? chunks : [text];
}

export async function translateChapter(
  originalContent: string,
  apiKey: string,
  onProgress?: (current: number, total: number) => void
): Promise<string> {
  const chunks = splitTextIntoChunks(originalContent);
  const translatedChunks: string[] = [];
  let contextSummary = '';

  for (let i = 0; i < chunks.length; i++) {
    onProgress?.(i + 1, chunks.length);

    const translated = await translateText(chunks[i], contextSummary, apiKey);
    translatedChunks.push(translated);

    // Build context from last translated chunk (truncated)
    contextSummary = translated.slice(-500);
  }

  return translatedChunks.join('\n\n');
}
