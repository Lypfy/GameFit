const games = [
  {
    id: 1,
    title: "Genshin Impact",
    category: "Action / RPG",
    publisher: "HoYoverse",
    rating: 4.8,
    description:
      "An open-world action RPG where players explore the vast world of Teyvat, battle enemies, solve puzzles, and uncover the story of the Seven Nations.",
    image: "../assets/trending1.webp",
    link: "game-detail.html?id=1",
  },

  {
    id: 2,
    title: "Honkai: Star Rail",
    category: "RPG",
    publisher: "HoYoverse",
    rating: 4.7,
    description:
      "A turn-based RPG that takes players on a journey across different worlds aboard the Astral Express to uncover mysterious cosmic secrets.",
    image: "../assets/trending1.webp",
    link: "game-detail.html?id=2",
  },

  {
    id: 3,
    title: "Wuthering Waves",
    category: "Action / RPG",
    publisher: "Kuro Games",
    rating: 4.6,
    description:
      "An open-world action RPG featuring fast-paced combat, powerful characters, and a mysterious post-apocalyptic world waiting to be explored.",
    image: "../assets/trending1.webp",
    link: "game-detail.html?id=3",
  },

  {
    id: 4,
    title: "Counter-Strike 2",
    category: "FPS",
    publisher: "Valve",
    rating: 4.5,
    description:
      "A competitive first-person shooter where two teams battle against each other through tactical gunplay, strategy, and teamwork.",
    image: "../assets/trending1.webp",
    link: "game-detail.html?id=4",
  },

  {
    id: 5,
    title: "Valorant",
    category: "FPS",
    publisher: "Riot Games",
    rating: 4.6,
    description:
      "A tactical 5v5 shooter that combines precise gunplay with unique character abilities, requiring teamwork and strategic thinking.",
    image: "../assets/trending1.webp",
    link: "game-detail.html?id=5",
  },

  {
    id: 6,
    title: "League of Legends",
    category: "MOBA",
    publisher: "Riot Games",
    rating: 4.8,
    description:
      "A popular multiplayer online battle arena game where two teams of champions compete to destroy the enemy team's base.",
    image: "../assets/trending1.webp",
    link: "game-detail.html?id=6",
  },

  {
    id: 7,
    title: "Minecraft",
    category: "Sandbox / Survival",
    publisher: "Mojang Studios",
    rating: 4.9,
    description:
      "A sandbox game that lets players explore, gather resources, build structures, craft items, and survive in a procedurally generated world.",
    image: "../assets/trending1.webp",
    link: "game-detail.html?id=7",
  },

  {
    id: 8,
    title: "Grand Theft Auto V",
    category: "Action / Open World",
    publisher: "Rockstar Games",
    rating: 4.8,
    description:
      "An open-world action game set in Los Santos, featuring an expansive story, diverse activities, and a large multiplayer experience.",
    image: "../assets/trending1.webp",
    link: "game-detail.html?id=8",
  },

  {
    id: 9,
    title: "Cyberpunk 2077",
    category: "Action / RPG",
    publisher: "CD Projekt",
    rating: 4.5,
    description:
      "A futuristic open-world RPG set in Night City, where players take on the role of V and experience a story filled with technology, crime, and difficult choices.",
    image: "../assets/trending1.webp",
    link: "game-detail.html?id=9",
  },

  {
    id: 10,
    title: "Elden Ring",
    category: "Action / RPG",
    publisher: "Bandai Namco Entertainment",
    rating: 4.9,
    description:
      "A challenging action RPG set in a vast fantasy world filled with powerful enemies, mysterious locations, exploration, and deep character customization.",
    image: "../assets/trending1.webp",
    link: "game-detail.html?id=10",
  },

  {
    id: 11,
    title: "Red Dead Redemption 2",
    category: "Action / Adventure",
    publisher: "Rockstar Games",
    rating: 4.9,
    description:
      "An open-world western adventure following Arthur Morgan and the Van der Linde gang as they struggle to survive in a changing America.",
    image: "../assets/trending1.webp",
    link: "game-detail.html?id=11",
  },

  {
    id: 12,
    title: "Hogwarts Legacy",
    category: "Action / RPG",
    publisher: "Warner Bros. Games",
    rating: 4.6,
    description:
      "An open-world action RPG set in the wizarding world where players attend Hogwarts, learn magic, explore the surrounding world, and uncover ancient secrets.",
    image: "../assets/trending1.webp",
    link: "game-detail.html?id=12",
  },

  {
    id: 13,
    title: "The Witcher 3",
    category: "Action / RPG",
    publisher: "CD Projekt",
    rating: 4.9,
    description:
      "A story-driven open-world RPG following Geralt of Rivia as he searches for Ciri while facing monsters, political conflicts, and difficult choices.",
    image: "../assets/trending1.webp",
    link: "game-detail.html?id=13",
  },

  {
    id: 14,
    title: "Apex Legends",
    category: "FPS / Battle Royale",
    publisher: "Electronic Arts",
    rating: 4.5,
    description:
      "A fast-paced battle royale shooter where teams of Legends compete using unique abilities, weapons, and tactical strategies to become the last squad standing.",
    image: "../assets/trending1.webp",
    link: "game-detail.html?id=14",
  },

  {
    id: 15,
    title: "Naraka: Bladepoint",
    category: "Action / Battle Royale",
    publisher: "NetEase Games",
    rating: 4.4,
    description:
      "A melee-focused battle royale game featuring fast movement, grappling hooks, powerful weapons, and intense close-quarters combat.",
    image: "../assets/trending1.webp",
    link: "game-detail.html?id=15",
  },
];
const requirements = [
  {
    gameId: 1,
    minimum: {
      os: "Windows 10 64-bit",
      cpu: "Intel Core i5",
      ram: "8 GB",
      gpu: "NVIDIA GeForce GT 1030",
      storage: "110 GB",
    },
    recommended: {
      os: "Windows 10/11 64-bit",
      cpu: "Intel Core i7",
      ram: "16 GB",
      gpu: "NVIDIA GeForce GTX 1060",
      storage: "110 GB",
    },
  },

  {
    gameId: 2,
    minimum: {
      os: "Windows 10 64-bit",
      cpu: "Intel Core i5",
      ram: "8 GB",
      gpu: "NVIDIA GeForce GTX 1050",
      storage: "20 GB",
    },
    recommended: {
      os: "Windows 10/11 64-bit",
      cpu: "Intel Core i7",
      ram: "16 GB",
      gpu: "NVIDIA GeForce GTX 1060",
      storage: "20 GB",
    },
  },

  {
    gameId: 3,
    minimum: {
      os: "Windows 10 64-bit",
      cpu: "Intel Core i5-8400",
      ram: "16 GB",
      gpu: "NVIDIA GeForce GTX 1060",
      storage: "30 GB",
    },
    recommended: {
      os: "Windows 10/11 64-bit",
      cpu: "Intel Core i7-8700",
      ram: "32 GB",
      gpu: "NVIDIA GeForce RTX 2060",
      storage: "30 GB",
    },
  },

  {
    gameId: 4,
    minimum: {
      os: "Windows 10 64-bit",
      cpu: "Intel Core i3-12100",
      ram: "8 GB",
      gpu: "NVIDIA GeForce GTX 1650",
      storage: "85 GB",
    },
    recommended: {
      os: "Windows 10/11 64-bit",
      cpu: "Intel Core i5-12400",
      ram: "16 GB",
      gpu: "NVIDIA GeForce RTX 3060",
      storage: "85 GB",
    },
  },

  {
    gameId: 5,
    minimum: {
      os: "Windows 10 64-bit",
      cpu: "Intel Core 2 Duo E8400",
      ram: "4 GB",
      gpu: "Intel HD 4000",
      storage: "30 GB",
    },
    recommended: {
      os: "Windows 10/11 64-bit",
      cpu: "Intel Core i3-4150",
      ram: "8 GB",
      gpu: "NVIDIA GeForce GT 730",
      storage: "30 GB",
    },
  },

  {
    gameId: 6,
    minimum: {
      os: "Windows 10 64-bit",
      cpu: "Intel Core i3-530",
      ram: "4 GB",
      gpu: "NVIDIA GeForce GTX 960",
      storage: "16 GB",
    },
    recommended: {
      os: "Windows 10/11 64-bit",
      cpu: "Intel Core i5-3300",
      ram: "8 GB",
      gpu: "NVIDIA GeForce GTX 1060",
      storage: "16 GB",
    },
  },
];
function renderGames(games) {
  const gamesContent = document.querySelector(".games-content");
  if (!gamesContent) return;

  gamesContent.innerHTML = games
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
  renderGames(games);
  //   Lọc game
  const btnApplyFilter = document.getElementById("btn-apply-filter");
  btnApplyFilter?.addEventListener("click", function () {
    const ActiveChips = document.querySelectorAll(".filter-chip.active");
    const selectedCategories = [];
    const selectedPublishers = [];
    const selectedRams = [];
    // Chia nhóm
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
