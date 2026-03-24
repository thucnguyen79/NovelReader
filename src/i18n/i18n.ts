import { getSetting, setSetting } from '../database/database';

type Language = 'vi' | 'en';

let currentLanguage: Language = 'vi';

const translations: Record<Language, Record<string, string>> = {
  vi: {
    // Tabs
    'tab.library': 'Thư Viện',
    'tab.settings': 'Cài Đặt',

    // Library
    'library.title': '📖 Thư Viện',
    'library.bookCount': '{count} cuốn sách',
    'library.empty': 'Thư viện trống',
    'library.emptyHint': 'Bấm nút + để thêm sách mới',
    'library.deleteTitle': 'Xóa sách',
    'library.deleteMsg': 'Bạn có chắc muốn xóa "{title}"?',
    'library.chapters': '{count} chương',

    // Add Book
    'addBook.title': 'Thêm Sách Mới',
    'addBook.bookName': 'Tên sách',
    'addBook.bookNamePlaceholder': 'Nhập tên sách...',
    'addBook.content': 'Nội dung',
    'addBook.contentPlaceholder': 'Dán hoặc nhập nội dung truyện tại đây...',
    'addBook.paste': 'Dán từ clipboard',
    'addBook.clipboardEmpty': 'Clipboard trống',
    'addBook.autoSplitHint': 'App sẽ tự động chia nội dung thành các chương dựa trên tiêu đề chương (Chương 1, Chapter 1, 第一章...)',
    'addBook.save': 'Lưu Sách',
    'addBook.saving': 'Đang lưu...',
    'addBook.missingInfo': 'Thiếu thông tin',
    'addBook.needTitle': 'Vui lòng nhập tên sách',
    'addBook.needContent': 'Vui lòng nhập nội dung',
    'addBook.success': 'Thành công',
    'addBook.savedMsg': 'Đã lưu "{title}" với {count} chương',
    'addBook.error': 'Không thể lưu sách',
    'addBook.chars': '{count} ký tự',
    'addBook.words': '{count} từ',

    // Book Detail
    'book.title': 'Chi Tiết Sách',
    'book.chapters': '{count} chương',
    'book.translated': '{count} đã dịch',
    'book.continueReading': 'Đọc tiếp',
    'book.translateAll': 'Dịch tất cả',
    'book.allTranslated': 'Tất cả chương đã được dịch',
    'book.translateConfirm': 'Bạn muốn dịch {count} chương chưa dịch?',
    'book.translating': 'Đang dịch phần {current}/{total}...',
    'book.translateSuccess': 'Đã dịch xong "{title}"',
    'book.translateError': 'Có lỗi xảy ra khi dịch',
    'book.retranslate': 'Dịch lại',
    'book.retranslateMsg': 'Bạn muốn dịch lại "{title}"? Bản dịch cũ sẽ bị ghi đè.',
    'book.addChapter': 'Thêm chương',
    'book.chapterTitle': 'Tiêu đề chương',
    'book.chapterContent': 'Nội dung chương',
    'book.deleteChapter': 'Xóa chương',
    'book.deleteChapterMsg': 'Bạn có chắc muốn xóa "{title}"?',
    'book.noApiKey': 'Chưa có API Key',
    'book.noApiKeyMsg': 'Vui lòng nhập Google Gemini API key trong Cài Đặt',
    'book.goSettings': 'Đi tới Cài Đặt',

    // Reader
    'reader.title': 'Đọc Truyện',
    'reader.translated': '🇻🇳 Bản dịch',
    'reader.original': '📄 Bản gốc',
    'reader.translate': 'Dịch chương này',
    'reader.prevChapter': 'Chương trước',
    'reader.nextChapter': 'Chương sau',
    'reader.saved': 'Đã lưu',
    'reader.savedMsg': 'Nội dung đã được cập nhật.',
    'reader.retranslateConfirm': 'Bản dịch cũ sẽ bị ghi đè. Tiếp tục?',

    // Settings
    'settings.geminiTitle': 'Google Gemini API',
    'settings.apiKey': 'API Key',
    'settings.apiKeyPlaceholder': 'Nhập API key...',
    'settings.detectModels': 'Kiểm tra API Key & Tìm Model',
    'settings.detecting': 'Đang kiểm tra...',
    'settings.availableModels': 'Model khả dụng ({count}):',
    'settings.model': 'Mô Hình Dịch (Model)',
    'settings.customModel': 'Hoặc nhập tên Model tùy chỉnh:',
    'settings.save': 'Lưu Cài Đặt',
    'settings.saved': 'Đã lưu!',
    'settings.themeTitle': 'Giao Diện',
    'settings.themeLabel': 'Chế độ hiển thị',
    'settings.themeSystem': 'Hệ thống',
    'settings.themeDark': 'Tối',
    'settings.themeLight': 'Sáng',
    'settings.aboutTitle': 'Thông Tin',
    'settings.version': 'Phiên bản',
    'settings.translatedBy': 'Dịch bởi',
    'settings.storage': 'Lưu trữ',
    'settings.storageValue': 'Cục bộ (AsyncStorage)',
    'settings.language': 'Ngôn ngữ giao diện',
    'settings.translationLang': 'Ngôn ngữ dịch',

    // Common
    'common.cancel': 'Hủy',
    'common.delete': 'Xóa',
    'common.save': 'Lưu',
    'common.ok': 'OK',
    'common.error': 'Lỗi',
    'common.notice': 'Thông báo',
    'common.translate': 'Dịch',
  },

  en: {
    // Tabs
    'tab.library': 'Library',
    'tab.settings': 'Settings',

    // Library
    'library.title': '📖 Library',
    'library.bookCount': '{count} books',
    'library.empty': 'Library is empty',
    'library.emptyHint': 'Tap + to add a new book',
    'library.deleteTitle': 'Delete book',
    'library.deleteMsg': 'Are you sure you want to delete "{title}"?',
    'library.chapters': '{count} chapters',

    // Add Book
    'addBook.title': 'Add New Book',
    'addBook.bookName': 'Book name',
    'addBook.bookNamePlaceholder': 'Enter book name...',
    'addBook.content': 'Content',
    'addBook.contentPlaceholder': 'Paste or type novel content here...',
    'addBook.paste': 'Paste from clipboard',
    'addBook.clipboardEmpty': 'Clipboard is empty',
    'addBook.autoSplitHint': 'App will auto-split content into chapters based on chapter headings (Chương 1, Chapter 1, 第一章...)',
    'addBook.save': 'Save Book',
    'addBook.saving': 'Saving...',
    'addBook.missingInfo': 'Missing info',
    'addBook.needTitle': 'Please enter a book name',
    'addBook.needContent': 'Please enter content',
    'addBook.success': 'Success',
    'addBook.savedMsg': 'Saved "{title}" with {count} chapters',
    'addBook.error': 'Cannot save book',
    'addBook.chars': '{count} chars',
    'addBook.words': '{count} words',

    // Book Detail
    'book.title': 'Book Detail',
    'book.chapters': '{count} chapters',
    'book.translated': '{count} translated',
    'book.continueReading': 'Continue',
    'book.translateAll': 'Translate all',
    'book.allTranslated': 'All chapters are translated',
    'book.translateConfirm': 'Translate {count} untranslated chapters?',
    'book.translating': 'Translating {current}/{total}...',
    'book.translateSuccess': 'Finished translating "{title}"',
    'book.translateError': 'Translation error',
    'book.retranslate': 'Re-translate',
    'book.retranslateMsg': 'Re-translate "{title}"? Old translation will be overwritten.',
    'book.addChapter': 'Add chapter',
    'book.chapterTitle': 'Chapter title',
    'book.chapterContent': 'Chapter content',
    'book.deleteChapter': 'Delete chapter',
    'book.deleteChapterMsg': 'Are you sure you want to delete "{title}"?',
    'book.noApiKey': 'No API Key',
    'book.noApiKeyMsg': 'Please enter Google Gemini API key in Settings',
    'book.goSettings': 'Go to Settings',

    // Reader
    'reader.title': 'Reader',
    'reader.translated': '🌐 Translated',
    'reader.original': '📄 Original',
    'reader.translate': 'Translate this chapter',
    'reader.prevChapter': 'Previous',
    'reader.nextChapter': 'Next',
    'reader.saved': 'Saved',
    'reader.savedMsg': 'Content has been updated.',
    'reader.retranslateConfirm': 'Old translation will be overwritten. Continue?',

    // Settings
    'settings.geminiTitle': 'Google Gemini API',
    'settings.apiKey': 'API Key',
    'settings.apiKeyPlaceholder': 'Enter API key...',
    'settings.detectModels': 'Test API Key & Find Models',
    'settings.detecting': 'Checking...',
    'settings.availableModels': 'Available models ({count}):',
    'settings.model': 'Translation Model',
    'settings.customModel': 'Or enter custom model name:',
    'settings.save': 'Save Settings',
    'settings.saved': 'Saved!',
    'settings.themeTitle': 'Appearance',
    'settings.themeLabel': 'Display mode',
    'settings.themeSystem': 'System',
    'settings.themeDark': 'Dark',
    'settings.themeLight': 'Light',
    'settings.aboutTitle': 'About',
    'settings.version': 'Version',
    'settings.translatedBy': 'Translated by',
    'settings.storage': 'Storage',
    'settings.storageValue': 'Local (AsyncStorage)',
    'settings.language': 'Interface language',
    'settings.translationLang': 'Translation language',

    // Common
    'common.cancel': 'Cancel',
    'common.delete': 'Delete',
    'common.save': 'Save',
    'common.ok': 'OK',
    'common.error': 'Error',
    'common.notice': 'Notice',
    'common.translate': 'Translate',
  },
};

