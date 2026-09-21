const btnOpenFilter = document.getElementById("btn-open-filter");
const btnCloseFilter = document.getElementById("btn-close-filter");
const filterModal = document.getElementById("filter-modal");
const filterOverlay = document.getElementById("filter-modal-overlay");
const btnResetFilter = document.getElementById("btn-reset-filter");
const filterChips = document.querySelectorAll(".filter-chip");

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
  // Chọn bộ lọc
  filterChips?.forEach((chip) => {
    chip?.addEventListener("click", function () {
      this.classList.toggle("active");
    });
  });
  // Reset
  btnResetFilter?.addEventListener("click", function () {
    filterChips.forEach((chip) => chip.classList.remove("active"));
  });
});
