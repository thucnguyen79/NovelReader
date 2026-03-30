# 📖 NovelReader

Ứng dụng đọc và dịch truyện chuyên nghiệp trên thiết bị di động, được xây dựng bằng **React Native + Expo**. Hỗ trợ dịch tự động thông minh sang tiếng Việt theo ngữ cảnh nhờ **Google Gemini AI** và trải nghiệm Audio Book chân thực thông qua **Text-to-Speech (TTS)**.

## ✨ Tính năng nổi bật

| Tính năng | Mô tả |
|-----------|-------|
| 📚 **Quản lý Thư viện** | Theo dõi tiến độ đọc, xem số lượng chương và trạng thái dịch của từng cuốn sách. |
| ⚡ **Thêm chương hàng loạt** | Tự động nhận diện và cắt (split) văn bản dài thành hàng trăm chương riêng biệt chỉ với 1 thao tác dán. |
| 🌐 **AI Dịch thuật Ngữ cảnh** | Sử dụng Google Gemini (Hỗ trợ nhiều Model mã nguồn mở và thương mại) để dịch mượt mà, cắt chunk tối ưu. Kèm theo cơ chế chống lỗi Quota thông minh. |
| 🔊 **Audio Book (TTS)** | Tùy chỉnh Giọng đọc, Tốc độ. **Đặc biệt**: Tự động chuyển chương (Auto-next) và ghi nhớ (Persist) thiết lập nghe cho các lần sau. |
| ✏️ **Chỉnh sửa Tức thì** | Chỉnh sửa trực tiếp nội dung chương (cả bản gốc lẫn bản dịch) với bộ công cụ điều hướng nổi (Floating UI) chống khuất tầm nhìn. |
| ↕️ **Smart Sorting** | Tự động phân tích và sắp xếp thứ tự chương dựa trên con số nằm trong tiêu đề bài viết (Chương 1, Chapter 2, Phần 3...). |
| 🌙 **Giao diện Cao cấp** | Bố cục tối ưu, nền tối (Dark mode) tiết kiệm pin và thân thiện với mắt. |
| 💾 **Đọc Offline** | Dữ liệu sách và các bản dịch được lưu trực tiếp trên bộ nhớ máy (AsyncStorage), đọc mọi lúc mọi nơi. |

## 🛠️ Công nghệ

- **Framework**: React Native + Expo SDK 54 / 55
- **Ngôn ngữ**: TypeScript
- **Navigation**: Expo Router (File-based Routing)
- **Lưu trữ**: AsyncStorage
- **AI Backend**: Google Gemini API REST
- **TTS Engine**: `expo-speech`
- **UI**: Custom Design System + Glassmorphism / Floating Layouts

## 🚀 Hướng dẫn nhanh (Quick Start)

### Cài đặt Môi trường
- Node.js >= 18
- npm hoặc yarn
- Ứng dụng **Expo Go** (tải trên App Store hoặc Google Play)

### Khởi chạy Dự án
```bash
git clone https://github.com/thucnguyen79/NovelReader.git
cd NovelReader
npm install
npx expo start
```
*Quét mã QR bằng Camera (iOS) hoặc Expo Go (Android) để mở ứng dụng.*

---

## 📖 Hướng dẫn sử dụng chi tiết

Để hiểu rõ hơn về cách thiết lập Google API Key miễn phí, tính năng tách chương, hay các thủ thuật dùng Audio Book, vui lòng đọc tài liệu chi tiết tại:

👉 **[Xem Hướng dẫn sử dụng (Usage Guide)](./usage_guide.md)**

---

## 📁 Cấu trúc thư mục cốt lõi

```
NovelReader/
├── app/                    # Màn hình cấu trúc theo Expo Router
│   ├── (tabs)/             # Thư viện & Cài đặt hệ thống
│   ├── add-book.tsx        # Màn hình tạo sách
│   ├── book/[id].tsx       # Màn hình Quản lý Chương (Bulk insert, Translate, Sort)
│   └── reader/[chapterId].tsx  # Màn hình Đọc và Nghe truyện
├── src/
│   ├── components/         # Giao diện tái sử dụng (TTSPlayer, BookCard...)
│   ├── database/           # AsyncStorage CRUD (+Thuật toán Smart Sort)
│   ├── services/           # Gemini API (Rate limit, Chunking) & TTS Pipeline
│   ├── utils/              # Tiện ích (Chapter Splitting bằng Regex)
│   └── theme/              # Typography, Colors, ThemeProvider
```

## 📄 Bản quyền (License)

Dự án tuân theo giấy phép MIT License.

## 👤 Chủ sở hữu

[@thucnguyen79](https://github.com/thucnguyen79)
