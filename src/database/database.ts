import AsyncStorage from '@react-native-async-storage/async-storage';
import { Book, Chapter, ReadingProgress } from './types';

const COVER_COLORS = [
  '#7C3AED', '#A78BFA', '#F472B6', '#DB2777',
  '#059669', '#34D399', '#D97706', '#FBBF24',
  '#3B82F6', '#06B6D4', '#8B5CF6', '#EC4899',
];

function randomColor(): string {
  return COVER_COLORS[Math.floor(Math.random() * COVER_COLORS.length)];
}

const KEYS = {
  BOOKS: 'books_v1',
  CHAPTERS: 'chapters_v1',
  PROGRESS: 'progress_v1',
  SETTINGS: 'settings_v1',
};

// ==================== BOOKS ====================

export async function getAllBooks(): Promise<Book[]> {
  const data = await AsyncStorage.getItem(KEYS.BOOKS);
  if (!data) return [];
  const books: Book[] = JSON.parse(data);
  return books.sort((a, b) => new Date(b.updatedAt!).getTime() - new Date(a.updatedAt!).getTime());
}

export async function getBook(id: number): Promise<Book | null> {
  const books = await getAllBooks();
  return books.find(b => b.id === id) || null;
}

export async function createBook(title: string, sourceLanguage: string = ''): Promise<number> {
  const books = await getAllBooks();
  const newId = books.length > 0 ? Math.max(...books.map(b => b.id)) + 1 : 1;
  const newBook: Book = {
    id: newId,
    title,
    sourceLanguage,
    coverColor: randomColor(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  books.push(newBook);
  await AsyncStorage.setItem(KEYS.BOOKS, JSON.stringify(books));
  return newId;
}

export async function deleteBook(id: number): Promise<void> {
  const books = await getAllBooks();
  await AsyncStorage.setItem(KEYS.BOOKS, JSON.stringify(books.filter(b => b.id !== id)));
  
  // Cascade delete chapters
  const chapters = await AsyncStorage.getItem(KEYS.CHAPTERS);
  if (chapters) {
    const allChapters: Chapter[] = JSON.parse(chapters);
    await AsyncStorage.setItem(KEYS.CHAPTERS, JSON.stringify(allChapters.filter(c => c.bookId !== id)));
  }

  // Cascade delete progress
  const progressList = await AsyncStorage.getItem(KEYS.PROGRESS);
  if (progressList) {
    const allProgress: ReadingProgress[] = JSON.parse(progressList);
    await AsyncStorage.setItem(KEYS.PROGRESS, JSON.stringify(allProgress.filter(p => p.bookId !== id)));
  }
}

export async function updateBookTimestamp(id: number): Promise<void> {
  const books = await getAllBooks();
  const index = books.findIndex(b => b.id === id);
  if (index !== -1) {
    books[index].updatedAt = new Date().toISOString();
    await AsyncStorage.setItem(KEYS.BOOKS, JSON.stringify(books));
  }
}

// ==================== CHAPTERS ====================

export async function getChapters(bookId: number): Promise<Chapter[]> {
  const data = await AsyncStorage.getItem(KEYS.CHAPTERS);
  if (!data) return [];
  const allChapters: Chapter[] = JSON.parse(data);
  return allChapters.filter(c => c.bookId === bookId).sort((a, b) => a.chapterNumber - b.chapterNumber);
}

export async function getChapter(id: number): Promise<Chapter | null> {
  const data = await AsyncStorage.getItem(KEYS.CHAPTERS);
  if (!data) return null;
  const allChapters: Chapter[] = JSON.parse(data);
  return allChapters.find(c => c.id === id) || null;
}

export async function createChapter(
  bookId: number,
  chapterNumber: number,
  title: string,
  content: string
): Promise<number> {
  const data = await AsyncStorage.getItem(KEYS.CHAPTERS);
  const allChapters: Chapter[] = data ? JSON.parse(data) : [];
  
  const newId = allChapters.length > 0 ? Math.max(...allChapters.map(c => c.id)) + 1 : 1;
  const newChapter: Chapter = {
    id: newId,
    bookId,
    chapterNumber,
    title,
    originalContent: content,
    translatedContent: null,
    isTranslated: false,
  };
  allChapters.push(newChapter);
  await AsyncStorage.setItem(KEYS.CHAPTERS, JSON.stringify(allChapters));
  return newId;
}

export async function updateChapterTranslation(
  chapterId: number,
  translatedContent: string
): Promise<void> {
  const data = await AsyncStorage.getItem(KEYS.CHAPTERS);
  if (!data) return;
  const allChapters: Chapter[] = JSON.parse(data);
  const index = allChapters.findIndex(c => c.id === chapterId);
  if (index !== -1) {
    allChapters[index].translatedContent = translatedContent;
    allChapters[index].isTranslated = true;
    await AsyncStorage.setItem(KEYS.CHAPTERS, JSON.stringify(allChapters));
  }
}

export async function getChapterCount(bookId: number): Promise<number> {
  const chapters = await getChapters(bookId);
  return chapters.length;
}

export async function getTranslatedChapterCount(bookId: number): Promise<number> {
  const chapters = await getChapters(bookId);
  return chapters.filter(c => c.isTranslated).length;
}

export async function deleteChapter(chapterId: number): Promise<void> {
  const data = await AsyncStorage.getItem(KEYS.CHAPTERS);
  if (!data) return;
  const allChapters: Chapter[] = JSON.parse(data);
  const chapter = allChapters.find(c => c.id === chapterId);
  if (!chapter) return;
  const bookId = chapter.bookId;
  const remaining = allChapters.filter(c => c.id !== chapterId);
  // Renumber chapters for this book
  const bookChapters = remaining.filter(c => c.bookId === bookId).sort((a, b) => a.chapterNumber - b.chapterNumber);
  bookChapters.forEach((c, i) => { c.chapterNumber = i + 1; });
  await AsyncStorage.setItem(KEYS.CHAPTERS, JSON.stringify(remaining));
}

export async function swapChapterOrder(bookId: number, chapterIdA: number, chapterIdB: number): Promise<void> {
  const data = await AsyncStorage.getItem(KEYS.CHAPTERS);
  if (!data) return;
  const allChapters: Chapter[] = JSON.parse(data);
  const a = allChapters.find(c => c.id === chapterIdA && c.bookId === bookId);
  const b = allChapters.find(c => c.id === chapterIdB && c.bookId === bookId);
  if (a && b) {
    const temp = a.chapterNumber;
    a.chapterNumber = b.chapterNumber;
    b.chapterNumber = temp;
    await AsyncStorage.setItem(KEYS.CHAPTERS, JSON.stringify(allChapters));
  }
}

export async function updateChapterContent(
  chapterId: number,
  originalContent?: string,
  translatedContent?: string
): Promise<void> {
  const data = await AsyncStorage.getItem(KEYS.CHAPTERS);
  if (!data) return;
  const allChapters: Chapter[] = JSON.parse(data);
  const index = allChapters.findIndex(c => c.id === chapterId);
  if (index !== -1) {
    if (originalContent !== undefined) {
      allChapters[index].originalContent = originalContent;
    }
    if (translatedContent !== undefined) {
      allChapters[index].translatedContent = translatedContent;
      allChapters[index].isTranslated = translatedContent !== null && translatedContent.length > 0;
    }
    await AsyncStorage.setItem(KEYS.CHAPTERS, JSON.stringify(allChapters));
  }
}

// ==================== READING PROGRESS ====================

export async function getReadingProgress(bookId: number): Promise<ReadingProgress | null> {
  const data = await AsyncStorage.getItem(KEYS.PROGRESS);
  if (!data) return null;
  const allProgress: ReadingProgress[] = JSON.parse(data);
  return allProgress.find(p => p.bookId === bookId) || null;
}

export async function saveReadingProgress(
  bookId: number,
  chapterId: number,
  position: number = 0,
  ttsSpeed: number = 1.0,
  ttsVoice: string | null = null
): Promise<void> {
  const data = await AsyncStorage.getItem(KEYS.PROGRESS);
  const allProgress: ReadingProgress[] = data ? JSON.parse(data) : [];
  
  const index = allProgress.findIndex(p => p.bookId === bookId);
  const progressToSave: ReadingProgress = {
    id: index !== -1 ? allProgress[index].id : (allProgress.length > 0 ? Math.max(...allProgress.map(p => p.id)) + 1 : 1),
    bookId,
    chapterId,
    position,
    ttsSpeed,
    ttsVoice,
    lastReadAt: new Date().toISOString(),
  };

  if (index !== -1) {
    allProgress[index] = progressToSave;
  } else {
    allProgress.push(progressToSave);
  }

  await AsyncStorage.setItem(KEYS.PROGRESS, JSON.stringify(allProgress));
  await updateBookTimestamp(bookId);
}

// ==================== SETTINGS ====================

export async function getSetting(key: string): Promise<string | null> {
  const data = await AsyncStorage.getItem(KEYS.SETTINGS);
  if (!data) return null;
  const settings = JSON.parse(data);
  return settings[key] || null;
}

export async function setSetting(key: string, value: string): Promise<void> {
  const data = await AsyncStorage.getItem(KEYS.SETTINGS);
  const settings = data ? JSON.parse(data) : {};
  settings[key] = value;
  await AsyncStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings));
}

export async function getDatabase() {
  return null;
}
