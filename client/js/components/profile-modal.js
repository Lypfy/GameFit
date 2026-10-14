/**
 * Profile update modal logic & dynamic component injection.
 * Tự động tạo và chèn HTML modal vào tất cả các trang, chỉ cần chỉnh sửa tại file này.
 */

function injectProfileModal() {
  if (document.getElementById("profile-modal")) return;

  const modalHtml = `
  <div class="modal" id="profile-modal">
    <div class="modal-overlay" id="profile-modal-overlay"></div>
    <div class="modal-card">
      <div class="modal-header">
        <h3><i class="bx bx-user-pin"></i> Cập nhật thông tin cá nhân</h3>
        <button type="button" class="close-btn" id="close-profile-modal">
          &times;
        </button>
      </div>
      <form id="profile-form">
        <div class="form-group">
          <label for="profile-username">Tên người dùng</label>
          <input type="text" id="profile-username" required placeholder="Nhập tên người dùng..." />
        </div>
        <div class="form-group">
          <label for="profile-email">Email</label>
          <input type="text" id="profile-email" readonly disabled />
        </div>
        <div class="form-group">
          <label for="profile-role">Vai trò tài khoản</label>
          <input type="text" id="profile-role" readonly disabled />
        </div>
        <div class="modal-footer">
          <button type="button" class="btn-cancel" id="cancel-profile-btn">
            Hủy
          </button>
          <button type="submit" class="btn-save">Lưu thay đổi</button>
        </div>
      </form>
    </div>
  </div>`;

  document.body.insertAdjacentHTML("beforeend", modalHtml);
}

function initProfileModal() {
  injectProfileModal();

  const profileModal = document.getElementById("profile-modal");
  const profileModalOverlay = document.getElementById("profile-modal-overlay");
  const closeProfileModal = document.getElementById("close-profile-modal");
  const cancelProfileBtn = document.getElementById("cancel-profile-btn");
  const profileForm = document.getElementById("profile-form");
  const profileUsernameInput =
    document.getElementById("profile-username") ||
    document.getElementById("profile-fullname");
  const profileEmail = document.getElementById("profile-email");
  const profileRole = document.getElementById("profile-role");
  const btnUpdateProfile = document.getElementById("btn-update-profile");
  const userDropdown = document.getElementById("user-dropdown");

  function displayToast(msg, isError = false) {
    if (typeof showToast === "function") {
      showToast(msg, isError);
    } else {
      alert(msg);
    }
  }

  function hideProfileModal() {
    if (profileModal) profileModal.classList.remove("active");
  }

  if (btnUpdateProfile) {
    btnUpdateProfile.addEventListener("click", function (e) {
      e.preventDefault();
      if (userDropdown) userDropdown.classList.remove("active");
      const currentUser = typeof getCurrentUser === "function" ? getCurrentUser() : null;
      if (!currentUser) return;

      if (profileUsernameInput) {
        profileUsernameInput.value =
          currentUser.user_name ||
          currentUser.username ||
          currentUser.fullname ||
          "";
      }
      if (profileEmail) profileEmail.value = currentUser.email || "";
      if (profileRole) {
        profileRole.value =
          currentUser.role && currentUser.role.toLowerCase() === "admin"
            ? "Quản trị viên (Admin)"
            : "Người dùng (User)";
      }
      if (profileModal) profileModal.classList.add("active");
    });
  }

  if (closeProfileModal) closeProfileModal.addEventListener("click", hideProfileModal);
  if (cancelProfileBtn) cancelProfileBtn.addEventListener("click", hideProfileModal);
  if (profileModalOverlay) profileModalOverlay.addEventListener("click", hideProfileModal);

  if (profileForm) {
    profileForm.addEventListener("submit", async function (e) {
      e.preventDefault();
      const currentUser = typeof getCurrentUser === "function" ? getCurrentUser() : null;
      if (!currentUser) return;

      const newUsername = profileUsernameInput ? profileUsernameInput.value.trim() : "";

      if (!newUsername) {
        displayToast("Vui lòng nhập tên người dùng!", true);
        return;
      }

      const token =
        (typeof getAuthToken === "function" ? getAuthToken() : null) ||
        localStorage.getItem("token");

      if (!token) {
        displayToast("Vui lòng đăng nhập lại để cập nhật thông tin!", true);
        return;
      }

      const saveBtn = profileForm.querySelector(".btn-save");
      const originalText = saveBtn ? saveBtn.textContent : "Lưu thay đổi";
      if (saveBtn) {
        saveBtn.disabled = true;
        saveBtn.textContent = "Đang lưu...";
      }

      try {
        const response = await fetch("/api/auth/profile", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({
            username: newUsername
          })
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          displayToast(data.message || "Tên người dùng này đã có người sử dụng!", true);
          return;
        }

        // Cập nhật thông tin vào currentUser và localStorage
        currentUser.user_name = newUsername;
        currentUser.username = newUsername;
        currentUser.fullname = newUsername;
        if (data.user) {
          Object.assign(currentUser, data.user);
        }
        if (typeof setCurrentUser === "function") {
          setCurrentUser(currentUser);
        } else {
          localStorage.setItem("currentUser", JSON.stringify(currentUser));
        }

        if (typeof renderUserDropdownUI === "function") {
          renderUserDropdownUI();
        }

        window.dispatchEvent(
          new CustomEvent("userProfileUpdated", { detail: currentUser })
        );

        hideProfileModal();
        displayToast("Cập nhật thông tin người dùng thành công!");
      } catch (err) {
        console.error("Lỗi khi cập nhật thông tin tài khoản:", err);
        displayToast("Không thể kết nối đến máy chủ, vui lòng thử lại sau!", true);
      } finally {
        if (saveBtn) {
          saveBtn.disabled = false;
          saveBtn.textContent = originalText;
        }
      }
    });
  }
}

