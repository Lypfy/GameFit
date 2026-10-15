/* ==========================================================================
   QUẢN LÝ ĐỀ XUẤT CẤU HÌNH (PC RECOMMENDATIONS MANAGEMENT)
   ========================================================================== */
let allAdminRecommendations = [];
let activeRecSearchTimer = null;
let currentDetailedRec = null;
let currentDetailedGameReqs = [];

function formatRecDate(dateStr) {
  if (!dateStr) return "-";
  if (typeof dateStr === "string" && dateStr.includes("T")) {
    const [datePart, timePart] = dateStr.split("T");
    const [year, month, day] = datePart.split("-");
    const [hours, minutes] = timePart.split(":");
    if (year && month && day && hours && minutes) {
      return `${day.padStart(2, "0")}/${month.padStart(2, "0")}/${year} ${hours.padStart(2, "0")}:${minutes.padStart(2, "0")}`;
    }
  }
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");
  return `${day}/${month}/${year} ${hours}:${minutes}`;
}

async function loadRecommendationsData() {
  const tbody = document.getElementById("recommendations-table-body");
  if (!tbody) return;

  const statusFilter = document.getElementById("rec-status-filter")?.value || "PENDING";
  const typeFilter = document.getElementById("rec-type-filter")?.value || "ALL";
  const search = document.getElementById("rec-search-input")?.value?.trim() || "";

  const token = localStorage.getItem("token");
  if (!token) return;

  try {
    tbody.innerHTML = `<tr><td colspan="6" class="table-empty-row"><i class='bx bx-loader-alt bx-spin'></i> Đang tải danh sách đề xuất cấu hình...</td></tr>`;

    const queryParams = new URLSearchParams();
    if (statusFilter && statusFilter !== "ALL") queryParams.append("status", statusFilter);
    if (typeFilter && typeFilter !== "ALL") queryParams.append("type", typeFilter);
    if (search) queryParams.append("search", search);

    const res = await fetch(`/api/reviews/admin/recommendations?${queryParams.toString()}&_t=${Date.now()}`, {
      headers: {
        "Authorization": `Bearer ${token}`,
        "Cache-Control": "no-cache"
      }
    });

    const result = await res.json();
    if (result.success) {
      allAdminRecommendations = result.data || [];
      renderRecommendationsTable(allAdminRecommendations);
    } else {
      tbody.innerHTML = `<tr><td colspan="6" class="table-empty-row" style="color: #ef4444;">${result.message || "Không thể tải danh sách đề xuất"}</td></tr>`;
    }
  } catch (err) {
    console.error("Lỗi khi load danh sách đề xuất cấu hình:", err);
    tbody.innerHTML = `<tr><td colspan="6" class="table-empty-row" style="color: #ef4444;">Lỗi kết nối máy chủ!</td></tr>`;
  }
}

// Lấy ảnh đầu tiên của game (xử lý cắt chuỗi đối với game có nhiều hình cách nhau bởi khoảng trắng hoặc dấu phẩy)
function getFirstGameImage(imageStr) {
  if (!imageStr || typeof imageStr !== "string") return "../../assets/trending1.webp";
  const trimmed = imageStr.trim();
  const first = trimmed.split(/[,\s]+/)[0]?.trim();
  if (!first) return "../../assets/trending1.webp";
  if (first.startsWith("./")) return "../../" + first.slice(2);
  if (first.startsWith("../assets/")) return "../" + first;
  return first;
}

