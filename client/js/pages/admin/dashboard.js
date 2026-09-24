document.addEventListener("DOMContentLoaded", function () {
  loadStatisticsTab(); // <-- Gọi hàm tại đây!
});
async function loadStatisticsTab() {
  const container = document.getElementById("tab-dashboard");
  if (!container) return;

  try {
    const res = await fetch("./statistics.html");
    const htmlText = await res.text();
    // Parse HTML và lấy phần nội dung chính của statistics
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlText, "text/html");
    const statsContent = doc.querySelector(".main-content") || doc.body;
    container.innerHTML = statsContent.innerHTML;
  } catch (err) {
    container.innerHTML = "<p>Không thể tải dữ liệu thống kê.</p>";
  }
}
