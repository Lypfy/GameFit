let allGamesList = [];
let selectedGameObj = null;

document.addEventListener("DOMContentLoaded", function () {
  initActions();
  initGameSelector();
  loadSavedUserConfigs();
  initSavePcModal();

  const form = document.getElementById("pc-check-form");
  if (form) {
    form.addEventListener("submit", handleCheckCompatibility);
  }
});

// Quản lý các nút hành động (Bật/tắt bộ cấu hình đã lưu)
function initActions() {
  const btnToggleSaved = document.getElementById("btn-toggle-saved-pc");
  const savedWrapper = document.getElementById("saved-pc-wrapper");

  if (btnToggleSaved && savedWrapper) {
    btnToggleSaved.addEventListener("click", () => {
      if (
        savedWrapper.style.display === "none" ||
        !savedWrapper.style.display
      ) {
        savedWrapper.style.display = "block";
      } else {
        savedWrapper.style.display = "none";
      }
    });
  }
}

// Xử lý Modal Lưu Bộ Cấu Hình Máy Tính
function initSavePcModal() {
  const btnSavePc = document.getElementById("btn-save-pc-config");
  const saveModal = document.getElementById("save-pc-modal");
  const closeBtn = document.getElementById("close-save-pc-modal");
  const cancelBtn = document.getElementById("cancel-save-pc-btn");
  const saveForm = document.getElementById("save-pc-name-form");

  function hideSaveModal() {
    if (saveModal) saveModal.classList.remove("active");
  }

  if (closeBtn) closeBtn.addEventListener("click", hideSaveModal);
  if (cancelBtn) cancelBtn.addEventListener("click", hideSaveModal);

  if (btnSavePc) {
    btnSavePc.addEventListener("click", () => {
      const user =
        typeof getCurrentUser === "function" ? getCurrentUser() : null;
      if (!user) {
        if (typeof showToast === "function") {
          showToast("Vui lòng đăng nhập để lưu bộ cấu hình!", "error");
        } else {
          alert("Vui lòng đăng nhập để lưu bộ cấu hình!");
        }
        return;
      }

      const ram = document.getElementById("check-pc-ram").value;
      const cpu = document.getElementById("check-pc-cpu").value;
      const gpu = document.getElementById("check-pc-gpu").value;

      if (
        !ram ||
        (!cpu &&
          !document.querySelector('[data-hw-type="cpu"] .hw-combobox-text')
            ?.value)
      ) {
        if (typeof showToast === "function") {
          showToast("Vui lòng nhập CPU, GPU và RAM trước khi lưu!", "error");
        } else {
          alert("Vui lòng nhập CPU, GPU và RAM!");
        }
        return;
      }

      const nameInput = document.getElementById("save-pc-name-input");
      if (nameInput) nameInput.value = "";
      if (saveModal) saveModal.classList.add("active");
    });
  }

  if (saveForm) {
    saveForm.addEventListener("submit", async function (e) {
      e.preventDefault();
      const user =
        typeof getCurrentUser === "function" ? getCurrentUser() : null;
      if (!user) return;

      const pcName = document.getElementById("save-pc-name-input").value;
      const ram = document.getElementById("check-pc-ram").value;
      const os =
        document.getElementById("check-pc-os").value || "Windows 10/11";
      const storage =
        document.getElementById("check-pc-storage").value || "512";
      const cpuId = document.getElementById("check-pc-cpu").value;
      const gpuId = document.getElementById("check-pc-gpu").value;

      const token = (typeof getAuthToken === "function" ? getAuthToken() : null) || localStorage.getItem("token");

      try {
        const response = await fetch("/api/computer-config", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            user_id: user.user_id,
            pc_name: pcName,
            cpu_id: cpuId,
            gpu_id: gpuId,
            ram: ram,
            os: os,
            storage: storage,
          }),
        });

        const result = await response.json();
        if (result.success) {
          if (typeof showToast === "function") {
            showToast("Đã lưu bộ cấu hình máy tính thành công!", "success");
          } else {
            alert("Đã lưu bộ cấu hình thành công!");
          }
          hideSaveModal();
          loadSavedUserConfigs();
        } else {
          if (typeof showToast === "function") {
            showToast("Lỗi lưu cấu hình: " + (result.message || ""), "error");
          } else {
            alert("Lỗi lưu cấu hình: " + (result.message || "Thất bại"));
          }
        }
      } catch (err) {
        console.error("Lỗi API save computer config:", err);
        if (typeof showToast === "function") {
          showToast("Lỗi hệ thống khi lưu cấu hình!", "error");
        } else {
          alert("Lỗi hệ thống khi lưu cấu hình!");
        }
      }
    });
  }
}