function injectChangePasswordModal() {
  if (document.getElementById("change-password-modal")) return;

  const modalHtml = `
  <div class="modal" id="change-password-modal">
    <div class="modal-overlay" id="change-password-modal-overlay"></div>
    <div class="modal-card">
      <div class="modal-header">
        <h3><i class="bx bx-lock-alt"></i> Đổi mật khẩu</h3>
        <button type="button" class="close-btn" id="close-change-password-modal">
          &times;
        </button>
      </div>
      <form id="change-password-form">
        <div class="form-group">
          <label for="old-password">Mật khẩu hiện tại <span style="color: #fa5353;">*</span></label>
          <div style="position: relative; display: flex; align-items: center;">
            <input type="password" id="old-password" required placeholder="Nhập mật khẩu hiện tại..." style="padding-right: 40px;" />
            <i class="bx bx-show toggle-pwd-eye" id="toggle-old-password" title="Hiện/Ẩn mật khẩu" style="position: absolute; right: 12px; cursor: pointer; color: var(--text-muted, #a0a0b0); font-size: 1.25rem;"></i>
          </div>
        </div>
        <div class="form-group">
          <label for="new-password">Mật khẩu mới <span style="color: #fa5353;">*</span></label>
          <div style="position: relative; display: flex; align-items: center;">
            <input type="password" id="new-password" required placeholder="Tối thiểu 8 ký tự..." style="padding-right: 40px;" />
            <i class="bx bx-show toggle-pwd-eye" id="toggle-new-password" title="Hiện/Ẩn mật khẩu" style="position: absolute; right: 12px; cursor: pointer; color: var(--text-muted, #a0a0b0); font-size: 1.25rem;"></i>
          </div>
        </div>
        <div class="form-group">
          <label for="confirm-password">Xác nhận mật khẩu mới <span style="color: #fa5353;">*</span></label>
          <div style="position: relative; display: flex; align-items: center;">
            <input type="password" id="confirm-password" required placeholder="Nhập lại mật khẩu mới..." style="padding-right: 40px;" />
            <i class="bx bx-show toggle-pwd-eye" id="toggle-confirm-password" title="Hiện/Ẩn mật khẩu" style="position: absolute; right: 12px; cursor: pointer; color: var(--text-muted, #a0a0b0); font-size: 1.25rem;"></i>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn-cancel" id="cancel-change-password-btn">
            Hủy
          </button>
          <button type="submit" class="btn-save">Đổi mật khẩu</button>
        </div>
      </form>
    </div>
  </div>`;

  document.body.insertAdjacentHTML("beforeend", modalHtml);
}

