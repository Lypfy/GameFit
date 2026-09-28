let games = []; // Khởi tạo mảng trống, sẽ được gán từ API
const requirements = typeof requirementsData !== 'undefined' ? requirementsData : [];

function renderGames(gamesList) {
  const gamesContent = document.querySelector(".games-content");
  if (!gamesContent) return;

  gamesContent.innerHTML = gamesList
    .map(
      (game) => `
    <div class="box" data-id="${game.game_id || game.id || ''}" style="cursor: pointer; transition: transform 0.3s;" onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
      <img src="${game.image || '../assets/default-game.png'}" alt="${game.name || game.title}" />
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
  `,
    )
    .join("");
}

document.addEventListener("DOMContentLoaded", function () {
  let currentPage = 1;
  let totalPages = 1;
  const limit = 20;

  // Lấy dữ liệu từ Database thông qua API
  async function fetchGames(page = 1) {
    try {
      // Giả sử server Backend đang chạy ở port 5000
      const response = await fetch(`http://localhost:5000/api/games?page=${page}&limit=${limit}`);
      const result = await response.json();

      if (result.success) {
        games = result.data; // Lưu lại vào biến games toàn cục để dùng cho bộ lọc bên dưới
        currentPage = result.pagination?.currentPage || 1;
        totalPages = result.pagination?.totalPages || 1;

        // Xử lý đọc tham số category từ URL sau khi đã có data
        const urlParams = new URLSearchParams(window.location.search);
        const categoryParam = urlParams.get("category");
        if (categoryParam) {
          const filteredGames = games.filter((game) => {
            const cat = game.category || game.platform || '';
            return cat.toLowerCase().includes(categoryParam.toLowerCase());
          });
          renderGames(filteredGames);

          const categoryChip = document.querySelectorAll('[data-filter-type="category"] .filter-chip');
          categoryChip.forEach((chip) => {
            if (categoryParam.toLowerCase().includes(chip.dataset.value.toLowerCase())) {
              chip.classList.add("active");
            }
          });
        } else {
          renderGames(games);
        }
        renderPagination();
      } else {
        console.error("Lỗi từ server:", result.message);
      }
    } catch (error) {
      console.error("Lỗi khi gọi API fetch games:", error);
      // Fallback: nếu lỗi API, dùng data cũ để giao diện không bị trắng
      if (typeof gamesData !== 'undefined') {
        games = gamesData;
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
      pageBtn.className = `page-btn ${i === currentPage ? 'active' : ''}`;
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
    fetchGames(page);
    window.scrollTo({ top: document.querySelector('.games').offsetTop - 100, behavior: 'smooth' });
  }

  // Gọi hàm lấy dữ liệu
  fetchGames();

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

    const filteredGames = games.filter((game) => {
      const matchCategory =
        selectedCategories.length === 0 ||
        selectedCategories.some((category) => {
          const cat = game.category || game.platform || '';
          return cat.toLowerCase().includes(category.toLowerCase());
        });

      const matchPublisher =
        selectedPublishers.length === 0 ||
        (game.publisher && selectedPublishers.includes(game.publisher));

      const req = requirements.find((r) => r.gameId === game.id);
      const matchRam =
        selectedRams.length === 0 ||
        (req && selectedRams.includes(req.minimum?.ram));

      return matchCategory && matchPublisher && matchRam;
    });

    renderGames(filteredGames);

    if (typeof window.closeFilterModal === "function") {
      window.closeFilterModal();
    }
  });
  // Lắng nghe click vào toàn bộ Card Game (Event Delegation)
  document.querySelector(".games-content")?.addEventListener("click", async (e) => {
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
