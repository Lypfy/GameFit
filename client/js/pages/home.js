// 2. Danh sách các thể loại hiển thị thành từng mục riêng biệt trên trang Home
const categoriesToDisplay = [
  { title: "Action / RPG", filterKey: "Action / RPG", icon: "bx-joystick" },
  { title: "FPS", filterKey: "FPS", icon: "bx-target-lock" },
];

let savedWishlistGameIds = new Set();
let currentUser = null;
let allGames = []; // Dữ liệu thật từ DB

function renderPopularGames(games) {
  const swiperWrapper = document.querySelector(
    ".popular-content .swiper-wrapper",
  );
  if (!swiperWrapper) return;
  swiperWrapper.innerHTML = games
    .map(
      (game) => {
        const gameIdStr = (game.game_id || game.id || '').toString();
        const isSaved = savedWishlistGameIds.has(gameIdStr);
        const bookmarkIcon = isSaved ? '../assets/yellow_bookmarks.png' : '../assets/white_bookmarks.png';
        const bookmarkHtml = `<img src="${bookmarkIcon}" class="wishlist-btn" data-game-id="${gameIdStr}" style="position: absolute; bottom: 15px; right: 15px; width: 32px; height: 32px; z-index: 10; cursor: pointer;" title="${isSaved ? 'Xóa khỏi Wishlist' : 'Thêm vào Wishlist'}" />`;

        return `
    <div class="swiper-slide">
      <div class="box" data-id="${gameIdStr}">
        <img src="${game.image || '../assets/default-game.png'}" alt="${game.title || game.name}" />
        ${bookmarkHtml}
        <div class="box-text">
          <h2>${game.title || game.name}</h2>
          <h3>${game.category || game.platform}</h3>
          <div class="rating-container">
            <div class="rating">
              <i class="bx bxs-star"></i>
              <span>${typeof game.rating === 'number' ? game.rating.toFixed(1) : (game.rating ? parseFloat(game.rating).toFixed(1) : '0.0')}</span>
            </div>
            <a href="game-details.html?id=${gameIdStr}" class="box-btn">View</a>
          </div>
        </div>
      </div>
    </div>
  `;
      }
    )
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
          const gameCat = game.category || game.platform || '';
          return gameCat.toLowerCase().includes(cat.filterKey.toLowerCase());
        })
        .slice(0, 4);

      if (filtered.length === 0) return "";

      const gameCardsHtml = filtered
        .map(
          (game) => {
            const gameIdStr = (game.game_id || game.id || '').toString();
            const isSaved = savedWishlistGameIds.has(gameIdStr);
            const bookmarkIcon = isSaved ? '../assets/yellow_bookmarks.png' : '../assets/white_bookmarks.png';
            const bookmarkHtml = `<img src="${bookmarkIcon}" class="wishlist-btn" data-game-id="${gameIdStr}" style="position: absolute; bottom: 15px; right: 15px; width: 32px; height: 32px; z-index: 10; cursor: pointer;" title="${isSaved ? 'Xóa khỏi Wishlist' : 'Thêm vào Wishlist'}" />`;

            return `
        <div class="box" data-id="${gameIdStr}" style="position: relative;">
          <img src="${game.image || '../assets/default-game.png'}" alt="${game.title || game.name}" />
          ${bookmarkHtml}
          <div class="box-text">
            <h2>${game.title || game.name}</h2>
            <h3>${game.category || game.platform}</h3>
            <div class="rating-container">
              <div class="rating">
                <i class="bx bxs-star"></i>
                <span>${typeof game.rating === 'number' ? game.rating.toFixed(1) : (game.rating ? parseFloat(game.rating).toFixed(1) : '0.0')}</span>
              </div>
              <a href="game-details.html?id=${gameIdStr}" class="box-btn">View</a>
            </div>
          </div>
        </div>
      `;
          }
        )
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

async function fetchUserWishlist() {
  if (currentUser) {
    try {
      const userId = currentUser.id || currentUser.user_id;
      const response = await fetch(`http://localhost:5000/api/wishlist/${userId}`);
      const result = await response.json();
      if (result.success) {
        savedWishlistGameIds = new Set(result.data.map(g => (g.game_id || g.id).toString()));
      }
    } catch (error) {
      console.error("Lỗi fetch wishlist:", error);
    }
  }
}

async function fetchAllGames() {
  try {
    const res = await fetch(`http://localhost:5000/api/games?page=1&limit=50`);
    const data = await res.json();
    if (data.success) {
      allGames = data.data;
    }
  } catch (error) {
    console.error("Lỗi fetch games:", error);
    // Fallback: dùng mảng tĩnh nếu API sập
    if (typeof gamesData !== 'undefined') allGames = gamesData;
  }
}

document.addEventListener("DOMContentLoaded", async function () {
  currentUser = typeof getCurrentUser === 'function' ? getCurrentUser() : null;
  
  await fetchAllGames();
  await fetchUserWishlist();

  // Lọc lấy 8 games có rating cao nhất cho phần Popular Games
  const popularGames = [...allGames]
    .sort((a, b) => (b.rating || 0) - (a.rating || 0))
    .slice(0, 8);

  renderPopularGames(popularGames);
  renderCategorySections();

  if (typeof Swiper !== "undefined") {
    new Swiper(".popular-content", {
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
  }

  // Lắng nghe click vào nút Wishlist trên toàn bộ trang
  document.body.addEventListener("click", async (e) => {
    if (e.target.classList.contains("wishlist-btn")) {
      e.preventDefault();
      e.stopPropagation();
      if (!currentUser) {
        if (typeof showToast === 'function') {
          showToast("Vui lòng đăng nhập để lưu game", "error");
        } else {
          alert("Vui lòng đăng nhập để lưu game");
        }
        return;
      }
      const gameId = e.target.getAttribute("data-game-id");
      if (!gameId) return;

      const userId = currentUser.id || currentUser.user_id;
      const isSaved = savedWishlistGameIds.has(gameId);
      
      try {
        const method = isSaved ? 'DELETE' : 'POST';
        const response = await fetch(`http://localhost:5000/api/wishlist/${userId}`, {
          method: method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ game_id: gameId })
        });
        const result = await response.json();
        
        if (result.success) {
          if (isSaved) {
            savedWishlistGameIds.delete(gameId);
            e.target.src = '../assets/white_bookmarks.png';
            e.target.title = 'Thêm vào Wishlist';
            if(typeof showToast === 'function') showToast("Đã xóa khỏi Wishlist", "success");
          } else {
            savedWishlistGameIds.add(gameId);
            e.target.src = '../assets/yellow_bookmarks.png';
            e.target.title = 'Xóa khỏi Wishlist';
            if(typeof showToast === 'function') showToast("Đã thêm vào Wishlist", "success");
          }
        }
      } catch (error) {
        console.error("Lỗi toggle wishlist:", error);
      }
    }
  });
});
