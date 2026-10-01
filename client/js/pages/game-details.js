let currentUser = null;
let savedWishlistGameIds = new Set();

const bookmarkSvgIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24"><path d="M0 0h24v24H0z" fill="none"/><path fill="currentColor" d="m12 12.298l1.102.679q.217.137.441-.025t.169-.429l-.306-1.257l.985-.835q.211-.187.124-.439q-.088-.251-.361-.282l-1.277-.106l-.504-1.202Q12.267 8.16 12 8.16t-.373.242l-.504 1.202l-1.277.106q-.273.03-.36.282q-.088.252.124.439l.984.835l-.305 1.257q-.056.268.168.429t.441.025zm0 4.625l-3.738 1.608q-.808.348-1.535-.134Q6 17.916 6 17.052V5.616q0-.691.463-1.153T7.616 4h8.769q.69 0 1.153.463T18 5.616v11.436q0 .864-.727 1.345q-.727.482-1.535.134z"/></svg>`;

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
    const response = await fetch(`http://localhost:5000/api/games/${gameId}/full_detail`);
    const result = await response.json();

    if (result.success && result.data && result.data.info) {
      renderGameDetails([result.data.info], result.data.requirements || []);


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
          .map((tag) => `<a href="games.html?category=${encodeURIComponent(tag)}" class="detail-tag-badge">${tag}</a>`)
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
    document.getElementById("gd-wishlist-container").innerHTML = `
      <button type="button" class="wishlist-btn ${isSaved ? "active" : ""}" id="gd-wishlist-btn" data-game-id="${gameIdStr}" style="position: static; display: inline-flex; vertical-align: middle; margin-left: 14px; width: 36px; height: 36px;" title="${isSaved ? "Xóa khỏi Wishlist" : "Thêm vào Wishlist"}">${bookmarkSvgIcon}</button>
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
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 18px;">
            <h4 style="margin: 0;">${req.type}</h4>
          </div>
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
        .join("") + `
        <div style="grid-column: 1 / -1; display: flex; justify-content: center; margin-top: 20px; width: 100%;">
          <button id="btn-check-config-main" 
                  style="width: 100%; padding: 15px; background-color: transparent; color: #ff4757; border: 1px solid #ff4757; border-radius: 0; cursor: pointer; font-size: 16px; font-weight: 600; display: flex; justify-content: center; align-items: center; gap: 8px; transition: all 0.3s ease; text-transform: uppercase; letter-spacing: 1px;" 
                  onmouseover="this.style.backgroundColor='#ff4757'; this.style.color='#ffffff'" 
                  onmouseout="this.style.backgroundColor='transparent'; this.style.color='#ff4757'">
            <i class='' style="font-size: 20px;"></i> Kiểm tra cấu hình
          </button>
        </div>
      `;
    } else {
      reqListEl.innerHTML = `<p style="color: #94a3b8; font-style: italic;">Chưa có thông tin cấu hình cho trò chơi này.</p>`;
    }
  }
});

document.addEventListener("click", (e) => {
  const btn = e.target.closest("#btn-check-config-main");
  if (btn) {
    const urlParams = new URLSearchParams(window.location.search);
    const gameId = urlParams.get("id");
    if (gameId) {
      window.location.href = `pc_config.html?game_id=${gameId}`;
    }
  }
});

document.addEventListener("click", async (e) => {
  const btn = e.target.closest(".wishlist-btn");
  if (btn) {
    if (!currentUser) {
      alert("Vui lòng đăng nhập để sử dụng tính năng Wishlist!");
      return;
    }
    const targetGameId = btn.getAttribute("data-game-id");
    if (!targetGameId) return;

    try {
      const isCurrentlySaved = savedWishlistGameIds.has(targetGameId);
      const method = isCurrentlySaved ? "DELETE" : "POST";
      const userId = currentUser.id || currentUser.user_id;
      const url = `http://localhost:5000/api/wishlist/${userId}`;
      const response = await fetch(url, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ game_id: parseInt(targetGameId) }),
      });
      const result = await response.json();
      if (result.success) {
        if (isCurrentlySaved) {
          savedWishlistGameIds.delete(targetGameId);
          btn.classList.remove("active");
          btn.title = "Thêm vào Wishlist";
        } else {
          savedWishlistGameIds.add(targetGameId);
          btn.classList.add("active");
          btn.title = "Xóa khỏi Wishlist";
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

// Lắng nghe sự kiện click Mở/Đóng Pop-up Kiểm tra cấu hình
document.addEventListener("click", async (e) => {
  // 1. Mở modal và load dữ liệu
  const checkBtn = e.target.closest(".btn-check-config");
  if (checkBtn) {
    const modal = document.getElementById("check-config-modal");
    const listContainer = document.getElementById("check-config-list");
    modal.classList.add("active");

    // Lấy Tối thiểu hay Đề xuất và lưu vào modal để lát lấy ra dùng
    const reqCard = checkBtn.closest(".req-card");
    const reqTypeRaw = reqCard.querySelector("h4").innerText;
    const reqType = reqTypeRaw.toLowerCase().includes("minimum")
      ? "MINIMUM"
      : "RECOMMENDED";
    modal.dataset.reqType = reqType; // <--- Lưu type vào modal

    const reqItems = reqCard.querySelectorAll("ul li");
    let reqs = {};
    reqItems.forEach((li) => {
      const key = li
        .querySelector("strong")
        .innerText.replace(":", "")
        .trim()
        .toLowerCase();
      const val = li.querySelector("span").innerText.trim();
      reqs[key] = val;
    });

    document.getElementById("cc-game-name").innerText =
      document.getElementById("gd-title").innerText;
    document.getElementById("cc-game-img").src =
      document.getElementById("gd-cover-img").src;

    document.getElementById("cc-req-list").innerHTML = `
      <div class="cc-req-item"><i class="bx bxl-windows"></i><div class="cc-req-info"><span>OS</span><p>${reqs.os || "N/A"}</p></div></div>
      <div class="cc-req-item"><i class="bx bx-chip"></i><div class="cc-req-info"><span>CPU</span><p>${reqs.cpu || "N/A"}</p></div></div>
      <div class="cc-req-item"><i class="bx bx-video"></i><div class="cc-req-info"><span>GPU</span><p>${reqs.gpu || "N/A"}</p></div></div>
      <div class="cc-req-item"><i class="bx bx-memory-card"></i><div class="cc-req-info"><span>RAM</span><p>${reqs.ram ? reqs.ram + (reqs.ram.includes("GB") ? "" : " GB") : "N/A"}</p></div></div>
      <div class="cc-req-item"><i class="bx bx-hdd"></i><div class="cc-req-info"><span>Storage</span><p>${reqs.storage ? reqs.storage + (reqs.storage.includes("GB") ? "" : " GB") : "N/A"}</p></div></div>
    `;

    // --- XỬ LÝ CỘT PHẢI (Danh sách máy của User) ---
    if (!currentUser) {
      listContainer.innerHTML = `<div style="text-align: center; padding: 40px;"><i class="bx bx-error-circle" style="font-size: 40px; color: #ff6b6b;"></i><p>Vui lòng đăng nhập để sử dụng tính năng này!</p></div>`;
      return;
    }
    listContainer.innerHTML = `<div style="text-align: center; padding: 40px;"><i class="bx bx-loader-alt bx-spin" style="font-size: 24px; color: #ff4757;"></i> Đang tải dữ liệu...</div>`;

    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/computer-config", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const result = await response.json();

      if (result.success && result.data && result.data.length > 0) {
        listContainer.innerHTML = result.data
          .map(
            (config) => `
          <div class="cc-pc-card">
            <div class="cc-pc-img">
              <img src="https://cdn-icons-png.flaticon.com/512/3082/3082383.png" alt="PC">
            </div>
            <div class="cc-pc-details">
              <div class="cc-pc-header">
                <div class="cc-pc-title">
                  <h4>${config.pc_name || "Máy tính của tôi"}</h4>
                </div>
              </div>
              <p class="cc-pc-subtitle">PC Gaming - ${config.ram ? config.ram + "GB" : "N/A"} RAM</p>
              
              <div class="cc-pc-specs">
                <div class="cc-spec-item"><i class="bx bxl-windows"></i><div><span>OS</span><p>${config.os || "N/A"}</p></div></div>
                <div class="cc-spec-item"><i class="bx bx-memory-card"></i><div><span>RAM</span><p>${config.ram ? config.ram + "GB" : "N/A"}</p></div></div>
                <div class="cc-spec-item"><i class="bx bx-chip"></i><div><span>CPU</span><p>${config.cpu_name || "N/A"}</p></div></div>
                <div class="cc-spec-item"><i class="bx bx-hdd"></i><div><span>Storage</span><p>${config.storage ? config.storage + "GB SSD" : "N/A"}</p></div></div>
                <div class="cc-spec-item full-width"><i class="bx bx-video"></i><div><span>GPU</span><p>${config.gpu_name || "N/A"}</p></div></div>
              </div>
              
              <div class="cc-pc-action">
                <button class="cc-btn-select" data-pc-id="${config.pc_id}">
                  <i class="bx bx-desktop"></i> Chọn cấu hình này <i class="bx bx-chevron-right"></i>
                </button>
              </div>
            </div>
          </div>
        `,
          )
          .join("");
      } else {
        listContainer.innerHTML = `<div style="text-align: center; padding: 40px;"><i class="bx bx-desktop" style="font-size: 40px; color: #94a3b8;"></i><p>Bạn chưa thêm cấu hình máy tính nào.</p></div>`;
      }
    } catch (error) {
      listContainer.innerHTML = `<p style="text-align: center; color: #ff6b6b;">Lỗi kết nối khi lấy dữ liệu cấu hình.</p>`;
    }
  }

  // 2. Xử lý khi bấm nút "Chọn cấu hình này" để gọi API
  const selectBtn = e.target.closest(".cc-btn-select");
  if (selectBtn) {
    const pcId = selectBtn.getAttribute("data-pc-id");
    const gameId = new URLSearchParams(window.location.search).get("id");
    const reqType =
      document.getElementById("check-config-modal").dataset.reqType ||
      "MINIMUM";

    // Hiệu ứng đang tải (Loading) trên nút
    const originalText = selectBtn.innerHTML;
    selectBtn.innerHTML = `<i class="bx bx-loader-alt bx-spin"></i> Đang phân tích...`;
    selectBtn.disabled = true;

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `/api/games/${gameId}/compatibility?pc_id=${pcId}&type=${reqType}`,
        {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const result = await response.json();

      selectBtn.innerHTML = originalText;
      selectBtn.disabled = false;

      if (result.success) {
        showResultPopup("success", "Tương thích tốt!");
      } else {
        // Truyền thẳng câu báo lỗi (ví dụ: "Cpu không phù hợp") vào popup
        showResultPopup("error", result.message);
      }
    } catch (error) {
      selectBtn.innerHTML = originalText;
      selectBtn.disabled = false;
      showResultPopup(
        "error",
        "Lỗi hệ thống",
        "Lỗi kết nối khi phân tích cấu hình.",
      );
    }
  }

  // 3. Đóng modal
  if (
    e.target.id === "close-check-config-modal" ||
    e.target.id === "check-config-overlay"
  ) {
    document.getElementById("check-config-modal").classList.remove("active");
  }
});

// --- HÀM VẼ POPUP THÔNG BÁO KẾT QUẢ ---
function showResultPopup(type, title, message) {
  const modal = document.getElementById("result-modal");
  const icon = document.getElementById("result-icon");
  const titleEl = document.getElementById("result-title");
  const msgEl = document.getElementById("result-message");

  if (type === "success") {
    icon.innerHTML =
      '<i class="bx bxs-check-circle" style="color: #4ade80;"></i>';
    titleEl.style.color = "#4ade80"; // Màu xanh lá
  } else {
    icon.innerHTML = '<i class="bx bxs-x-circle" style="color: #ff4757;"></i>';
    titleEl.style.color = "#ff4757"; // Màu đỏ
  }

  // Đưa chuỗi vào làm Tiêu đề to đùng ở giữa
  titleEl.innerText = title;

  // Nếu không truyền thông báo phụ thì ẩn hoàn toàn thẻ <p> đi cho gọn
  if (message && message.trim() !== "") {
    msgEl.innerText = message;
    msgEl.style.display = "block";
  } else {
    msgEl.style.display = "none";
  }

  modal.classList.add("active");
}

// Xử lý đóng Popup Thông báo
document.addEventListener("click", (e) => {
  if (
    e.target.id === "close-result-modal" ||
    e.target.id === "result-overlay"
  ) {
    document.getElementById("result-modal").classList.remove("active");
  }
});