function renderRecommendationsTable(list) {
  const tbody = document.getElementById("recommendations-table-body");
  if (!tbody) return;

  if (!list || list.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="table-empty-row">Không có đề xuất cấu hình nào phù hợp với bộ lọc</td></tr>`;
    return;
  }

  tbody.innerHTML = list.map((rec) => {
    const recId = rec.recommendation_id;
    const gameImg = getFirstGameImage(rec.game_image);
    const netVotes = rec.net_votes || 0;
    const upvotes = rec.upvotes || 0;
    const downvotes = rec.downvotes || 0;

    // Badge loại cấu hình
    const isMin = rec.type === "MINIMUM";
    const typeBadge = isMin
      ? `<span class="rec-type-badge min"><i class='bx bx-chevron-down'></i> Tối thiểu</span>`
      : `<span class="rec-type-badge rec"><i class='bx bx-star'></i> Khuyến nghị</span>`;

    // Badge vote
    let voteClass = "neutral";
    let voteSign = "";
    if (netVotes > 0) {
      voteClass = "positive";
      voteSign = "+";
    } else if (netVotes < 0) {
      voteClass = "negative";
    }
    const voteBadge = `
      <div class="vote-badge ${voteClass}" title="${upvotes} lượt thích, ${downvotes} lượt không thích">
        <i class='bx ${netVotes >= 0 ? "bxs-like" : "bxs-dislike"}'></i>
        <span>${voteSign}${netVotes}</span>
        <span class="vote-details-hint">(${upvotes}/${downvotes})</span>
      </div>
    `;

    // Badge trạng thái
    let statusBadge = "";
    if (rec.status === "PENDING") {
      statusBadge = `<span class="status-badge pending" data-tooltip="Đang chờ Admin duyệt"><i class='bx bx-time'></i> Chờ duyệt</span>`;
    } else if (rec.status === "APPROVED") {
      statusBadge = `<span class="status-badge approved" data-tooltip="Đang áp dụng làm cấu hình chính thức"><i class='bx bx-check-circle'></i> Đã áp dụng</span>`;
    } else if (rec.status === "REPLACED") {
      statusBadge = `<span class="status-badge replaced" data-tooltip="Đã từng được duyệt, nay có đề xuất mới hơn thay thế"><i class='bx bx-history'></i> Đã thay thế</span>`;
    } else if (rec.status === "REJECTED") {
      statusBadge = `<span class="status-badge rejected" data-tooltip="Đã bị từ chối"><i class='bx bx-x-circle'></i> Đã từ chối</span>`;
    }

    // Các nút thao tác
    const canApprove = rec.status !== "APPROVED";
    const canReject = rec.status !== "REJECTED";

    return `
      <tr data-rec-id="${recId}">
        <td>
          <div class="rec-game-cell">
            <img src="${gameImg}" alt="${rec.game_name || "Game"}" class="rec-game-thumb" onerror="this.onerror=null;this.src='https://placehold.co/100x60/211f34/ffffff?text=Game';" />
            <div class="rec-game-info">
              <span class="rec-game-title">${rec.game_name || "Game #" + rec.game_id}</span>
              <span class="rec-game-id">#GM-${String(rec.game_id).padStart(3, "0")}</span>
            </div>
          </div>
        </td>
        <td>
          <div>
            <strong style="color: #fff;">${rec.reporter_name || "User #" + rec.user_id}</strong>
            <div style="font-size: 0.76rem; color: rgba(255,255,255,0.5);">${formatRecDate(rec.created_at)}</div>
          </div>
        </td>
        <td>${typeBadge}</td>
        <td>${voteBadge}</td>
        <td>${statusBadge}</td>
        <td class="text-center" style="white-space: nowrap;">
          <button type="button" class="btn-action btn-edit btn-rec-detail" data-id="${recId}" title="Xem chi tiết & So sánh cấu hình">
            <i class='bx bx-edit'></i>
          </button>
          ${canApprove ? `
            <button type="button" class="btn-action btn-approve btn-rec-approve" data-id="${recId}" title="Duyệt & Áp dụng">
              <i class='bx bx-check'></i>
            </button>
          ` : `
            <button type="button" class="btn-action" disabled style="opacity: 0.3; cursor: not-allowed;" title="Đã được áp dụng">
              <i class='bx bx-check'></i>
            </button>
          `}
          ${canReject ? `
            <button type="button" class="btn-action btn-reject btn-rec-reject" data-id="${recId}" title="Từ chối đề xuất">
              <i class='bx bx-x'></i>
            </button>
          ` : `
            <button type="button" class="btn-action" disabled style="opacity: 0.3; cursor: not-allowed;" title="Đã từ chối">
              <i class='bx bx-x'></i>
            </button>
          `}
        </td>
      </tr>
    `;
  }).join("");
}

// Mở Modal Chi tiết & So sánh cấu hình
async function openRecommendationDetailModal(recId) {
  const token = localStorage.getItem("token");
  if (!token) return;

  const modal = document.getElementById("modal-recommendation-detail");
  if (!modal) return;

  const metaEl = document.getElementById("rec-detail-meta");
  const gameBodyEl = document.getElementById("compare-game-body");
  const userBodyEl = document.getElementById("compare-user-body");
  const warningEl = document.getElementById("rec-conflict-warning");
  const warningTextEl = document.getElementById("rec-warning-text");
  const noteBoxEl = document.getElementById("rec-user-note-box");
  const noteContentEl = document.getElementById("rec-user-note-content");
  const btnApprove = document.getElementById("btn-modal-trigger-approve");
  const btnReject = document.getElementById("btn-modal-trigger-reject");

  document.getElementById("modal-detail-rec-id").value = recId;

  // Hiển thị trạng thái loading tạm thời
  if (metaEl) metaEl.innerHTML = `<i class='bx bx-loader-alt bx-spin'></i> Đang tải dữ liệu...`;
  if (gameBodyEl) gameBodyEl.innerHTML = "";
  if (userBodyEl) userBodyEl.innerHTML = "";
  if (warningEl) warningEl.style.display = "none";
  if (noteBoxEl) noteBoxEl.style.display = "none";

  modal.classList.add("active");

  try {
    const res = await fetch(`/api/reviews/admin/recommendations/${recId}?_t=${Date.now()}`, {
      headers: {
        "Authorization": `Bearer ${token}`,
        "Cache-Control": "no-cache"
      }
    });

    const result = await res.json();
    if (!result.success || !result.data?.recommendation) {
      if (typeof showToast === "function") showToast("Không tìm thấy thông tin đề xuất!", true);
      closeRecommendationDetailModal();
      return;
    }

    const rec = result.data.recommendation;
    const reqs = result.data.gameRequirements || [];
    currentDetailedRec = rec;
    currentDetailedGameReqs = reqs;

    // 1. Render Meta
    const isMin = rec.type === "MINIMUM";
    const typeLabel = isMin ? "Cấu hình Tối thiểu (MINIMUM)" : "Cấu hình Khuyến nghị (RECOMMENDED)";
    const typeColor = isMin ? "#f59e0b" : "#10b981";

    const modalGameImg = getFirstGameImage(rec.game_image);

    metaEl.innerHTML = `
      <div class="rec-detail-meta-left">
        <img src="${modalGameImg}" alt="${rec.game_name}" onerror="this.onerror=null;this.src='https://placehold.co/100x60/211f34/ffffff?text=Game';" />
        <div>
          <h4 style="margin: 0; color: #fff; font-size: 1.05rem;">${rec.game_name}</h4>
          <span style="font-size: 0.8rem; color: rgba(255,255,255,0.6);">Đề xuất bởi: <strong style="color: #fff;">${rec.user_name}</strong> - ${formatRecDate(rec.created_at)}</span>
        </div>
      </div>
      <div class="rec-detail-meta-right">
        <span style="background: ${typeColor}22; color: ${typeColor}; border: 1px solid ${typeColor}55; padding: 4px 10px; border-radius: 12px; font-size: 0.82rem; font-weight: 700;">
          ${typeLabel}
        </span>
        <span class="vote-badge ${rec.net_votes >= 0 ? "positive" : "negative"}">
          <i class='bx ${rec.net_votes >= 0 ? "bxs-like" : "bxs-dislike"}'></i> Vote: ${rec.net_votes >= 0 ? "+" : ""}${rec.net_votes || 0}
        </span>
      </div>
    `;

    // 2. Tìm cấu hình game hiện tại tương ứng
    const matchingReq = reqs.find((r) => r.type?.toUpperCase() === rec.type?.toUpperCase());
    const oppositeReq = reqs.find((r) => r.type?.toUpperCase() !== rec.type?.toUpperCase());

    // Cột Game hiện tại
    if (matchingReq) {
      gameBodyEl.innerHTML = `
        <div class="rec-spec-item">
          <span class="rec-spec-item-label"><i class='bx bx-chip'></i> CPU</span>
          <div class="rec-spec-item-value">
            <span>${matchingReq.cpu_name || "Chưa thiết lập"}</span>
            <span class="benchmark-pill" title="Điểm benchmark">${matchingReq.cpu_benchmark || 0} pts</span>
          </div>
        </div>
        <div class="rec-spec-item">
          <span class="rec-spec-item-label"><i class='bx bx-microchip'></i> GPU (Card đồ họa)</span>
          <div class="rec-spec-item-value">
            <span>${matchingReq.gpu_name || "Chưa thiết lập"}</span>
            <span class="benchmark-pill" title="Điểm benchmark">${matchingReq.gpu_benchmark || 0} pts</span>
          </div>
        </div>
        <div class="rec-spec-item">
          <span class="rec-spec-item-label"><i class='bx bx-memory-card'></i> RAM</span>
          <div class="rec-spec-item-value"><span>${matchingReq.ram || 0} GB</span></div>
        </div>
        <div class="rec-spec-item">
          <span class="rec-spec-item-label"><i class='bx bx-hdd'></i> Ổ cứng trống</span>
          <div class="rec-spec-item-value"><span>${matchingReq.storage || 0} GB</span></div>
        </div>
        <div class="rec-spec-item">
          <span class="rec-spec-item-label"><i class='bx bxl-windows'></i> Hệ điều hành</span>
          <div class="rec-spec-item-value"><span>${matchingReq.os || "Windows 10/11"}</span></div>
        </div>
      `;
    } else {
      gameBodyEl.innerHTML = `
        <div style="padding: 25px; text-align: center; color: rgba(255,255,255,0.45); font-style: italic;">
          <i class='bx bx-info-circle' style="font-size: 1.8rem; display: block; margin-bottom: 6px;"></i>
          Game này hiện chưa được thiết lập cấu hình ${typeLabel}.
        </div>
      `;
    }

    // Cột Đề xuất User
    userBodyEl.innerHTML = `
      <div class="rec-spec-item">
        <span class="rec-spec-item-label"><i class='bx bx-chip'></i> CPU</span>
        <div class="rec-spec-item-value">
          <span>${rec.cpu_name || "N/A"}</span>
          <span class="benchmark-pill" title="Điểm benchmark" style="background: rgba(16, 185, 129, 0.2); color: #34d399; border-color: rgba(16, 185, 129, 0.35);">
            ${rec.cpu_benchmark || 0} pts
          </span>
        </div>
      </div>
      <div class="rec-spec-item">
        <span class="rec-spec-item-label"><i class='bx bx-microchip'></i> GPU (Card đồ họa)</span>
        <div class="rec-spec-item-value">
          <span>${rec.gpu_name || "N/A"}</span>
          <span class="benchmark-pill" title="Điểm benchmark" style="background: rgba(16, 185, 129, 0.2); color: #34d399; border-color: rgba(16, 185, 129, 0.35);">
            ${rec.gpu_benchmark || 0} pts
          </span>
        </div>
      </div>
      <div class="rec-spec-item">
        <span class="rec-spec-item-label"><i class='bx bx-memory-card'></i> RAM</span>
        <div class="rec-spec-item-value"><span>${rec.ram || 0} GB</span></div>
      </div>
      <div class="rec-spec-item">
        <span class="rec-spec-item-label"><i class='bx bx-hdd'></i> Ổ cứng trống</span>
        <div class="rec-spec-item-value"><span>${rec.storage || 0} GB</span></div>
      </div>
      <div class="rec-spec-item">
        <span class="rec-spec-item-label"><i class='bx bxl-windows'></i> Hệ điều hành</span>
        <div class="rec-spec-item-value"><span>${rec.os || "Windows"}</span></div>
      </div>
    `;

    // 3. Kiểm tra nguy cơ xung đột với Trigger trg_GameRequirement_Check
    let conflictMsg = "";
    if (isMin && oppositeReq) {
      // Đề xuất là MINIMUM -> không được mạnh hơn RECOMMENDED của Game
      const cpuConflict = (rec.cpu_benchmark || 0) > (oppositeReq.cpu_benchmark || 0);
      const gpuConflict = (rec.gpu_benchmark || 0) > (oppositeReq.gpu_benchmark || 0);
      const ramConflict = (rec.ram || 0) > (oppositeReq.ram || 0);
      const storageConflict = (rec.storage || 0) > (oppositeReq.storage || 0);

      if (cpuConflict || gpuConflict || ramConflict || storageConflict) {
        conflictMsg = `Cảnh báo xung đột cấu hình: Đề xuất Tối thiểu (MINIMUM) này đang có thông số mạnh hơn cấu hình Khuyến nghị (RECOMMENDED) hiện tại của game (`;
        const reasons = [];
        if (cpuConflict) reasons.push(`CPU ${rec.cpu_benchmark} > ${oppositeReq.cpu_benchmark} pts`);
        if (gpuConflict) reasons.push(`GPU ${rec.gpu_benchmark} > ${oppositeReq.gpu_benchmark} pts`);
        if (ramConflict) reasons.push(`RAM ${rec.ram}GB > ${oppositeReq.ram}GB`);
        if (storageConflict) reasons.push(`Ổ cứng ${rec.storage}GB > ${oppositeReq.storage}GB`);
        conflictMsg += reasons.join(", ") + `). Nếu duyệt sẽ bị CSDL chặn lỗi!`;
      }
    } else if (!isMin && oppositeReq) {
      // Đề xuất là RECOMMENDED -> không được yếu hơn MINIMUM của Game
      const cpuConflict = (rec.cpu_benchmark || 0) < (oppositeReq.cpu_benchmark || 0);
      const gpuConflict = (rec.gpu_benchmark || 0) < (oppositeReq.gpu_benchmark || 0);
      const ramConflict = (rec.ram || 0) < (oppositeReq.ram || 0);
      const storageConflict = (rec.storage || 0) < (oppositeReq.storage || 0);

      if (cpuConflict || gpuConflict || ramConflict || storageConflict) {
        conflictMsg = `Cảnh báo xung đột cấu hình: Đề xuất Khuyến nghị (RECOMMENDED) này đang yếu hơn cấu hình Tối thiểu (MINIMUM) hiện tại của game (`;
        const reasons = [];
        if (cpuConflict) reasons.push(`CPU ${rec.cpu_benchmark} < ${oppositeReq.cpu_benchmark} pts`);
        if (gpuConflict) reasons.push(`GPU ${rec.gpu_benchmark} < ${oppositeReq.gpu_benchmark} pts`);
        if (ramConflict) reasons.push(`RAM ${rec.ram}GB < ${oppositeReq.ram}GB`);
        if (storageConflict) reasons.push(`Ổ cứng ${rec.storage}GB < ${oppositeReq.storage}GB`);
        conflictMsg += reasons.join(", ") + `). Nếu duyệt sẽ bị CSDL chặn lỗi!`;
      }
    }

    if (conflictMsg) {
      warningTextEl.textContent = conflictMsg;
      warningEl.style.display = "flex";
    } else {
      warningEl.style.display = "none";
    }

    // 4. Ghi chú người dùng
    if (rec.note && rec.note.trim()) {
      noteContentEl.textContent = `"${rec.note}"`;
      noteBoxEl.style.display = "block";
    } else {
      noteBoxEl.style.display = "none";
    }

    // 5. Nút bấm duyệt / từ chối
    if (btnApprove) btnApprove.style.display = rec.status !== "APPROVED" ? "inline-flex" : "none";
    if (btnReject) btnReject.style.display = rec.status !== "REJECTED" ? "inline-flex" : "none";

  } catch (err) {
    console.error("Lỗi khi mở modal chi tiết đề xuất:", err);
    if (typeof showToast === "function") showToast("Lỗi khi tải chi tiết đề xuất!", true);
  }
}

function closeRecommendationDetailModal() {
  const modal = document.getElementById("modal-recommendation-detail");
  if (modal) modal.classList.remove("active");
  currentDetailedRec = null;
  currentDetailedGameReqs = [];
}

function openConfirmApproveModal(recId, warningText = "") {
  const modal = document.getElementById("modal-confirm-rec-approve");
  if (!modal) return;

  document.getElementById("approve-target-rec-id").value = recId;
  const msgEl = document.getElementById("approve-confirm-message");
  const alertEl = document.getElementById("approve-conflict-alert");
  const alertTextEl = document.getElementById("approve-conflict-text");

  // Tìm rec trong danh sách để hiển thị tên rõ ràng
  const target = allAdminRecommendations.find((r) => String(r.recommendation_id) === String(recId));
  if (target) {
    const typeText = target.type === "MINIMUM" ? "Tối thiểu" : "Khuyến nghị";
    msgEl.innerHTML = `Bạn có chắc chắn muốn duyệt đề xuất của <strong>${target.reporter_name}</strong> và áp dụng làm cấu hình <strong>${typeText}</strong> chính thức cho game <strong>${target.game_name}</strong>?`;
  } else {
    msgEl.textContent = "Bạn có chắc chắn muốn duyệt đề xuất này và áp dụng làm cấu hình chính thức cho game không?";
  }

  if (warningText) {
    alertTextEl.textContent = warningText;
    alertEl.style.display = "flex";
  } else {
    alertEl.style.display = "none";
  }

  modal.classList.add("active");
}

function closeConfirmApproveModal() {
  const modal = document.getElementById("modal-confirm-rec-approve");
  if (modal) modal.classList.remove("active");
}

function openConfirmRejectModal(recId) {
  const modal = document.getElementById("modal-confirm-rec-reject");
  if (!modal) return;

  document.getElementById("reject-target-rec-id").value = recId;
  const reasonInput = document.getElementById("reject-reason-input");
  if (reasonInput) reasonInput.value = "";

  const msgEl = document.getElementById("reject-confirm-message");
  const target = allAdminRecommendations.find((r) => String(r.recommendation_id) === String(recId));
  if (target) {
    msgEl.innerHTML = `Bạn có chắc chắn muốn từ chối đề xuất cấu hình của <strong>${target.reporter_name}</strong> cho game <strong>${target.game_name}</strong>?`;
  } else {
    msgEl.textContent = "Bạn có chắc chắn muốn từ chối đề xuất cấu hình này không?";
  }

  modal.classList.add("active");
}

function closeConfirmRejectModal() {
  const modal = document.getElementById("modal-confirm-rec-reject");
  if (modal) modal.classList.remove("active");
}

function initRecommendationActions() {
  // 1. Bộ lọc trạng thái & loại cấu hình
  const statusFilter = document.getElementById("rec-status-filter");
  const typeFilter = document.getElementById("rec-type-filter");
  const searchInput = document.getElementById("rec-search-input");

  if (statusFilter) {
    statusFilter.addEventListener("change", () => loadRecommendationsData());
  }

  if (typeFilter) {
    typeFilter.addEventListener("change", () => loadRecommendationsData());
  }

  if (searchInput) {
    searchInput.addEventListener("input", () => {
      clearTimeout(activeRecSearchTimer);
      activeRecSearchTimer = setTimeout(() => {
        loadRecommendationsData();
      }, 350);
    });
  }

  // 2. Bắt sự kiện click trên bảng recommendations
  const tbody = document.getElementById("recommendations-table-body");
  if (tbody) {
    tbody.addEventListener("click", (e) => {
      // Click nút Chi tiết
      const btnDetail = e.target.closest(".btn-rec-detail");
      if (btnDetail) {
        const id = btnDetail.getAttribute("data-id");
        if (id) openRecommendationDetailModal(id);
        return;
      }

      // Click nút Duyệt
      const btnApprove = e.target.closest(".btn-rec-approve");
      if (btnApprove) {
        const id = btnApprove.getAttribute("data-id");
        if (id) openConfirmApproveModal(id);
        return;
      }

      // Click nút Từ chối
      const btnReject = e.target.closest(".btn-rec-reject");
      if (btnReject) {
        const id = btnReject.getAttribute("data-id");
        if (id) openConfirmRejectModal(id);
        return;
      }
    });
  }

  // 3. Sự kiện đóng các Modal
  const closeDetailBtn = document.getElementById("close-rec-detail-modal");
  const btnCloseDetail = document.getElementById("btn-close-rec-detail");
  const detailOverlay = document.getElementById("rec-detail-overlay");
  [closeDetailBtn, btnCloseDetail, detailOverlay].forEach((el) => {
    if (el) el.addEventListener("click", closeRecommendationDetailModal);
  });

  const closeApproveBtn = document.getElementById("close-confirm-approve-modal");
  const cancelApproveBtn = document.getElementById("btn-cancel-approve");
  const approveOverlay = document.getElementById("confirm-rec-approve-overlay");
  [closeApproveBtn, cancelApproveBtn, approveOverlay].forEach((el) => {
    if (el) el.addEventListener("click", closeConfirmApproveModal);
  });

  const closeRejectBtn = document.getElementById("close-confirm-reject-modal");
  const cancelRejectBtn = document.getElementById("btn-cancel-reject");
  const rejectOverlay = document.getElementById("confirm-rec-reject-overlay");
  [closeRejectBtn, cancelRejectBtn, rejectOverlay].forEach((el) => {
    if (el) el.addEventListener("click", closeConfirmRejectModal);
  });

  // 4. Nút Duyệt / Từ chối bên trong Modal Chi tiết
  const btnModalTriggerApprove = document.getElementById("btn-modal-trigger-approve");
  const btnModalTriggerReject = document.getElementById("btn-modal-trigger-reject");

  if (btnModalTriggerApprove) {
    btnModalTriggerApprove.addEventListener("click", () => {
      const recId = document.getElementById("modal-detail-rec-id")?.value;
      const warningText = document.getElementById("rec-warning-text")?.textContent || "";
      const isConflict = document.getElementById("rec-conflict-warning")?.style.display !== "none";
      closeRecommendationDetailModal();
      if (recId) openConfirmApproveModal(recId, isConflict ? warningText : "");
    });
  }

  if (btnModalTriggerReject) {
    btnModalTriggerReject.addEventListener("click", () => {
      const recId = document.getElementById("modal-detail-rec-id")?.value;
      closeRecommendationDetailModal();
      if (recId) openConfirmRejectModal(recId);
    });
  }

  // 5. Submit Duyệt Đề xuất
  const btnSubmitApprove = document.getElementById("btn-submit-approve");
  if (btnSubmitApprove) {
    btnSubmitApprove.addEventListener("click", async () => {
      const recId = document.getElementById("approve-target-rec-id")?.value;
      if (!recId) return;

      const token = localStorage.getItem("token");
      try {
        btnSubmitApprove.disabled = true;
        const res = await fetch(`/api/reviews/admin/recommendations/${recId}/approve`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          }
        });

        const result = await res.json();
        if (result.success) {
          if (typeof showToast === "function") {
            showToast("Đã duyệt đề xuất và áp dụng vào cấu hình game thành công!");
          }
          closeConfirmApproveModal();
          loadRecommendationsData();
        } else {
          if (typeof showToast === "function") {
            showToast(result.message || "Lỗi khi duyệt đề xuất cấu hình!", true);
          }
        }
      } catch (err) {
        console.error("Lỗi khi duyệt đề xuất:", err);
        if (typeof showToast === "function") showToast("Lỗi kết nối máy chủ!", true);
      } finally {
        btnSubmitApprove.disabled = false;
      }
    });
  }

  // 6. Submit Từ chối Đề xuất
  const btnSubmitReject = document.getElementById("btn-submit-reject");
  if (btnSubmitReject) {
    btnSubmitReject.addEventListener("click", async () => {
      const recId = document.getElementById("reject-target-rec-id")?.value;
      const rejectReason = document.getElementById("reject-reason-input")?.value?.trim() || "";
      if (!recId) return;

      const token = localStorage.getItem("token");
      try {
        btnSubmitReject.disabled = true;
        const res = await fetch(`/api/reviews/admin/recommendations/${recId}/reject`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({ reject_reason: rejectReason })
        });

        const result = await res.json();
        if (result.success) {
          if (typeof showToast === "function") {
            showToast("Đã từ chối đề xuất cấu hình thành công!");
          }
          closeConfirmRejectModal();
          loadRecommendationsData();
        } else {
          if (typeof showToast === "function") {
            showToast(result.message || "Lỗi khi từ chối đề xuất!", true);
          }
        }
      } catch (err) {
        console.error("Lỗi khi từ chối đề xuất:", err);
        if (typeof showToast === "function") showToast("Lỗi kết nối máy chủ!", true);
      } finally {
        btnSubmitReject.disabled = false;
      }
    });
  }
}