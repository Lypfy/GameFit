# Đề xuất Tích hợp AI cho Dự án GameFit

Dưới đây là 4 hướng ứng dụng Trí tuệ nhân tạo (AI) phù hợp và mang lại giá trị cao nhất cho dự án GameFit.

## 1. Kiểm duyệt nội dung tự động (Auto Moderation)
* **Bộ phận áp dụng:** Quản lý Review / Quản lý Người dùng
* **Mô tả logic:** Khi người dùng gửi một bài "Đánh giá game" hoặc "Bình luận", hệ thống sẽ gửi nội dung đó qua API của AI (Gemini/OpenAI). AI sẽ phân tích ngữ nghĩa để phát hiện các ngôn từ thù địch, chửi thề (toxic), hoặc nội dung rác (spam).
* **Hành động:** Nếu AI gắn cờ vi phạm, hệ thống tự động từ chối hiển thị bình luận đó hoặc đưa vào trạng thái "Chờ Admin duyệt", giúp tiết kiệm 90% thời gian kiểm duyệt thủ công.

## 2. Trợ lý ảo tư vấn nâng cấp PC (AI Upgrade Advisor)
* **Bộ phận áp dụng:** Cấu hình thiết bị cá nhân (User PC) / Chi tiết Game
* **Mô tả logic:** Đây là tính năng "Ăn tiền" của hệ thống. Khi cấu hình máy tính của người dùng không đủ để chơi một tựa game (Not Fit). Hệ thống sẽ gửi prompt cho AI bao gồm: (1) Cấu hình máy hiện tại của User, (2) Cấu hình yêu cầu của Game.
* **Hành động:** AI sẽ phân tích điểm nghẽn (bottleneck) và đưa ra lời khuyên bằng ngôn ngữ tự nhiên. Ví dụ: *"Máy của bạn có CPU ổn, nhưng Card màn hình quá yếu. Bạn chỉ cần nâng cấp lên GPU RTX 3060 là có thể chơi mượt tựa game này."*

### 🎮 Kịch bản Demo: Luồng xử lý AI Tư vấn nâng cấp

**1. Khởi tạo (Context thu thập ngầm tại Server)**
Khi người dùng bấm nút "Nhờ AI tư vấn" tại trang của game **Cyberpunk 2077**, Backend tự động thu thập:
* **Máy của người dùng:** `CPU: Intel Core i3-8100 | GPU: GTX 1050 Ti | RAM: 8GB`
* **Game yêu cầu:** `CPU: Intel Core i7-6700 | GPU: GTX 1060 6GB | RAM: 16GB`

**2. Đóng gói System Prompt (Gửi cho AI API)**
Hệ thống tự động biên dịch dữ liệu thành câu lệnh sau:
> *"Bạn là chuyên gia phần cứng PC. Khách hàng có máy: CPU i3-8100, GPU GTX 1050 Ti, RAM 8GB. Họ muốn chơi Cyberpunk 2077 yêu cầu: CPU i7-6700, GPU GTX 1060 6GB, RAM 16GB. Hãy chỉ ra điểm yếu nhất và đề xuất giải pháp tiết kiệm nhất. Trả về đúng định dạng JSON: { "status": "Not Fit", "bottleneck": "...", "ai_advice": "..." }"*

**3. AI trả kết quả về (Xử lý giao diện)**
AI trả về mã JSON:
```json
{
  "status": "Not Fit",
  "bottleneck": "GPU và RAM",
  "ai_advice": "CPU của bạn tạm ổn, nhưng Card đồ họa (VRAM) và RAM đang là điểm nghẽn lớn. Bạn nên nâng cấp lên ít nhất 16GB RAM và một GPU tầm trung như GTX 1660 Super hoặc RTX 3050 để tránh giật lag nhé."
}
```
*Frontend sẽ bóc tách trường `ai_advice` để hiển thị ra màn hình UI cho người dùng xem một cách đẹp mắt.*

## 3. Hệ thống Gợi ý Game thông minh (AI Recommendation System)
* **Bộ phận áp dụng:** Trang chủ / Khám phá Game
* **Mô tả logic:** Các thuật toán gợi ý truyền thống chỉ dựa trên "Thể loại". Với AI, hệ thống có thể kết hợp nhiều luồng dữ liệu phức tạp hơn: Lịch sử tìm kiếm + Thể loại trong Wishlist + **Mức độ sức mạnh cấu hình PC của user**.
* **Hành động:** Trả về danh sách game được cá nhân hóa cao độ. Đảm bảo những game được gợi ý không chỉ đúng sở thích mà máy tính của user chắc chắn "cân" được.

## 4. Tóm tắt Đánh giá bằng AI (Review Summarization)
* **Bộ phận áp dụng:** Trang Chi tiết Game
* **Mô tả logic:** Một tựa game hot có thể có hàng ngàn lượt đánh giá (tương tự Steam). Việc đọc hết là bất khả thi. Hệ thống sẽ gom các đánh giá gần nhất đẩy cho AI xử lý.
* **Hành động:** AI sẽ trích xuất ý chính và viết 1-2 câu tóm tắt tổng quan. Ví dụ: *"Hầu hết người chơi đánh giá cao cốt truyện và đồ họa, tuy nhiên có nhiều phản hồi phàn nàn về lỗi rớt khung hình (FPS) ở các phân đoạn hành động nhanh."*
