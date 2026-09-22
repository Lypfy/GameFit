const games = gamesData;
const requirements = requirementsData;

function renderGames(gamesList) {
  const gamesContent = document.querySelector(".games-content");
  if (!gamesContent) return;

  gamesContent.innerHTML = gamesList
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

document.addEventListener("DOMContentLoaded", function () {
  // Đọc tham số category từ URL nếu có
  const urlParams = new URLSearchParams(window.location.search);
  const categoryParam = urlParams.get("category");
  if (categoryParam) {
    const filteredGames = games.filter((game) =>
      game.category.toLowerCase().includes(categoryParam.toLowerCase()),
    );
    renderGames(filteredGames);
    // active chip bộ lọc tương ứng
    const categoryChip = document.querySelectorAll(
      '[data-filter-type="category"] .filter-chip',
    );
    categoryChip.forEach((chip) => {
      if (
        categoryParam.toLowerCase().includes(chip.dataset.value.toLowerCase())
      ) {
        chip.classList.add("active");
      }
    });
  } else {
    renderGames(games);
  }
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
        selectedCategories.some((category) =>
          game.category.toLowerCase().includes(category.toLowerCase()),
        );

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
