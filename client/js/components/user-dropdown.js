/**
 * User Dropdown component handling user state UI and navigation.
 */
function renderUserDropdownUI() {
  const userDisplayName = document.getElementById("user-display-name");
  const dropdownUsername = document.getElementById("dropdown-username");
  const dropdownRole = document.getElementById("dropdown-role");
  const menuDashboard = document.getElementById("menu-dashboard");

  const currentUser = getCurrentUser();
  if (!currentUser) {
    if (userDisplayName) userDisplayName.textContent = "";
    if (menuDashboard) menuDashboard.style.display = "none";
    return;
  }

  if (userDisplayName) {
    userDisplayName.textContent = currentUser.fullname || "";
  }
  if (dropdownUsername) {
    dropdownUsername.textContent = currentUser.fullname || "Người dùng";
  }
  if (dropdownRole) {
    const isAdmin = currentUser.role === "admin";
    dropdownRole.textContent = isAdmin ? "Admin" : "User";
    dropdownRole.className = `role-badge ${isAdmin ? "admin" : "user"}`;
  }
  if (menuDashboard) {
    menuDashboard.style.display = currentUser.role === "admin" ? "block" : "none";
  }
}

document.addEventListener("DOMContentLoaded", function () {
  const userIcon = document.getElementById("user-icon");
  const userDisplayName = document.getElementById("user-display-name");
  const userDropdown = document.getElementById("user-dropdown");
  const btnLogout = document.getElementById("btn-logout");

  renderUserDropdownUI();

  // Handle click on user icon or display name
  function handleUserIconClick(e) {
    e.stopPropagation();
    const currentUser = getCurrentUser();
    if (!currentUser) {
      // Redirect from html/home.html to auth/login_register.html
      window.location.href = "auth/login_register.html";
    } else {
      if (userDropdown) {
        userDropdown.classList.toggle("active");
      }
    }
  }

  if (userIcon) userIcon.addEventListener("click", handleUserIconClick);
  if (userDisplayName) userDisplayName.addEventListener("click", handleUserIconClick);

  // Close dropdown when clicking outside
  document.addEventListener("click", function (e) {
    if (
      userDropdown &&
      userDropdown.classList.contains("active") &&
      !userDropdown.contains(e.target) &&
      e.target !== userIcon &&
      e.target !== userDisplayName
    ) {
      userDropdown.classList.remove("active");
    }
  });

  // Handle Logout button
  if (btnLogout) {
    btnLogout.addEventListener("click", function (e) {
      e.preventDefault();
      if (userDropdown) userDropdown.classList.remove("active");
      logoutUser();
      renderUserDropdownUI();
      showToast("Đã đăng xuất tài khoản!");
    });
  }
});
