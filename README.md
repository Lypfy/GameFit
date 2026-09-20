# 🎮 GameFit - Nền Tảng Duyệt Game & Gợi Ý Theo Cấu Hình PC

> **GameFit** là nền tảng web kết hợp giữa **Cổng duyệt/khám phá game (Game Browser)** và **Công cụ kiểm tra độ tương thích phần cứng (PC Compatibility Matcher)**. Dự án giúp game thủ nhanh chóng tìm kiếm những tựa game hấp dẫn vừa vặn nhất với cấu hình máy tính cá nhân mà không lo tình trạng giật lag hay mua nhầm game vượt quá khả năng phần cứng.

---

## 📌 Mục Tiêu Dự Án

- **Giải quyết bài toán "Máy tôi có chơi được game này không?"**: Tự động tính toán và so khớp phần cứng tức thì.
- **Duyệt game cá nhân hóa (Personalized Game Discovery)**: Gợi ý các game phù hợp với cấu hình PC người dùng tự chọn.
- **Xây dựng cộng đồng đánh giá trải nghiệm**: Nơi game thủ chia sẻ FPS và trải nghiệm thực tế với từng cấu hình máy.

---

## 🗂️ Cấu Trúc Thư Mục Dự Án (Fullstack Architecture)

```
GameFit/
├── client/                      # [FRONTEND] Giao diện người dùng
│   ├── assets/                  # Hình ảnh, banner, icons tĩnh
│   ├── css/                     # Toàn bộ Stylesheet của ứng dụng
│   │   ├── style.css            # Stylesheet chính
│   │   ├── statistics.css       # Style trang thống kê Admin
│   │   ├── my_pc_configs.css    # Style trang cấu hình PC
│   │   └── ...
│   ├── js/                      # Logic frontend và tương tác người dùng
│   │   ├── home.js              # Script trang chủ & auth dropdown
│   │   ├── login_regis.js       # Script xác thực đăng nhập/đăng ký
│   │   └── swiper-bundle.min.js # Thư viện slider
│   ├── pages/                   # Phân nhóm các trang HTML theo chức năng
│   │   ├── auth/                # login_register.html
│   │   ├── user/                # my_pc_config.html, review-modal.html
│   │   ├── admin/               # statistics.html, add-game-wizard.html, account-lock-modal.html,...
│   │   ├── games.html           # Danh mục thư viện game
│   │   ├── pc-config.html       # Công cụ kiểm tra cấu hình
│   │   └── home.html            # Trang chủ duyệt game
│   └── index.html               # Trang điều hướng Client vào pages/home.html
│
├── server/                      # [BACKEND] Mã nguồn máy chủ API (Node.js/Express)
│   ├── src/
│   │   ├── config/              # db.js (Kết nối CSDL)
│   │   ├── controllers/         # auth, game, hardware controllers
│   │   ├── middlewares/         # auth.middleware.js (JWT & quyền Admin)
│   │   ├── models/              # User, Game, Hardware schemas
│   │   ├── routes/              # auth, game, hardware routes
│   │   ├── services/            # compatibility.service.js (Thuật toán GameFit)
│   │   └── app.js               # Khởi động Express server
│   ├── .env.example             # Cấu hình biến môi trường mẫu
│   └── package.json             # Danh sách thư viện Backend
│
├── .gitignore                   # Bỏ qua node_modules, .env,...
├── index.html                   # Trang điều hướng gốc dự án
└── README.md                    # Tài liệu hướng dẫn
```

---

## 💻 Hướng Dẫn Chạy Dự Án

### 1. Khởi chạy Giao diện Frontend
- Mở trực tiếp file `client/pages/home.html` trên trình duyệt (hoặc sử dụng extension **Live Server** trong VS Code / IDE).
- Hoặc mở file `index.html` tại thư mục gốc, hệ thống sẽ tự động điều hướng vào trang chủ.

### 2. Khởi chạy Máy chủ Backend (Tùy chọn khi phát triển API)
```bash
cd server
npm install
npm run dev
```
Máy chủ API sẽ chạy tại: `http://localhost:5000`

---

## ⚡ Các Tính Năng Nổi Bật

1. **Khám Phá & Duyệt Game (Game Browser)**: Thư viện game đa dạng, xem chi tiết và cấu hình Tối thiểu / Đề nghị.
2. **Cốt lõi GameFit Matching**: Thuật toán so sánh CPU, GPU, RAM, Ổ cứng của người dùng với yêu cầu của game và phân loại trạng thái (Không đủ / Tối thiểu / Chơi mượt).
3. **Hệ Thống Tài Khoản & Đánh Giá**: Đăng ký, đăng nhập phân quyền Admin/User, đánh giá và chia sẻ trải nghiệm thực tế.
4. **Quản Trị Hệ Thống (Admin Panel)**: Bảng thống kê hệ thống ([statistics.html](file:///e:/Antigravity%20IDE/gamefit/GameFit/client/pages/admin/statistics.html)), Wizard thêm game và quản lý tài khoản.
