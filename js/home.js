let menu = document.querySelector(".menu-icon");
let navbar = document.querySelector(".menu");

menu.onclick = () => {
  menu.classList.toggle("move");
  navbar.classList.toggle("active");
};

// ==================== CSDL MẪU (DỮ LIỆU GAME) ====================
const popularGames = [
  {
    id: 1,
    title: "Genshin Impact",
    category: "Action / RPG",
    rating: 4.8,
    image: "../assets/trending1.webp",
    link: "#",
  },
  {
    id: 2,
    title: "Cyberpunk 2077",
    category: "Sci-Fi / RPG",
    rating: 4.6,
    image: "../assets/trending1.webp",
    link: "#",
  },
  {
    id: 3,
    title: "Elden Ring",
    category: "Souls-like",
    rating: 4.9,
    image: "../assets/trending1.webp",
    link: "#",
  },
  {
    id: 4,
    title: "God of War",
    category: "Adventure",
    rating: 4.9,
    image: "../assets/trending1.webp",
    link: "#",
  },
  {
    id: 5,
    title: "Valorant",
    category: "FPS / Tactical",
    rating: 4.5,
    image: "../assets/trending1.webp",
    link: "#",
  },
  {
    id: 6,
    title: "GTA V",
    category: "Open World",
    rating: 4.7,
    image: "../assets/trending1.webp",
    link: "#",
  },
];

// ==================== CSDL MẪU (NEW GAMES) ====================
const newGames = [
  {
    id: 1,
    title: "Black Myth: Wukong",
    category: "Action / RPG",
    rating: 4.9,
    image: "../assets/trending1.webp",
    link: "#",
  },
  {
    id: 2,
    title: "Helldivers 2",
    category: "Shooter / Co-op",
    rating: 4.7,
    image: "../assets/trending1.webp",
    link: "#",
  },
  {
    id: 3,
    title: "Palworld",
    category: "Survival / Crafting",
    rating: 4.6,
    image: "../assets/trending1.webp",
    link: "#",
  },
  {
    id: 4,
    title: "Tekken 8",
    category: "Fighting",
    rating: 4.8,
    image: "../assets/trending1.webp",
    link: "#",
  },
  {
    id: 5,
    title: "FF VII Rebirth",
    category: "RPG",
    rating: 4.9,
    image: "../assets/trending1.webp",
    link: "#",
  },
  {
    id: 6,
    title: "Dragon's Dogma 2",
    category: "Action RPG",
    rating: 4.5,
    image: "../assets/trending1.webp",
    link: "#",
  },
];

// render dữ liễu vào html
function renderPopularGames(games) {
  const swiperWrapper = document.querySelector(
    ".popular-content .swiper-wrapper",
  );
  if (!swiperWrapper) return;
  swiperWrapper.innerHTML = games
    .map(
      (game) => `
    <div class="swiper-slide">
      <div class="box">
        <img src="${game.image}" alt="${game.title}" />
        <div class="box-text">
          <h2>${game.title}</h2>
          <h3>${game.category}</h3>
          <div class="rating-container">
            <div class="rating">
              <i class="bx bxs-star"></i>
              <span>${game.rating}</span>
            </div>
            <a href="${game.link}" class="box-btn">View</a>
          </div>
        </div>
      </div>
    </div>
  `,
    )
    .join("");
}

// Render dữ liệu trước khi khởi tạo Swiper
renderPopularGames(popularGames);

// add new game vào html
function renderNewGames(games) {
  const newContent = document.querySelector(".new-content");
  if (!newContent) return;

  newContent.innerHTML = games
    .map(
      (game) => `
    <div class="box">
      <img src="${game.image}" alt="${game.title}" />
      <div class="box-text">
        <h2>${game.title}</h2>
        <h3>${game.category}</h3>
        <div class="rating-container">
          <div class="rating">
            <i class="bx bxs-star"></i>
            <span>${game.rating}</span>
          </div>
          <a href="${game.link}" class="box-btn">View</a>
        </div>
      </div>
    </div>
  `,
    )
    .join("");
}

// Render New Games
renderNewGames(newGames);

// Swiper
var swiper = new Swiper(".popular-content", {
  slidesPerView: 1,
  spaceBetween: 10,
  pagination: {
    el: ".swiper-pagination",
    clickable: true,
  },
  autoplay: {
    delay: 2500,
    disableOnInteraction: false,
  },
  breakpoints: {
    640: {
      slidesPerView: 2,
      spaceBetween: 10,
    },
    768: {
      slidesPerView: 3,
      spaceBetween: 15,
    },
    1068: {
      slidesPerView: 5,
      spaceBetween: 20,
    },
  },
});

