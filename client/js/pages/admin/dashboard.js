document.addEventListener("DOMContentLoaded", function () {
  initAdminTabs();
  initHardwareSubTabs();
  loadStatisticsTab();
  loadGamesData();
  initGameActions();
  loadUsersData();
  initUserActions();
  loadTagsData();
  initTagActions();
  loadCpuData();
  loadGpuData();
  initHardwareActions();
});

let allAdminGames = [];
let pendingDeleteGameId = null;

// Lấy danh sách game cho Dashboard Admin
async function loadGamesData(search = "") {
  try {
    const res = await fetch(`/api/games?page=1&limit=500&_t=${Date.now()}`, {
      cache: "no-store",
      headers: { "Cache-Control": "no-cache" }
    });
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
            (g.tags && g.tags.toLowerCase().includes(keyword)),
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
  console.log("Dữ liệu game:", games); // <-- Đặt ở đây
  console.log("Phần tử đầu tiên:", games ? games[0] : null);
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
        description: document
          .getElementById("add-game-description")
          .value.trim(),
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

  if (closeDeleteModal)
    closeDeleteModal.addEventListener("click", hideDeleteModal);
  if (cancelDeleteBtn)
    cancelDeleteBtn.addEventListener("click", hideDeleteModal);
  if (deleteOverlay) deleteOverlay.addEventListener("click", hideDeleteModal);

  if (confirmDeleteBtn) {
    confirmDeleteBtn.addEventListener("click", async function () {
      if (!pendingDeleteGameId) return;
      confirmDeleteBtn.disabled = true;
      confirmDeleteBtn.textContent = "Đang xóa...";
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
      } finally {
        confirmDeleteBtn.disabled = false;
        confirmDeleteBtn.textContent = "Xóa ngay";
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
          (g) => (g.game_id || g.id).toString() === gameId.toString(),
        );
        if (targetGame) {
          document.getElementById("edit-game-id").value =
            targetGame.game_id || targetGame.id;
          document.getElementById("edit-game-name").value =
            targetGame.name || "";
          document.getElementById("edit-game-developer").value =
            targetGame.developer || "";
          document.getElementById("edit-game-tags").value =
            targetGame.tags || "";
          document.getElementById("edit-game-status").value =
            targetGame.is_active !== false && targetGame.is_active !== 0
              ? "1"
              : "0";
          if (editModal) editModal.classList.add("active");
        }
      }

      if (btnDelete) {
        const gameId = btnDelete.getAttribute("data-id");
        const targetGame = allAdminGames.find(
          (g) => (g.game_id || g.id).toString() === gameId.toString(),
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
      confirmDeleteBtn.disabled = true;
      confirmDeleteBtn.textContent = "Đang xóa...";
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
      } finally {
        confirmDeleteBtn.disabled = false;
        confirmDeleteBtn.textContent = "Xóa ngay";
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

// --- QUẢN LÝ DỮ LIỆU HARDWARE (CPU & GPU) ---
let cpuCurrentPage = 1;
let cpuTotalPages = 1;
let cpuSearchKeyword = "";
let currentCpusList = [];
let pendingDeleteCpuId = null;

let gpuCurrentPage = 1;
let gpuTotalPages = 1;
let gpuSearchKeyword = "";
let currentGpusList = [];
let pendingDeleteGpuId = null;

// 1. Lấy và hiển thị danh sách CPU từ DBMS (Có phân trang & sắp xếp theo CPU ID)
async function loadCpuData(page = 1, search = cpuSearchKeyword) {
  try {
    cpuCurrentPage = page;
    cpuSearchKeyword = search;

    const url = `/api/cpus?page=${page}&limit=20&search=${encodeURIComponent(search.trim())}`;

    const res = await fetch(url);
    const result = await res.json();
    if (result.success) {
      const cpus = Array.isArray(result.data)
        ? result.data
        : result.data?.data || [];
      currentCpusList = cpus;
      renderCpuTable(cpus);

      const pagination = result.pagination || result.data?.pagination || {};
      cpuTotalPages = pagination.totalPages || 1;
      const totalItems = pagination.totalItems || cpus.length;

      updateCpuPaginationUI(cpuCurrentPage, cpuTotalPages, totalItems);
    }
  } catch (error) {
    console.error("Lỗi khi tải dữ liệu CPU:", error);
  }
}

function updateCpuPaginationUI(page, totalPages, totalItems) {
  const elPage = document.getElementById("cpu-current-page");
  const elTotalPages = document.getElementById("cpu-total-pages");
  const elTotalItems = document.getElementById("cpu-total-items");
  const btnPrev = document.getElementById("btn-cpu-prev");
  const btnNext = document.getElementById("btn-cpu-next");

  if (elPage) elPage.textContent = page;
  if (elTotalPages) elTotalPages.textContent = totalPages;
  if (elTotalItems)
    elTotalItems.textContent = totalItems.toLocaleString("vi-VN");

  if (btnPrev) btnPrev.disabled = page <= 1;
  if (btnNext) btnNext.disabled = page >= totalPages;
}

function renderCpuTable(cpus) {
  const tbody = document.querySelector("#hw-cpu table.data-table tbody");
  if (!tbody) return;

  if (!cpus || cpus.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align: center;">Chưa có dữ liệu CPU trong hệ thống</td></tr>`;
    return;
  }

  tbody.innerHTML = cpus
    .map((cpu) => {
      const cpuId = cpu.cpu_id || cpu.id;
      const name = cpu.name || cpu.cpu_name || "-";
      const brand = cpu.brand || "-";
      const score =
        cpu.benchmark_score != null
          ? Number(cpu.benchmark_score).toLocaleString("vi-VN")
          : "0";

      return `
        <tr data-id="${cpuId}">
          <td>${cpuId}</td>
          <td class="text-highlight">${name}</td>
          <td>${brand}</td>
          <td class="score-val">${score}</td>
          <td class="text-right">
            <button title="Sửa" class="btn-action btn-edit btn-edit-cpu" data-id="${cpuId}">
              <i class="bx bx-edit"></i>
            </button>
            <button title="Xóa" class="btn-action btn-delete btn-delete-cpu" data-id="${cpuId}">
              <i class="bx bx-trash"></i>
            </button>
          </td>
        </tr>
      `;
    })
    .join("");
}

// 2. Lấy và hiển thị danh sách GPU từ DBMS (Có phân trang & sắp xếp theo GPU ID)
async function loadGpuData(page = 1, search = gpuSearchKeyword) {
  try {
    gpuCurrentPage = page;
    gpuSearchKeyword = search;

    const url = `/api/gpus?page=${page}&limit=20&search=${encodeURIComponent(search.trim())}`;

    const res = await fetch(url);
    const result = await res.json();
    if (result.success) {
      const gpus = Array.isArray(result.data)
        ? result.data
        : result.data?.data || [];
      currentGpusList = gpus;
      renderGpuTable(gpus);

      const pagination = result.pagination || result.data?.pagination || {};
      gpuTotalPages = pagination.totalPages || 1;
      const totalItems = pagination.totalItems || gpus.length;

      updateGpuPaginationUI(gpuCurrentPage, gpuTotalPages, totalItems);
    }
  } catch (error) {
    console.error("Lỗi khi tải dữ liệu GPU:", error);
  }
}

function updateGpuPaginationUI(page, totalPages, totalItems) {
  const elPage = document.getElementById("gpu-current-page");
  const elTotalPages = document.getElementById("gpu-total-pages");
  const elTotalItems = document.getElementById("gpu-total-items");
  const btnPrev = document.getElementById("btn-gpu-prev");
  const btnNext = document.getElementById("btn-gpu-next");

  if (elPage) elPage.textContent = page;
  if (elTotalPages) elTotalPages.textContent = totalPages;
  if (elTotalItems)
    elTotalItems.textContent = totalItems.toLocaleString("vi-VN");

  if (btnPrev) btnPrev.disabled = page <= 1;
  if (btnNext) btnNext.disabled = page >= totalPages;
}

function renderGpuTable(gpus) {
  const tbody = document.querySelector("#hw-gpu table.data-table tbody");
  if (!tbody) return;

  if (!gpus || gpus.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align: center;">Chưa có dữ liệu GPU trong hệ thống</td></tr>`;
    return;
  }

  tbody.innerHTML = gpus
    .map((gpu) => {
      const gpuId = gpu.gpu_id || gpu.id;
      const name = gpu.name || gpu.gpu_name || "-";
      const brand = gpu.brand || "-";
      const score =
        gpu.benchmark_score != null
          ? Number(gpu.benchmark_score).toLocaleString("vi-VN")
          : "0";

      return `
        <tr data-id="${gpuId}">
          <td>${gpuId}</td>
          <td class="text-highlight">${name}</td>
          <td>${brand}</td>
          <td class="score-val">${score}</td>
          <td class="text-right">
            <button title="Sửa" class="btn-action btn-edit btn-edit-gpu" data-id="${gpuId}">
              <i class="bx bx-edit"></i>
            </button>
            <button title="Xóa" class="btn-action btn-delete btn-delete-gpu" data-id="${gpuId}">
              <i class="bx bx-trash"></i>
            </button>
          </td>
        </tr>
      `;
    })
    .join("");
}

// Khởi tạo các sự kiện phân trang và tìm kiếm cho CPU / GPU
function initHardwareActions() {
  // Tìm kiếm CPU
  const cpuSearch = document.querySelector("#hw-cpu .table-search input");
  if (cpuSearch) {
    cpuSearch.addEventListener("input", function (e) {
      loadCpuData(1, e.target.value.trim());
    });
  }

  // Nút Phân trang CPU
  const btnCpuPrev = document.getElementById("btn-cpu-prev");
  const btnCpuNext = document.getElementById("btn-cpu-next");
  if (btnCpuPrev) {
    btnCpuPrev.addEventListener("click", () => {
      if (cpuCurrentPage > 1) {
        loadCpuData(cpuCurrentPage - 1);
      }
    });
  }
  if (btnCpuNext) {
    btnCpuNext.addEventListener("click", () => {
      if (cpuCurrentPage < cpuTotalPages) {
        loadCpuData(cpuCurrentPage + 1);
      }
    });
  }

  // Tìm kiếm GPU
  const gpuSearch = document.querySelector("#hw-gpu .table-search input");
  if (gpuSearch) {
    gpuSearch.addEventListener("input", function (e) {
      loadGpuData(1, e.target.value.trim());
    });
  }

  // Nút Phân trang GPU
  const btnGpuPrev = document.getElementById("btn-gpu-prev");
  const btnGpuNext = document.getElementById("btn-gpu-next");
  if (btnGpuPrev) {
    btnGpuPrev.addEventListener("click", () => {
      if (gpuCurrentPage > 1) {
        loadGpuData(gpuCurrentPage - 1);
      }
    });
  }
  if (btnGpuNext) {
    btnGpuNext.addEventListener("click", () => {
      if (gpuCurrentPage < gpuTotalPages) {
        loadGpuData(gpuCurrentPage + 1);
      }
    });
  }

  // --- MODAL THÊM CPU MỚI ---
  const btnAddCpu = document.getElementById("btn-add-cpu");
  const cpuModal = document.getElementById("cpu-add-modal");
  const cpuForm = document.getElementById("cpu-add-form");
  const closeCpuModal = document.getElementById("close-cpu-add-modal");
  const cancelCpuBtn = document.getElementById("cancel-cpu-add-btn");
  const cpuOverlay = document.getElementById("cpu-add-modal");

  function hideCpuModal() {
    if (cpuModal) cpuModal.classList.remove("active");
    if (cpuForm) cpuForm.reset();
  }

  if (btnAddCpu) {
    btnAddCpu.addEventListener("click", () => {
      if (cpuModal) cpuModal.classList.add("active");
    });
  }
  if (closeCpuModal) closeCpuModal.addEventListener("click", hideCpuModal);
  if (cancelCpuBtn) cancelCpuBtn.addEventListener("click", hideCpuModal);
  if (cpuOverlay) {
    cpuOverlay.addEventListener("click", function (e) {
      if (e.target === cpuOverlay) hideCpuModal();
    });
  }

  if (cpuForm) {
    cpuForm.addEventListener("submit", async function (e) {
      e.preventDefault();
      const name = document.getElementById("add-cpu-name").value.trim();
      const brand = document.getElementById("add-cpu-brand").value;
      const score =
        parseInt(document.getElementById("add-cpu-score").value, 10) || 0;

      if (!name) {
        showToast("Vui lòng nhập tên CPU!", true);
        return;
      }

      try {
        const res = await fetch("/api/cpus", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            cpu_name: name,
            name,
            brand,
            benchmark_score: score,
          }),
        });
        const result = await res.json();
        if (result.success || res.ok) {
          showToast("Thêm CPU mới thành công!");
          hideCpuModal();
          loadCpuData(1);
        } else {
          showToast(result.message || "Thêm CPU thất bại!", true);
        }
      } catch (err) {
        console.error("Lỗi khi thêm CPU:", err);
        showToast("Lỗi kết nối khi thêm CPU!", true);
      }
    });
  }

  // --- MODAL CẬP NHẬT CPU ---
  const cpuEditModal = document.getElementById("cpu-edit-modal");
  const cpuEditForm = document.getElementById("cpu-edit-form");
  const closeCpuEditModal = document.getElementById("close-cpu-edit-modal");
  const cancelCpuEditBtn = document.getElementById("cancel-cpu-edit-btn");
  const cpuEditOverlay = document.getElementById("cpu-edit-modal");

  function hideCpuEditModal() {
    if (cpuEditModal) cpuEditModal.classList.remove("active");
    if (cpuEditForm) cpuEditForm.reset();
  }

  if (closeCpuEditModal) closeCpuEditModal.addEventListener("click", hideCpuEditModal);
  if (cancelCpuEditBtn) cancelCpuEditBtn.addEventListener("click", hideCpuEditModal);
  if (cpuEditOverlay) {
    cpuEditOverlay.addEventListener("click", function (e) {
      if (e.target === cpuEditOverlay) hideCpuEditModal();
    });
  }

  if (cpuEditForm) {
    cpuEditForm.addEventListener("submit", async function (e) {
      e.preventDefault();
      const cpuId = document.getElementById("edit-cpu-id").value;
      const name = document.getElementById("edit-cpu-name").value.trim();
      const brand = document.getElementById("edit-cpu-brand").value;
      const score = parseInt(document.getElementById("edit-cpu-score").value, 10) || 0;

      if (!cpuId) {
        showToast("Thiếu ID CPU hợp lệ!", true);
        return;
      }
      if (!name) {
        showToast("Vui lòng nhập tên CPU!", true);
        return;
      }

      try {
        const res = await fetch(`/api/cpus/${cpuId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            cpu_name: name,
            brand,
            benchmark_score: score,
          }),
        });
        const result = await res.json();
        if (result.success || res.ok) {
          showToast("Cập nhật CPU thành công!");
          hideCpuEditModal();
          loadCpuData(cpuCurrentPage);
        } else {
          showToast(result.message || "Cập nhật CPU thất bại!", true);
        }
      } catch (err) {
        console.error("Lỗi khi cập nhật CPU:", err);
        showToast("Lỗi kết nối khi cập nhật CPU!", true);
      }
    });
  }

  // --- MODAL XÓA CPU ---
  const deleteCpuModal = document.getElementById("delete-cpu-modal");
  const closeDeleteCpuModal = document.getElementById("close-delete-cpu-modal");
  const cancelDeleteCpuBtn = document.getElementById("cancel-delete-cpu-btn");
  const confirmDeleteCpuBtn = document.getElementById("confirm-delete-cpu-btn");
  const deleteCpuOverlay = document.getElementById("delete-cpu-overlay");

  function hideDeleteCpuModal() {
    if (deleteCpuModal) deleteCpuModal.classList.remove("active");
    pendingDeleteCpuId = null;
  }

  if (closeDeleteCpuModal) closeDeleteCpuModal.addEventListener("click", hideDeleteCpuModal);
  if (cancelDeleteCpuBtn) cancelDeleteCpuBtn.addEventListener("click", hideDeleteCpuModal);
  if (deleteCpuOverlay) deleteCpuOverlay.addEventListener("click", hideDeleteCpuModal);

  if (confirmDeleteCpuBtn) {
    confirmDeleteCpuBtn.addEventListener("click", async function () {
      if (!pendingDeleteCpuId) return;
      confirmDeleteCpuBtn.disabled = true;
      confirmDeleteCpuBtn.textContent = "Đang xóa...";
      try {
        const res = await fetch(`/api/cpus/${pendingDeleteCpuId}`, {
          method: "DELETE",
        });
        const result = await res.json();
        if (result.success || res.ok) {
          showToast("Xóa CPU thành công!");
          hideDeleteCpuModal();
          loadCpuData(cpuCurrentPage);
        } else {
          showToast(result.message || "Xóa CPU thất bại!", true);
        }
      } catch (err) {
        console.error("Lỗi khi xóa CPU:", err);
        showToast("Lỗi kết nối khi xóa CPU!", true);
      } finally {
        confirmDeleteCpuBtn.disabled = false;
        confirmDeleteCpuBtn.textContent = "Xóa ngay";
      }
    });
  }

  // Event Delegation trên bảng CPU cho nút Sửa & Xóa
  const cpuTbody = document.querySelector("#hw-cpu table.data-table tbody");
  if (cpuTbody) {
    cpuTbody.addEventListener("click", function (e) {
      const btnEdit = e.target.closest(".btn-edit-cpu");
      const btnDelete = e.target.closest(".btn-delete-cpu");

      if (btnEdit) {
        const cpuId = btnEdit.getAttribute("data-id");
        const targetCpu = currentCpusList.find(
          (c) => (c.cpu_id || c.id).toString() === cpuId.toString()
        );
        if (targetCpu) {
          document.getElementById("edit-cpu-id").value = targetCpu.cpu_id || targetCpu.id;
          document.getElementById("edit-cpu-name").value = targetCpu.name || targetCpu.cpu_name || "";
          document.getElementById("edit-cpu-brand").value = targetCpu.brand || "";
          document.getElementById("edit-cpu-score").value = targetCpu.benchmark_score != null ? targetCpu.benchmark_score : 0;
          if (cpuEditModal) cpuEditModal.classList.add("active");
        }
      }

      if (btnDelete) {
        const cpuId = btnDelete.getAttribute("data-id");
        const targetCpu = currentCpusList.find(
          (c) => (c.cpu_id || c.id).toString() === cpuId.toString()
        );
        pendingDeleteCpuId = cpuId;
        const confirmMsg = document.getElementById("delete-cpu-confirm-msg");
        if (confirmMsg && targetCpu) {
          confirmMsg.innerHTML = `Bạn có chắc chắn muốn xóa CPU <strong>"${targetCpu.name || targetCpu.cpu_name}"</strong> (Mã: #${cpuId}) không?`;
        }
        if (deleteCpuModal) deleteCpuModal.classList.add("active");
      }
    });
  }

  // --- MODAL THÊM GPU MỚI ---
  const btnAddGpu = document.getElementById("btn-add-gpu");
  const gpuModal = document.getElementById("gpu-add-modal");
  const gpuForm = document.getElementById("gpu-add-form");
  const closeGpuModal = document.getElementById("close-gpu-add-modal");
  const cancelGpuBtn = document.getElementById("cancel-gpu-add-btn");
  const gpuOverlay = document.getElementById("gpu-add-modal");

  function hideGpuModal() {
    if (gpuModal) gpuModal.classList.remove("active");
    if (gpuForm) gpuForm.reset();
  }

  if (btnAddGpu) {
    btnAddGpu.addEventListener("click", () => {
      if (gpuModal) gpuModal.classList.add("active");
    });
  }
  if (closeGpuModal) closeGpuModal.addEventListener("click", hideGpuModal);
  if (cancelGpuBtn) cancelGpuBtn.addEventListener("click", hideGpuModal);
  if (gpuOverlay) {
    gpuOverlay.addEventListener("click", function (e) {
      if (e.target === gpuOverlay) hideGpuModal();
    });
  }

  if (gpuForm) {
    gpuForm.addEventListener("submit", async function (e) {
      e.preventDefault();
      const name = document.getElementById("add-gpu-name").value.trim();
      const brand = document.getElementById("add-gpu-brand").value;
      const score =
        parseInt(document.getElementById("add-gpu-score").value, 10) || 0;

      if (!name) {
        showToast("Vui lòng nhập tên GPU!", true);
        return;
      }

      try {
        const res = await fetch("/api/gpus", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            gpu_name: name,
            name,
            brand,
            benchmark_score: score,
          }),
        });
        const result = await res.json();
        if (result.success || res.ok) {
          showToast("Thêm GPU mới thành công!");
          hideGpuModal();
          loadGpuData(1);
        } else {
          showToast(result.message || "Thêm GPU thất bại!", true);
        }
      } catch (err) {
        console.error("Lỗi khi thêm GPU:", err);
        showToast("Lỗi kết nối khi thêm GPU!", true);
      }
    });
  }

  // --- MODAL CẬP NHẬT GPU ---
  const gpuEditModal = document.getElementById("gpu-edit-modal");
  const gpuEditForm = document.getElementById("gpu-edit-form");
  const closeGpuEditModal = document.getElementById("close-gpu-edit-modal");
  const cancelGpuEditBtn = document.getElementById("cancel-gpu-edit-btn");
  const gpuEditOverlay = document.getElementById("gpu-edit-modal");

  function hideGpuEditModal() {
    if (gpuEditModal) gpuEditModal.classList.remove("active");
    if (gpuEditForm) gpuEditForm.reset();
  }

  if (closeGpuEditModal) closeGpuEditModal.addEventListener("click", hideGpuEditModal);
  if (cancelGpuEditBtn) cancelGpuEditBtn.addEventListener("click", hideGpuEditModal);
  if (gpuEditOverlay) {
    gpuEditOverlay.addEventListener("click", function (e) {
      if (e.target === gpuEditOverlay) hideGpuEditModal();
    });
  }

  if (gpuEditForm) {
    gpuEditForm.addEventListener("submit", async function (e) {
      e.preventDefault();
      const gpuId = document.getElementById("edit-gpu-id").value;
      const name = document.getElementById("edit-gpu-name").value.trim();
      const brand = document.getElementById("edit-gpu-brand").value;
      const score = parseInt(document.getElementById("edit-gpu-score").value, 10) || 0;

      if (!gpuId) {
        showToast("Thiếu ID GPU hợp lệ!", true);
        return;
      }
      if (!name) {
        showToast("Vui lòng nhập tên GPU!", true);
        return;
      }

      try {
        const res = await fetch(`/api/gpus/${gpuId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            gpu_name: name,
            brand,
            benchmark_score: score,
          }),
        });
        const result = await res.json();
        if (result.success || res.ok) {
          showToast("Cập nhật GPU thành công!");
          hideGpuEditModal();
          loadGpuData(gpuCurrentPage);
        } else {
          showToast(result.message || "Cập nhật GPU thất bại!", true);
        }
      } catch (err) {
        console.error("Lỗi khi cập nhật GPU:", err);
        showToast("Lỗi kết nối khi cập nhật GPU!", true);
      }
    });
  }

  // --- MODAL XÓA GPU ---
  const deleteGpuModal = document.getElementById("delete-gpu-modal");
  const closeDeleteGpuModal = document.getElementById("close-delete-gpu-modal");
  const cancelDeleteGpuBtn = document.getElementById("cancel-delete-gpu-btn");
  const confirmDeleteGpuBtn = document.getElementById("confirm-delete-gpu-btn");
  const deleteGpuOverlay = document.getElementById("delete-gpu-overlay");

  function hideDeleteGpuModal() {
    if (deleteGpuModal) deleteGpuModal.classList.remove("active");
    pendingDeleteGpuId = null;
  }

  if (closeDeleteGpuModal) closeDeleteGpuModal.addEventListener("click", hideDeleteGpuModal);
  if (cancelDeleteGpuBtn) cancelDeleteGpuBtn.addEventListener("click", hideDeleteGpuModal);
  if (deleteGpuOverlay) deleteGpuOverlay.addEventListener("click", hideDeleteGpuModal);

  if (confirmDeleteGpuBtn) {
    confirmDeleteGpuBtn.addEventListener("click", async function () {
      if (!pendingDeleteGpuId) return;
      confirmDeleteGpuBtn.disabled = true;
      confirmDeleteGpuBtn.textContent = "Đang xóa...";
      try {
        const res = await fetch(`/api/gpus/${pendingDeleteGpuId}`, {
          method: "DELETE",
        });
        const result = await res.json();
        if (result.success || res.ok) {
          showToast("Xóa GPU thành công!");
          hideDeleteGpuModal();
          loadGpuData(gpuCurrentPage);
        } else {
          showToast(result.message || "Xóa GPU thất bại!", true);
        }
      } catch (err) {
        console.error("Lỗi khi xóa GPU:", err);
        showToast("Lỗi kết nối khi xóa GPU!", true);
      } finally {
        confirmDeleteGpuBtn.disabled = false;
        confirmDeleteGpuBtn.textContent = "Xóa ngay";
      }
    });
  }

  // Event Delegation trên bảng GPU cho nút Sửa & Xóa
  const gpuTbody = document.querySelector("#hw-gpu table.data-table tbody");
  if (gpuTbody) {
    gpuTbody.addEventListener("click", function (e) {
      const btnEdit = e.target.closest(".btn-edit-gpu");
      const btnDelete = e.target.closest(".btn-delete-gpu");

      if (btnEdit) {
        const gpuId = btnEdit.getAttribute("data-id");
        const targetGpu = currentGpusList.find(
          (g) => (g.gpu_id || g.id).toString() === gpuId.toString()
        );
        if (targetGpu) {
          document.getElementById("edit-gpu-id").value = targetGpu.gpu_id || targetGpu.id;
          document.getElementById("edit-gpu-name").value = targetGpu.name || targetGpu.gpu_name || "";
          document.getElementById("edit-gpu-brand").value = targetGpu.brand || "";
          document.getElementById("edit-gpu-score").value = targetGpu.benchmark_score != null ? targetGpu.benchmark_score : 0;
          if (gpuEditModal) gpuEditModal.classList.add("active");
        }
      }

      if (btnDelete) {
        const gpuId = btnDelete.getAttribute("data-id");
        const targetGpu = currentGpusList.find(
          (g) => (g.gpu_id || g.id).toString() === gpuId.toString()
        );
        pendingDeleteGpuId = gpuId;
        const confirmMsg = document.getElementById("delete-gpu-confirm-msg");
        if (confirmMsg && targetGpu) {
          confirmMsg.innerHTML = `Bạn có chắc chắn muốn xóa GPU <strong>"${targetGpu.name || targetGpu.gpu_name}"</strong> (Mã: #${gpuId}) không?`;
        }
        if (deleteGpuModal) deleteGpuModal.classList.add("active");
      }
    });
  }
}

// ==========================================
// 6. XỬ LÝ MODAL CHI TIẾT BÁO CÁO VI PHẠM
// ==========================================
const violationModal = document.getElementById("violation-detail-modal");
const closeViolationModal = document.getElementById("close-violation-modal");
const violationOverlay = document.getElementById("violation-modal-overlay");

const footerDefault = document.getElementById("violation-footer-default");
const footerConfirm = document.getElementById("violation-footer-confirm");

const btnTriggerDelete = document.getElementById("btn-trigger-delete");
const btnCancelDelete = document.getElementById("btn-cancel-delete");
const btnConfirmDelete = document.getElementById("btn-confirm-delete");
const btnDismissViolation = document.getElementById("btn-dismiss-violation");

// Hàm đóng modal
function hideViolationModal() {
  if (violationModal) violationModal.classList.remove("active");
  // Reset trạng thái footer về ban đầu
  if (footerDefault) footerDefault.style.display = "flex";
  if (footerConfirm) footerConfirm.style.display = "none";
}

if (closeViolationModal) {
  closeViolationModal.addEventListener("click", hideViolationModal);
}

if (violationOverlay) {
  violationOverlay.addEventListener("click", hideViolationModal);
}

// Bắt sự kiện click nút xem chi tiết trên bảng Báo cáo vi phạm
document.addEventListener("click", function (e) {
  const btnView = e.target.closest(
    ".btn-view-violation, #tab-violations .btn-edit",
  );
  if (btnView) {
    if (footerDefault) footerDefault.style.display = "flex";
    if (footerConfirm) footerConfirm.style.display = "none";
    if (violationModal) violationModal.classList.add("active");
  }
});

// Chuyển sang xác nhận Inline khi bấm "Ẩn bình luận"
if (btnTriggerDelete) {
  btnTriggerDelete.addEventListener("click", function () {
    if (footerDefault) footerDefault.style.display = "none";
    if (footerConfirm) footerConfirm.style.display = "flex";
  });
}

// Bấm Hủy xác nhận -> quay lại footer mặc định
if (btnCancelDelete) {
  btnCancelDelete.addEventListener("click", function () {
    if (footerDefault) footerDefault.style.display = "flex";
    if (footerConfirm) footerConfirm.style.display = "none";
  });
}

// Bấm Đồng ý ẩn (Demo giao diện)
if (btnConfirmDelete) {
  btnConfirmDelete.addEventListener("click", function () {
    hideViolationModal();
    if (typeof showToast === "function") {
      showToast("Đã ẩn bình luận vi phạm thành công!");
    }
  });
}

// Bấm Bỏ qua (Hợp lệ)
if (btnDismissViolation) {
  btnDismissViolation.addEventListener("click", function () {
    hideViolationModal();
    if (typeof showToast === "function") {
      showToast("Đã từ chối báo cáo vi phạm.");
    }
  });
}

// ==================== QUẢN LÝ NGƯỜI DÙNG (USERS) ====================
let allAdminUsers = [];
let userCurrentPage = 1;
const userPageLimit = 20;

async function loadUsersData(page = 1) {
  userCurrentPage = page;
  const keyword =
    document.getElementById("user-search-input")?.value?.trim() || "";
  const role = document.getElementById("user-role-filter")?.value?.trim() || "";
  const status =
    document.getElementById("user-status-filter")?.value?.trim() || "";
  try {
    const params = new URLSearchParams();
    if (keyword) params.append("keyword", keyword);
    if (role) params.append("role", role);
    if (status) params.append("status", status);
    const res = await fetch(`/api/auth/users?${params.toString()}`);
    const result = await res.json();
    if (result.success) {
      allAdminUsers = result.data || [];
      const totalItems = allAdminUsers.length;
      const totalPages = Math.ceil(totalItems / userPageLimit) || 1;
      if (userCurrentPage > totalPages) userCurrentPage = totalPages;
      if (userCurrentPage < 1) userCurrentPage = 1;
      const startIndex = (userCurrentPage - 1) * userPageLimit;
      const paginatedUsers = allAdminUsers.slice(
        startIndex,
        startIndex + userPageLimit,
      );
      renderUsersTable(paginatedUsers);
      updateUserPagination(userCurrentPage, totalPages, totalItems);
    } else {
      console.error("Lỗi lấy danh sách người dùng:", result.message);
    }
  } catch (error) {
    console.error("Lỗi khi gọi API users:", error);
  }
}

function updateUserPagination(currentPage, totalPages, totalItems) {
  const pageCurrentEl = document.getElementById("user-current-page");
  const pageTotalEl = document.getElementById("user-total-pages");
  const itemsTotalEl = document.getElementById("user-total-items");
  const btnPrev = document.getElementById("btn-user-prev");
  const btnNext = document.getElementById("btn-user-next");

  if (pageCurrentEl) pageCurrentEl.textContent = currentPage;
  if (pageTotalEl) pageTotalEl.textContent = totalPages;
  if (itemsTotalEl) itemsTotalEl.textContent = totalItems;

  if (btnPrev) {
    btnPrev.disabled = currentPage <= 1;
  }
  if (btnNext) {
    btnNext.disabled = currentPage >= totalPages;
  }
}

function renderUsersTable(users) {
  const tbody = document.getElementById("users-table-body");
  if (!tbody) return;

  if (!users || users.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: rgba(255,255,255,0.6); padding: 1.5rem;">Không tìm thấy người dùng phù hợp</td></tr>`;
    return;
  }

  tbody.innerHTML = users
    .map((user) => {
      const userId = user.user_id;
      const formattedDate = user.create_at
        ? new Date(user.create_at).toLocaleDateString("vi-VN")
        : "-";

      const roleClass =
        (user.role || "user").toLowerCase() === "admin" ? "admin" : "user";
      const roleText = user.role || "User";

      const isLocked = user.status === "Locked";
      const statusHtml = isLocked
        ? `<span class="status-badge danger" data-tooltip="${user.lock_reason ? user.lock_reason : "Tài khoản bị khóa"}">
            Bị khóa <i class="bx bx-info-circle" style="vertical-align: middle; margin-left: 2px;"></i>
          </span>`
        : `<span class="status-badge active">Hoạt động</span>`;

      const lockBtnClass = isLocked ? "btn-unlock" : "btn-lock";
      const lockBtnIcon = isLocked ? "bx-lock-open-alt" : "bx-lock-alt";
      const lockBtnTitle = isLocked ? "Mở khóa" : "Khóa";

      return `
        <tr data-id="${userId}">
          <td>${userId}</td>
          <td class="text-highlight">${user.user_name || "-"}</td>
          <td>${user.email || "-"}</td>
          <td><span class="role-tag ${roleClass}">${roleText}</span></td>
          <td>${statusHtml}</td>
          <td>${formattedDate}</td>
          <td class="text-right">
            <button title="Sửa vai trò" class="btn-action btn-edit btn-edit-user" data-id="${userId}">
              <i class="bx bx-edit"></i>
            </button>
            <button title="${lockBtnTitle}" class="btn-action ${lockBtnClass} btn-toggle-lock-user" data-id="${userId}">
              <i class="bx ${lockBtnIcon}"></i>
            </button>
          </td>
        </tr>
      `;
    })
    .join("");
}

function initUserActions() {
  const searchInput = document.getElementById("user-search-input");
  const roleFilter = document.getElementById("user-role-filter");
  const statusFilter = document.getElementById("user-status-filter");
  const btnPrev = document.getElementById("btn-user-prev");
  const btnNext = document.getElementById("btn-user-next");

  let debounceTimer;
  searchInput?.addEventListener("input", function () {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      loadUsersData(1);
    }, 300);
  });

  roleFilter?.addEventListener("change", function () {
    loadUsersData(1);
  });

  statusFilter?.addEventListener("change", function () {
    loadUsersData(1);
  });

  btnPrev?.addEventListener("click", function () {
    if (userCurrentPage > 1) {
      loadUsersData(userCurrentPage - 1);
    }
  });

  btnNext?.addEventListener("click", function () {
    const totalPages = Math.ceil(allAdminUsers.length / userPageLimit) || 1;
    if (userCurrentPage < totalPages) {
      loadUsersData(userCurrentPage + 1);
    }
  });

  // --- MODAL THÊM NGƯỜI DÙNG MỚI ---
  const btnAddUser = document.getElementById("btn-add-user");
  const userModal = document.getElementById("user-add-modal");
  const userForm = document.getElementById("user-add-form");
  const closeUserModal = document.getElementById("close-user-add-modal");
  const cancelUserBtn = document.getElementById("cancel-user-add-btn");
  const userOverlay = document.getElementById("user-add-overlay");

  function hideUserAddModal() {
    if (userModal) userModal.classList.remove("active");
    if (userForm) userForm.reset();
  }

  if (btnAddUser) {
    btnAddUser.addEventListener("click", () => {
      if (userModal) userModal.classList.add("active");
    });
  }

  if (closeUserModal)
    closeUserModal.addEventListener("click", hideUserAddModal);
  if (cancelUserBtn) cancelUserBtn.addEventListener("click", hideUserAddModal);
  if (userOverlay) {
    userOverlay.addEventListener("click", function (e) {
      if (e.target === userOverlay) hideUserAddModal();
    });
  }

  if (userForm) {
    userForm.addEventListener("submit", async function (e) {
      e.preventDefault();
      const username = document.getElementById("add-user-name")?.value?.trim();
      const email = document.getElementById("add-user-email")?.value?.trim();
      const password = document
        .getElementById("add-user-password")
        ?.value?.trim();
      const role = document.getElementById("add-user-role")?.value || "User";

      if (!username || !email || !password) {
        if (typeof showToast === "function") {
          showToast("Vui lòng điền đầy đủ các thông tin bắt buộc!", true);
        }
        return;
      }

      try {
        const res = await fetch("/api/auth/admin/add-user", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, email, password, role }),
        });
        const result = await res.json();

        if (result.success) {
          if (typeof showToast === "function") {
            showToast("Thêm người dùng mới thành công!");
          }
          hideUserAddModal();
          loadUsersData(1);
        } else {
          if (typeof showToast === "function") {
            showToast(result.message || "Lỗi khi thêm người dùng", true);
          } else {
            alert(result.message || "Lỗi khi thêm người dùng");
          }
        }
      } catch (err) {
        console.error("Lỗi khi thêm người dùng:", err);
        if (typeof showToast === "function") {
          showToast("Lỗi kết nối máy chủ!", true);
        }
      }
    });
  }

  // --- MODAL KHÓA / BÁN TÀI KHOẢN NGƯỜI DÙNG ---
  const userLockModal = document.getElementById("user-lock-modal");
  const userLockForm = document.getElementById("user-lock-form");
  const closeUserLockModalBtn = document.getElementById(
    "close-user-lock-modal",
  );
  const cancelUserLockBtn = document.getElementById("cancel-user-lock-btn");
  const userLockOverlay = document.getElementById("user-lock-overlay");
  const lockReasonSelect = document.getElementById("lock-reason-select");
  const lockReasonCustomGroup = document.getElementById(
    "lock-reason-custom-group",
  );
  const lockReasonCustomInput = document.getElementById("lock-reason-custom");
  const lockDurationSelect = document.getElementById("lock-duration-select");
  const lockDurationCustomGroup = document.getElementById(
    "lock-duration-custom-group",
  );
  const lockUntilCustomInput = document.getElementById(
    "lock-until-custom-date",
  );

  function hideUserLockModal() {
    if (userLockModal) userLockModal.classList.remove("active");
    if (userLockForm) userLockForm.reset();
    if (lockReasonCustomGroup) lockReasonCustomGroup.style.display = "none";
    if (lockDurationCustomGroup) lockDurationCustomGroup.style.display = "none";
    if (lockReasonCustomInput) lockReasonCustomInput.required = false;
    if (lockUntilCustomInput) lockUntilCustomInput.required = false;
  }

  if (closeUserLockModalBtn)
    closeUserLockModalBtn.addEventListener("click", hideUserLockModal);
  if (cancelUserLockBtn)
    cancelUserLockBtn.addEventListener("click", hideUserLockModal);
  if (userLockOverlay) {
    userLockOverlay.addEventListener("click", function (e) {
      if (e.target === userLockOverlay) hideUserLockModal();
    });
  }

  // Sự kiện khi chọn lý do khóa
  lockReasonSelect?.addEventListener("change", function () {
    if (this.value === "other") {
      if (lockReasonCustomGroup) lockReasonCustomGroup.style.display = "block";
      if (lockReasonCustomInput) lockReasonCustomInput.required = true;
    } else {
      if (lockReasonCustomGroup) lockReasonCustomGroup.style.display = "none";
      if (lockReasonCustomInput) {
        lockReasonCustomInput.required = false;
        lockReasonCustomInput.value = "";
      }
    }
  });

  // Sự kiện khi chọn thời hạn khóa
  lockDurationSelect?.addEventListener("change", function () {
    if (this.value === "custom") {
      if (lockDurationCustomGroup)
        lockDurationCustomGroup.style.display = "block";
      if (lockUntilCustomInput) lockUntilCustomInput.required = true;
    } else {
      if (lockDurationCustomGroup)
        lockDurationCustomGroup.style.display = "none";
      if (lockUntilCustomInput) {
        lockUntilCustomInput.required = false;
        lockUntilCustomInput.value = "";
      }
    }
  });

  // --- MODAL MỞ KHÓA TÀI KHOẢN ---
  const userUnlockModal = document.getElementById("user-unlock-modal");
  const closeUserUnlockModalBtn = document.getElementById(
    "close-user-unlock-modal",
  );
  const cancelUserUnlockBtn = document.getElementById("cancel-user-unlock-btn");
  const userUnlockOverlay = document.getElementById("user-unlock-overlay");
  const confirmUserUnlockBtn = document.getElementById(
    "confirm-user-unlock-btn",
  );

  function hideUserUnlockModal() {
    if (userUnlockModal) userUnlockModal.classList.remove("active");
  }

  if (closeUserUnlockModalBtn)
    closeUserUnlockModalBtn.addEventListener("click", hideUserUnlockModal);
  if (cancelUserUnlockBtn)
    cancelUserUnlockBtn.addEventListener("click", hideUserUnlockModal);
  if (userUnlockOverlay) {
    userUnlockOverlay.addEventListener("click", function (e) {
      if (e.target === userUnlockOverlay) hideUserUnlockModal();
    });
  }

  confirmUserUnlockBtn?.addEventListener("click", async function () {
    const userIdVal = document.getElementById("unlock-target-user-id")?.value;
    if (!userIdVal) return;
    const userId = parseInt(userIdVal, 10);

    try {
      const res = await fetch("/api/auth/admin/lock-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, status: "Active" }),
      });
      const result = await res.json();

      if (result.success) {
        if (typeof showToast === "function") {
          showToast("Đã mở khóa tài khoản thành công!");
        }
        hideUserUnlockModal();
        loadUsersData(userCurrentPage);
      } else {
        if (typeof showToast === "function") {
          showToast(result.message || "Lỗi khi mở khóa tài khoản", true);
        }
      }
    } catch (err) {
      console.error("Lỗi khi mở khóa tài khoản:", err);
      if (typeof showToast === "function") {
        showToast("Lỗi kết nối máy chủ!", true);
      }
    }
  });

  // --- MODAL THAY ĐỔI VAI TRÒ NGƯỜI DÙNG ---
  const userRoleModal = document.getElementById("user-role-modal");
  const userRoleForm = document.getElementById("user-role-form");
  const closeUserRoleModalBtn = document.getElementById(
    "close-user-role-modal",
  );
  const cancelUserRoleBtn = document.getElementById("cancel-user-role-btn");
  const userRoleOverlay = document.getElementById("user-role-overlay");

  function hideUserRoleModal() {
    if (userRoleModal) userRoleModal.classList.remove("active");
    if (userRoleForm) userRoleForm.reset();
  }

  if (closeUserRoleModalBtn)
    closeUserRoleModalBtn.addEventListener("click", hideUserRoleModal);
  if (cancelUserRoleBtn)
    cancelUserRoleBtn.addEventListener("click", hideUserRoleModal);
  if (userRoleOverlay) {
    userRoleOverlay.addEventListener("click", function (e) {
      if (e.target === userRoleOverlay) hideUserRoleModal();
    });
  }

  userRoleForm?.addEventListener("submit", async function (e) {
    e.preventDefault();
    const userIdVal = document.getElementById(
      "edit-role-target-user-id",
    )?.value;
    const newRole = document.getElementById("edit-user-role-select")?.value;
    if (!userIdVal || !newRole) return;
    const userId = parseInt(userIdVal, 10);

    const currentUser =
      typeof getCurrentUser === "function" ? getCurrentUser() : null;
    const currentUserId = currentUser
      ? currentUser.user_id || currentUser.id
      : null;
    if (
      currentUserId &&
      Number(currentUserId) === userId &&
      newRole !== "Admin"
    ) {
      if (typeof showToast === "function") {
        showToast("Bạn không thể tự giáng cấp vai trò của chính mình!", true);
      } else {
        alert("Bạn không thể tự giáng cấp vai trò của chính mình!");
      }
      return;
    }

    try {
      const res = await fetch("/api/auth/admin/change-role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, role: newRole }),
      });
      const result = await res.json();

      if (result.success) {
        if (typeof showToast === "function") {
          showToast("Cập nhật vai trò người dùng thành công!");
        }
        hideUserRoleModal();
        loadUsersData(userCurrentPage);
      } else {
        if (typeof showToast === "function") {
          showToast(result.message || "Lỗi khi cập nhật vai trò", true);
        } else {
          alert(result.message || "Lỗi khi cập nhật vai trò");
        }
      }
    } catch (err) {
      console.error("Lỗi khi cập nhật vai trò người dùng:", err);
      if (typeof showToast === "function") {
        showToast("Lỗi kết nối máy chủ!", true);
      }
    }
  });

  // Event delegation trên bảng người dùng cho các nút Sửa / Khóa / Mở khóa
  const usersTableBody = document.getElementById("users-table-body");
  usersTableBody?.addEventListener("click", async function (e) {
    const editBtn = e.target.closest(".btn-edit-user");
    if (editBtn) {
      const userId = parseInt(editBtn.dataset.id, 10);
      const user = allAdminUsers.find((u) => u.user_id === userId);
      if (!user) return;

      document.getElementById("edit-role-target-user-id").value = user.user_id;
      document.getElementById("role-user-id-text").textContent =
        `${user.user_id}`;
      document.getElementById("role-username-text").textContent =
        user.user_name || "-";
      document.getElementById("role-email-text").textContent =
        user.email || "-";

      const currentRoleEl = document.getElementById("role-current-text");
      if (currentRoleEl) {
        const roleLower = (user.role || "User").toLowerCase();
        currentRoleEl.textContent = user.role || "User";
        currentRoleEl.className = `role-tag ${roleLower === "admin" ? "admin" : "user"}`;
      }

      const roleSelect = document.getElementById("edit-user-role-select");
      if (roleSelect) {
        roleSelect.value = user.role || "User";
      }

      if (userRoleModal) userRoleModal.classList.add("active");
      return;
    }

    const lockBtn = e.target.closest(".btn-toggle-lock-user");
    if (!lockBtn) return;

    const userId = parseInt(lockBtn.dataset.id, 10);
    const user = allAdminUsers.find((u) => u.user_id === userId);
    if (!user) return;

    // Kiểm tra không cho Admin tự khóa tài khoản chính mình
    const currentUser =
      typeof getCurrentUser === "function" ? getCurrentUser() : null;
    const currentUserId = currentUser
      ? currentUser.user_id || currentUser.id
      : null;
    if (
      currentUserId &&
      Number(currentUserId) === userId &&
      user.status !== "Locked"
    ) {
      if (typeof showToast === "function") {
        showToast("Bạn không thể tự khóa tài khoản của chính mình!", true);
      } else {
        alert("Bạn không thể tự khóa tài khoản của chính mình!");
      }
      return;
    }

    if (user.status === "Locked") {
      // Mở Modal Xác nhận Mở khóa tài khoản
      const targetInput = document.getElementById("unlock-target-user-id");
      const msgEl = document.getElementById("user-unlock-confirm-msg");
      if (targetInput) targetInput.value = user.user_id;
      if (msgEl) {
        msgEl.innerHTML = `Bạn có chắc chắn muốn mở khóa tài khoản <strong>"${user.user_name || ""}"</strong> (ID: #${user.user_id}) không?`;
      }
      if (userUnlockModal) userUnlockModal.classList.add("active");
    } else {
      // Khóa tài khoản -> Mở Modal Khóa
      document.getElementById("lock-target-user-id").value = user.user_id;
      document.getElementById("lock-user-id-text").textContent =
        `${user.user_id}`;
      document.getElementById("lock-username-text").textContent =
        user.user_name || "-";
      document.getElementById("lock-email-text").textContent =
        user.email || "-";

      if (lockReasonSelect)
        lockReasonSelect.value = "Vi phạm quy định bình luận";
      if (lockReasonCustomGroup) lockReasonCustomGroup.style.display = "none";
      if (lockReasonCustomInput) {
        lockReasonCustomInput.value = "";
        lockReasonCustomInput.required = false;
      }

      if (lockDurationSelect) lockDurationSelect.value = "1440";
      if (lockDurationCustomGroup)
        lockDurationCustomGroup.style.display = "none";
      if (lockUntilCustomInput) {
        lockUntilCustomInput.value = "";
        lockUntilCustomInput.required = false;
      }

      if (userLockModal) userLockModal.classList.add("active");
    }
  });

  // Xử lý gửi Form Khóa Tài Khoản
  if (userLockForm) {
    userLockForm.addEventListener("submit", async function (e) {
      e.preventDefault();

      const userIdVal = document.getElementById("lock-target-user-id")?.value;
      if (!userIdVal) return;
      const userId = parseInt(userIdVal, 10);

      // Kiểm tra lại lần nữa nếu Admin cố tình tự khóa tài khoản chính mình
      const currentUser =
        typeof getCurrentUser === "function" ? getCurrentUser() : null;
      const currentUserId = currentUser
        ? currentUser.user_id || currentUser.id
        : null;
      if (currentUserId && Number(currentUserId) === userId) {
        if (typeof showToast === "function") {
          showToast("Bạn không thể tự khóa tài khoản của chính mình!", true);
        } else {
          alert("Bạn không thể tự khóa tài khoản của chính mình!");
        }
        return;
      }

      const reasonSel = lockReasonSelect?.value;
      let lockReason = reasonSel;
      if (reasonSel === "other") {
        lockReason = lockReasonCustomInput?.value?.trim();
        if (!lockReason) {
          if (typeof showToast === "function") {
            showToast("Vui lòng nhập lý do khóa chi tiết!", true);
          }
          return;
        }
      }

      const durationSel = lockDurationSelect?.value;
      let lockUntil = null;
      if (durationSel === "custom") {
        const customVal = lockUntilCustomInput?.value;
        if (!customVal) {
          if (typeof showToast === "function") {
            showToast("Vui lòng chọn thời gian khóa tùy chỉnh!", true);
          }
          return;
        }
        lockUntil = new Date(customVal).toISOString();
      } else if (durationSel === "permanent") {
        lockUntil = null;
      } else {
        const minutes = parseInt(durationSel, 10);
        if (!isNaN(minutes)) {
          const d = new Date();
          d.setMinutes(d.getMinutes() + minutes);
          lockUntil = d.toISOString();
        }
      }

      try {
        const res = await fetch("/api/auth/admin/lock-user", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId,
            status: "Locked",
            lockReason,
            lockUntil,
          }),
        });
        const result = await res.json();

        if (result.success) {
          if (typeof showToast === "function") {
            showToast("Khóa tài khoản thành công!");
          }
          hideUserLockModal();
          loadUsersData(userCurrentPage);
        } else {
          if (typeof showToast === "function") {
            showToast(result.message || "Lỗi khi khóa tài khoản", true);
          }
        }
      } catch (err) {
        console.error("Lỗi khi khóa tài khoản:", err);
        if (typeof showToast === "function") {
          showToast("Lỗi kết nối máy chủ!", true);
        }
      }
    });
  }
}
