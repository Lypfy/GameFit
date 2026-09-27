let games = []; // Khởi tạo mảng trống, sẽ được gán từ API
const requirements = typeof requirementsData !== 'undefined' ? requirementsData : [];

function renderGames(gamesList) {
  const gamesContent = document.querySelector(".games-content");
  if (!gamesContent) return;

  gamesContent.innerHTML = gamesList
    .map(
      (game) => `
    <div class="box">
      <img src="${game.image || '../assets/default-game.png'}" alt="${game.name || game.title}" />
      <div class="box-text">
        <h2 title="${game.name || game.title}">${game.name || game.title}</h2>
        <h3>${game.platform || game.category || 'N/A'}</h3>
        <div class="rating-container">
          <div class="rating">
            <i class="bx bxs-star"></i>
            <span>${game.rating || '5.0'}</span>
          </div>
          <a href="${game.download_url || game.link || '#'}" class="box-btn">View</a>
        </div>
      </div>
    </div>
  `,
    )
    .join("");
}

document.addEventListener("DOMContentLoaded", function () {
  // Lấy dữ liệu từ Database thông qua API
  async function fetchGames() {
    try {
      // Giả sử server Backend đang chạy ở port 5000
      const response = await fetch('http://localhost:5000/api/games?page=1&limit=20');
      const result = await response.json();

      if (result.success) {
        games = result.data; // Lưu lại vào biến games toàn cục để dùng cho bộ lọc bên dưới

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
});
