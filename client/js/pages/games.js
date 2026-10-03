let games = []; // Khởi tạo mảng trống, sẽ được gán từ API
const requirements =
  typeof requirementsData !== "undefined" ? requirementsData : [];
let savedWishlistGameIds = new Set(); // Lưu ID các game đã lưu vào Wishlist
let currentUser = null;

const bookmarkSvgIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24"><path d="M0 0h24v24H0z" fill="none"/><path fill="currentColor" d="m12 12.298l1.102.679q.217.137.441-.025t.169-.429l-.306-1.257l.985-.835q.211-.187.124-.439q-.088-.251-.361-.282l-1.277-.106l-.504-1.202Q12.267 8.16 12 8.16t-.373.242l-.504 1.202l-1.277.106q-.273.03-.36.282q-.088.252.124.439l.984.835l-.305 1.257q-.056.268.168.429t.441.025zm0 4.625l-3.738 1.608q-.808.348-1.535-.134Q6 17.916 6 17.052V5.616q0-.691.463-1.153T7.616 4h8.769q.69 0 1.153.463T18 5.616v11.436q0 .864-.727 1.345q-.727.482-1.535.134z"/></svg>`;

function getBookmarkHtml(gameIdStr, isSaved) {
  return `<button type="button" class="wishlist-btn ${isSaved ? "active" : ""}" data-game-id="${gameIdStr}" title="${isSaved ? "Xóa khỏi Wishlist" : "Thêm vào Wishlist"}">${bookmarkSvgIcon}</button>`;
}

