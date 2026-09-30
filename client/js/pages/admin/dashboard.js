document.addEventListener("DOMContentLoaded", function () {
  initAdminTabs();
  initHardwareSubTabs();
  loadStatisticsTab();
  loadGamesData();
  initGameActions();
  loadTagsData();
  initTagActions();
});

let allAdminGames = [];
let pendingDeleteGameId = null;

// Lấy danh sách game cho Dashboard Admin
async function loadGamesData(search = "") {
  try {
    const res = await fetch(`/api/games?page=1&limit=500`);
    const result = await res.json();
    if (result.success) {
      allAdminGames = result.data || [];
      let filtered = allAdminGames;
      if (search.trim()) {
        const keyword = search.trim().toLowerCase();
        filtered = allAdminGames.filter(
          (g) =>
            (g.name && g.name.toLowerCase().includes(keyword)) ||
            (g.developer && g.developer.toLowerCase().includes(keyword)) ||
            (g.tags && g.tags.toLowerCase().includes(keyword))
        );
      }
      renderGamesTable(filtered);
    } else {
      console.error("Lỗi lấy danh sách game:", result.message);
    }
  } catch (error) {
    console.error("Lỗi khi gọi API games:", error);
  }
}

// Đổ dữ liệu vào bảng Quản lý Game
function renderGamesTable(games) {
  const tbody = document.getElementById("games-table-body");
  if (!tbody) return;

  if (!games || games.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align: center;">Chưa có game nào trong hệ thống</td></tr>`;
    return;
  }

  tbody.innerHTML = games
    .map((game) => {
      const gameId = game.game_id || game.id;
      const tagArray = (game.tags || "")
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
      const tagsHtml =
        tagArray.length > 0
          ? tagArray
              .slice(0, 3)
              .map((tag) => `<span class="genre-badge">${tag}</span>`)
              .join(" ")
          : `<span style="color: rgba(255,255,255,0.4);">-</span>`;

      const isActive = game.is_active !== false && game.is_active !== 0;
      const statusHtml = isActive
        ? `<span class="status-badge active">Hoạt động</span>`
        : `<span class="status-badge danger">Ngừng hỗ trợ</span>`;

      return `
        <tr data-id="${gameId}">
          <td>#G-${String(gameId).padStart(3, "0")}</td>
          <td class="text-highlight">${game.name || "-"}</td>
          <td>
            <div class="genre-tags">
              ${tagsHtml}
            </div>
          </td>
          <td>${game.developer || game.publisher || "-"}</td>
          <td>${statusHtml}</td>
          <td class="text-right">
            <button title="Sửa" class="btn-action btn-edit-game" data-id="${gameId}">
              <i class="bx bx-edit"></i>
            </button>
            <button title="Xóa" class="btn-action btn-delete-game" data-id="${gameId}">
              <i class="bx bx-trash"></i>
            </button>
          </td>
        </tr>
      `;
    })
    .join("");
}

