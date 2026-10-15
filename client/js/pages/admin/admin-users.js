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