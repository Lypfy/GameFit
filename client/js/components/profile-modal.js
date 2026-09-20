/**
 * Profile update modal logic.
 */
document.addEventListener("DOMContentLoaded", function () {
  const profileModal = document.getElementById("profile-modal");
  const profileModalOverlay = document.getElementById("profile-modal-overlay");
  const closeProfileModal = document.getElementById("close-profile-modal");
  const cancelProfileBtn = document.getElementById("cancel-profile-btn");
  const profileForm = document.getElementById("profile-form");
  const profileFullname = document.getElementById("profile-fullname");
  const profileUsername = document.getElementById("profile-username");
  const profileRole = document.getElementById("profile-role");
  const profilePassword = document.getElementById("profile-password");
  const btnUpdateProfile = document.getElementById("btn-update-profile");
  const userDropdown = document.getElementById("user-dropdown");

  if (btnUpdateProfile) {
    btnUpdateProfile.addEventListener("click", function (e) {
      e.preventDefault();
      if (userDropdown) userDropdown.classList.remove("active");
      const currentUser = getCurrentUser();
      if (!currentUser) return;

      if (profileFullname) profileFullname.value = currentUser.fullname || "";
      if (profileUsername) profileUsername.value = currentUser.username || "user1";
      if (profileRole) {
        profileRole.value =
          currentUser.role === "admin"
            ? "Quản trị viên (Admin)"
            : "Người dùng (User)";
      }
      if (profilePassword) profilePassword.value = "";
      if (profileModal) profileModal.classList.add("active");
    });
  }

  function hideProfileModal() {
    if (profileModal) profileModal.classList.remove("active");
  }

  if (closeProfileModal) closeProfileModal.addEventListener("click", hideProfileModal);
  if (cancelProfileBtn) cancelProfileBtn.addEventListener("click", hideProfileModal);
  if (profileModalOverlay) profileModalOverlay.addEventListener("click", hideProfileModal);

  if (profileForm) {
    profileForm.addEventListener("submit", function (e) {
      e.preventDefault();
      const currentUser = getCurrentUser();
      if (!currentUser) return;

      const newFullname = profileFullname.value.trim();
      const newPassword = profilePassword.value.trim();

      if (!newFullname) {
        showToast("Vui lòng nhập họ và tên!", true);
        return;
      }

      currentUser.fullname = newFullname;
      if (newPassword) {
        currentUser.password = newPassword;
      }

      setCurrentUser(currentUser);
      if (typeof renderUserDropdownUI === "function") {
        renderUserDropdownUI();
      }
      hideProfileModal();
      showToast("Cập nhật thông tin cá nhân thành công!");
    });
  }
});