// Bơm danh sách Game và xử lý tìm kiếm & chọn Game Card
async function initGameSelector() {
  const frame = document.getElementById("game-selector-frame");
  const searchInput = document.getElementById("game-search-input");
  if (!frame) return;

  try {
    const res = await fetch("/api/games?limit=1000");
    const result = await res.json();
    if (result.success && Array.isArray(result.data)) {
      allGamesList = result.data;
    } else if (typeof gamesData !== "undefined") {
      allGamesList = gamesData;
    }
  } catch (err) {
    if (typeof gamesData !== "undefined") {
      allGamesList = gamesData;
    }
  }

  const urlParams = new URLSearchParams(window.location.search);
  const targetGameId = urlParams.get("game_id");

  if (targetGameId) {
    const targetGame = allGamesList.find(g => (g.game_id || g.id).toString() === targetGameId);
    if (targetGame) {
      allGamesList = [targetGame, ...allGamesList.filter(g => g !== targetGame)];
    }
  }

  renderGameCards(allGamesList, false);

  if (targetGameId) {
    const targetCard = frame.querySelector(`.game-select-card[data-game-id="${targetGameId}"]`);
    if (targetCard) {
      targetCard.click();
    }
  }

  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      const q = e.target.value.toLowerCase().trim();
      if (q === "") {
        renderGameCards(allGamesList, false);
      } else {
        const filtered = allGamesList.filter((g) => {
          const title = (g.name || g.title || "").toLowerCase();
          return title.includes(q);
        });
        renderGameCards(filtered, true);
      }
    });
  }
}

function renderGameCards(games, isSearching = false) {
  const frame = document.getElementById("game-selector-frame");
  if (!frame) return;

  if (!games || games.length === 0) {
    frame.innerHTML = `<p style="grid-column: 1/-1; color: var(--text-muted); text-align: center; padding: 20px;">Không tìm thấy game nào.</p>`;
    return;
  }

  // Mặc định ban đầu chỉ hiển thị 20 game đầu tiên; Khi gõ từ khóa tìm kiếm sẽ duyệt toàn bộ DB
  const displayGames = isSearching ? games : games.slice(0, 20);

  frame.innerHTML = displayGames
    .map((g) => {
      const gameId = g.game_id || g.id;
      const title = g.name || g.title;
      const img = g.image || "../assets/default-game.png";

      return `
      <div class="game-select-card" data-game-id="${gameId}">
        <div class="selected-check"><i class="bx bx-check"></i></div>
        <img src="${img}" alt="${title}" loading="lazy" />
        <div class="game-title-overlay">
          <h4>${title}</h4>
        </div>
      </div>
    `;
    })
    .join("");

  frame.querySelectorAll(".game-select-card").forEach((card) => {
    card.addEventListener("click", function () {
      frame
        .querySelectorAll(".game-select-card")
        .forEach((c) => c.classList.remove("selected"));
      this.classList.add("selected");

      const gameId = this.getAttribute("data-game-id");
      selectedGameObj = allGamesList.find(
        (g) => (g.game_id || g.id).toString() === gameId.toString(),
      );

      document.getElementById("selected-game-id").value = gameId;
      const label = document.getElementById("selected-game-label");
      if (label && selectedGameObj) {
        label.textContent = `Đã chọn: ${selectedGameObj.name || selectedGameObj.title}`;
        label.style.color = "var(--main-color)";
      }
    });
  });
}

