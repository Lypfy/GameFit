// File cấu hình đường dẫn API dùng chung cho toàn bộ dự án
// Khi bạn đẩy web lên mây (Cloud), bạn chỉ cần đổi đường dẫn ở đây thành tên miền thực tế (VD: https://api.gamefit.com/api)
const API_URL = window.location.origin + "/api";
window.API_URL = API_URL; 
