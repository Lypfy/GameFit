// 2. Danh sách các thể loại hiển thị thành từng mục riêng biệt trên trang Home
const categoriesToDisplay = [
  { title: "FPS", filterKey: "FPS", icon: "bx-target-lock" },
];

let savedWishlistGameIds = new Set();
let currentUser = null;
let allGames = []; // Dữ liệu thật từ DB

function getGameTagsHtml(game) {
  if (!game.tags || game.tags.trim() === "") return "";
  const tagArray = game.tags
    .split(", ")
    .map((t) => t.trim())
    .filter(Boolean);
  const maxDisplay = 3;
  const displayTags = tagArray.slice(0, maxDisplay);
  const remainingCount = tagArray.length - displayTags.length;
  return `
    <div class="game-tags-list" style="display: flex; gap: 4px; flex-wrap: wrap; margin: 6px 0;">
      ${displayTags.map((tag) => `<span class="game-tag-badge">${tag}</span>`).join("")}
      ${remainingCount > 0 ? `<span class="game-tag-badge more-tag">+${remainingCount}</span>` : ""}
    </div>
  `;
}

const bookmarkSvgIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24"><path d="M0 0h24v24H0z" fill="none"/><path fill="currentColor" d="m12 12.298l1.102.679q.217.137.441-.025t.169-.429l-.306-1.257l.985-.835q.211-.187.124-.439q-.088-.251-.361-.282l-1.277-.106l-.504-1.202Q12.267 8.16 12 8.16t-.373.242l-.504 1.202l-1.277.106q-.273.03-.36.282q-.088.252.124.439l.984.835l-.305 1.257q-.056.268.168.429t.441.025zm0 4.625l-3.738 1.608q-.808.348-1.535-.134Q6 17.916 6 17.052V5.616q0-.691.463-1.153T7.616 4h8.769q.69 0 1.153.463T18 5.616v11.436q0 .864-.727 1.345q-.727.482-1.535.134z"/></svg>`;

function getBookmarkHtml(gameIdStr, isSaved) {
  return `<button type="button" class="wishlist-btn ${isSaved ? "active" : ""}" data-game-id="${gameIdStr}" title="${isSaved ? "Xóa khỏi Wishlist" : "Thêm vào Wishlist"}">${bookmarkSvgIcon}</button>`;
}

