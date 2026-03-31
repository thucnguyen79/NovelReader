# Sổ tay Hướng dẫn Sử dụng NovelReader

Chào mừng bạn đến với tài liệu hướng dẫn sử dụng NovelReader. Tài liệu này sẽ chỉ dẫn chi tiết cách để tận dụng tối đa các công cụ thông minh như **Nhập dữ liệu lớn (Bulk Import)**, **Dịch thuật AI**, và tính năng **Sách nói (TTS)** trong ứng dụng.

---

## 1. Thiết lập AI Dịch Thuật ban đầu

Hệ thống dịch vụ cốt lõi của NovelReader được vận hành bởi trí tuệ nhân tạo. Bạn cần một mã khóa (API Key) để bắt đầu:

1. Vào trang web [Google AI Studio](https://aistudio.google.com/).
2. Đăng nhập bằng tài khoản Google của bạn và nhấn **Create API Key**.
3. Khởi động ứng dụng NovelReader, chọn tab **Cài đặt (Settings)** ở dưới cùng màn hình.
4. Dán API Key vừa tạo vào ô trống.
5. Nhấn **"Kiểm tra API Key & Tìm Model"**. Ứng dụng sẽ tự động rà quét các hệ thống AI đang có (như `gemini-1.5-flash` hay `gemini-2.5-flash`) và đưa ra gợi ý dùng Model nào tốt nhất.
6. Kết thúc bằng thao tác nhấn biểu tượng đĩa mềm **"Lưu"**.

---

## 2. Quản lý Thư Viện Sách

### 2.1 Tạo sách mới và Tách chương (Chunking) Tự động
Nhấn dấu **(+)** ở góc thư viện để tạo sách.
- **Tên sách & Tác giả:** Khai báo thông tin hiển thị cơ bản.
- **Nội dung gốc:** Bạn có thể copy toàn bộ nội dung của hàng chục chương truyện trên mạng vào đây. 

**Quy tắc cắt chương tự động:**
Hệ thống sẽ dùng thuật toán Regex để tự động phân rã nội dung khổng lồ đó thành từng chương rời rạc nếu phát hiện thấy các từ khóa như `Chương 1...`, `Chapter 2...`, `Phần 3...` ở đầu đoạn văn. Nếu có các đoạn văn mở đầu (Preamble) không chứa số thứ tự chương (VD: Phần tóm tắt truyện), app sẽ tự động nhóm nó thành một chương mang tựa đề **"Mở đầu"**.

### 2.2 Sắp xếp thư mục (Smart Sort)
Trong màn hình **Chi tiết sách**, nếu các chương tự thêm vào bị lộn xộn, bạn chỉ việc ấn nút **"Sắp xếp"** ở thanh công cụ phía trên cùng. Ứng dụng sẽ tự động đọc con số chèn giấu trong tên chương để xếp lại thứ tự từ bé đến lớn một cách chính xác tuyệt đối.

### 2.3 Thêm chương thủ công hoặc Thêm hàng loạt
Vẫn ở màn hình **Chi tiết sách**, nút **"Thêm chương"** cho phép bạn bổ sung nội dung:
- Nhập tên 1 chương và dán văn bản bình thường (Dành cho việc thêm lẻ).
- Dán tiếp văn bản chứa nhiều chương vào ô Nội dung. Thuật toán tự chia nhỏ tương tự lúc tạo sách sẽ hoạt động.

> **💡 Mẹo:** Nếu độ dài hộp khai báo (Modal) bị đè lên bởi bàn phím ảo, đừng lo, bạn có thể vuốt tay trượt nội dung hộp thoại lên xuống để thao tác lưu thuận tiện dễ dàng.

---

## 3. Dịch Thuật AI

### 3.1 Dịch từng phần hoặc Dịch Toàn Bộ
Bạn có thể tự quyết định:
- Dịch từng chương bằng cách bấm icon Ngôn ngữ hoặc bấm nút **Dịch chương này** bên trong màn hình Đọc.
- Dịch một lúc toàn bộ sách tiết kiệm thời gian bằng nút **"Dịch tất cả"** ở giao diện Chi tiết sách.

### 3.2 Đặc tả bản dịch
- **Bao gồm cả Tiêu đề:** Khi gửi qua Google Gemini, ứng dụng sẽ gửi Tiêu đề đính kèm Nội dung chương, vì vậy ở màn hình Đọc Bản Dịch, dòng chữ đầu tiên bạn thấy sẽ luôn luôn là tựa đề đã vỡ lòng sang ngôn ngữ mẹ đẻ cực kỳ mượt mà.
- **Tiến trình theo thời gian thực:** Với các chương đồ sộ, app tự động cắt nhỏ thành các phân đoạn (chunk) ~2500 - 3000 ký tự và dịch cuốn chiếu để tránh bị AI ngắt ngữ cảnh, đồng thời hiển thị phần trăm trạng thái cho bạn theo dõi.

### 3.3 Khắc phục lỗi Quá Hạn Mức (Quota Exceeded)
Google AI thỉnh thoảng sẽ có giới hạn về Request mỗi ngày ở bản miễn phí.
Nếu bạn dịch quá nhiều, app sẽ hiện lên Dấu nhắc cảnh báo bằng tiếng Việt rõ ràng:
`API Key của bạn đã hết hạn mức... Vui lòng đổi Key khác hoặc chờ sang ngày mới.` 
Khi gặp lỗi này, tiến trình dịch bị hủy lập tức nhưng Nội dung văn bản tuyệt đối không bị dán rác lỗi vào trong, giúp bạn giữ vẹn nguyên tính thẩm mỹ cho chương sách đó.

---

## 4. Trải nghiệm không giới hạn với Text-To-Speech (TTS)

Vào màn hình **Đọc truyện** bằng cách nhấn vào tên một cuốn.

### Cấu hình Audio
Ngay phía thân dưới màn hình, bảng điều khiển Audio Book nổi lên.
- Bạn có quyền tùy chỉnh **Tốc độ đọc** (1x, 1.25x...) hoặc **Thay đổi giọng đọc** (Voice) bằng cách nhấn vào thanh mở rộng.
- **Lưu trữ Vĩnh viễn (Persist Setting):** Mọi tùy chỉnh giọng đọc, tốc độ đều được tự động gắn vào bộ nhớ thiết bị. Lần sau mở app hoặc nghe cuốn sách khác, bạn không cần phải thay đổi lại từ đầu.

### Điều khiển Âm thanh
- **Highlights:** App tự động nhận diện và thay đổi màu của câu đang được đọc.
- **Auto-next:** Khi câu cuối cùng của đoạn kết thúc, app sẽ tự động nhảy chuyển (navigate) sang chương tiếp theo và đọc ngay lập tức, đem lại trải nghiệm Hands-free (rảnh tay) hoàn hảo.

### Chỉnh sửa Nội dung (Edit Mode)
Nếu bạn nhấn biểu tượng cái bút (Edit) ở trên cùng bên phải.
Hệ thống sẽ tự nhận biết và đưa bạn vào trạng thái tập trung:
- Mọi thanh công cụ Audio Audio hoặc Header sẽ tạm biến mất hoàn toàn.
- Những nút Floating **Lưu/Hủy** dập nổi nằm bám đuổi theo bàn phím để bạn hoàn thiện sửa chữa chữ và tái trở lại cấu hình đọc nhanh chóng.

---

Hãy để **NovelReader** mang lại cho bạn những giờ khắc đắm chìm trọn vẹn trong các tác phẩm nổi tiếng! Nếu có nhu cầu thay đổi tham số nào, đừng ngần ngại truy cập mã nguồn hoặc mở Issue trên Github.