// Khởi tạo các sự kiện cho Quản lý Game (Search, Add, Edit, Delete)
function initGameActions() {
  const searchInput = document.getElementById("game-search-input");
  if (searchInput) {
    searchInput.addEventListener("input", function (e) {
      loadGamesData(e.target.value);
    });
  }

  // --- Modal Thêm Game ---
  const btnAddGame = document.getElementById("btn-add-game");
  const addModal = document.getElementById("game-add-modal");
  const addForm = document.getElementById("game-add-form");
  const closeAddModal = document.getElementById("close-game-add-modal");
  const cancelAddBtn = document.getElementById("cancel-game-add-btn");
  const addOverlay = document.getElementById("game-add-overlay");

  function hideAddModal() {
    if (addModal) addModal.classList.remove("active");
    if (addForm) addForm.reset();
  }

  if (btnAddGame) {
    btnAddGame.addEventListener("click", () => {
      window.location.href = "add_game_wizard.html";
    });
  }
  if (closeAddModal) closeAddModal.addEventListener("click", hideAddModal);
  if (cancelAddBtn) cancelAddBtn.addEventListener("click", hideAddModal);
  if (addOverlay) addOverlay.addEventListener("click", hideAddModal);

  if (addForm) {
    addForm.addEventListener("submit", async function (e) {
      e.preventDefault();
      const newGame = {
        name: document.getElementById("add-game-name").value.trim(),
        description: document.getElementById("add-game-description").value.trim(),
        publisher: document.getElementById("add-game-publisher").value.trim(),
        developer: document.getElementById("add-game-developer").value.trim(),
        name_tag: document.getElementById("add-game-tags").value.trim(),
        release_date: document.getElementById("add-game-release").value,
        download_url: document.getElementById("add-game-url").value.trim(),
      };

      try {
        const res = await fetch("/api/games/add", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newGame),
        });
        const result = await res.json();
        if (result.success) {
          showToast("Thêm game mới thành công!");
          hideAddModal();
          loadGamesData();
        } else {
          showToast(result.message || "Thêm game thất bại!", true);
        }
      } catch (err) {
        console.error("Lỗi khi thêm game:", err);
        showToast("Lỗi kết nối khi thêm game!", true);
      }
    });
  }

  // --- Modal Sửa Game ---
  const editModal = document.getElementById("game-edit-modal");
  const editForm = document.getElementById("game-edit-form");
  const closeEditModal = document.getElementById("close-game-edit-modal");
  const cancelEditBtn = document.getElementById("cancel-game-edit-btn");
  const editOverlay = document.getElementById("game-edit-overlay");

  function hideEditModal() {
    if (editModal) editModal.classList.remove("active");
    if (editForm) editForm.reset();
  }

  if (closeEditModal) closeEditModal.addEventListener("click", hideEditModal);
  if (cancelEditBtn) cancelEditBtn.addEventListener("click", hideEditModal);
  if (editOverlay) editOverlay.addEventListener("click", hideEditModal);

  if (editForm) {
    editForm.addEventListener("submit", async function (e) {
      e.preventDefault();
      const gameId = document.getElementById("edit-game-id").value;
      const updatePayload = {
        game_id: parseInt(gameId, 10),
        name: document.getElementById("edit-game-name").value.trim(),
        developer: document.getElementById("edit-game-developer").value.trim(),
        name_tag: document.getElementById("edit-game-tags").value.trim(),
        is_active: document.getElementById("edit-game-status").value === "1",
      };

      try {
        const res = await fetch("/api/games/update", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updatePayload),
        });
        const result = await res.json();
        if (result.success) {
          showToast("Cập nhật game thành công!");
          hideEditModal();
          loadGamesData();
        } else {
          showToast(result.message || "Cập nhật game thất bại!", true);
        }
      } catch (err) {
        console.error("Lỗi khi cập nhật game:", err);
        showToast("Lỗi kết nối khi cập nhật game!", true);
      }
    });
  }

  // --- Modal Xóa Game ---
  const deleteModal = document.getElementById("delete-game-modal");
  const closeDeleteModal = document.getElementById("close-delete-game-modal");
  const cancelDeleteBtn = document.getElementById("cancel-delete-game-btn");
  const confirmDeleteBtn = document.getElementById("confirm-delete-game-btn");
  const deleteOverlay = document.getElementById("delete-game-overlay");

  function hideDeleteModal() {
    if (deleteModal) deleteModal.classList.remove("active");
    pendingDeleteGameId = null;
  }

  if (closeDeleteModal) closeDeleteModal.addEventListener("click", hideDeleteModal);
  if (cancelDeleteBtn) cancelDeleteBtn.addEventListener("click", hideDeleteModal);
  if (deleteOverlay) deleteOverlay.addEventListener("click", hideDeleteModal);

  if (confirmDeleteBtn) {
    confirmDeleteBtn.addEventListener("click", async function () {
      if (!pendingDeleteGameId) return;
      try {
        const res = await fetch("/api/games/delete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ game_id: parseInt(pendingDeleteGameId, 10) }),
        });
        const result = await res.json();
        if (result.success) {
          showToast("Xóa game thành công!");
          hideDeleteModal();
          loadGamesData();
        } else {
          showToast(result.message || "Xóa game thất bại!", true);
        }
      } catch (err) {
        console.error("Lỗi khi xóa game:", err);
        showToast("Lỗi kết nối khi xóa game!", true);
      }
    });
  }

  // Delegated Click trên bảng Game cho nút Sửa & Xóa
  const gamesTbody = document.getElementById("games-table-body");
  if (gamesTbody) {
    gamesTbody.addEventListener("click", function (e) {
      const btnEdit = e.target.closest(".btn-edit-game");
      const btnDelete = e.target.closest(".btn-delete-game");

      if (btnEdit) {
        const gameId = btnEdit.getAttribute("data-id");
        const targetGame = allAdminGames.find(
          (g) => (g.game_id || g.id).toString() === gameId.toString()
        );
        if (targetGame) {
          document.getElementById("edit-game-id").value = targetGame.game_id || targetGame.id;
          document.getElementById("edit-game-name").value = targetGame.name || "";
          document.getElementById("edit-game-developer").value = targetGame.developer || "";
          document.getElementById("edit-game-tags").value = targetGame.tags || "";
          document.getElementById("edit-game-status").value =
            targetGame.is_active !== false && targetGame.is_active !== 0 ? "1" : "0";
          if (editModal) editModal.classList.add("active");
        }
      }

      if (btnDelete) {
        const gameId = btnDelete.getAttribute("data-id");
        const targetGame = allAdminGames.find(
          (g) => (g.game_id || g.id).toString() === gameId.toString()
        );
        pendingDeleteGameId = gameId;
        const confirmMsg = document.getElementById("delete-game-confirm-msg");
        if (confirmMsg && targetGame) {
          confirmMsg.innerHTML = `Bạn có chắc chắn muốn xóa game <strong>"${targetGame.name}"</strong> (Mã: #G-${String(gameId).padStart(3, "0")}) không?`;
        }
        if (deleteModal) deleteModal.classList.add("active");
      }
    });
  }
}

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

