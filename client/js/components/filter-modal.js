const btnOpenFilter = document.getElementById("btn-open-filter");
const btnCloseFilter = document.getElementById("btn-close-filter");
const filterModal = document.getElementById("filter-modal");
const filterOverlay = document.getElementById("filter-modal-overlay");
const btnResetFilter = document.getElementById("btn-reset-filter");

document.addEventListener("DOMContentLoaded", function () {
  // Mở - Đóng bộ lộc
  function openFilterModal() {
    filterModal?.classList.add("active");
    filterOverlay?.classList.add("active");
  }
  window.closeFilterModal = function () {
    filterModal?.classList.remove("active");
    filterOverlay?.classList.remove("active");
  };
  btnOpenFilter?.addEventListener("click", openFilterModal);
  btnCloseFilter?.addEventListener("click", closeFilterModal);
  filterOverlay?.addEventListener("click", closeFilterModal);
  // Chọn bộ lọc (cho chip tĩnh RAM)
  document.querySelectorAll(".filter-chip").forEach((chip) => {
    chip?.addEventListener("click", function () {
      this.classList.toggle("active");
    });
  });
  // Reset
  btnResetFilter?.addEventListener("click", function () {
    document.querySelectorAll(".filter-chip").forEach((chip) => {
      chip?.classList.remove("active");
    });
  });
});

async function loadCategoriesFilter() {
  try {
    const res = await fetch("http://localhost:5000/api/games/categories");
    const result = await res.json();

    if (result.success && result.data) {
      const categoryContainer = document.getElementById("category-filter-list");
      categoryContainer.innerHTML = ""; // Xóa rỗng trước khi đổ

      // Lặp qua 72 tags và tạo các nút
      result.data.forEach((tagName) => {
        const btn = document.createElement("button");
        btn.className = "filter-chip";
        btn.dataset.value = tagName;
        btn.textContent = tagName;

        // Gắn sự kiện click để kích hoạt trạng thái "active"
        btn.addEventListener("click", function () {
          this.classList.toggle("active");
        });

        categoryContainer.appendChild(btn);
      });
    }
  } catch (error) {
    console.error("Lỗi khi load danh sách tags:", error);
  }
}

async function loadPublishersFilter() {
  try {
    const res = await fetch("http://localhost:5000/api/games/publishers");
    const result = await res.json();

    if (result.success && result.data) {
      const publisherContainer = document.getElementById(
        "publisher-filter-list",
      );
      publisherContainer.innerHTML = ""; // Xóa rỗng trước khi đổ

      result.data.forEach((publisherName) => {
        const btn = document.createElement("button");
        btn.className = "filter-chip";
        btn.dataset.value = publisherName;
        btn.textContent = publisherName;

        btn.addEventListener("click", function () {
          this.classList.toggle("active");
        });

        publisherContainer.appendChild(btn);
      });
    }
  } catch (error) {
    console.error("Lỗi khi load danh sách nhà phát hành:", error);
  }
}

loadCategoriesFilter();
loadPublishersFilter();
