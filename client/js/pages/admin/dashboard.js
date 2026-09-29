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
// Lưu ID của thể loại bị xoá
let pendingDeleteTagId = null;

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

  // Add Tag UI Controls
  const btnShowAdd = document.getElementById("btn-show-add-tag");
  const addContainer = document.getElementById("tag-add-container");
  const newTagInput = document.getElementById("new-tag-name-input");
  const btnConfirmAdd = document.getElementById("btn-confirm-add-tag");
  const btnCancelAdd = document.getElementById("btn-cancel-add-tag");

  function openAddTag() {
    if (btnShowAdd && addContainer && newTagInput) {
      btnShowAdd.style.display = "none";
      addContainer.style.display = "flex";
      newTagInput.value = "";
      newTagInput.focus();
    }
  }

  function closeAddTag() {
    if (btnShowAdd && addContainer && newTagInput) {
      addContainer.style.display = "none";
      btnShowAdd.style.display = "inline-flex";
      newTagInput.value = "";
    }
  }

  async function submitAddTag() {
    if (!newTagInput) return;
    const nameTag = newTagInput.value.trim();
    if (!nameTag) {
      showToast("Vui lòng nhập tên thể loại!", true);
      newTagInput.focus();
      return;
    }
    try {
      const res = await fetch("/api/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: nameTag }),
      });
      const result = await res.json();
      if (result.success) {
        showToast("Thêm thể loại thành công!");
        closeAddTag();
        loadTagsData();
      } else {
        showToast(result.message || "Lỗi khi thêm thể loại", true);
      }
    } catch (error) {
      console.error("Lỗi khi thêm tag:", error);
      showToast("Lỗi kết nối khi thêm thể loại!", true);
    }
  }

  if (btnShowAdd) btnShowAdd.addEventListener("click", openAddTag);
  if (btnCancelAdd) btnCancelAdd.addEventListener("click", closeAddTag);
  if (btnConfirmAdd) btnConfirmAdd.addEventListener("click", submitAddTag);
  if (newTagInput) {
    newTagInput.addEventListener("keydown", function (e) {
      if (e.key === "Enter") {
        e.preventDefault();
        submitAddTag();
      } else if (e.key === "Escape") {
        closeAddTag();
      }
    });
  }

  // Bảng xác nhận xoá
  const deleteModal = document.getElementById("delete-tag-modal");
  const confirmDeleteBtn = document.getElementById("confirm-delete-tag-btn");
  const cancelDeleteBtn = document.getElementById("cancel-delete-tag-btn");
  const closeDeleteModal = document.getElementById("close-delete-tag-modal");
  const deleteOverlay = document.getElementById("delete-tag-overlay");

  function hideDeleteModal() {
    if (deleteModal) deleteModal.classList.remove("active");
    pendingDeleteTagId = null;
  }

  if (cancelDeleteBtn)
    cancelDeleteBtn.addEventListener("click", hideDeleteModal);
  if (closeDeleteModal)
    closeDeleteModal.addEventListener("click", hideDeleteModal);
  if (deleteOverlay) deleteOverlay.addEventListener("click", hideDeleteModal);

  if (confirmDeleteBtn) {
    confirmDeleteBtn.addEventListener("click", async function () {
      if (!pendingDeleteTagId) return;
      try {
        const res = await fetch(`/api/tags/${pendingDeleteTagId}`, {
          method: "DELETE",
        });
        const result = await res.json();
        if (result.success) {
          showToast("Xóa thể loại thành công!");
          hideDeleteModal();
          loadTagsData();
        } else {
          showToast(result.message || "Xóa thể loại thất bại!", true);
        }
      } catch (err) {
        console.error("Lỗi khi xóa tag:", err);
        showToast("Lỗi kết nối khi xóa thể loại!", true);
      }
    });
  }

  // Sửa, Xoá tag trong bảng
  const tbody = tabGenres.querySelector("table.data-table tbody");
  if (tbody) {
    tbody.addEventListener("click", async function (e) {
      const btnCancelEdit = e.target.closest(".btn-cancel-edit");
      const btnSaveEdit = e.target.closest(".btn-save-edit");
      const btnEdit = e.target.closest(".btn-edit");
      const btnDelete = e.target.closest(".btn-delete:not(.btn-cancel-edit)");

      // Bấm Hủy khi sửa
      if (btnCancelEdit) {
        e.stopPropagation();
        loadTagsData();
        return;
      }

      // Bấm Lưu khi sửa
      if (btnSaveEdit) {
        e.stopPropagation();
        const tagId = btnSaveEdit.getAttribute("data-id");
        const currentRow = btnSaveEdit.closest("tr");
        const editInput = currentRow
          ? currentRow.querySelector(".tag-edit-input")
          : null;
        if (editInput) {
          const oldName = editInput.getAttribute("data-original") || "";
          saveTagEdit(tagId, editInput.value.trim(), oldName);
        }
        return;
      }

      // Bấm Sửa (chuyển ô tên thành input)
      if (btnEdit) {
        e.stopPropagation();
        const currentRow = btnEdit.closest("tr");
        if (currentRow.classList.contains("editing-row")) return;

        let tagId =
          btnEdit.getAttribute("data-id") || currentRow.getAttribute("data-id");
        if (!tagId) {
          tagId = currentRow.children[0].textContent.trim().replace("#", "");
        }

        currentRow.classList.add("editing-row");
        const nameTd = currentRow.children[1];
        const currentName = nameTd.textContent.trim();

        // Đưa input vào ô tên
        nameTd.innerHTML = `
          <input type="text" class="tag-inline-input tag-edit-input" value="${currentName}" data-original="${currentName}" style="width: 100%; box-sizing: border-box;" />
        `;

        // Đổi nút thao tác thành Lưu và Hủy
        const actionTd = currentRow.children[3];
        actionTd.innerHTML = `
          <button type="button" title="Lưu" class="btn-action btn-save-edit" data-id="${tagId}">
            <i class="bx bx-check"></i>
          </button>
          <button type="button" title="Hủy" class="btn-action btn-cancel-edit" data-id="${tagId}">
            <i class="bx bx-x"></i>
          </button>
        `;

        const editInput = nameTd.querySelector(".tag-edit-input");
        if (editInput) {
          editInput.focus();
          editInput.select();

          editInput.addEventListener("keydown", async function (evt) {
            if (evt.key === "Enter") {
              evt.preventDefault();
              saveTagEdit(tagId, editInput.value.trim(), currentName);
            } else if (evt.key === "Escape") {
              loadTagsData();
            }
          });
        }
        return;
      }

      // Bấm Xoá -> Hiện modal xác nhận custom
      if (btnDelete) {
        e.stopPropagation();
        const currentRow = btnDelete.closest("tr");
        let tagId =
          btnDelete.getAttribute("data-id") ||
          currentRow.getAttribute("data-id");
        if (!tagId) {
          tagId = currentRow.children[0].textContent.trim().replace("#", "");
        }

        const nameTd =
          currentRow.querySelector(".tag-edit-input") || currentRow.children[1];
        const tagName =
          nameTd.tagName === "INPUT" ? nameTd.value : nameTd.textContent.trim();

        pendingDeleteTagId = tagId;
        const confirmMsg = document.getElementById("delete-tag-confirm-msg");
        if (confirmMsg) {
          confirmMsg.innerHTML = `Bạn có chắc chắn muốn xóa thể loại <strong>"${tagName}"</strong> (Mã: #${tagId}) không?`;
        }

        if (deleteModal) {
          deleteModal.classList.add("active");
        }
      }
    });
  }
}

// Hàm hỗ trợ Lưu Sửa Tag
async function saveTagEdit(tagId, newName, oldName = "") {
  if (!tagId || tagId === "null" || isNaN(parseInt(tagId, 10))) {
    showToast("Không tìm thấy ID hợp lệ của thể loại!", true);
    loadTagsData();
    return;
  }
  if (!newName) {
    showToast("Tên thể loại không được để trống!", true);
    return;
  }
  if (oldName && newName === oldName) {
    loadTagsData();
    return;
  }
  try {
    const res = await fetch(`/api/tags/${tagId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName }),
    });
    const result = await res.json();
    if (result.success) {
      showToast("Cập nhật thể loại thành công!");
    } else {
      showToast(result.message || "Cập nhật thể loại thất bại!", true);
    }
  } catch (err) {
    console.error("Lỗi khi sửa tag:", err);
    showToast("Lỗi kết nối khi sửa thể loại!", true);
  } finally {
    // Luôn luôn tải lại dữ liệu để thoát chế độ sửa và đồng bộ giao diện
    loadTagsData();
  }
}