function renderPopularGames(games) {
  const swiperWrapper = document.querySelector(
    ".popular-content .swiper-wrapper",
  );
  if (!swiperWrapper) return;
  swiperWrapper.innerHTML = games
    .map((game) => {
      const gameIdStr = (game.game_id || game.id || "").toString();
      const isSaved = savedWishlistGameIds.has(gameIdStr);
      const bookmarkHtml = getBookmarkHtml(gameIdStr, isSaved);

      return `
    <div class="swiper-slide">
      <div class="box" data-id="${gameIdStr}" style="position: relative; cursor: pointer; transition: transform 0.3s;" onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
        <img src="${game.image || "../assets/default-game.png"}" loading="lazy" alt="${game.name || game.title}" />
        ${bookmarkHtml}
        <div class="box-text">
          <h2 title="${game.name || game.title}">${game.name || game.title}</h2>
          <h3>${game.platform || game.category || ""}</h3>
          ${getGameTagsHtml(game)}
          <div class="rating-container">
            <div class="rating">
              <i class="bx bxs-star"></i>
              <span>${typeof game.rating === "number" ? game.rating.toFixed(1) : game.rating ? parseFloat(game.rating).toFixed(1) : "0.0"}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
    })
    .join("");
}

/**
 * Hiển thị từng thể loại thành một mục riêng biệt (Section)
 */
function renderCategorySections() {
  const container = document.getElementById("category-sections");
  if (!container) return;

  container.innerHTML = categoriesToDisplay
    .map((cat) => {
      // Lấy danh sách game thuộc thể loại này (lấy tối đa 4 game)
      const filtered = allGames
        .filter((game) => {
          const gameCat = game.category || game.platform || "";
          return gameCat.toLowerCase().includes(cat.filterKey.toLowerCase());
        })
        .slice(0, 4);

      if (filtered.length === 0) return "";

      const gameCardsHtml = filtered
        .map((game) => {
          const gameIdStr = (game.game_id || game.id || "").toString();
          const isSaved = savedWishlistGameIds.has(gameIdStr);
          const bookmarkHtml = getBookmarkHtml(gameIdStr, isSaved);

          return `
        <div class="box" data-id="${gameIdStr}" style="position: relative; cursor: pointer; transition: transform 0.3s;" onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
          <img src="${game.image || "../assets/default-game.png"}" loading="lazy" alt="${game.name || game.title}" />
          ${bookmarkHtml}
          <div class="box-text">
            <h2 title="${game.name || game.title}">${game.name || game.title}</h2>
            <h3>${game.platform || game.category || ""}</h3>
            ${getGameTagsHtml(game)}
            <div class="rating-container">
              <div class="rating">
                <i class="bx bxs-star"></i>
                <span>${typeof game.rating === "number" ? game.rating.toFixed(1) : game.rating ? parseFloat(game.rating).toFixed(1) : "0.0"}</span>
              </div>
            </div>
          </div>
        </div>
      `;
        })
        .join("");

      return `
        <section class="new container">
          <div class="heading">
            <div class="left-heading">
              <i class="bx ${cat.icon}"></i>
              <h2>${cat.title} Games</h2>
            </div>
            <div class="right-heading">
              <a href="games.html?category=${encodeURIComponent(cat.filterKey)}">View All<i class="bx bx-right-arrow-alt"></i></a>
            </div>
          </div>
          <div class="new-content">
            ${gameCardsHtml}
          </div>
        </section>
      `;
    })
    .join("");
}

async function fetchAndRenderActionGames() {
  const container = document.getElementById("category-sections");
  if (!container) return;

  try {
    const actionTagId = 1; // Theo chỉ định, tag_id của Action là 1

    // Lấy game theo tag
    const gamesRes = await fetch(
      `http://localhost:5000/api/games/tag/${actionTagId}`,
    );
    const gamesData = await gamesRes.json();

    if (gamesData.success && gamesData.data.length > 0) {
      const actionGames = gamesData.data.slice(0, 4);

      const gameCardsHtml = actionGames
        .map((game) => {
          const gameIdStr = (game.game_id || game.id || "").toString();
          const isSaved = savedWishlistGameIds.has(gameIdStr);
          const bookmarkHtml = getBookmarkHtml(gameIdStr, isSaved);

          return `
        <div class="box" data-id="${gameIdStr}" style="position: relative; cursor: pointer; transition: transform 0.3s;" onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
          <img src="${game.image || "../assets/default-game.png"}" loading="lazy" alt="${game.name || game.title}" />
          ${bookmarkHtml}
          <div class="box-text">
            <h2 title="${game.name || game.title}">${game.name || game.title}</h2>
            <h3>${game.platform || game.category || ""}</h3>
            ${getGameTagsHtml(game)}
            <div class="rating-container">
              <div class="rating">
                <i class="bx bxs-star"></i>
                <span>${typeof game.rating === "number" ? game.rating.toFixed(1) : game.rating ? parseFloat(game.rating).toFixed(1) : "0.0"}</span>
              </div>
            </div>
          </div>
        </div>
      `;
        })
        .join("");

      const sectionHtml = `
        <section class="new container">
          <div class="heading">
            <div class="left-heading">
              <i class="bx bx-joystick"></i>
              <h2>Action Games</h2>
            </div>
            <div class="right-heading">
              <a href="games.html?category=Action">View All<i class="bx bx-right-arrow-alt"></i></a>
            </div>
          </div>
          <div class="new-content">
            ${gameCardsHtml}
          </div>
        </section>
      `;

      container.insertAdjacentHTML("afterbegin", sectionHtml);
    }
  } catch (error) {
    console.error("Lỗi khi fetch Action games by tag:", error);
  }
}

async function fetchUserWishlist() {
  if (currentUser) {
    try {
      const userId = currentUser.id || currentUser.user_id;
      const response = await fetch(
        `http://localhost:5000/api/wishlist/${userId}`,
      );
      const result = await response.json();
      if (result.success) {
        savedWishlistGameIds = new Set(
          result.data.map((g) => (g.game_id || g.id).toString()),
        );
      }
    } catch (error) {
      console.error("Lỗi fetch wishlist:", error);
    }
  }
}

