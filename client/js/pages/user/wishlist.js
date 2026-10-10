const bookmarkSvgIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24"><path d="M0 0h24v24H0z" fill="none"/><path fill="currentColor" d="m12 12.298l1.102.679q.217.137.441-.025t.169-.429l-.306-1.257l.985-.835q.211-.187.124-.439q-.088-.251-.361-.282l-1.277-.106l-.504-1.202Q12.267 8.16 12 8.16t-.373.242l-.504 1.202l-1.277.106q-.273.03-.36.282q-.088.252.124.439l.984.835l-.305 1.257q-.056.268.168.429t.441.025zm0 4.625l-3.738 1.608q-.808.348-1.535-.134Q6 17.916 6 17.052V5.616q0-.691.463-1.153T7.616 4h8.769q.69 0 1.153.463T18 5.616v11.436q0 .864-.727 1.345q-.727.482-1.535.134z"/></svg>`;

let wishlistGames = [];

function getGameTagsHtml(game) {
  const tagString = game.tags || "";
  if (!tagString) {
    if (game.platform || game.category) {
      return `<h3>${game.platform || game.category}</h3>`;
    }
    return "";
  }
  const tagArray = tagString
    .split(", ")
    .map((t) => t.trim())
    .filter(Boolean);
  const maxDisplay = 2;
  const displayTags = tagArray.slice(0, maxDisplay);
  const remainingCount = tagArray.length - displayTags.length;
  const tagsContent =
    tagArray.length > 0
      ? `${displayTags.map((tag) => `<span class="game-tag-badge" title="${tag}">${tag}</span>`).join("")}
         ${remainingCount > 0 ? `<span class="game-tag-badge more-tag">+${remainingCount}</span>` : ""}`
      : "";
  return `<div class="game-tags-list">${tagsContent}</div>`;
}

async function renderWishlistGames(gamesList) {
  const gamesContent = document.querySelector(".games-content");
  if (!gamesContent) return;

  if (!gamesList || gamesList.length === 0) {
    gamesContent.innerHTML = `<div style="grid-column: 1 / -1; text-align: center; padding: 3rem; color: var(--text-secondary);">Bạn chưa lưu tựa game nào trong Wishlist.</div>`;
    return;
  }

  gamesContent.innerHTML = gamesList
    .map((game) => {
      const gameIdStr = (game.game_id || game.id || "").toString();
      const gameName = game.name || game.game_name || game.title || "Chưa có tên";
      const ratingVal =
        game.rating !== undefined
          ? game.rating
          : game.average_rating !== undefined
            ? game.average_rating
            : 0;
      const ratingStr =
        typeof ratingVal === "number"
          ? ratingVal.toFixed(1)
          : ratingVal
            ? parseFloat(ratingVal).toFixed(1)
            : "0.0";
      const tagsHtml = getGameTagsHtml(game);
      const imgSrc = game.image
        ? game.image.split(" ")[0]
        : "../../assets/home.jpg";
      const trailerSrc = game.trailer_url
        ? game.trailer_url.split(" ")[0]
        : "";

      return `
    <div class="box" data-id="${gameIdStr}" style="position: relative; cursor: pointer; transition: transform 0.3s;" 
         onmouseenter="this.style.transform='scale(1.05)'; const v = this.querySelector('video'); const i = this.querySelector('img'); if(v) { v.style.opacity=1; i.style.opacity=0; v.play().catch(()=>{}); }" 
         onmouseleave="this.style.transform='scale(1)'; const v = this.querySelector('video'); const i = this.querySelector('img'); if(v) { v.style.opacity=0; i.style.opacity=1; v.pause(); v.currentTime=0; }">
      <div class="media-wrapper" style="position: relative; width: 100%; aspect-ratio: 16/9; overflow: hidden;">
        <img src="${imgSrc}" style="width: 100%; height: 100%; object-fit: cover; transition: opacity 0.3s; display: block;" loading="lazy" alt="${gameName}" />
        ${trailerSrc ? `<video src="${trailerSrc}" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover; opacity: 0; transition: opacity 0.3s; pointer-events: none;" muted loop playsinline></video>` : ""}
      </div>
      <button type="button" class="wishlist-btn active" data-game-id="${gameIdStr}" title="Xóa khỏi Wishlist">${bookmarkSvgIcon}</button>
      <div class="box-text">
        <h2 title="${gameName}">${gameName}</h2>
        ${tagsHtml}
        <div class="rating-container">
          <div class="rating">
            <i class="bx bxs-star"></i>
            <span>${ratingStr}</span>
          </div>
        </div>
      </div>
    </div>
  `;
    })
    .join("");
}

document.addEventListener("DOMContentLoaded", async function () {
  const currentUser =
    typeof getCurrentUser === "function" ? getCurrentUser() : null;
  if (!currentUser) {
    window.location.href = "../auth/login_register.html";
    return;
  }

  const userId = currentUser.id || currentUser.user_id;

  async function fetchWishlistGames() {
    try {
      const response = await fetch(
        `http://localhost:5000/api/wishlist/${userId}`,
      );
      const result = await response.json();

      if (result.success) {
        wishlistGames = result.data || [];
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
      const filtered = wishlistGames.filter((game) => {
        const name = (
          game.name ||
          game.game_name ||
          game.title ||
          ""
        ).toLowerCase();
        const tags = (game.tags || "").toLowerCase();
        return name.includes(query) || tags.includes(query);
      });
      renderWishlistGames(filtered);
    });
  }

  // Xử lý click vào Card Game và Nút Wishlist
  document
    .querySelector(".games-content")
    ?.addEventListener("click", async (e) => {
      // Nếu click vào nút Wishlist
      const btn = e.target.closest(".wishlist-btn");
      if (btn) {
        e.stopPropagation(); // Ngăn chặn sự kiện nổi bọt lên box
        const gameId = btn.getAttribute("data-game-id");
        if (!gameId) return;

        try {
          const response = await fetch(
            `http://localhost:5000/api/wishlist/${userId}`,
            {
              method: "DELETE",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ game_id: gameId }),
            },
          );
          const result = await response.json();

          if (result.success) {
            showToast("Đã xóa khỏi Wishlist", "delete");
            // Xóa khỏi danh sách local và render lại
            wishlistGames = wishlistGames.filter(
              (g) => (g.game_id || g.id).toString() !== gameId.toString(),
            );
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
