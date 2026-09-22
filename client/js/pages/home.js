// 1. Lọc lấy 8 games có rating cao nhất cho phần Popular Games
const popularGames = [...gamesData]
  .sort((a, b) => b.rating - a.rating)
  .slice(0, 8);

// 2. Danh sách các thể loại hiển thị thành từng mục riêng biệt trên trang Home
const categoriesToDisplay = [
  { title: "Action / RPG", filterKey: "Action / RPG", icon: "bx-joystick" },
  { title: "FPS", filterKey: "FPS", icon: "bx-target-lock" },
];

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

/**
 * Hiển thị từng thể loại thành một mục riêng biệt (Section)
 */
function renderCategorySections() {
  const container = document.getElementById("category-sections");
  if (!container) return;

  container.innerHTML = categoriesToDisplay
    .map((cat) => {
      // Lấy danh sách game thuộc thể loại này (lấy tối đa 4 game)
      const games = gamesData
        .filter((game) =>
          game.category.toLowerCase().includes(cat.filterKey.toLowerCase()),
        )
        .slice(0, 4);

      if (games.length === 0) return "";

      const gameCardsHtml = games
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

      return `
        <section class="new container">
          <div class="heading">
            <div class="left-heading">
              <i class="bx ${cat.icon}"></i>
              <h2>${cat.title} Games</h2>
            </div>
            <div class="right-heading">
              <a href="games.html">View All<i class="bx bx-right-arrow-alt"></i></a>
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

document.addEventListener("DOMContentLoaded", function () {
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
});
