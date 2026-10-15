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
            <button title="Sửa thông tin" class="btn-action btn-edit btn-edit-game" data-id="${gameId}">
              <i class="bx bx-edit"></i>
            </button>
            <button title="Cập nhật cấu hình" class="btn-action btn-config btn-config-game" data-id="${gameId}">
              <i class="bx bx-cog"></i>
            </button>
            <button title="Xóa" class="btn-action btn-delete btn-delete-game" data-id="${gameId}">
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

  // --- Modal Cập nhật Cấu hình Game ---
  const configModal = document.getElementById("game-config-modal");
  const configForm = document.getElementById("game-config-form");
  const closeConfigModal = document.getElementById("close-game-config-modal");
  const cancelConfigBtn = document.getElementById("cancel-game-config-btn");
  const configOverlay = document.getElementById("game-config-overlay");
  const btnOpenConfigFromEdit = document.getElementById("btn-open-config-from-edit");

  function hideConfigModal() {
    if (configModal) configModal.classList.remove("active");
    if (configForm) configForm.reset();
  }

  if (closeConfigModal) closeConfigModal.addEventListener("click", hideConfigModal);
  if (cancelConfigBtn) cancelConfigBtn.addEventListener("click", hideConfigModal);
  if (configOverlay) configOverlay.addEventListener("click", hideConfigModal);

  async function openGameConfigModal(gameId) {
    if (!gameId) return;
    const targetGame = allAdminGames.find(
      (g) => (g.game_id || g.id).toString() === gameId.toString()
    );

    document.getElementById("config-game-id").value = gameId;
    const titleEl = document.getElementById("config-game-target-name");
    if (titleEl) {
      titleEl.textContent = targetGame ? `${targetGame.name} (#G-${String(gameId).padStart(3, "0")})` : `#G-${gameId}`;
    }

    // Clear previous input values
    const fields = [
      "config-min-os", "config-min-cpu", "config-min-gpu", "config-min-ram", "config-min-storage",
      "config-rec-os", "config-rec-cpu", "config-rec-gpu", "config-rec-ram", "config-rec-storage"
    ];
    fields.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = "";
    });

    if (configModal) {
      configModal.classList.add("active");
      if (typeof initAllHwComboboxes === "function") {
        initAllHwComboboxes(configModal);
      }
    }

    // Lấy thông tin cấu hình hiện tại của game
    try {
      const res = await fetch(`/api/games/${gameId}/game_requirement`);
      const result = await res.json();
      if (result.success && Array.isArray(result.data)) {
        result.data.forEach((req) => {
          const typeUpper = (req.type || "").toUpperCase();
          if (typeUpper === "MINIMUM" || req.type === "Cấu hình tối thiểu") {
            const elOs = document.getElementById("config-min-os");
            const elCpu = document.getElementById("config-min-cpu");
            const elGpu = document.getElementById("config-min-gpu");
            const elRam = document.getElementById("config-min-ram");
            const elStorage = document.getElementById("config-min-storage");
            if (elOs) elOs.value = req.os || "";
            if (elCpu) elCpu.value = req.cpu_name || "";
            if (elGpu) elGpu.value = req.gpu_name || "";
            if (elRam) elRam.value = req.ram || "";
            if (elStorage) elStorage.value = req.storage || "";
          } else if (typeUpper === "RECOMMENDED" || req.type === "Cấu hình đề xuất") {
            const elOs = document.getElementById("config-rec-os");
            const elCpu = document.getElementById("config-rec-cpu");
            const elGpu = document.getElementById("config-rec-gpu");
            const elRam = document.getElementById("config-rec-ram");
            const elStorage = document.getElementById("config-rec-storage");
            if (elOs) elOs.value = req.os || "";
            if (elCpu) elCpu.value = req.cpu_name || "";
            if (elGpu) elGpu.value = req.gpu_name || "";
            if (elRam) elRam.value = req.ram || "";
            if (elStorage) elStorage.value = req.storage || "";
          }
        });
      }
    } catch (err) {
      console.error("Lỗi khi lấy thông tin cấu hình game:", err);
    }
  }

  if (btnOpenConfigFromEdit) {
    btnOpenConfigFromEdit.addEventListener("click", function () {
      const gameId = document.getElementById("edit-game-id").value;
      if (gameId) {
        hideEditModal();
        openGameConfigModal(gameId);
      }
    });
  }

  if (configForm) {
    configForm.addEventListener("submit", async function (e) {
      e.preventDefault();
      const gameId = document.getElementById("config-game-id").value;
      const saveBtn = document.getElementById("save-game-config-btn");

      const payload = {
        game_id: parseInt(gameId, 10),
        minimum: {
          os: (document.getElementById("config-min-os")?.value || "").trim(),
          cpu_name: (document.getElementById("config-min-cpu")?.value || "").trim(),
          gpu_name: (document.getElementById("config-min-gpu")?.value || "").trim(),
          ram: parseInt(document.getElementById("config-min-ram")?.value, 10) || 0,
          storage: parseInt(document.getElementById("config-min-storage")?.value, 10) || 0,
        },
        recommended: {
          os: (document.getElementById("config-rec-os")?.value || "").trim(),
          cpu_name: (document.getElementById("config-rec-cpu")?.value || "").trim(),
          gpu_name: (document.getElementById("config-rec-gpu")?.value || "").trim(),
          ram: parseInt(document.getElementById("config-rec-ram")?.value, 10) || 0,
          storage: parseInt(document.getElementById("config-rec-storage")?.value, 10) || 0,
        },
      };

      if (saveBtn) {
        saveBtn.disabled = true;
        saveBtn.innerHTML = '<i class="bx bx-loader-alt bx-spin"></i> Đang lưu...';
      }

      try {
        const res = await fetch("/api/games/update-requirement", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const result = await res.json();
        if (result.success) {
          showToast("Cập nhật thông tin cấu hình game thành công!");
          hideConfigModal();
          loadGamesData();
        } else {
          showToast(result.message || "Cập nhật cấu hình thất bại!", true);
        }
      } catch (err) {
        console.error("Lỗi khi cập nhật cấu hình game:", err);
        showToast("Lỗi kết nối khi cập nhật cấu hình game!", true);
      } finally {
        if (saveBtn) {
          saveBtn.disabled = false;
          saveBtn.innerHTML = '<i class="bx bx-save"></i> Lưu cấu hình';
        }
      }
    });
  }

  // Delegated Click trên bảng Game cho nút Sửa, Cấu hình & Xóa
  const gamesTbody = document.getElementById("games-table-body");
  if (gamesTbody) {
    gamesTbody.addEventListener("click", function (e) {
      const btnEdit = e.target.closest(".btn-edit-game");
      const btnConfig = e.target.closest(".btn-config-game");
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

      if (btnConfig) {
        const gameId = btnConfig.getAttribute("data-id");
        openGameConfigModal(gameId);
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