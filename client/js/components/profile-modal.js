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
        <div class="form-group">
          <label for="profile-password">Mật khẩu mới (Để trống nếu không đổi)</label>
          <input type="password" id="profile-password" placeholder="Nhập mật khẩu mới..." />
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
  const profilePassword = document.getElementById("profile-password");
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
      if (profilePassword) profilePassword.value = "";
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
      const newPassword = profilePassword ? profilePassword.value.trim() : "";

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
            username: newUsername,
            password: newPassword || undefined
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

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initProfileModal);
} else {
  initProfileModal();
}
