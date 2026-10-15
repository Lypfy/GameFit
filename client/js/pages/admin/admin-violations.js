/* ==========================================================================
   QUẢN LÝ BÁO CÁO VI PHẠM (VIOLATIONS & MODERATION)
   ========================================================================== */
let allReportedReviews = [];
let activeViolationsSearchTimer = null;

function formatViolationDate(dateStr) {
  if (!dateStr) return "-";

  // Khi CSDL Azure SQL lưu giờ Việt Nam và trả về chuỗi ISO có cờ 'Z',
  // bóc tách trực tiếp để tránh bị trình duyệt tự cộng thêm 7 tiếng (08:05 thành 15:05)
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

async function loadViolationsData() {
  const tbody = document.getElementById("violations-table-body");
  if (!tbody) return;

  const statusFilter = document.getElementById("violation-status-filter")?.value || "ALL";
  const timeFilter = document.getElementById("violation-time-filter")?.value || "all";
  const search = document.getElementById("violation-search-input")?.value?.trim() || "";

  const token = localStorage.getItem("token");
  if (!token) return;

  try {
    tbody.innerHTML = `<tr><td colspan="7" class="table-empty-row"><i class='bx bx-loader-alt bx-spin'></i> Đang tải danh sách báo cáo...</td></tr>`;

    const queryParams = new URLSearchParams();
    if (statusFilter && statusFilter !== "ALL") queryParams.append("status", statusFilter);
    if (timeFilter && timeFilter !== "all") queryParams.append("time_range", timeFilter);
    if (search) queryParams.append("search", search);

    const res = await fetch(`/api/reviews/admin/reports?${queryParams.toString()}&_t=${Date.now()}`, {
      headers: {
        "Authorization": `Bearer ${token}`,
        "Cache-Control": "no-cache"
      }
    });

    const result = await res.json();
    if (result.success) {
      allReportedReviews = result.data || [];
      renderViolationsTable(allReportedReviews);
    } else {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: #ef4444; padding: 16px;">${result.message || "Lỗi tải dữ liệu"}</td></tr>`;
    }
  } catch (error) {
    console.error("Lỗi khi load danh sách báo cáo vi phạm:", error);
    tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: #ef4444; padding: 16px;">Không thể kết nối máy chủ để tải danh sách báo cáo</td></tr>`;
  }
}

function renderTableReasonCell(r) {
  const count = r.report_count || 1;
  if (count > 1) {
    return `
      <button type="button" class="btn-reasons-badge btn-open-reasons-fast" data-id="${r.review_id}" title="Nhấn để xem chi tiết ${count} lý do">
        <i class='bx bx-list-ul'></i> ${count} lý do
      </button>
    `;
  }
  const singleReason = r.report_reason || "Chưa rõ";
  if (singleReason.startsWith("Lý do khác")) {
    return `<span class="reason-tag">Lý do khác</span>`;
  }
  return `<span class="reason-tag">${singleReason}</span>`;
}

function renderViolationsTable(reports) {
  const tbody = document.getElementById("violations-table-body");
  if (!tbody) return;

  if (!reports || reports.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" class="table-empty-row">Không có báo cáo vi phạm nào phù hợp với bộ lọc</td></tr>`;
    return;
  }

  tbody.innerHTML = reports.map((r) => {
    let statusBadge = "";
    if (r.report_status === "PENDING") {
      statusBadge = `<span class="status-badge warning">Chờ xử lý</span>`;
    } else if (r.report_status === "DISMISSED") {
      statusBadge = `<span class="status-badge success">Đã bỏ qua</span>`;
    } else if (r.report_status === "HIDDEN") {
      statusBadge = `<span class="status-badge danger">Đã ẩn</span>`;
    } else {
      statusBadge = `<span class="status-badge">${r.report_status || "Chưa duyệt"}</span>`;
    }

    return `
      <tr data-review-id="${r.review_id}">
        <td>#REP-${String(r.review_id).padStart(3, "0")}</td>
        <td class="text-highlight">${r.violator_name || "Người dùng"}</td>
        <td>${r.game_name || "-"}</td>
        <td>${renderTableReasonCell(r)}</td>
        <td>${formatViolationDate(r.reported_at)}</td>
        <td>${statusBadge}</td>
        <td class="text-center">
          <button title="Xem chi tiết & Kiểm duyệt" class="btn-action btn-edit btn-view-violation" data-id="${r.review_id}">
            <i class="bx bx-edit"></i>
          </button>
        </td>
      </tr>
    `;
  }).join("");
}

function initViolationActions() {
  const statusFilter = document.getElementById("violation-status-filter");
  const timeFilter = document.getElementById("violation-time-filter");
  const searchInput = document.getElementById("violation-search-input");

  if (statusFilter) {
    statusFilter.addEventListener("change", () => loadViolationsData());
  }
  if (timeFilter) {
    timeFilter.addEventListener("change", () => loadViolationsData());
  }
  if (searchInput) {
    searchInput.addEventListener("input", () => {
      clearTimeout(activeViolationsSearchTimer);
      activeViolationsSearchTimer = setTimeout(() => {
        loadViolationsData();
      }, 350);
    });
  }

  const modal = document.getElementById("violation-detail-modal");
  const closeBtn = document.getElementById("close-violation-modal");
  const overlay = document.getElementById("violation-modal-overlay");
  const btnDismiss = document.getElementById("btn-dismiss-violation");
  const btnTriggerDelete = document.getElementById("btn-trigger-delete");
  const btnCancelDelete = document.getElementById("btn-cancel-delete");
  const btnConfirmDelete = document.getElementById("btn-confirm-delete");
  const footerDefault = document.getElementById("violation-footer-default");
  const footerConfirm = document.getElementById("violation-footer-confirm");

  let currentInspectedReport = null;

  function hideViolationModal() {
    if (modal) modal.classList.remove("active");
    if (footerConfirm) footerConfirm.style.display = "none";
    if (footerDefault) footerDefault.style.display = "flex";
  }

  if (closeBtn) closeBtn.addEventListener("click", hideViolationModal);
  if (overlay) overlay.addEventListener("click", hideViolationModal);

  async function populateViolationDetailModal(reportItem) {
    currentInspectedReport = reportItem;

    const targetIdInput = document.getElementById("violation-target-review-id");
    const userEl = document.getElementById("violation-user");
    const gameEl = document.getElementById("violation-game");
    const countEl = document.getElementById("violation-count");
    const timeEl = document.getElementById("violation-time");
    const commentEl = document.getElementById("violation-comment-text");
    const reasonsCountBadge = document.getElementById("violation-reasons-count-badge");
    const inlineReasonsList = document.getElementById("violation-inline-reasons-list");

    if (targetIdInput) targetIdInput.value = reportItem.review_id;
    if (userEl) userEl.textContent = reportItem.violator_name || "-";
    if (gameEl) gameEl.textContent = reportItem.game_name || "-";
    const reportCount = reportItem.report_count || 1;
    if (countEl) countEl.textContent = `${reportCount} lượt`;
    if (reasonsCountBadge) reasonsCountBadge.textContent = `${reportCount} lượt`;
    if (timeEl) timeEl.textContent = formatViolationDate(reportItem.reported_at);
    if (commentEl) commentEl.textContent = reportItem.comment ? `"${reportItem.comment}"` : "(Không có nội dung bình luận)";

    if (footerConfirm) footerConfirm.style.display = "none";
    if (footerDefault) footerDefault.style.display = "flex";

    // Tải và hiển thị danh sách chi tiết các lý do vi phạm ngay trong modal
    if (inlineReasonsList) {
      inlineReasonsList.innerHTML = `
        <div style="text-align: center; padding: 18px 0; color: rgba(255, 255, 255, 0.65);">
          <i class='bx bx-loader-alt bx-spin' style='font-size: 20px; color: #38bdf8;'></i>
          <p style="margin-top: 6px; font-size: 0.8rem;">Đang tải danh sách người báo cáo...</p>
        </div>
      `;

      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`/api/reviews/admin/reports/${reportItem.review_id}`, {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });
        const result = await res.json();

        if (result.success && Array.isArray(result.data) && result.data.length > 0) {
          inlineReasonsList.innerHTML = result.data.map((item, index) => {
            const reporterName = item.reporter_name || "Người dùng ẩn danh";
            const reportReason = item.report_reason || "Chưa rõ lý do";
            const detailText = item.report_detail ? item.report_detail.trim() : null;
            const reportedAt = formatViolationDate(item.reported_at);

            return `
              <div class="violation-reason-card">
                <div class="violation-card-meta">
                  <span class="reporter-name">
                    <i class='bx bx-user-circle'></i> ${reporterName}
                  </span>
                  <span class="report-time">
                    <i class='bx bx-time-five'></i> ${reportedAt}
                  </span>
                </div>
                <div class="violation-reason-card-title">
                  <span class="violation-reason-index">${index + 1}</span>
                  <span>${reportReason}</span>
                </div>
                ${detailText ? `
                  <div class="violation-reason-detail">
                    <em>Chi tiết: "${detailText}"</em>
                  </div>
                ` : ""}
              </div>
            `;
          }).join("");
        } else {
          // Fallback nếu chưa có bản ghi chi tiết
          inlineReasonsList.innerHTML = `
            <div class="violation-reason-card">
              <div class="violation-reason-card-title">
                <span class="violation-reason-index">1</span>
                <span>${reportItem.report_reason || "Chưa rõ lý do"}</span>
              </div>
            </div>
          `;
        }
      } catch (err) {
        console.error("Lỗi khi tải chi tiết lý do báo cáo:", err);
        inlineReasonsList.innerHTML = `
          <div class="violation-reason-card">
            <div class="violation-reason-card-title">
              <span class="violation-reason-index">1</span>
              <span>${reportItem.report_reason || "Chưa rõ lý do"}</span>
            </div>
          </div>
        `;
      }
    }
  }

  // Click nút xem chi tiết & kiểm duyệt trên bảng
  const tableBody = document.getElementById("violations-table-body");
  if (tableBody) {
    tableBody.addEventListener("click", (e) => {
      // Nhấn nút badge "Xem X lý do" hoặc nút icon cây bút trên bảng đều mở Modal kiểm duyệt đầy đủ
      const triggerBtn = e.target.closest(".btn-open-reasons-fast, .btn-view-violation");
      if (!triggerBtn) return;

      const reviewId = parseInt(triggerBtn.getAttribute("data-id"), 10);
      const reportItem = allReportedReviews.find((r) => r.review_id === reviewId);
      if (!reportItem) return;

      populateViolationDetailModal(reportItem);
      if (modal) modal.classList.add("active");
    });
  }

  // Bấm nút "Bỏ qua báo cáo"
  if (btnDismiss) {
    btnDismiss.addEventListener("click", async () => {
      const reviewId = document.getElementById("violation-target-review-id")?.value;
      if (!reviewId) return;

      const token = localStorage.getItem("token");
      try {
        btnDismiss.disabled = true;
        const res = await fetch(`/api/reviews/admin/moderate/${reviewId}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({ action: "DISMISS" })
        });
        const result = await res.json();
        if (result.success) {
          if (typeof showToast === "function") {
            showToast("Đã bỏ qua báo cáo thành công!");
          }
          hideViolationModal();
          loadViolationsData();
        } else {
          if (typeof showToast === "function") {
            showToast(result.message || "Có lỗi xảy ra", true);
          }
        }
      } catch (err) {
        console.error("Lỗi khi bỏ qua báo cáo:", err);
        if (typeof showToast === "function") showToast("Lỗi kết nối máy chủ!", true);
      } finally {
        btnDismiss.disabled = false;
      }
    });
  }

  // Bấm nút "Ẩn bình luận" -> Hiện khung xác nhận
  if (btnTriggerDelete) {
    btnTriggerDelete.addEventListener("click", () => {
      if (footerDefault) footerDefault.style.display = "none";
      if (footerConfirm) footerConfirm.style.display = "flex";
    });
  }

  // Bấm nút "Hủy" xác nhận ẩn
  if (btnCancelDelete) {
    btnCancelDelete.addEventListener("click", () => {
      if (footerConfirm) footerConfirm.style.display = "none";
      if (footerDefault) footerDefault.style.display = "flex";
    });
  }

  // Bấm nút "Đồng ý ẩn"
  if (btnConfirmDelete) {
    btnConfirmDelete.addEventListener("click", async () => {
      const reviewId = document.getElementById("violation-target-review-id")?.value;
      if (!reviewId) return;

      const token = localStorage.getItem("token");
      try {
        btnConfirmDelete.disabled = true;
        const res = await fetch(`/api/reviews/admin/moderate/${reviewId}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({ action: "HIDE" })
        });
        const result = await res.json();
        if (result.success) {
          if (typeof showToast === "function") {
            showToast("Đã ẩn đánh giá vi phạm thành công!");
          }
          hideViolationModal();
          loadViolationsData();
        } else {
          if (typeof showToast === "function") {
            showToast(result.message || "Có lỗi xảy ra", true);
          }
        }
      } catch (err) {
        console.error("Lỗi khi ẩn đánh giá:", err);
        if (typeof showToast === "function") showToast("Lỗi kết nối máy chủ!", true);
      } finally {
        btnConfirmDelete.disabled = false;
      }
    });
  }
}