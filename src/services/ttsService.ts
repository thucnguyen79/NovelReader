import * as Speech from 'expo-speech';

export interface VoiceInfo {
  identifier: string;
  name: string;
  language: string;
}

let sleepTimerId: ReturnType<typeof setTimeout> | null = null;
let isSpeakingState = false;
let currentSentenceIndex = 0;
let sentences: string[] = [];
let onSentenceChangeCallback: ((index: number) => void) | null = null;
let currentSpeed = 1.0;
let currentVoice: string | undefined = undefined;

export function splitIntoSentences(text: string): string[] {
  // Split by sentence-ending punctuation followed by space or newline
  const parts = text.split(/(?<=[.!?。！？\n])\s+/);
  return parts.filter((s) => s.trim().length > 0);
}

export async function getAvailableVoices(): Promise<VoiceInfo[]> {
  const voices = await Speech.getAvailableVoicesAsync();
  return voices
    .filter((v) => v.language.startsWith('vi') || v.language.startsWith('en'))
    .map((v) => ({
      identifier: v.identifier,
      name: v.name || v.identifier,
      language: v.language,
    }))
    .sort((a, b) => {
      // Vietnamese voices first
      if (a.language.startsWith('vi') && !b.language.startsWith('vi')) return -1;
      if (!a.language.startsWith('vi') && b.language.startsWith('vi')) return 1;
      return a.name.localeCompare(b.name);
    });
}

export function speakText(
  text: string,
  options?: {
    speed?: number;
    voice?: string;
    onStart?: () => void;
    onDone?: () => void;
    onSentenceChange?: (sentenceIndex: number) => void;
  }
): void {
  stopSpeaking();

  sentences = splitIntoSentences(text);
  currentSentenceIndex = 0;
  currentSpeed = options?.speed ?? 1.0;
  currentVoice = options?.voice;
  onSentenceChangeCallback = options?.onSentenceChange ?? null;

  if (sentences.length === 0) return;

  isSpeakingState = true;
  options?.onStart?.();

  speakSentence(currentSentenceIndex, options?.onDone);
}

function speakSentence(index: number, onAllDone?: () => void): void {
  if (index >= sentences.length || !isSpeakingState) {
    isSpeakingState = false;
    onAllDone?.();
    return;
  }

  currentSentenceIndex = index;
  onSentenceChangeCallback?.(index);

  Speech.speak(sentences[index], {
    rate: currentSpeed,
    voice: currentVoice,
    onDone: () => {
      if (isSpeakingState) {
        speakSentence(index + 1, onAllDone);
      }
    },
    onError: () => {
      // Continue to next sentence on error
      if (isSpeakingState) {
        speakSentence(index + 1, onAllDone);
      }
    },
  });
}

export function resumeSpeaking(onDone?: () => void): void {
  if (sentences.length === 0) return;
  isSpeakingState = true;
  speakSentence(currentSentenceIndex, onDone);
}

export function pauseSpeaking(): void {
  isSpeakingState = false;
  Speech.stop();
}

export function stopSpeaking(): void {
  isSpeakingState = false;
  currentSentenceIndex = 0;
  sentences = [];
  onSentenceChangeCallback = null;
  Speech.stop();
  clearSleepTimer();
}

export function isSpeaking(): boolean {
  return isSpeakingState;
}

export function getCurrentSentenceIndex(): number {
  return currentSentenceIndex;
}

export function getSentences(): string[] {
  return sentences;
}

export function setSpeed(speed: number): void {
  currentSpeed = speed;
}

export function setVoice(voiceId: string): void {
  currentVoice = voiceId;
}

let onAllDoneCallback: (() => void) | undefined = undefined;

export function skipForward(onDone?: () => void): void {
  if (sentences.length === 0) return;
  Speech.stop();
  const nextIdx = Math.min(currentSentenceIndex + 1, sentences.length - 1);
  if (nextIdx >= sentences.length) {
    isSpeakingState = false;
    onDone?.();
    return;
  }
  currentSentenceIndex = nextIdx;
  onSentenceChangeCallback?.(nextIdx);
  if (isSpeakingState) {
    speakSentence(nextIdx, onDone || onAllDoneCallback);
  }
}

export function skipBackward(onDone?: () => void): void {
  if (sentences.length === 0) return;
  Speech.stop();
  const prevIdx = Math.max(currentSentenceIndex - 1, 0);
  currentSentenceIndex = prevIdx;
  onSentenceChangeCallback?.(prevIdx);
  if (isSpeakingState) {
    speakSentence(prevIdx, onDone || onAllDoneCallback);
  }
}

// ==================== SLEEP TIMER ====================

export function setSleepTimer(
  minutes: number,
  onTimerEnd?: () => void
): void {
  clearSleepTimer();
  if (minutes <= 0) return;

  sleepTimerId = setTimeout(() => {
    stopSpeaking();
    onTimerEnd?.();
  }, minutes * 60 * 1000);
}

export function clearSleepTimer(): void {
  if (sleepTimerId) {
    clearTimeout(sleepTimerId);
    sleepTimerId = null;
  }
}

export function getSleepTimerActive(): boolean {
  return sleepTimerId !== null;
}