// Nạp danh sách máy tính đã lưu của User & Tự động điền dữ liệu khi chọn
async function loadSavedUserConfigs() {
  const user = typeof getCurrentUser === "function" ? getCurrentUser() : null;
  const select = document.getElementById("select-saved-pc");
  if (!user || !select) return;

  try {
    const token = localStorage.getItem("token");
    const res = await fetch(`/api/computer-config`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      }
    });
    const result = await res.json();
    if (result.success && Array.isArray(result.data)) {
      select.innerHTML = `<option value="">-- Chọn cấu hình máy tính của bạn --</option>`;
      result.data.forEach((pc) => {
        const opt = document.createElement("option");
        opt.value = pc.id || pc.pc_id;
        opt.textContent = `${pc.pc_name || "PC"} (CPU: ${pc.cpu_name || pc.cpu || "N/A"}, GPU: ${pc.gpu_name || pc.gpu || "N/A"}, RAM: ${pc.ram}GB)`;
        opt.dataset.cpuName = pc.cpu_name || pc.cpu || "";
        opt.dataset.cpuId = pc.cpu_id || "";
        opt.dataset.gpuName = pc.gpu_name || pc.gpu || "";
        opt.dataset.gpuId = pc.gpu_id || "";
        opt.dataset.ram = pc.ram || "";
        opt.dataset.os = pc.os || "";
        opt.dataset.storage = pc.storage || "";
        select.appendChild(opt);
      });

      select.onchange = function () {
        const selectedOpt = this.options[this.selectedIndex];
        if (selectedOpt && selectedOpt.value) {
          if (selectedOpt.dataset.cpuName) {
            const cpuInput = document.querySelector(
              '[data-hw-type="cpu"] .hw-combobox-text',
            );
            if (cpuInput) cpuInput.value = selectedOpt.dataset.cpuName;
            const cpuHidden = document.getElementById("check-pc-cpu");
            if (cpuHidden)
              cpuHidden.value =
                selectedOpt.dataset.cpuId || selectedOpt.dataset.cpuName;
          }
          if (selectedOpt.dataset.gpuName) {
            const gpuInput = document.querySelector(
              '[data-hw-type="gpu"] .hw-combobox-text',
            );
            if (gpuInput) gpuInput.value = selectedOpt.dataset.gpuName;
            const gpuHidden = document.getElementById("check-pc-gpu");
            if (gpuHidden)
              gpuHidden.value =
                selectedOpt.dataset.gpuId || selectedOpt.dataset.gpuName;
          }
          if (selectedOpt.dataset.ram)
            document.getElementById("check-pc-ram").value =
              selectedOpt.dataset.ram;
          if (selectedOpt.dataset.os)
            document.getElementById("check-pc-os").value =
              selectedOpt.dataset.os;
          if (selectedOpt.dataset.storage)
            document.getElementById("check-pc-storage").value =
              selectedOpt.dataset.storage;

          if (typeof showToast === "function") {
            showToast("Đã tải thông số máy tính được chọn!", "info");
          }
        }
      };
    }
  } catch (err) {
    console.error("Lỗi nạp PC đã lưu:", err);
  }
}

