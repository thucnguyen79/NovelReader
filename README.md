# 📖 NovelReader

Ứng dụng đọc và dịch truyện di động, được xây dựng bằng **React Native + Expo**. Hỗ trợ dịch tự động sang tiếng Việt bằng **Google Gemini AI** và đọc to bằng **Text-to-Speech (TTS)**.

## ✨ Tính năng chính

| Tính năng | Mô tả |
|-----------|-------|
| 📚 **Quản lý truyện** | Thêm, xóa, quản lý sách với giao diện đẹp mắt |
| 🌐 **Dịch AI tự động** | Dịch truyện sang tiếng Việt bằng Google Gemini (hỗ trợ nhiều model) |
| 🔊 **Text-to-Speech** | Đọc to với tùy chỉnh giọng, tốc độ, hẹn giờ tắt |
| ✏️ **Chỉnh sửa nội dung** | Sửa bản gốc hoặc bản dịch trực tiếp trong app |
| 🔄 **Dịch lại** | Dịch lại bất kỳ chương nào không ưng ý |
| ↕️ **Sắp xếp chương** | Thay đổi thứ tự các chương trong sách |
| ⏩ **Tua câu TTS** | Nhảy tiến/lùi từng câu khi nghe đọc |
| 🌙 **Dark mode** | Giao diện tối/sáng theo hệ thống hoặc tùy chỉnh |
| 💾 **Lưu trữ cục bộ** | Dữ liệu lưu trên máy, không cần internet để đọc |

## 🛠️ Công nghệ

- **Framework**: React Native + Expo SDK 54
- **Ngôn ngữ**: TypeScript
- **Navigation**: Expo Router (file-based routing)
- **Lưu trữ**: AsyncStorage
- **AI Translation**: Google Gemini API
- **TTS**: expo-speech
- **UI**: Custom design system với dark/light theme

## 🚀 Cài đặt & Chạy

### Yêu cầu
- Node.js >= 18
- npm hoặc yarn
- Expo Go trên điện thoại (Android/iOS)

### Bước 1: Clone repo
```bash
git clone https://github.com/thucnguyen79/NovelReader.git
cd NovelReader
```

### Bước 2: Cài dependencies
```bash
npm install
```

### Bước 3: Chạy app
```bash
npx expo start
```

### Bước 4: Mở trên điện thoại
- Cài **Expo Go** từ Play Store / App Store
- Quét mã QR hiện trên terminal

## 🔑 Cấu hình API Key

1. Truy cập [Google AI Studio](https://aistudio.google.com/)
2. Tạo API Key miễn phí
3. Mở app → Tab **Cài đặt** → Nhập API Key
4. Nhấn **"Kiểm tra API Key & Tìm Model"** để tìm model phù hợp
5. Lưu cài đặt

## 📁 Cấu trúc dự án

```
NovelReader/
├── app/                    # Screens (Expo Router)
│   ├── (tabs)/             # Tab navigation
│   │   ├── index.tsx       # Trang chủ - Thư viện
│   │   └── settings.tsx    # Cài đặt
│   ├── add-book.tsx        # Thêm sách mới
│   ├── book/[id].tsx       # Chi tiết sách
│   └── reader/[chapterId].tsx  # Đọc truyện
├── src/
│   ├── components/         # UI components
│   │   ├── BookCard.tsx
│   │   └── TTSPlayer.tsx
│   ├── database/           # Data layer (AsyncStorage)
│   │   ├── database.ts
│   │   └── types.ts
│   ├── services/           # API & TTS services
│   │   ├── geminiService.ts
│   │   └── ttsService.ts
│   └── theme/              # Design system
│       ├── colors.ts
│       ├── typography.ts
│       └── ThemeProvider.tsx
├── app.json
├── package.json
└── tsconfig.json
```

## 📄 License

MIT License

## 👤 Tác giả

[@thucnguyen79](https://github.com/thucnguyen79)