function initChangePasswordModal() {
  injectChangePasswordModal();

  const changePwdModal = document.getElementById("change-password-modal");
  const changePwdOverlay = document.getElementById("change-password-modal-overlay");
  const closeChangePwdModal = document.getElementById("close-change-password-modal");
  const cancelChangePwdBtn = document.getElementById("cancel-change-password-btn");
  const changePwdForm = document.getElementById("change-password-form");
  const oldPasswordInput = document.getElementById("old-password");
  const newPasswordInput = document.getElementById("new-password");
  const confirmPasswordInput = document.getElementById("confirm-password");
  const userDropdown = document.getElementById("user-dropdown");

  function displayToast(msg, isError = false) {
    if (typeof showToast === "function") {
      showToast(msg, isError);
    } else {
      alert(msg);
    }
  }

  function hideChangePwdModal() {
    if (changePwdModal) changePwdModal.classList.remove("active");
    if (changePwdForm) changePwdForm.reset();
    resetEyeToggles();
  }

  function resetEyeToggles() {
    ["old-password", "new-password", "confirm-password"].forEach((id) => {
      const input = document.getElementById(id);
      const toggle = document.getElementById(`toggle-${id}`);
      if (input) input.type = "password";
      if (toggle) {
        toggle.classList.remove("bx-hide");
        toggle.classList.add("bx-show");
      }
    });
  }

  function setupEyeToggle(inputId, toggleId) {
    const input = document.getElementById(inputId);
    const toggle = document.getElementById(toggleId);
    if (!input || !toggle) return;

    toggle.addEventListener("click", function () {
      if (input.type === "password") {
        input.type = "text";
        toggle.classList.remove("bx-show");
        toggle.classList.add("bx-hide");
      } else {
        input.type = "password";
        toggle.classList.remove("bx-hide");
        toggle.classList.add("bx-show");
      }
    });
  }

  setupEyeToggle("old-password", "toggle-old-password");
  setupEyeToggle("new-password", "toggle-new-password");
  setupEyeToggle("confirm-password", "toggle-confirm-password");

  // Xử lý mở modal đổi mật khẩu khi bấm nút (hỗ trợ cả event delegation)
  document.addEventListener("click", function (e) {
    const btn = e.target.closest("#btn-change-password");
    if (btn) {
      e.preventDefault();
      if (userDropdown) userDropdown.classList.remove("active");
      const userCapsule = document.getElementById("user-profile-capsule");
      if (userCapsule) userCapsule.classList.remove("active");
      if (changePwdForm) changePwdForm.reset();
      resetEyeToggles();
      if (changePwdModal) changePwdModal.classList.add("active");
    }
  });

  if (closeChangePwdModal) closeChangePwdModal.addEventListener("click", hideChangePwdModal);
  if (cancelChangePwdBtn) cancelChangePwdBtn.addEventListener("click", hideChangePwdModal);
  if (changePwdOverlay) changePwdOverlay.addEventListener("click", hideChangePwdModal);

  if (changePwdForm) {
    changePwdForm.addEventListener("submit", async function (e) {
      e.preventDefault();

      const oldPassword = oldPasswordInput ? oldPasswordInput.value.trim() : "";
      const newPassword = newPasswordInput ? newPasswordInput.value.trim() : "";
      const confirmPassword = confirmPasswordInput ? confirmPasswordInput.value.trim() : "";

      if (!oldPassword) {
        displayToast("Vui lòng nhập mật khẩu hiện tại!", true);
        return;
      }

      if (!newPassword) {
        displayToast("Vui lòng nhập mật khẩu mới!", true);
        return;
      }

      if (newPassword.length < 8) {
        displayToast("Mật khẩu mới phải có ít nhất 8 ký tự!", true);
        return;
      }

      if (newPassword !== confirmPassword) {
        displayToast("Xác nhận mật khẩu mới không khớp!", true);
        return;
      }

      if (oldPassword === newPassword) {
        displayToast("Mật khẩu mới không được trùng với mật khẩu cũ!", true);
        return;
      }

      const token =
        (typeof getAuthToken === "function" ? getAuthToken() : null) ||
        localStorage.getItem("token");

      if (!token) {
        displayToast("Vui lòng đăng nhập lại để đổi mật khẩu!", true);
        return;
      }

      const saveBtn = changePwdForm.querySelector(".btn-save");
      const originalText = saveBtn ? saveBtn.textContent : "Đổi mật khẩu";
      if (saveBtn) {
        saveBtn.disabled = true;
        saveBtn.textContent = "Đang xử lý...";
      }

      try {
        const response = await fetch("/api/auth/change-password", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({
            oldPassword,
            newPassword
          })
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          displayToast(data.message || "Mật khẩu cũ không chính xác!", true);
          return;
        }

        hideChangePwdModal();
        displayToast("Đổi mật khẩu thành công!");
      } catch (err) {
        console.error("Lỗi khi đổi mật khẩu:", err);
        displayToast("Không thể kết nối đến máy chủ, vui lòng thử lại sau!", true);
      } finally {
        if (saveBtn) {
          saveBtn.disabled = false;
          saveBtn.textContent = originalText;
        }
      }
    });
  }
}

function initAllModals() {
  initProfileModal();
  initChangePasswordModal();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initAllModals);
} else {
  initAllModals();
}