// Xử lý gửi form Kiểm Tra Cấu Hình
async function handleCheckCompatibility(e) {
  e.preventDefault();

  const gameId = document.getElementById("selected-game-id").value;
  const ram = document.getElementById("check-pc-ram").value;
  const cpuText =
    document.querySelector('[data-hw-type="cpu"] .hw-combobox-text')?.value ||
    "Intel Core i5";
  const gpuText =
    document.querySelector('[data-hw-type="gpu"] .hw-combobox-text')?.value ||
    "NVIDIA GTX 1060";
  const os =
    document.getElementById("check-pc-os").value || "Windows 10 64-bit";
  const storage = document.getElementById("check-pc-storage").value || "100";

  if (!gameId || !selectedGameObj) {
    if (typeof showToast === "function") {
      showToast("Vui lòng chọn 1 tựa game từ danh sách bên dưới!", "error");
    } else {
      alert("Vui lòng chọn 1 tựa game!");
    }
    return;
  }

  if (!ram) {
    if (typeof showToast === "function") {
      showToast("Vui lòng nhập dung lượng RAM!", "error");
    } else {
      alert("Vui lòng nhập dung lượng RAM!");
    }
    return;
  }

  // 1. Cập nhật thông tin Game ở bên Trái (Flex Row)
  document.getElementById("res-game-poster").src =
    selectedGameObj.image || "../assets/default-game.png";
  document.getElementById("res-game-title").textContent =
    selectedGameObj.name || selectedGameObj.title;
  document.getElementById("res-game-dev").textContent =
    selectedGameObj.developer || "Đang cập nhật";
  document.getElementById("res-game-pub").textContent =
    selectedGameObj.publisher || "Đang cập nhật";
  document.getElementById("res-game-cat").textContent =
    selectedGameObj.category || selectedGameObj.platform || "PC Game";

  // Cập nhật Cột 4: Cấu hình của bạn
  document.getElementById("my-cpu-val").textContent = cpuText;
  document.getElementById("my-gpu-val").textContent = gpuText;
  document.getElementById("my-ram-val").textContent = `${ram} GB`;
  document.getElementById("my-os-val").textContent = os;
  document.getElementById("my-storage-val").textContent = `${storage} GB`;

  // 2. Thử fetch yêu cầu hệ thống tối thiểu & khuyến nghị từ API (nếu có)
  let minReqObj = null;
  let recReqObj = null;

  try {
    const reqRes = await fetch(`/api/games/${gameId}/game_requirement`);
    const reqData = await reqRes.json();
    if (reqData.success && Array.isArray(reqData.data)) {
      minReqObj =
        reqData.data.find((r) =>
          (r.requirement_type || r.type || "").toLowerCase().includes("min"),
        ) || reqData.data[0];
      recReqObj =
        reqData.data.find((r) =>
          (r.requirement_type || r.type || "").toLowerCase().includes("rec"),
        ) ||
        reqData.data[1] ||
        reqData.data[0];

      if (minReqObj) {
        document.getElementById("req-min-os").textContent =
          minReqObj.os || "Windows 10 64-bit";
        document.getElementById("req-min-cpu").textContent =
          minReqObj.cpu_name || minReqObj.cpu || "Intel Core i5-8400";
        document.getElementById("req-min-gpu").textContent =
          minReqObj.gpu_name || minReqObj.gpu || "GTX 1060 6GB";
        document.getElementById("req-min-ram").textContent = minReqObj.ram
          ? `${minReqObj.ram} GB`
          : "8 GB";
        document.getElementById("req-min-storage").textContent = minReqObj.storage
          ? `${minReqObj.storage} GB`
          : "50 GB";
      }

      if (recReqObj) {
        document.getElementById("req-rec-os").textContent =
          recReqObj.os || "Windows 11 64-bit";
        document.getElementById("req-rec-cpu").textContent =
          recReqObj.cpu_name || recReqObj.cpu || "Intel Core i7-10700K";
        document.getElementById("req-rec-gpu").textContent =
          recReqObj.gpu_name || recReqObj.gpu || "RTX 3060 12GB";
        document.getElementById("req-rec-ram").textContent = recReqObj.ram
          ? `${recReqObj.ram} GB`
          : "16 GB";
        document.getElementById("req-rec-storage").textContent = recReqObj.storage
          ? `${recReqObj.storage} GB`
          : "70 GB SSD";
      }
    }
  } catch (err) {
    console.log("Dùng fallback spec:", err);
  }

  // 3. Tính toán điểm phần trăm (%) tương thích dựa theo fn_GetCompatibilityPercent
  let score = null;

  try {
    const compRes = await fetch("/api/games/compatibility-percent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        game_id: gameId,
        cpu_name: cpuText,
        gpu_name: gpuText,
        ram: parseInt(ram) || 0,
        storage: parseInt(storage) || 0,
        os: os
      })
    });
    const compData = await compRes.json();
    if (compData.success && compData.percent !== null && compData.percent !== undefined) {
      score = Math.round(compData.percent);
    }
  } catch (err) {
    console.log("Lỗi gọi API compatibility-percent:", err);
  }

  // Nếu API chưa tính được (DB chưa tạo function hoặc offline), tự động tính bằng JS tương đương SQL fn_GetCompatibilityPercent
  if (score === null || isNaN(score)) {
    score = calculateCompatibilityPercentJS(
      { cpuText, gpuText, ram: parseInt(ram) || 0, storage: parseInt(storage) || 0, os },
      minReqObj,
      recReqObj
    );
  }

  // Cập nhật Biểu đồ tròn, Badge & Nhận xét chi tiết
  const chartDonut = document.getElementById("res-circle-chart");
  const chartNumber = document.getElementById("res-percent-number");
  const statusBadge = document.getElementById("res-status-badge");
  const commentsList = document.getElementById("res-comments-list");

  if (chartNumber) chartNumber.textContent = `${score}%`;

  const degrees = Math.round((score / 100) * 360);
  let chartColor = "var(--success, #10b981)";

  if (score >= 80) {
    // 1. MÀU XANH: TƯƠNG THÍCH TỐT
    chartColor = "var(--success, #10b981)";
    if (chartDonut) {
      chartDonut.style.background = `conic-gradient(${chartColor} 0deg ${degrees}deg, rgba(255, 255, 255, 0.1) ${degrees}deg 360deg)`;
    }

    if (statusBadge) {
      statusBadge.textContent = "TƯƠNG THÍCH TỐT";
      statusBadge.style.background = "rgba(16, 185, 129, 0.15)";
      statusBadge.style.color = "var(--success, #10b981)";
      statusBadge.style.borderColor = "rgba(16, 185, 129, 0.3)";
    }

    if (commentsList) {
      commentsList.innerHTML = `
        <div class="res-comment-item pass">
          <i class="bx bx-check-circle"></i>
          <span>CPU <strong>${cpuText}</strong>, GPU <strong>${gpuText}</strong>, RAM <strong>${ram}GB</strong> của bạn hoàn toàn đáp ứng tốt yêu cầu khuyến nghị.</span>
        </div>
        <div class="res-comment-item pass">
          <i class="bx bx-check-circle"></i>
          <span>Mang lại trải nghiệm chơi game mượt mà ở độ phân giải và thiết lập đồ họa cao (High/Ultra).</span>
        </div>
      `;
    }
  } else if (score >= 60) {
    // 2. MÀU VÀNG: ĐẠT TỐI THIỂU (CÓ THỂ GIẬT LAG Ở CẤU HÌNH CAO)
    chartColor = "#f59e0b";
    if (chartDonut) {
      chartDonut.style.background = `conic-gradient(${chartColor} 0deg ${degrees}deg, rgba(255, 255, 255, 0.1) ${degrees}deg 360deg)`;
    }

    if (statusBadge) {
      statusBadge.textContent = "TƯƠNG THÍCH TỐI THIỂU";
      statusBadge.style.background = "rgba(245, 158, 11, 0.15)";
      statusBadge.style.color = "#f59e0b";
      statusBadge.style.borderColor = "rgba(245, 158, 11, 0.3)";
    }

    if (commentsList) {
      commentsList.innerHTML = `
        <div class="res-comment-item warn">
          <i class="bx bx-error-circle"></i>
          <span>CPU <strong>${cpuText}</strong>, GPU <strong>${gpuText}</strong>, RAM <strong>${ram}GB</strong> của bạn đảm bảo mức tối thiểu nhưng có thể sẽ bị giật lag khi chơi ở thiết lập cấu hình cao.</span>
        </div>
        <div class="res-comment-item warn">
          <i class="bx bx-info-circle"></i>
          <span>Khuyên bạn nên giảm thiết lập đồ họa xuống mức Low/Medium để tốc độ khung hình (FPS) ổn định hơn.</span>
        </div>
      `;
    }
  } else {
    // 3. MÀU ĐỎ: KHÔNG ĐẠT CẤU HÌNH TỐI THIỂU
    chartColor = "var(--danger, #ff4d4f)";
    if (chartDonut) {
      chartDonut.style.background = `conic-gradient(${chartColor} 0deg ${degrees}deg, rgba(255, 255, 255, 0.1) ${degrees}deg 360deg)`;
    }

    if (statusBadge) {
      statusBadge.textContent = "KHÔNG ĐẠT TỐI THIỂU";
      statusBadge.style.background = "rgba(255, 77, 79, 0.15)";
      statusBadge.style.color = "var(--danger, #ff4d4f)";
      statusBadge.style.borderColor = "rgba(255, 77, 79, 0.3)";
    }

    if (commentsList) {
      commentsList.innerHTML = `
        <div class="res-comment-item danger" style="color: var(--danger, #ff4d4f);">
          <i class="bx bx-x-circle"></i>
          <span>Thiết bị của bạn không đáp ứng được cấu hình tối thiểu của trò chơi này.</span>
        </div>
        <div class="res-comment-item warn">
          <i class="bx bx-error-circle"></i>
          <span>Cần nâng cấp CPU, GPU hoặc RAM <strong>${ram}GB</strong> để có thể khởi chạy và chơi game tốt hơn.</span>
        </div>
      `;
    }
  }

  // Hiển thị khung kết quả & cuộn xuống
  const resultSec = document.getElementById("check-result-section");
  if (resultSec) {
    resultSec.style.display = "grid";
    resultSec.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

/**
 * Hàm tính điểm phần trăm tương thích tương đương SQL dbo.fn_GetCompatibilityPercent:
 * Trọng số: CPU (25%), GPU (35%), RAM (20%), Storage (10%), OS (10%)
 */
function calculateCompatibilityPercentJS(userSpec, minReq, recReq) {
  const ram = userSpec.ram || 0;
  const storage = userSpec.storage || 0;

  const minRam = parseInt(minReq?.ram) || 8;
  const recRam = parseInt(recReq?.ram) || 16;

  const minStorage = parseInt(minReq?.storage) || 50;
  const recStorage = parseInt(recReq?.storage) || 100;

  // 1. CPU Score Calculation (Trọng số 25%)
  const userCpuScore = parseBenchmarkScore(userSpec.cpuText);
  const minCpuScore = parseBenchmarkScore(minReq?.cpu_name || minReq?.cpu) || 4000;
  const recCpuScore = parseBenchmarkScore(recReq?.cpu_name || recReq?.cpu) || 8000;

  let cpuPercent = 0;
  if (userCpuScore < minCpuScore) {
    cpuPercent = 0;
  } else if (userCpuScore >= recCpuScore) {
    cpuPercent = 100;
  } else {
    cpuPercent = ((userCpuScore - minCpuScore) * 100.0) / Math.max(1, (recCpuScore - minCpuScore));
  }

  // 2. GPU Score Calculation (Trọng số 35%)
  const userGpuScore = parseBenchmarkScore(userSpec.gpuText);
  const minGpuScore = parseBenchmarkScore(minReq?.gpu_name || minReq?.gpu) || 5000;
  const recGpuScore = parseBenchmarkScore(recReq?.gpu_name || recReq?.gpu) || 12000;

  let gpuPercent = 0;
  if (userGpuScore < minGpuScore) {
    gpuPercent = 0;
  } else if (userGpuScore >= recGpuScore) {
    gpuPercent = 100;
  } else {
    gpuPercent = ((userGpuScore - minGpuScore) * 100.0) / Math.max(1, (recGpuScore - minGpuScore));
  }

  // 3. RAM Percent (Trọng số 20%)
  let ramPercent = 0;
  if (ram < minRam) {
    ramPercent = 0;
  } else if (ram >= recRam) {
    ramPercent = 100;
  } else {
    ramPercent = ((ram - minRam) * 100.0) / Math.max(1, (recRam - minRam));
  }

  // 4. Storage Percent (Trọng số 10%)
  let storagePercent = 0;
  if (storage < minStorage) {
    storagePercent = 0;
  } else if (storage >= recStorage) {
    storagePercent = 100;
  } else {
    storagePercent = ((storage - minStorage) * 100.0) / Math.max(1, (recStorage - minStorage));
  }

  // 5. OS Percent (Trọng số 10%)
  let osPercent = 100;
  if (userSpec.os && minReq?.os) {
    const uOs = userSpec.os.toLowerCase();
    const mOs = minReq.os.toLowerCase();
    if (uOs.includes(mOs) || mOs.includes(uOs) || uOs.includes("win")) {
      osPercent = 100;
    } else {
      osPercent = 50;
    }
  }

  // Tổng điểm có trọng số: CPU*0.25 + GPU*0.35 + RAM*0.20 + Storage*0.10 + OS*0.10
  let totalPercent = (cpuPercent * 0.25) +
    (gpuPercent * 0.35) +
    (ramPercent * 0.20) +
    (storagePercent * 0.10) +
    (osPercent * 0.10);

  if (totalPercent > 100) totalPercent = 100;
  if (totalPercent < 0) totalPercent = 0;

  return Math.round(totalPercent);
}

function parseBenchmarkScore(str) {
  if (!str) return 5000;
  const match = str.match(/(\d+)/g);
  if (match) {
    const nums = match.map(Number).filter(n => n > 100);
    if (nums.length > 0) return Math.max(...nums) * 2;
  }
  return 6000;
}