// Dropdown
document.addEventListener("DOMContentLoaded", function () {
  const userIcon = document.getElementById("user-icon");
  const userDisplayName = document.getElementById("user-display-name");
  const userDropdown = document.getElementById("user-dropdown");
  const dropdownUsername = document.getElementById("dropdown-username");
  const dropdownRole = document.getElementById("dropdown-role");
  const menuDashboard = document.getElementById("menu-dashboard");
  const btnLogout = document.getElementById("btn-logout");
  const btnUpdateProfile = document.getElementById("btn-update-profile");

  // Modal
  const profileModal = document.getElementById("profile-modal");
  const profileModalOverlay = document.getElementById("profile-modal-overlay");
  const closeProfileModal = document.getElementById("close-profile-modal");
  const cancelProfileBtn = document.getElementById("cancel-profile-btn");
  const profileForm = document.getElementById("profile-form");
  const profileFullname = document.getElementById("profile-fullname");
  const profileUsername = document.getElementById("profile-username");
  const profileRole = document.getElementById("profile-role");
  const profilePassword = document.getElementById("profile-password");

  //Lấy thông tin user hiện tại từ localStorage
  function getCurrentUser() {
    const storedUserStr = localStorage.getItem("currentUser");
    if (storedUserStr) {
      try {
        return JSON.parse(storedUserStr);
      } catch (e) {
        console.error("Lỗi parse currentUser", e);
      }
    }
    return null;
  }

  // Cập nhật giao diện Dropdown dựa theo thông tin & vai trò user
  function renderUserDropdownUI() {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      if (userDisplayName) userDisplayName.textContent = "";
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
    // Hiển thị mục Dashboard ĐỐI VỚI TÀI KHOẢN ADMIN
    if (menuDashboard) {
      menuDashboard.style.display =
        currentUser.role === "admin" ? "block" : "none";
    }
  }
  renderUserDropdownUI();

  // Xử lý click user-icon và tên người dùng:
  // - CHƯA ĐĂNG NHẬP: Chuyển sang trang đăng nhập (login_register.html)
  // - ĐÃ ĐĂNG NHẬP: Bật/tắt Bảng Dropdown Menu
  function handleUserIconClick(e) {
    e.stopPropagation();
    const currentUser = getCurrentUser();
    if (!currentUser) {
      window.location.href = "../html/login_register.html";
    } else {
      if (userDropdown) {
        userDropdown.classList.toggle("active");
      }
    }
  }
  if (userIcon) userIcon.addEventListener("click", handleUserIconClick);
  if (userDisplayName)
    userDisplayName.addEventListener("click", handleUserIconClick);
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
  // Xử lý Cập nhật thông tin cá nhân (Mở Modal)
  if (btnUpdateProfile) {
    btnUpdateProfile.addEventListener("click", function (e) {
      e.preventDefault();
      if (userDropdown) userDropdown.classList.remove("active");
      const currentUser = getCurrentUser();
      if (!currentUser) return;
      if (profileFullname) profileFullname.value = currentUser.fullname || "";
      if (profileUsername)
        profileUsername.value = currentUser.username || "user1";
      if (profileRole)
        profileRole.value =
          currentUser.role === "admin"
            ? "Quản trị viên (Admin)"
            : "Người dùng (User)";
      if (profilePassword) profilePassword.value = "";
      if (profileModal) profileModal.classList.add("active");
    });
  }

  function hideProfileModal() {
    if (profileModal) profileModal.classList.remove("active");
  }

  if (closeProfileModal)
    closeProfileModal.addEventListener("click", hideProfileModal);
  if (cancelProfileBtn)
    cancelProfileBtn.addEventListener("click", hideProfileModal);
  if (profileModalOverlay)
    profileModalOverlay.addEventListener("click", hideProfileModal);

  // Lưu thông tin cá nhân đã cập nhật
  if (profileForm) {
    profileForm.addEventListener("submit", function (e) {
      e.preventDefault();
      const currentUser = getCurrentUser();
      if (!currentUser) return;
      const newFullname = profileFullname.value.trim();
      const newPassword = profilePassword.value.trim();
      if (!newFullname) {
        showHomeToast("Vui lòng nhập họ và tên!", true);
        return;
      }
      currentUser.fullname = newFullname;
      if (newPassword) {
        currentUser.password = newPassword;
        localStorage.setItem("password", newPassword);
      }
      localStorage.setItem("fullname", newFullname);
      localStorage.setItem("currentUser", JSON.stringify(currentUser));
      renderUserDropdownUI();
      hideProfileModal();
      showHomeToast("Cập nhật thông tin cá nhân thành công!");
    });
  }

  // Xử lý Đăng xuất (Logout): Đăng xuất tại chỗ và giữ ở lại trang home.html
  if (btnLogout) {
    btnLogout.addEventListener("click", function (e) {
      e.preventDefault();
      if (userDropdown) userDropdown.classList.remove("active");
      localStorage.removeItem("currentUser");
      renderUserDropdownUI();
      showHomeToast("Đã đăng xuất tài khoản!");
    });
  }

  // Helper hiển thị thông báo Toast
  function showHomeToast(message, isError = false) {
    const toast = document.getElementById("home-toast");
    if (!toast) return;
    toast.innerHTML = isError
      ? `<i class="bx bx-error-circle" style="color: #ef4444; font-size: 1.2rem;"></i> ${message}`
      : `<i class="bx bx-check-circle" style="color: #22c55e; font-size: 1.2rem;"></i> ${message}`;
    toast.classList.add("show");
    setTimeout(function () {
      toast.classList.remove("show");
    }, 2500);
  }
});
