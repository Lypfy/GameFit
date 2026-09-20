/**
 * Home page main initialization & data rendering.
 */
const popularGames = [
  {
    id: 1,
    title: "Genshin Impact",
    category: "Action / RPG",
    rating: 4.8,
    image: "../assets/trending1.webp",
    link: "game-detail.html?id=1",
  },
  {
    id: 2,
    title: "Cyberpunk 2077",
    category: "Sci-Fi / RPG",
    rating: 4.6,
    image: "../assets/trending1.webp",
    link: "game-detail.html?id=2",
  },
  {
    id: 3,
    title: "Elden Ring",
    category: "Souls-like",
    rating: 4.9,
    image: "../assets/trending1.webp",
    link: "game-detail.html?id=3",
  },
  {
    id: 4,
    title: "God of War",
    category: "Adventure",
    rating: 4.9,
    image: "../assets/trending1.webp",
    link: "game-detail.html?id=4",
  },
  {
    id: 5,
    title: "Valorant",
    category: "FPS / Tactical",
    rating: 4.5,
    image: "../assets/trending1.webp",
    link: "game-detail.html?id=5",
  },
  {
    id: 6,
    title: "GTA V",
    category: "Open World",
    rating: 4.7,
    image: "../assets/trending1.webp",
    link: "game-detail.html?id=6",
  },
];

const newGames = [
  {
    id: 1,
    title: "Black Myth: Wukong",
    category: "Action / RPG",
    rating: 4.9,
    image: "../assets/trending1.webp",
    link: "game-detail.html?id=101",
  },
  {
    id: 2,
    title: "Helldivers 2",
    category: "Shooter / Co-op",
    rating: 4.7,
    image: "../assets/trending1.webp",
    link: "game-detail.html?id=102",
  },
  {
    id: 3,
    title: "Palworld",
    category: "Survival / Crafting",
    rating: 4.6,
    image: "../assets/trending1.webp",
    link: "game-detail.html?id=103",
  },
  {
    id: 4,
    title: "Tekken 8",
    category: "Fighting",
    rating: 4.8,
    image: "../assets/trending1.webp",
    link: "game-detail.html?id=104",
  },
  {
    id: 5,
    title: "FF VII Rebirth",
    category: "RPG",
    rating: 4.9,
    image: "../assets/trending1.webp",
    link: "game-detail.html?id=105",
  },
  {
    id: 6,
    title: "Dragon's Dogma 2",
    category: "Action RPG",
    rating: 4.5,
    image: "../assets/trending1.webp",
    link: "game-detail.html?id=106",
  },
];

function renderPopularGames(games) {
  const swiperWrapper = document.querySelector(".popular-content .swiper-wrapper");
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
  `
    )
    .join("");
}

function renderNewGames(games) {
  const newContent = document.querySelector(".new-content");
  if (!newContent) return;

  newContent.innerHTML = games
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
  `
    )
    .join("");
}

document.addEventListener("DOMContentLoaded", function () {
  renderPopularGames(popularGames);
  renderNewGames(newGames);

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