function renderGames(gamesList) {
  const gamesContent = document.querySelector(".games-content");
  if (!gamesContent) return;

  if (!gamesList || gamesList.length === 0) {
    gamesContent.innerHTML = `
      <div class="no-games-found" style="grid-column: 1 / -1; text-align: center; padding: 50px 20px; color: #ccc;">
        <h3 style="font-size: 20px; margin-bottom: 8px; color: #fff;">Không tìm thấy game phù hợp</h3>
        <p style="font-size: 14px; color: #aaa;">Vui lòng thử thay đổi hoặc bỏ bớt các tiêu chí lọc.</p>
      </div>
    `;
    return;
  }

  gamesContent.innerHTML = gamesList
    .map((game) => {
      const gameIdStr = (game.game_id || game.id || "").toString();
      const isSaved = savedWishlistGameIds.has(gameIdStr);
      const bookmarkHtml = getBookmarkHtml(gameIdStr, isSaved);
      // Xử lý Tags (Giữ độ cao cố định 1 dòng)
      const tagString = game.tags || "";
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
      const tagsHtml = `<div class="game-tags-list">${tagsContent}</div>`;
      return `
    <div class="box" data-id="${gameIdStr}" style="position: relative; cursor: pointer; transition: transform 0.3s;" onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
      <img src="${game.image || "../assets/default-game.png"}" loading="lazy" alt="${game.name || game.title}" />
      ${bookmarkHtml}
      <div class="box-text">
        <h2 title="${game.name || game.title}">${game.name || game.title}</h2>
        <h3>${game.platform || game.category || ""}</h3>
        ${tagsHtml}
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
}

document.addEventListener("DOMContentLoaded", function () {
  let currentPage = 1;
  let totalPages = 1;
  const limit = 20;

  function renderSkeletonCards(count = 12) {
    const gamesContent = document.querySelector(".games-content");
    if (!gamesContent) return;
    const skeletonHtml = Array(count)
      .fill(
        `<div class="skeleton-box">
          <div class="skeleton-element skeleton-img"></div>
          <div class="skeleton-element skeleton-title"></div>
          <div class="skeleton-element skeleton-sub"></div>
          <div class="skeleton-element skeleton-badge"></div>
        </div>`,
      )
      .join("");
    gamesContent.innerHTML = skeletonHtml;
  }

  let currentFilters = {};
  let currentSort = document.getElementById("sort-by")?.value || "default";

  // Lấy dữ liệu từ Database thông qua API có hỗ trợ Filter & Sort
  async function fetchGames(page = 1, filters = {}) {
    renderSkeletonCards(12);
    try {
      let url = `http://localhost:5000/api/games?page=${page}&limit=${limit}`;

      // Gắn tham số lọc vào URL
      if (filters.categories?.length)
        url += `&categories=${encodeURIComponent(filters.categories.join(","))}`;
      if (filters.publishers?.length)
        url += `&publishers=${encodeURIComponent(filters.publishers.join(","))}`;
      if (filters.rams?.length) url += `&rams=${encodeURIComponent(filters.rams.join(","))}`;
      if (filters.sort && filters.sort !== "default") {
        url += `&sort=${encodeURIComponent(filters.sort)}`;
      }

      const response = await fetch(url);
      const result = await response.json();

      if (result.success) {
        games = result.data || [];

        // Sap xep client-side (fallback/guarantee)
        const activeSort = filters.sort || currentSort;
        if (activeSort === "name-asc") {
          games.sort((a, b) =>
            (a.name || a.title || "").localeCompare(b.name || b.title || "", "vi", { sensitivity: "base" })
          );
        } else if (activeSort === "rating-desc") {
          games.sort((a, b) => (parseFloat(b.rating) || 0) - (parseFloat(a.rating) || 0));
        }

        currentPage = result.pagination?.currentPage || 1;
        totalPages = result.pagination?.totalPages || 1;

        // Render ra giao diện
        renderGames(games);
        renderPagination();
      } else {
        console.error("Lỗi từ server:", result.message);
      }
    } catch (error) {
      console.error("Lỗi khi gọi API fetch games:", error);
      if (typeof gamesData !== "undefined") {
        games = gamesData;
        if (currentSort === "name-asc") {
          games.sort((a, b) =>
            (a.name || a.title || "").localeCompare(b.name || b.title || "", "vi", { sensitivity: "base" })
          );
        } else if (currentSort === "rating-desc") {
          games.sort((a, b) => (parseFloat(b.rating) || 0) - (parseFloat(a.rating) || 0));
        }
        renderGames(games);
      }
    }
  }

  function renderPagination() {
    const paginationContainer = document.getElementById("pagination-container");
    if (!paginationContainer) return;

    paginationContainer.innerHTML = "";
    if (totalPages <= 1) return;

    const prevBtn = document.createElement("button");
    prevBtn.className = "page-btn";
    prevBtn.textContent = "Prev";
    prevBtn.disabled = currentPage === 1;
    prevBtn.addEventListener("click", () => changePage(currentPage - 1));
    paginationContainer.appendChild(prevBtn);

    for (let i = 1; i <= totalPages; i++) {
      const pageBtn = document.createElement("button");
      pageBtn.className = `page-btn ${i === currentPage ? "active" : ""}`;
      pageBtn.textContent = i;
      pageBtn.addEventListener("click", () => changePage(i));
      paginationContainer.appendChild(pageBtn);
    }

    const nextBtn = document.createElement("button");
    nextBtn.className = "page-btn";
    nextBtn.textContent = "Next";
    nextBtn.disabled = currentPage === totalPages;
    nextBtn.addEventListener("click", () => changePage(currentPage + 1));
    paginationContainer.appendChild(nextBtn);
  }

  function changePage(page) {
    if (page < 1 || page > totalPages || page === currentPage) return;
    fetchGames(page, { ...currentFilters, sort: currentSort });
    window.scrollTo({
      top: document.querySelector(".games").offsetTop - 100,
      behavior: "smooth",
    });
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

  // Gọi hàm lấy dữ liệu
  async function initializeData() {
    currentUser =
      typeof getCurrentUser === "function" ? getCurrentUser() : null;

    const urlParams = new URLSearchParams(window.location.search);
    const categoryFromUrl = urlParams.get("category");
    if (typeof loadCategoriesFilter === "function" && typeof loadPublishersFilter === "function") {
      await Promise.all([loadCategoriesFilter(), loadPublishersFilter()]);
      window.isFilterDataLoaded = true;
    } else if (typeof loadCategoriesFilter === "function") {
      await loadCategoriesFilter();
    }
    if (categoryFromUrl) {
      const chips = document.querySelectorAll(
        "#category-filter-list .filter-chip",
      );
      chips.forEach((chip) => {
        if (chip.dataset.value === categoryFromUrl) {
          chip.classList.add("active");
        }
      });
    }
    if (categoryFromUrl) {
      currentFilters.categories = [categoryFromUrl];

      // Đợi danh sách tag được render xong rồi đánh dấu active
      setTimeout(() => {
        const btn = document.querySelector(
          `.filter-chip[data-value="${categoryFromUrl}"]`,
        );
        if (btn) btn.classList.add("active");
      }, 500);
    }
    await fetchGames(1, { ...currentFilters, sort: currentSort });
    fetchUserWishlist().then(() => {
      updateWishlistUI();
    });
  }

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

  initializeData();

  // Sắp xếp game khi thay đổi select #sort-by
  const sortBySelect = document.getElementById("sort-by");
  sortBySelect?.addEventListener("change", function () {
    currentSort = this.value;
    fetchGames(1, { ...currentFilters, sort: currentSort });
  });

  // Lọc game
  const btnApplyFilter = document.getElementById("btn-apply-filter");
  btnApplyFilter?.addEventListener("click", function () {
    const ActiveChips = document.querySelectorAll(".filter-chip.active");
    const selectedCategories = [];
    const selectedPublishers = [];
    const selectedRams = [];

    // Chia nhóm bộ lọc
    ActiveChips.forEach((chip) => {
      const type = chip.parentElement.dataset.filterType;
      const value = chip.dataset.value;
      if (type === "category") selectedCategories.push(value);
      if (type === "publisher") selectedPublishers.push(value);
      if (type === "ram") selectedRams.push(value);
    });

    currentFilters = {
      categories: selectedCategories,
      publishers: selectedPublishers,
      rams: selectedRams,
    };

    fetchGames(1, {
      ...currentFilters,
      sort: currentSort,
    });

    if (typeof window.closeFilterModal === "function") {
      window.closeFilterModal();
    }
  });

  const btnResetFilter = document.getElementById("btn-reset-filter");
  btnResetFilter?.addEventListener("click", function () {
    currentFilters = {};
    fetchGames(1, { ...currentFilters, sort: currentSort });
  });
  // Lắng nghe click vào toàn bộ Card Game (Event Delegation)
  document
    .querySelector(".games-content")
    ?.addEventListener("click", async (e) => {
      // Nếu click vào nút Wishlist
      const btn = e.target.closest(".wishlist-btn");
      if (btn) {
        e.preventDefault();
        e.stopPropagation(); // Ngăn sự kiện nổi bọt
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
                showToast("Đã xóa khỏi Wishlist", "delete");
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
