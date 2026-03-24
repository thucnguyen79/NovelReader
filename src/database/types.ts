export interface Book {
  id: number;
  title: string;
  sourceLanguage: string;
  coverColor: string;
  createdAt: string;
  updatedAt: string;
}

export interface Chapter {
  id: number;
  bookId: number;
  chapterNumber: number;
  title: string;
  originalContent: string;
  translatedContent: string | null;
  isTranslated: boolean;
}

export interface ReadingProgress {
  id: number;
  bookId: number;
  chapterId: number;
  position: number;
  ttsSpeed: number;
  ttsVoice: string | null;
  lastReadAt: string;
}

export interface AppSettings {
  geminiApiKey: string;
  defaultTtsSpeed: number;
  defaultTtsVoice: string;
  sleepTimerMinutes: number;
  readerFontSize: number;
}
