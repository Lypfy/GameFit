document.addEventListener("DOMContentLoaded", function () {
  initAdminTabs();
  initHardwareSubTabs();
  loadStatisticsTab();
  loadTagsData();
  initTagActions();
});

function initAdminTabs() {
  const tabPills = document.querySelectorAll(".admin-tabs-nav .tab-pill");
  tabPills.forEach((pill) => {
    pill.addEventListener("click", function () {
      const targetId = this.getAttribute("data-tab");
      tabPills.forEach((p) => p.classList.remove("active"));
      this.classList.add("active");
      const tabContents = document.querySelectorAll(
        ".admin-management-container > .tab-content",
      );
      tabContents.forEach((tab) => {
        if (tab.id === targetId) {
          tab.classList.add("active");
          tab.style.display = "block";
        } else {
          tab.classList.remove("active");
          tab.style.display = "none";
        }
      });
    });
  });
}

function initHardwareSubTabs() {
  const subTabPills = document.querySelectorAll(
    ".hardware-sub-nav .sub-tab-pill",
  );
  subTabPills.forEach((pill) => {
    pill.addEventListener("click", function () {
      const targetId = this.getAttribute("data-hw-tab");
      subTabPills.forEach((p) => p.classList.remove("active"));
      this.classList.add("active");
      const hwContents = document.querySelectorAll(".hw-tab-content");
      hwContents.forEach((content) => {
        if (content.id === targetId) {
          content.style.display = "block";
        } else {
          content.style.display = "none";
        }
      });
    });
  });
}

async function loadStatisticsTab() {
  const container = document.getElementById("tab-dashboard");
  if (!container) return;
  try {
    const res = await fetch("./statistics.html");
    const htmlText = await res.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlText, "text/html");
    const statsContent = doc.querySelector(".main-content") || doc.body;
    container.innerHTML = statsContent.innerHTML;
    // Khởi tạo các sự kiện click tab & filter sau khi nạp HTML thành công
    if (typeof initStatistics === "function") {
      initStatistics(container);
    }
  } catch (err) {
    container.innerHTML = "<p>Không thể tải dữ liệu thống kê.</p>";
  }
}
// Gọi API lấy danh sách tag
async function loadTagsData(search = "") {
  try {
    const response = await fetch(
      `/api/tags?search=${encodeURIComponent(search)}`,
    );
    const result = await response.json();
    if (result.success) {
      renderTagsTable(result.data);
    } else {
      console.error("Lỗi lấy danh sách tags:", result.message);
    }
  } catch (error) {
    console.error("Lỗi khi gọi API tags:", error);
  }
}
// Đổ dữ liệu vào tbody của bảng Tag
function renderTagsTable(tags) {
  const tbody = document.querySelector("#tab-genres table.data-table tbody");
  if (!tbody) return;
  if (!tags || tags.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4" style="text-align: center;">Chưa có tag nào trong hệ thống</td></tr>`;
    return;
  }
  tbody.innerHTML = tags
    .map((tag) => {
      return `
    <tr>
      <td>${tag.tag_id}</td>
      <td class="text-highlight">${tag.name}</td>
      <td class="text-highlight">${tag.soluonggame}</td>
      <td class="text-right">
        <button title="Sửa" class="btn-action btn-edit" data-id="${tag.tag_id}">
          <i class="bx bx-edit"></i>
        </button>
        <button title="Xóa" class="btn-action btn-delete" data-id="${tag.tag_id}">
          <i class="bx bx-trash"></i>
        </button>
      </td>
    </tr>
    `;
    })
    .join("");
}
// Hàm tagActions - Search - Add - Edit - Delete
function initTagActions() {
  const tabGenres = document.getElementById("tab-genres");
  if (!tabGenres) return;
  // Search
  const searchInput = tabGenres.querySelector(".table-search input");
  if (searchInput) {
    searchInput.addEventListener("input", function (e) {
      const keyword = e.target.value.trim();
      loadTagsData(keyword);
    });
  }
  // Add
  const addBtn = tabGenres.querySelector(".btn-add");
  if (addBtn) {
    addBtn.addEventListener("click", async function () {
      const nameTag = prompt("Nhập tên tag:");
      if (nameTag && nameTag.trim() !== "") {
        try {
          const res = await fetch("/api/tags", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              name: nameTag.trim(),
            }),
          });
          const result = await res.json();
          if (result.success) {
            loadTagsData();
          } else {
            console.error("Lỗi thêm tag:", result.message);
          }
        } catch (error) {
          console.error("Lỗi khi thêm tag:", error);
        }
      }
    });
  }
  // Sửa, Xoá tag trong bản
  const tbody = tabGenres.querySelector("table.data-table tbody");
  if (tbody) {
    tbody.addEventListener("click", async function (e) {
      const btnEdit = e.target.closest(".btn-edit");
      const btnDelete = e.target.closest(".btn-delete");
      // sửa tag
      if (btnEdit) {
        const tagId = btnEdit.getAttribute("data-id");
        const currentRow = btnEdit.closest("tr");
        const currentName = currentRow.children[1].textContent.trim();
        const newName = prompt("Nhập tên Tag mới:", currentName);
        if (newName && newName.trim() !== "" && newName !== currentName) {
          try {
            const res = await fetch(`/api/tags/${tagId}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ name: newName.trim() }),
            });
            const result = await res.json();
            if (result.success) {
              alert("Cập nhật Tag thành công!");
              loadTagsData();
            } else {
              alert(result.message);
            }
          } catch (err) {
            alert("Lỗi kết nối khi sửa Tag!");
          }
        }
      }
      // xoá tag
      if (btnDelete) {
        const tagId = btnDelete.getAttribute("data-id");
        if (confirm(`Bạn có chắc chắn muốn xóa Tag #${tagId} này không?`)) {
          try {
            const res = await fetch(`/api/tags/${tagId}`, { method: "DELETE" });
            const result = await res.json();
            if (result.success) {
              alert("Xóa Tag thành công!");
              loadTagsData();
            } else {
              alert(result.message);
            }
          } catch (err) {
            alert("Lỗi kết nối khi xóa Tag!");
          }
        }
      }
    });
  }
}
