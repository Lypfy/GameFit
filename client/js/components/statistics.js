function initStatistics(parent = document) {
  // Xử lý chuyển đổi nút Lọc (Filter)
  const filterBtns = document.querySelectorAll(".filter-btn");
  filterBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      filterBtns.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
    });
  });

  // Xử lý chuyển đổi Tabs
  const tabBtns = document.querySelectorAll(".tab-btn");
  const tabContents = document.querySelectorAll(".tab-content");
  const filterBar = document.querySelector(".filter-bar");

  tabBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      // Xóa class active ở tất cả các tab
      tabBtns.forEach((b) => b.classList.remove("active"));
      tabContents.forEach((c) => c.classList.remove("active"));

      // Kích hoạt tab được bấm
      btn.classList.add("active");
      const tabId = btn.getAttribute("data-tab");
      document.getElementById(tabId).classList.add("active");

      // Hiển thị filter bar ở tab 2 và 3
      if (tabId === "tab-1") {
        filterBar.classList.add("hidden");
      } else {
        filterBar.classList.remove("hidden");
      }
    });
  });
}
// để mở độc lập statistic.html
document.addEventListener("DOMContentLoaded", () => {
  if (document.querySelector(".tab-btn")) {
    initStatistics();
  }
});