function renderPopularSkeleton(count = 4) {
  const wrapper = document.querySelector(".popular-content .swiper-wrapper");
  if (!wrapper) return;
  wrapper.innerHTML = Array(count)
    .fill(
      `<div class="swiper-slide">
        <div class="skeleton-box">
          <div class="skeleton-element skeleton-img"></div>
          <div class="skeleton-element skeleton-title"></div>
          <div class="skeleton-element skeleton-sub"></div>
          <div class="skeleton-element skeleton-badge"></div>
        </div>
      </div>`,
    )
    .join("");
}

async function fetchAllGames() {
  try {
    const res = await fetch(`http://localhost:5000/api/games?page=1&limit=8`);
    const data = await res.json();
    if (data.success) {
      allGames = data.data;
    }
  } catch (error) {
    console.error("Lỗi fetch games:", error);
    // Fallback: dùng mảng tĩnh nếu API sập
    if (typeof gamesData !== "undefined") allGames = gamesData;
  }
}

let popularSwiper = null;

function initOrUpdateSwiper() {
  if (typeof Swiper === "undefined") return;
  if (!popularSwiper) {
    popularSwiper = new Swiper(".popular-content", {
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
  } else {
    popularSwiper.update();
  }
}

document.addEventListener("DOMContentLoaded", async function () {
  currentUser = typeof getCurrentUser === "function" ? getCurrentUser() : null;

  // Render skeleton và khởi tạo Swiper ngay lập tức để giữ khung 4 cột (không bị trượt 1 hình to)
  renderPopularSkeleton(4);
  initOrUpdateSwiper();

  await fetchAllGames();

  // Lọc lấy 8 games có rating cao nhất cho phần Popular Games
  const popularGames = [...allGames]
    .sort((a, b) => (b.rating || 0) - (a.rating || 0))
    .slice(0, 8);

  renderPopularGames(popularGames);
  initOrUpdateSwiper();

  renderCategorySections();
  await fetchAndRenderActionGames();
  fetchUserWishlist().then(() => {
    updateWishlistUI();
  });

  function updateWishlistUI() {
    document.querySelectorAll(".wishlist-btn").forEach((btn) => {
      const gameId = btn.getAttribute("data-game-id");
      if (gameId && savedWishlistGameIds.has(gameId)) {
        btn.classList.add("active");
        btn.title = "Xóa khỏi Wishlist";
      } else {
        btn.classList.remove("active");
        btn.title = "Thêm vào Wishlist";
      }
    });
  }

  // Lắng nghe click vào nút Wishlist trên toàn bộ trang
  document.body.addEventListener("click", async (e) => {
    const btn = e.target.closest(".wishlist-btn");
    if (btn) {
      e.preventDefault();
      e.stopPropagation();
      if (!currentUser) {
        if (typeof showToast === "function") {
          showToast("Vui lòng đăng nhập để lưu game", "error");
        } else {
          alert("Vui lòng đăng nhập để lưu game");
        }
        return;
      }
      const gameId = btn.getAttribute("data-game-id");
      if (!gameId) return;

      const userId = currentUser.id || currentUser.user_id;
      const isSaved = savedWishlistGameIds.has(gameId);

      try {
        const method = isSaved ? "DELETE" : "POST";
        const response = await fetch(
          `http://localhost:5000/api/wishlist/${userId}`,
          {
            method: method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ game_id: gameId }),
          },
        );
        const result = await response.json();

        if (result.success) {
          if (isSaved) {
            savedWishlistGameIds.delete(gameId);
            btn.classList.remove("active");
            btn.title = "Thêm vào Wishlist";
            if (typeof showToast === "function")
              showToast("Đã xóa khỏi Wishlist", "success");
          } else {
            savedWishlistGameIds.add(gameId);
            btn.classList.add("active");
            btn.title = "Xóa khỏi Wishlist";
            if (typeof showToast === "function")
              showToast("Đã thêm vào Wishlist", "success");
          }
        }
      } catch (error) {
        console.error("Lỗi toggle wishlist:", error);
      }
      return;
    }

    const box = e.target.closest(".box");
    if (box) {
      e.preventDefault();
      const gameId = box.getAttribute("data-id");
      if (!gameId) return;

      // Chuyển hướng sang trang chi tiết game mới
      window.location.href = `game-details.html?id=${gameId}`;
    }
  });
});
