let wishlistGames = [];

async function renderWishlistGames(gamesList) {
  const gamesContent = document.querySelector(".games-content");
  if (!gamesContent) return;

  if (gamesList.length === 0) {
    gamesContent.innerHTML = `<div style="grid-column: 1 / -1; text-align: center; padding: 3rem; color: var(--text-secondary);">Bạn chưa lưu tựa game nào trong Wishlist.</div>`;
    return;
  }

  gamesContent.innerHTML = gamesList
    .map(
      (game) => `
    <div class="box" data-id="${game.game_id || game.id || ''}" style="position: relative; cursor: pointer; transition: transform 0.3s;" onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
      <img src="${game.image || '../../assets/default-game.png'}" alt="${game.name || game.title}" />
      <img src="../../assets/yellow_bookmarks.png" class="wishlist-btn" data-game-id="${game.game_id || game.id}" style="position: absolute; bottom: 15px; right: 15px; width: 32px; height: 32px; z-index: 10; cursor: pointer;" title="Xóa khỏi Wishlist" />
      <div class="box-text">
        <h2 title="${game.name || game.title}">${game.name || game.title}</h2>
        <h3>${game.platform || game.category || 'N/A'}</h3>
        <div class="rating-container">
          <div class="rating">
            <i class="bx bxs-star"></i>
            <span>${game.rating || '5.0'}</span>
          </div>
        </div>
      </div>
    </div>
  `
    )
    .join("");
}

document.addEventListener("DOMContentLoaded", async function () {
  const currentUser = typeof getCurrentUser === 'function' ? getCurrentUser() : null;
  if (!currentUser) {
    window.location.href = "../auth.html";
    return;
  }

  const userId = currentUser.id || currentUser.user_id;

  async function fetchWishlistGames() {
    try {
      const response = await fetch(`http://localhost:5000/api/wishlist/${userId}`);
      const result = await response.json();

      if (result.success) {
        wishlistGames = result.data;
        renderWishlistGames(wishlistGames);
      } else {
        showToast("Lỗi lấy wishlist: " + result.message, "error");
        renderWishlistGames([]);
      }
    } catch (error) {
      console.error("Lỗi API fetch wishlist:", error);
      showToast("Không thể kết nối đến máy chủ", "error");
      renderWishlistGames([]);
    }
  }

  await fetchWishlistGames();

  // Xử lý tìm kiếm
  const searchInput = document.getElementById("wishlist-search-input");
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      const query = e.target.value.toLowerCase().trim();
      const filtered = wishlistGames.filter(game => {
        const name = (game.name || game.title || '').toLowerCase();
        return name.includes(query);
      });
      renderWishlistGames(filtered);
    });
  }

  // Xử lý click vào Card Game và Nút Wishlist
  document.querySelector(".games-content")?.addEventListener("click", async (e) => {
    // Nếu click vào nút Wishlist
    if (e.target.classList.contains("wishlist-btn")) {
      e.stopPropagation(); // Ngăn chặn sự kiện nổi bọt lên box
      const gameId = e.target.getAttribute("data-game-id");
      if (!gameId) return;

      try {
        const response = await fetch(`http://localhost:5000/api/wishlist/${userId}`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ game_id: gameId })
        });
        const result = await response.json();
        
        if (result.success) {
          showToast("Đã xóa khỏi Wishlist", "success");
          // Xóa khỏi danh sách local và render lại
          wishlistGames = wishlistGames.filter(g => (g.game_id || g.id).toString() !== gameId.toString());
          // Giữ lại text search nếu đang search
          if (searchInput && searchInput.value) {
             searchInput.dispatchEvent(new Event("input"));
          } else {
             renderWishlistGames(wishlistGames);
          }
        } else {
          showToast("Lỗi xóa: " + result.message, "error");
        }
      } catch (error) {
        console.error(error);
        showToast("Lỗi kết nối", "error");
      }
      return;
    }

    // Nếu click vào box game
    const box = e.target.closest(".box");
    if (box) {
      e.preventDefault();
      const gameId = box.getAttribute("data-id");
      if (!gameId) return;
      window.location.href = `../game-details.html?id=${gameId}`;
    }
  });
});
