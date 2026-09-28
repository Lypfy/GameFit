document.addEventListener("DOMContentLoaded", async function () {
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

    if (result.success && result.data && result.data.length > 0) {
      renderGameDetails(result.data);
      
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

  function renderGameDetails(data) {
    const gameInfo = data[0];

    // Cập nhật tiêu đề trang
    document.title = `Game Fit - ${gameInfo.name || 'Chi tiết Game'}`;

    // Cập nhật Banner
    document.getElementById("gd-title").textContent = gameInfo.name;
    document.getElementById("gd-subtitle").textContent = `A downloadable ${gameInfo.platform || 'PC'} Game`;

    // Cập nhật Top Section (Mua / Tải)
    document.getElementById("gd-cover-img").src = gameInfo.image || '../assets/default-game.png';
    document.getElementById("gd-download-btn").href = gameInfo.download_url || '#';
    document.getElementById("gd-dev-name").textContent = gameInfo.developer || 'Đang cập nhật';
    document.getElementById("gd-pub-name").textContent = gameInfo.publisher || 'Đang cập nhật';
    document.getElementById("gd-platform").innerHTML = `<i class='bx bx-laptop'></i> ${gameInfo.platform || 'PC'}`;
    
    const releaseDateStr = gameInfo.release_date ? new Date(gameInfo.release_date).toLocaleDateString('vi-VN') : 'Đang cập nhật';
    document.getElementById("gd-release-date").textContent = releaseDateStr;

    // Cập nhật Mô tả
    document.getElementById("gd-desc-text").textContent = gameInfo.description || 'Chưa có mô tả cho trò chơi này.';

    // Xử lý Yêu cầu hệ thống (Gom nhóm từ nhiều dòng LEFT JOIN)
    const requirements = data.filter(row => row.requirement_id).map(row => ({
      type: row.type,
      os: row.os,
      ram: row.ram,
      storage: row.storage,
      cpu_id: row.cpu_id, 
      gpu_id: row.gpu_id
    }));

    const reqListEl = document.getElementById("gd-requirements-list");
    
    if (requirements.length > 0) {
      reqListEl.innerHTML = requirements.map(req => `
        <div class="req-card">
          <h4>${req.type} Requirements</h4>
          <ul>
            <li><strong>OS:</strong> <span>${req.os || 'N/A'}</span></li>
            <li><strong>CPU (ID):</strong> <span>${req.cpu_id || 'N/A'}</span></li>
            <li><strong>GPU (ID):</strong> <span>${req.gpu_id || 'N/A'}</span></li>
            <li><strong>RAM:</strong> <span>${req.ram || 'N/A'}</span></li>
            <li><strong>Storage:</strong> <span>${req.storage || 'N/A'}</span></li>
          </ul>
        </div>
      `).join('');
    } else {
      reqListEl.innerHTML = `<p style="color: #94a3b8; font-style: italic;">Chưa có thông tin cấu hình cho trò chơi này.</p>`;
    }
  }
});
