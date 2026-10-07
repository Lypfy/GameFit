/**
 * Navbar hamburger menu toggle & Live Game Search Dropdown
 */
document.addEventListener("DOMContentLoaded", function () {
  // 1. Hamburger Menu Toggle
  const menuIcon = document.querySelector(".menu-icon");
  const navbar = document.querySelector(".menu");

  if (menuIcon && navbar) {
    menuIcon.onclick = () => {
      menuIcon.classList.toggle("move");
      navbar.classList.toggle("active");
    };
  }

  // 2. Live Navbar Search Logic
  initNavbarLiveSearch();
});

let navbarGamesCache = null;

async function fetchNavbarGamesData() {
  if (navbarGamesCache && navbarGamesCache.length > 0) {
    return navbarGamesCache;
  }

  try {
    const res = await fetch("/api/games?page=1&limit=500");
    const result = await res.json();
    if (
      result.success &&
      Array.isArray(result.data) &&
      result.data.length > 0
    ) {
      navbarGamesCache = result.data;
      return navbarGamesCache;
    }
  } catch (err) {
    console.warn(
      "API games fetch error in navbar, fallback to gamesData if available:",
      err,
    );
  }

  if (typeof gamesData !== "undefined" && Array.isArray(gamesData)) {
    navbarGamesCache = gamesData;
    return navbarGamesCache;
  }

  return [];
}

function initNavbarLiveSearch() {
  const navSearchContainer = document.querySelector(".nav-icon .search");
  if (!navSearchContainer) return;

  const searchInput = navSearchContainer.querySelector("input");
  if (!searchInput) return;

  // Create or reuse dropdown container
  let resultsContainer = navSearchContainer.querySelector(
    ".navbar-search-results",
  );
  if (!resultsContainer) {
    resultsContainer = document.createElement("div");
    resultsContainer.className = "navbar-search-results";
    navSearchContainer.appendChild(resultsContainer);
  }

  // Determine path prefix for links and images
  const pathname = window.location.pathname.toLowerCase();
  const isInSubfolder =
    pathname.includes("/user/") || pathname.includes("/admin/");
  const detailLinkPrefix = isInSubfolder
    ? "../game-details.html"
    : "game-details.html";
  const defaultImg = isInSubfolder
    ? "../../assets/trending1.webp"
    : "../assets/trending1.webp";

  // Pre-fetch games list
  fetchNavbarGamesData();

  // Input event listener
  searchInput.addEventListener("input", async function (e) {
    const query = e.target.value.trim().toLowerCase();
    if (!query) {
      resultsContainer.classList.remove("active");
      resultsContainer.innerHTML = "";
      return;
    }

    const games = await fetchNavbarGamesData();
    if (!games || games.length === 0) {
      resultsContainer.classList.add("active");
      resultsContainer.innerHTML = `<div class="search-result-empty">Không tìm thấy dữ liệu game</div>`;
      return;
    }

    // Filter games by name, publisher, developer, tags
    const filtered = games.filter((game) => {
      const title = (game.name || game.title || "").toLowerCase();
      const pub = (game.publisher || game.developer || "").toLowerCase();
      const cat = (game.tags || game.category || "").toLowerCase();
      return (
        title.includes(query) || pub.includes(query) || cat.includes(query)
      );
    });

    if (filtered.length === 0) {
      resultsContainer.classList.add("active");
      resultsContainer.innerHTML = `<div class="search-result-empty">Không tìm thấy game "${query}"</div>`;
      return;
    }

    // Render max 8 matching items
    const matchesToShow = filtered.slice(0, 8);
    resultsContainer.innerHTML = matchesToShow
      .map((game) => {
        const gameId = game.game_id || game.id;
        const title = game.name || game.title || "Game";
        const meta =
          game.publisher ||
          game.developer ||
          game.tags ||
          game.category ||
          "PC Game";

        let rawImg =
          (game.image ? game.image.split(' ')[0] : null) || game.download_url || game.banner_image || defaultImg;
        if (rawImg.startsWith("./"))
          rawImg = rawImg.replace("./", isInSubfolder ? "../../" : "../");
        else if (rawImg.startsWith("../assets/") && isInSubfolder)
          rawImg = "../" + rawImg;

        return `
          <div class="search-result-item" data-id="${gameId}">
            <img src="${rawImg}" alt="${title}" class="search-result-img" onerror="this.onerror=null;this.src='${defaultImg}';" />
            <div class="search-result-info">
              <div class="search-result-title">${title}</div>
              <div class="search-result-meta">${meta}</div>
            </div>
          </div>
        `;
      })
      .join("");

    resultsContainer.classList.add("active");

    // Click handler for items
    resultsContainer.querySelectorAll(".search-result-item").forEach((item) => {
      item.addEventListener("click", function () {
        const id = this.getAttribute("data-id");
        window.location.href = `${detailLinkPrefix}?id=${id}`;
      });
    });
  });

  // Hide dropdown when clicking outside
  document.addEventListener("click", function (e) {
    if (!navSearchContainer.contains(e.target)) {
      resultsContainer.classList.remove("active");
    }
  });

  // Re-open on focus if query present
  searchInput.addEventListener("focus", function (e) {
    if (
      e.target.value.trim().length > 0 &&
      resultsContainer.children.length > 0
    ) {
      resultsContainer.classList.add("active");
    }
  });
}

// Khởi tạo Chatbot AI toàn cục
(function initGlobalChatbot() {
  const isInSub = window.location.pathname.toLowerCase().includes('/user/') || 
                  window.location.pathname.toLowerCase().includes('/admin/') || 
                  window.location.pathname.toLowerCase().includes('/auth/');
  const jsPrefix = isInSub ? '../../js/' : '../js/';
  const chatbotScript = document.createElement('script');
  chatbotScript.src = `${jsPrefix}components/chatbot.js`;
  chatbotScript.defer = true;
  document.head.appendChild(chatbotScript);
})();