export function t(key: string, params?: Record<string, string | number>): string {
  let text = translations[currentLanguage]?.[key] || translations.vi[key] || key;
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      text = text.replace(`{${k}}`, String(v));
    });
  }
  return text;
}

export function getLanguage(): Language {
  return currentLanguage;
}

export function setLanguage(lang: Language): void {
  currentLanguage = lang;
}

export async function loadLanguage(): Promise<void> {
  const saved = await getSetting('appLanguage');
  if (saved === 'en' || saved === 'vi') {
    currentLanguage = saved;
  }
}

export async function saveLanguage(lang: Language): Promise<void> {
  currentLanguage = lang;
  await setSetting('appLanguage', lang);
}

// Translation target languages
export const TARGET_LANGUAGES = [
  { id: 'vi', name: 'Tiếng Việt', nameEn: 'Vietnamese' },
  { id: 'en', name: 'English', nameEn: 'English' },
  { id: 'ja', name: '日本語', nameEn: 'Japanese' },
  { id: 'ko', name: '한국어', nameEn: 'Korean' },
  { id: 'zh', name: '中文', nameEn: 'Chinese' },
  { id: 'fr', name: 'Français', nameEn: 'French' },
  { id: 'es', name: 'Español', nameEn: 'Spanish' },
  { id: 'de', name: 'Deutsch', nameEn: 'German' },
  { id: 'ru', name: 'Русский', nameEn: 'Russian' },
  { id: 'th', name: 'ภาษาไทย', nameEn: 'Thai' },
  { id: 'pt', name: 'Português', nameEn: 'Portuguese' },
  { id: 'id', name: 'Bahasa Indonesia', nameEn: 'Indonesian' },
];

export function getTargetLanguageName(id: string): string {
  return TARGET_LANGUAGES.find(l => l.id === id)?.nameEn || id;
}
