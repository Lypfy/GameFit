function initStatistics(parent = document) {
  const root = parent || document;

  // Xử lý chuyển đổi nút Lọc (Filter)
  const filterBtns = root.querySelectorAll(".filter-btn");
  filterBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      filterBtns.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
    });
  });

  // Xử lý chuyển đổi Sub-Tabs Thống kê
  const tabBtns = root.querySelectorAll(".tab-btn");
  const tabContents = root.querySelectorAll("#tab-1, #tab-2, #tab-3");
  const filterBar = root.querySelector(".filter-bar");

  tabBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      // Xóa class active ở tất cả các sub-tab thống kê
      tabBtns.forEach((b) => b.classList.remove("active"));
      tabContents.forEach((c) => c.classList.remove("active"));

      // Kích hoạt tab được bấm
      btn.classList.add("active");
      const tabId = btn.getAttribute("data-tab");
      const targetTab =
        root.querySelector(`#${tabId}`) || document.getElementById(tabId);
      if (targetTab) {
        targetTab.classList.add("active");
      }

      // Hiển thị filter bar ở tab 2 và 3
      if (filterBar) {
        if (tabId === "tab-1") {
          filterBar.classList.add("hidden");
        } else {
          filterBar.classList.remove("hidden");
        }
      }
    });
  });
}

// Để mở độc lập statistics.html
document.addEventListener("DOMContentLoaded", () => {
  if (
    !document.getElementById("tab-dashboard") &&
    document.querySelector(".tab-btn")
  ) {
    initStatistics();
  }
});
