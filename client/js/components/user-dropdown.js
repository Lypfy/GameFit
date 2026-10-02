/**
 * User Dropdown component handling user state UI and navigation.
 */
function getAuthPath() {
  const currentPath = window.location.pathname;
  if (currentPath.includes("/admin/") || currentPath.includes("/user/")) {
    return "../auth/login_register.html";
  }
  return "auth/login_register.html";
}

function renderUserDropdownUI() {
  const userBox = document.querySelector(".user-box");
  const userDisplayName = document.getElementById("user-display-name");
  const userIcon = document.getElementById("user-icon");
  const dropdownUsername = document.getElementById("dropdown-username");
  const dropdownRole = document.getElementById("dropdown-role");
  const menuDashboard = document.getElementById("menu-dashboard");
  const userDropdown = document.getElementById("user-dropdown");

  const currentUser = typeof getCurrentUser === "function" ? getCurrentUser() : null;
  const isAdmin = currentUser && currentUser.role && currentUser.role.toLowerCase() === "admin";

  // Display/Hide all admin-only elements across navbar and menus
  const adminOnlyElements = document.querySelectorAll(".admin-only");
  adminOnlyElements.forEach((el) => {
    el.style.display = isAdmin ? "block" : "none";
  });

  if (!userBox) return;

  let navLoginBtn = document.getElementById("nav-login-btn");
  let userCapsule = document.getElementById("user-profile-capsule");

  // 1. TRƯỜNG HỢP CHƯA ĐĂNG NHẬP
  if (!currentUser) {
    if (userDisplayName) userDisplayName.style.display = "none";
    if (userIcon) userIcon.style.display = "none";
    if (userCapsule) userCapsule.style.display = "none";
    if (userDropdown) userDropdown.classList.remove("active");

    if (!navLoginBtn) {
      navLoginBtn = document.createElement("a");
      navLoginBtn.id = "nav-login-btn";
      navLoginBtn.className = "btn-nav-login";
      navLoginBtn.href = getAuthPath();
      navLoginBtn.innerHTML = `<i class="bx bx-log-in"></i><span>Đăng nhập</span>`;
      userBox.insertBefore(navLoginBtn, userDropdown || userBox.firstChild);
    } else {
      navLoginBtn.href = getAuthPath();
      navLoginBtn.style.display = "inline-flex";
    }

    if (menuDashboard) menuDashboard.style.display = "none";
    return;
  }

  // 2. TRƯỜNG HỢP ĐÃ ĐĂNG NHẬP
  if (navLoginBtn) navLoginBtn.style.display = "none";
  if (userDisplayName) userDisplayName.style.display = "none";
  if (userIcon) userIcon.style.display = "none";

  const username =
    currentUser.user_name ||
    currentUser.username ||
    "Người dùng";
  const initial = username.trim().charAt(0).toUpperCase() || "U";

  if (!userCapsule) {
    userCapsule = document.createElement("div");
    userCapsule.id = "user-profile-capsule";
    userCapsule.className = "user-profile-capsule";
    userCapsule.title = "Tùy chọn tài khoản";
    userCapsule.innerHTML = `
      <div class="user-avatar-badge">${initial}</div>
      <span class="user-display-name">${username}</span>
      <i class="bx bx-chevron-down nav-dropdown-arrow"></i>
    `;
    userBox.insertBefore(userCapsule, userDropdown || userBox.firstChild);

    userCapsule.addEventListener("click", function (e) {
      e.stopPropagation();
      if (userDropdown) {
        const isActive = userDropdown.classList.toggle("active");
        userCapsule.classList.toggle("active", isActive);
      }
    });
  } else {
    userCapsule.style.display = "inline-flex";
    const badge = userCapsule.querySelector(".user-avatar-badge");
    const nameEl = userCapsule.querySelector(".user-display-name");
    if (badge) badge.textContent = initial;
    if (nameEl) nameEl.textContent = username;
  }

  if (dropdownUsername) {
    dropdownUsername.textContent = username;
  }
  if (dropdownRole) {
    dropdownRole.textContent = isAdmin ? "Admin" : "User";
    dropdownRole.className = `role-badge ${isAdmin ? "admin" : "user"}`;
  }
  if (menuDashboard) {
    menuDashboard.style.display = isAdmin ? "block" : "none";
  }
}

document.addEventListener("DOMContentLoaded", function () {
  const userIcon = document.getElementById("user-icon");
  const userDisplayName = document.getElementById("user-display-name");
  const userDropdown = document.getElementById("user-dropdown");
  const btnLogout = document.getElementById("btn-logout");

  renderUserDropdownUI();

  // Close dropdown when clicking outside
  document.addEventListener("click", function (e) {
    const userCapsule = document.getElementById("user-profile-capsule");
    if (
      userDropdown &&
      userDropdown.classList.contains("active") &&
      !userDropdown.contains(e.target) &&
      (!userCapsule || !userCapsule.contains(e.target)) &&
      e.target !== userIcon &&
      e.target !== userDisplayName
    ) {
      userDropdown.classList.remove("active");
      if (userCapsule) userCapsule.classList.remove("active");
    }
  });

  // Handle Logout button
  if (btnLogout) {
    btnLogout.addEventListener("click", function (e) {
      e.preventDefault();
      if (userDropdown) userDropdown.classList.remove("active");
      const userCapsule = document.getElementById("user-profile-capsule");
      if (userCapsule) userCapsule.classList.remove("active");
      if (typeof logoutUser === "function") logoutUser();
      renderUserDropdownUI();
      if (typeof showToast === "function") {
        showToast("Đã đăng xuất tài khoản!");
      }
      // If logging out from admin dashboard, redirect to home page
      if (window.location.pathname.includes("/admin/")) {
        setTimeout(() => {
          window.location.href = "../home.html";
        }, 500);
      } else if (window.location.pathname.includes("game-details")) {
        setTimeout(() => {
          window.location.reload();
        }, 500);
      }
    });
  }
});
