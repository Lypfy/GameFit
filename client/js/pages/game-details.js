let currentUser = null;
let savedWishlistGameIds = new Set();

async function fetchUserWishlist() {
  if (!currentUser) return;
  try {
    const response = await fetch(
      `http://localhost:5000/api/wishlist/${currentUser.user_id}`,
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

document.addEventListener("DOMContentLoaded", async function () {
  currentUser = typeof getCurrentUser === "function" ? getCurrentUser() : null;
  await fetchUserWishlist();
  // Lấy ID game từ URL (vd: game-details.html?id=1)
  const urlParams = new URLSearchParams(window.location.search);
  const gameId = urlParams.get("id");

  const loadingState = document.getElementById("loading-state");
  const errorState = document.getElementById("error-state");
  const contentState = document.getElementById("game-content-state");
  const errorMessage = document.getElementById("error-message");

  if (!gameId) {
    showError("Không có ID game được cung cấp!");
    return;
  }

  try {
    const response = await fetch(`http://localhost:5000/api/games/${gameId}`);
    const result = await response.json();

    const reqResponse = await fetch(
      `http://localhost:5000/api/games/${gameId}/game_requirement`,
    );
    const reqResult = await reqResponse.json();

    if (result.success && result.data && result.data.length > 0) {
      renderGameDetails(result.data, reqResult.success ? reqResult.data : []);

      // Ẩn loading, hiện content
      loadingState.style.display = "none";
      contentState.style.display = "block";
    } else {
      showError(result.message || "Không tìm thấy thông tin game!");
    }
  } catch (error) {
    console.error("Lỗi khi fetch game detail:", error);
    showError("Có lỗi xảy ra khi tải dữ liệu từ máy chủ!");
  }

  function showError(msg) {
    loadingState.style.display = "none";
    contentState.style.display = "none";
    errorState.style.display = "block";
    if (errorMessage) errorMessage.textContent = msg;
  }

  function renderGameDetails(data, reqData) {
    const gameInfo = data[0];
    // Xử lý tags
    if (gameInfo.tags && gameInfo.tags.trim() !== "") {
      const allTags = gameInfo.tags
        .split(", ")
        .map((t) => t.trim())
        .filter(Boolean);
      const tagsContainer = document.getElementById("gd-tags-container");
      if (tagsContainer) {
        tagsContainer.innerHTML = allTags
          .map((tag) => `<span class="detail-tag-badge">${tag}</span>`)
          .join("");
      }
    }
    // Cập nhật tiêu đề trang
    document.title = `Game Fit - ${gameInfo.name || "Chi tiết Game"}`;

    // Cập nhật Banner
    document.getElementById("gd-title").textContent = gameInfo.name;
    document.getElementById("gd-subtitle").textContent =
      `A downloadable ${gameInfo.platform || "PC"} Game`;

    // Cập nhật Top Section (Mua / Tải)
    document.getElementById("gd-cover-img").src =
      gameInfo.image || "../assets/default-game.png";
    document.getElementById("gd-download-btn").href =
      gameInfo.download_url || "#";
    document.getElementById("gd-dev-name").textContent =
      gameInfo.developer || "Đang cập nhật";
    document.getElementById("gd-pub-name").textContent =
      gameInfo.publisher || "Đang cập nhật";
    document.getElementById("gd-platform").innerHTML =
      `<i class='bx bx-laptop'></i> ${gameInfo.platform || "PC"}`;

    const releaseDateStr = gameInfo.release_date
      ? new Date(gameInfo.release_date).toLocaleDateString("vi-VN")
      : "Đang cập nhật";
    document.getElementById("gd-release-date").textContent = releaseDateStr;

    // Hiển thị nút Wishlist
    const gameIdStr = gameId.toString();
    const isSaved = savedWishlistGameIds.has(gameIdStr);
    const bookmarkIcon = isSaved
      ? "../assets/yellow_bookmarks.png"
      : "../assets/white_bookmarks.png";
    document.getElementById("gd-wishlist-container").innerHTML = `
      <img src="${bookmarkIcon}" class="wishlist-btn" id="gd-wishlist-btn" data-game-id="${gameIdStr}" style="width: 32px; height: 32px; cursor: pointer; vertical-align: middle; margin-left: 10px;" title="${isSaved ? "Xóa khỏi Wishlist" : "Thêm vào Wishlist"}" />
    `;

    // Cập nhật Mô tả
    document.getElementById("gd-desc-text").textContent =
      gameInfo.description || "Chưa có mô tả cho trò chơi này.";

    // Xử lý Yêu cầu hệ thống (từ API riêng biệt)
    const requirements = reqData.map((row) => ({
      type: row.type,
      os: row.os,
      ram: row.ram,
      storage: row.storage,
      cpu_name: row.cpu_name || "N/A",
      gpu_name: row.gpu_name || "N/A",
    }));

    const reqListEl = document.getElementById("gd-requirements-list");

    if (requirements.length > 0) {
      reqListEl.innerHTML = requirements
        .map(
          (req) => `
        <div class="req-card">
          <h4>${req.type} Requirements</h4>
          <ul>
            <li><strong>OS:</strong> <span>${req.os || "N/A"}</span></li>
            <li><strong>CPU:</strong> <span>${req.cpu_name}</span></li>
            <li><strong>GPU:</strong> <span>${req.gpu_name}</span></li>
            <li><strong>RAM:</strong> <span>${req.ram || "N/A"}</span></li>
            <li><strong>Storage:</strong> <span>${req.storage || "N/A"}</span></li>
          </ul>
        </div>
      `,
        )
        .join("");
    } else {
      reqListEl.innerHTML = `<p style="color: #94a3b8; font-style: italic;">Chưa có thông tin cấu hình cho trò chơi này.</p>`;
    }
  }
});

document.addEventListener("click", async (e) => {
  if (e.target.classList.contains("wishlist-btn")) {
    if (!currentUser) {
      alert("Vui lòng đăng nhập để sử dụng tính năng Wishlist!");
      return;
    }
    const targetGameId = e.target.getAttribute("data-game-id");
    if (!targetGameId) return;

    try {
      const isCurrentlySaved = savedWishlistGameIds.has(targetGameId);
      const method = isCurrentlySaved ? "DELETE" : "POST";
      const url = `http://localhost:5000/api/wishlist/${currentUser.user_id}`;
      const response = await fetch(url, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ game_id: parseInt(targetGameId) }),
      });
      const result = await response.json();
      if (result.success) {
        if (isCurrentlySaved) {
          savedWishlistGameIds.delete(targetGameId);
          e.target.src = "../assets/white_bookmarks.png";
          e.target.title = "Thêm vào Wishlist";
        } else {
          savedWishlistGameIds.add(targetGameId);
          e.target.src = "../assets/yellow_bookmarks.png";
          e.target.title = "Xóa khỏi Wishlist";
        }
      } else {
        alert(result.message || "Không thể cập nhật Wishlist!");
      }
    } catch (error) {
      console.error("Lỗi cập nhật wishlist:", error);
      alert("Có lỗi xảy ra khi cập nhật Wishlist!");
    }
  }
});
