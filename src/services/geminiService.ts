import { getSetting } from '../database/database';
import { getTargetLanguageName } from '../i18n/i18n';

interface GeminiResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>;
    };
  }>;
  error?: { message: string, code?: number, status?: string };
}

export async function getApiKey(): Promise<string | null> {
  return getSetting('geminiApiKey');
}

export async function getGeminiModel(): Promise<string> {
  const model = await getSetting('geminiModel');
  return model || 'gemini-1.5-flash';
}

export async function translateText(
  text: string,
  contextSummary: string = '',
  apiKey: string,
  retryCount: number = 0
): Promise<string> {
  const prompt = buildTranslationPrompt(text, contextSummary, await getTranslationLanguage());
  const model = await getGeminiModel();
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

  const response = await fetch(`${url}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 8192,
      },
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    if (response.status === 404) {
      throw new Error(`Mô hình "${model}" không tồn tại hoặc API Key của bạn không có quyền truy cập. Hãy vào Cài đặt đổi sang mô hình khác hoặc nhập tay "gemini-2.0-flash-exp".`);
    }
    if (response.status === 429) {
      if (errText.includes('limit: 0')) {
        throw new Error(`API Key không hỗ trợ mô hình "${model}" (Limit = 0). Hãy vào Cài đặt chọn mô hình "2.0 Flash (Thử nghiệm)" hoặc tự nhập "gemini-2.0-flash-exp".`);
      }
      if (retryCount < 2) {
        console.log('Rate limit hit (429). Retrying in 30s...');
        await new Promise(resolve => setTimeout(resolve, 30000));
        return translateText(text, contextSummary, apiKey, retryCount + 1);
      }
    }
    throw new Error(`Gemini API error (${response.status}): ${errText}`);
  }

  const data: GeminiResponse = await response.json();

  if (data.error) {
    if (data.error.code === 429) {
      if (typeof data.error.message === 'string' && data.error.message.includes('limit: 0')) {
        throw new Error('API Key của bạn không hỗ trợ mô hình này (Limit = 0). Hãy vào tab Cài đặt đổi sang mô hình khác.');
      }
      if (retryCount < 2) {
        console.log('Rate limit hit (429 data code). Retrying in 30s...');
        await new Promise(resolve => setTimeout(resolve, 30000));
        return translateText(text, contextSummary, apiKey, retryCount + 1);
      }
    }
    throw new Error(`Gemini API: ${data.error.message}`);
  }

  const result = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!result) {
    throw new Error('Không nhận được kết quả dịch từ Gemini.');
  }

  return result.trim();
}

async function getTranslationLanguage(): Promise<string> {
  const lang = await getSetting('translationLanguage');
  return lang || 'vi';
}

function buildTranslationPrompt(text: string, contextSummary: string, targetLang: string = 'vi'): string {
  const langName = getTargetLanguageName(targetLang);
  let prompt = `You are a professional translator specializing in novels and fiction. Translate the following text into ${langName}.

Requirements:
- Translate naturally, keep the literary style, do not translate word by word
- Preserve context and emotions of the story
- Keep character names as-is or transliterate naturally
- Return only the translation, no notes or explanations`;

  if (contextSummary) {
    prompt += `\n\nPrevious context:\n${contextSummary}`;
  }

  prompt += `\n\nText to translate:\n${text}`;

  return prompt;
}

export function splitTextIntoChunks(text: string, maxChunkSize: number = 2500): string[] {
  const paragraphs = text.split(/\n\s*\n/);
  const chunks: string[] = [];
  let currentChunk = '';

  for (const paragraph of paragraphs) {
    if (currentChunk.length + paragraph.length + 2 > maxChunkSize && currentChunk.length > 0) {
      chunks.push(currentChunk.trim());
      currentChunk = '';
    }
    currentChunk += (currentChunk ? '\n\n' : '') + paragraph;
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

    let translated = '';
    try {
      translated = await translateText(chunks[i], contextSummary, apiKey);
    } catch (error) {
      if (i > 0) {
        // If we translated at least 1 chunk, don't fail the whole chapter, just append error
        translated = `\n\n[LỖI DỊCH ĐOẠN NÀY: ${(error as Error).message}]\n\n` + chunks[i];
      } else {
        throw error; // Fail whole chapter if first chunk fails
      }
    }
    
    translatedChunks.push(translated);

    // Build context from last translated chunk (truncated)
    contextSummary = translated.slice(-500);

    // Constant delay of 4.5 seconds to respect 15 Requests Per Minute limit (~4s per req)
    if (i < chunks.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 4500));
    }
  }

  return translatedChunks.join('\n\n');
}
