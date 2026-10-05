/**
 * statistics.js - Quản lý thống kê Admin GameFit
 * Hỗ trợ chuyển tab, tải dữ liệu động cho Thống kê Thể loại, Wishlist và Phần cứng
 */

// Biến trạng thái toàn cục cho Tab 1: Tổng quan
let generalDataCache = null;
let recentGameSearchQuery = "";
let selectedExportFormat = "xlsx";

// Biến trạng thái toàn cục cho Tab Thể loại
let currentGenreMetric = "games"; // 'games' | 'wishlist' | 'rating'
let currentGenreSort = "desc";    // 'desc' | 'asc' | 'alpha'
let genreSearchQuery = "";
let genreDataCache = null;

// Biến trạng thái toàn cục cho Tab Wishlist & Đánh giá
let wishlistStatusFilter = "all"; // 'all' | 'released' | 'upcoming'
let wishlistSearchQuery = "";
let reviewSortCriteria = "count-desc"; // 'count-desc' | 'count-asc' | 'rating-desc' | 'rating-asc'
let reviewTierFilter = "all"; // 'all' | 'high' | 'medium' | 'low'
let wishlistDataCache = null;

// Biến trạng thái toàn cục cho Tab Phần cứng
let hardwareDataCache = null;
let cpuBrandFilter = "all"; // 'all' | 'Intel' | 'AMD'
let cpuSortCriteria = "pop-desc"; // 'pop-desc' | 'pop-asc' | 'bench-desc' | 'bench-asc'
let cpuSearchQuery = "";

let gpuBrandFilter = "all"; // 'all' | 'NVIDIA' | 'AMD' | 'Intel'
let gpuSortCriteria = "pop-desc"; // 'pop-desc' | 'pop-asc' | 'bench-desc' | 'bench-asc'
let gpuSearchQuery = "";

/**
 * Helper gọi API nội bộ hệ thống
 */
async function fetchApi(endpoint) {
  const path = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  const res = await fetch(path);
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${res.statusText}`);
  }
  return await res.json();
}

function initStatistics(parent = document) {
  const root = parent || document;

  // Xử lý chuyển đổi Sub-Tabs Thống kê (tab-1, tab-2, tab-3, tab-4)
  const tabBtns = root.querySelectorAll(".tab-btn");
  const tabContents = root.querySelectorAll("#tab-1, #tab-2, #tab-3, #tab-4");
  const genreFilterBar = root.querySelector("#genre-filter-bar");

  tabBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      tabBtns.forEach((b) => b.classList.remove("active"));
      tabContents.forEach((c) => c.classList.remove("active"));

      btn.classList.add("active");
      const tabId = btn.getAttribute("data-tab");
      const targetTab = root.querySelector(`#${tabId}`);
      if (targetTab) {
        targetTab.classList.add("active");
      }

      // Hiển thị Filter Bar chỉ khi ở Tab 2 (Thể loại)
      if (genreFilterBar) {
        genreFilterBar.classList.toggle("hidden", tabId !== "tab-2");
      }

      // Tự động đồng bộ dropdown phạm vi xuất theo tab đang xem (nếu không chọn 'all')
      const scopeSelect = root.querySelector("#export-scope-select") || document.querySelector("#export-scope-select");
      if (scopeSelect && scopeSelect.value !== "all") {
        scopeSelect.value = tabId;
      }

      // Tải dữ liệu tương ứng theo tab khi chuyển đổi
      if (tabId === "tab-1") {
        loadGeneralStatistics(root);
      } else if (tabId === "tab-2") {
        loadGenreStatistics(root);
      } else if (tabId === "tab-3") {
        loadWishlistStatistics(root);
      } else if (tabId === "tab-4") {
        loadHardwareStatistics(root);
      }
    });
  });

  // Gắn sự kiện cho bộ lọc Tiêu chí Thống kê theo: [ Số lượng game | Lượt Wishlist | Điểm đánh giá TB ]
  const metricBtns = root.querySelectorAll(".genre-metric-btn");
  metricBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      metricBtns.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      currentGenreMetric = btn.getAttribute("data-metric") || "games";
      renderGenreTab(root);
    });
  });

  // Gắn sự kiện cho bộ lọc Sắp xếp theo thứ tự: [ Cao nhất | Thấp nhất | Tên A - Z ]
  const sortSelect = root.querySelector("#genre-sort-select");
  if (sortSelect) {
    sortSelect.addEventListener("change", (e) => {
      currentGenreSort = e.target.value;
      renderGenreTab(root);
    });
  }

  // Gắn sự kiện cho ô Tìm kiếm thể loại trong table-header
  const searchInput = root.querySelector("#genre-search-input");
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      genreSearchQuery = e.target.value.trim().toLowerCase();
      renderGenreTab(root);
    });
  }

  // Gắn sự kiện cho bộ lọc Tình trạng phát hành & Tìm kiếm ở Bảng Wishlist
  const wishlistStatusSelect = root.querySelector("#wishlist-status-select");
  if (wishlistStatusSelect) {
    wishlistStatusSelect.addEventListener("change", (e) => {
      wishlistStatusFilter = e.target.value;
      renderWishlistTable(root);
    });
  }

  const wishlistSearchInput = root.querySelector("#wishlist-search-input");
  if (wishlistSearchInput) {
    wishlistSearchInput.addEventListener("input", (e) => {
      wishlistSearchQuery = e.target.value.trim().toLowerCase();
      renderWishlistTable(root);
    });
  }

  // Gắn sự kiện cho bộ lọc Sắp xếp & Mức độ hài lòng ở Bảng Đánh giá
  const reviewSortSelect = root.querySelector("#review-sort-select");
  if (reviewSortSelect) {
    reviewSortSelect.addEventListener("change", (e) => {
      reviewSortCriteria = e.target.value;
      renderReviewTable(root);
    });
  }

  const reviewTierSelect = root.querySelector("#review-tier-select");
  if (reviewTierSelect) {
    reviewTierSelect.addEventListener("change", (e) => {
      reviewTierFilter = e.target.value;
      renderReviewTable(root);
    });
  }

  // Gắn sự kiện cho bộ lọc Bảng CPU
  const cpuBrandSelect = root.querySelector("#cpu-brand-select");
  if (cpuBrandSelect) {
    cpuBrandSelect.addEventListener("change", (e) => {
      cpuBrandFilter = e.target.value;
      renderHardwareCpuTable(root);
    });
  }

  const cpuSortSelect = root.querySelector("#cpu-sort-select");
  if (cpuSortSelect) {
    cpuSortSelect.addEventListener("change", (e) => {
      cpuSortCriteria = e.target.value;
      renderHardwareCpuTable(root);
    });
  }

  const cpuSearchInput = root.querySelector("#cpu-search-input");
  if (cpuSearchInput) {
    cpuSearchInput.addEventListener("input", (e) => {
      cpuSearchQuery = e.target.value.trim().toLowerCase();
      renderHardwareCpuTable(root);
    });
  }

  // Gắn sự kiện cho bộ lọc Bảng GPU
  const gpuBrandSelect = root.querySelector("#gpu-brand-select");
  if (gpuBrandSelect) {
    gpuBrandSelect.addEventListener("change", (e) => {
      gpuBrandFilter = e.target.value;
      renderHardwareGpuTable(root);
    });
  }

  const gpuSortSelect = root.querySelector("#gpu-sort-select");
  if (gpuSortSelect) {
    gpuSortSelect.addEventListener("change", (e) => {
      gpuSortCriteria = e.target.value;
      renderHardwareGpuTable(root);
    });
  }

  const gpuSearchInput = root.querySelector("#gpu-search-input");
  if (gpuSearchInput) {
    gpuSearchInput.addEventListener("input", (e) => {
      gpuSearchQuery = e.target.value.trim().toLowerCase();
      renderHardwareGpuTable(root);
    });
  }

  // Gắn sự kiện cho ô Tìm kiếm game mới thêm ở Tab 1
  const recentGameSearchInput = root.querySelector("#recent-game-search-input");
  if (recentGameSearchInput) {
    recentGameSearchInput.addEventListener("input", (e) => {
      recentGameSearchQuery = e.target.value.trim().toLowerCase();
      renderRecentGamesTable(root);
    });
  }

  // Tải dữ liệu ban đầu cho các tab (dùng cache tránh tải lại trùng lặp)
  loadGeneralStatistics(root);
  loadGenreStatistics(root);
  loadWishlistStatistics(root);
  loadHardwareStatistics(root);

  // Khởi tạo Module Xuất Báo Cáo Thống Kê & Modal
  initExportModule(root);
}

/**
 * 0. Tải và render dữ liệu Thống kê Tổng quan (Tab 1)
 */
async function loadGeneralStatistics(root) {
  const recentTableBody = root.querySelector("#recent-games-table-body");

  try {
    if (!generalDataCache) {
      const result = await fetchApi("/api/statistics/general");
      if (!result.success || !result.data) {
        if (recentTableBody) {
          recentTableBody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: var(--danger); padding: 1.5rem;">Không thể tải dữ liệu thống kê tổng quan.</td></tr>`;
        }
        return;
      }
      generalDataCache = result.data;
    }

    renderGeneralTab(root);
  } catch (err) {
    console.error("Lỗi khi tải dữ liệu Thống kê chung:", err);
    if (recentTableBody) {
      recentTableBody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: var(--danger); padding: 1.5rem;">Lỗi kết nối máy chủ khi lấy dữ liệu thống kê chung.</td></tr>`;
    }
  }
}

/**
 * Render toàn bộ nội dung Tab 1: KPI Cards, Trend Line Chart, Status Donut, Recent Games Table
 */
function renderGeneralTab(root) {
  if (!generalDataCache) return;
  const { totals, timeline, statusDistribution } = generalDataCache;

  // 1. Cập nhật các thẻ thông số KPI
  const totalElem = root.querySelector("#stat-general-total");
  const activeElem = root.querySelector("#stat-general-active");
  const inactiveElem = root.querySelector("#stat-general-inactive");

  if (totalElem) totalElem.textContent = (totals?.total_games || 0).toLocaleString();
  if (activeElem) activeElem.textContent = (totals?.active_games || 0).toLocaleString();
  if (inactiveElem) inactiveElem.textContent = (totals?.inactive_games || 0).toLocaleString();

  // 2. Render Biểu đồ đường biến động phát hành game theo năm (Timeline)
  renderGeneralTrendChart(root, timeline || []);

  // 3. Render Biểu đồ tròn trạng thái game (Donut Chart)
  renderGeneralStatusDonut(root, statusDistribution || [], totals || {});

  // 4. Render Bảng Game được thêm gần đây
  renderRecentGamesTable(root);
}

/**
 * Render Biểu đồ đường biến động số lượng game theo năm (SVG Timeline sinh động)
 */
function renderGeneralTrendChart(root, timeline) {
  const container = root.querySelector("#general-trend-chart");
  if (!container) return;

  if (!timeline || timeline.length === 0) {
    container.innerHTML = `<div style="color: var(--text-muted); text-align: center; padding: 2rem;">Chưa có dữ liệu biến động phát hành theo năm.</div>`;
    return;
  }

  const svgWidth = 600;
  const svgHeight = 200;
  const padLeft = 45;
  const padRight = 45;
  const padTop = 32;
  const padBottom = 38;

  const usableWidth = svgWidth - padLeft - padRight;
  const usableHeight = svgHeight - padTop - padBottom;

  const maxCount = Math.max(...timeline.map((d) => d.count), 5);
  const yCeil = Math.ceil(maxCount * 1.25);

  const n = timeline.length;
  const points = timeline.map((d, idx) => {
    const x = n > 1 ? padLeft + (idx / (n - 1)) * usableWidth : padLeft + usableWidth / 2;
    const y = padTop + usableHeight - (d.count / yCeil) * usableHeight;
    return {
      x: Math.round(x * 10) / 10,
      y: Math.round(y * 10) / 10,
      year: d.year,
      count: d.count,
    };
  });

  const polylinePoints = points.map((p) => `${p.x},${p.y}`).join(" ");
  const polygonPoints = `${points[0].x},${padTop + usableHeight} ${polylinePoints} ${points[points.length - 1].x},${padTop + usableHeight}`;

  const gridY1 = padTop;
  const gridY2 = padTop + usableHeight / 2;
  const gridY3 = padTop + usableHeight;

  const dotsHtml = points
    .map(
      (p) => `
        <g class="trend-point-group">
          <!-- Text giá trị số lượng trên đỉnh điểm -->
          <text x="${p.x}" y="${p.y - 10}" fill="#ffffff" font-size="11" font-weight="600" text-anchor="middle">${p.count}</text>
          <!-- Điểm tròn tương tác -->
          <circle cx="${p.x}" cy="${p.y}" r="4.5" fill="#fa5353" stroke="#ffffff" stroke-width="2" class="trend-dot">
            <title>Năm ${p.year}: ${p.count} game</title>
          </circle>
          <!-- Nhãn năm bên dưới trục hoành -->
          <text x="${p.x}" y="${padTop + usableHeight + 20}" fill="#9da4b0" font-size="11.5" font-weight="500" text-anchor="middle">${p.year}</text>
        </g>
      `
    )
    .join("");

  container.innerHTML = `
    <svg class="line-chart-svg" viewBox="0 0 ${svgWidth} ${svgHeight}" preserveAspectRatio="none">
      <defs>
        <linearGradient id="trendGradientDynamic" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#fa5353" stop-opacity="0.38" />
          <stop offset="100%" stop-color="#fa5353" stop-opacity="0.0" />
        </linearGradient>
      </defs>

      <!-- Đường kẻ ngang phụ trợ (Grid Lines) -->
      <line x1="${padLeft - 10}" y1="${gridY1}" x2="${svgWidth - padRight + 10}" y2="${gridY1}" stroke="rgba(255,255,255,0.06)" stroke-width="1" stroke-dasharray="4" />
      <line x1="${padLeft - 10}" y1="${gridY2}" x2="${svgWidth - padRight + 10}" y2="${gridY2}" stroke="rgba(255,255,255,0.06)" stroke-width="1" stroke-dasharray="4" />
      <line x1="${padLeft - 10}" y1="${gridY3}" x2="${svgWidth - padRight + 10}" y2="${gridY3}" stroke="rgba(255,255,255,0.12)" stroke-width="1" />

      <!-- Vùng diện tích mờ (Area Gradient) -->
      <polygon points="${polygonPoints}" fill="url(#trendGradientDynamic)" />

      <!-- Đường biểu đồ chính (Polyline) -->
      <polyline points="${polylinePoints}" fill="none" stroke="#fa5353" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />

      <!-- Các điểm nút tròn và nhãn số -->
      ${dotsHtml}
    </svg>
  `;
}

/**
 * Render Biểu đồ tròn trạng thái game (Donut Chart)
 */
function renderGeneralStatusDonut(root, statusDistribution, totals) {
  const container = root.querySelector("#general-donut-container");
  if (!container) return;

  const total = totals?.total_games || 0;
  const active = totals?.active_games || 0;
  const inactive = totals?.inactive_games || 0;

  const activePct = total > 0 ? Math.round((active / total) * 100) : 100;
  const inactivePct = 100 - activePct;

  container.innerHTML = `
    <div class="donut-chart" style="background: conic-gradient(var(--success, #10b981) 0% ${activePct}%, var(--danger, #ef4444) ${activePct}% 100%);">
      <div class="donut-hole">
        <h3>${total.toLocaleString()}</h3>
        <p>Tổng số</p>
      </div>
    </div>
    <div class="chart-legend">
      <div class="legend-item">
        <div class="legend-color">
          <div class="color-dot success"></div>
          Đang hoạt động
        </div>
        <span>${activePct}% (${active.toLocaleString()})</span>
      </div>
      <div class="legend-item">
        <div class="legend-color">
          <div class="color-dot danger"></div>
          Ngừng hoạt động
        </div>
        <span>${inactivePct}% (${inactive.toLocaleString()})</span>
      </div>
    </div>
  `;
}

/**
 * Render Bảng Game được thêm gần đây kèm bộ lọc tìm kiếm
 */
function renderRecentGamesTable(root) {
  const tableBody = root.querySelector("#recent-games-table-body");
  if (!tableBody || !generalDataCache) return;

  const recentGames = generalDataCache.recentGames || [];

  // Lọc theo từ khóa tìm kiếm (tên game hoặc thể loại)
  let filtered = recentGames.filter((g) => {
    if (!recentGameSearchQuery) return true;
    const name = (g.name || "").toLowerCase();
    const genres = (g.genres || "").toLowerCase();
    return name.includes(recentGameSearchQuery) || genres.includes(recentGameSearchQuery);
  });

  if (filtered.length === 0) {
    tableBody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: var(--text-secondary); padding: 2rem;">Không tìm thấy tựa game nào phù hợp với từ khóa "${escapeHtml(recentGameSearchQuery)}".</td></tr>`;
    return;
  }

  tableBody.innerHTML = filtered
    .map((game) => {
      const imgUrl = game.image ? game.image.split(' ')[0] : "../../img/placeholder.jpg";
      const tagBadges = (game.genres || "")
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean)
        .slice(0, 3)
        .map((t) => `<span class="genre-badge">${escapeHtml(t)}</span>`)
        .join("") || `<span style="color: var(--text-muted); font-size: 0.8rem;">Chưa phân loại</span>`;

      const statusBadge = game.is_active
        ? `<span class="status-badge active"><i class='bx bx-check'></i> Hoạt động</span>`
        : `<span class="status-badge danger"><i class='bx bx-x'></i> Ngừng</span>`;

      return `
        <tr>
          <td>
            <div class="game-cell">
              <img src="${imgUrl}" alt="${escapeHtml(game.name)}" class="game-thumb" onerror="this.src='https://placehold.co/100x60/211f34/ffffff?text=Game'" />
              <span style="font-weight: 600; color: #ffffff;">${escapeHtml(game.name)}</span>
            </div>
          </td>
          <td>
            <div class="genre-tags">${tagBadges}</div>
          </td>
          <td style="color: var(--text-primary); font-size: 0.88rem; font-weight: 500;">
            ${formatDate(game.release_date)}
          </td>
          <td style="text-align: center;">
            ${statusBadge}
          </td>
        </tr>
      `;
    })
    .join("");
}

/**
 * 1. Tải và render dữ liệu Thống kê Thể loại (Tab 2)
 */
async function loadGenreStatistics(root) {
  const tableBody = root.querySelector("#genre-table-body");

  try {
    if (!genreDataCache) {
      const result = await fetchApi("/api/statistics/genres");
      if (!result.success || !result.data) {
        if (tableBody) {
          tableBody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: var(--danger); padding: 1.5rem;">Không thể tải dữ liệu thể loại.</td></tr>`;
        }
        return;
      }
      genreDataCache = result.data;
    }

    renderGenreTab(root);
  } catch (err) {
    console.error("Lỗi khi tải dữ liệu thể loại:", err);
    if (tableBody) {
      tableBody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: var(--danger); padding: 1.5rem;">Lỗi máy chủ khi lấy dữ liệu thể loại.</td></tr>`;
    }
  }
}

/**
 * Render giao diện Tab Thể loại theo tiêu chí và sắp xếp hiện tại
 */
function renderGenreTab(root) {
  if (!genreDataCache || !genreDataCache.genres) return;

  const { totals, genres } = genreDataCache;

  const distTitle = root.querySelector("#genre-dist-title");
  const distList = root.querySelector("#genre-distribution-list");
  const summaryBox = root.querySelector("#genre-summary-box");
  const metricHeader = root.querySelector("#genre-metric-header");
  const tableBody = root.querySelector("#genre-table-body");

  // 1. Sao chép và lọc theo tìm kiếm
  let filteredGenres = [...genres];
  if (genreSearchQuery) {
    filteredGenres = filteredGenres.filter((g) =>
      g.genre_name.toLowerCase().includes(genreSearchQuery)
    );
  }

  // 2. Xác định cấu hình theo tiêu chí đang chọn
  let valKey = "game_count";
  let metricLabel = "Số lượng game";
  let totalForPercent = totals.total_games || 1;

  if (currentGenreMetric === "wishlist") {
    valKey = "wishlist_count";
    metricLabel = "Lượt Wishlist";
    totalForPercent = totals.total_wishlists || 1;
  } else if (currentGenreMetric === "rating") {
    valKey = "avg_rating";
    metricLabel = "Điểm đánh giá TB";
    totalForPercent = 5; // Điểm tối đa là 5 sao
  }

  // Cập nhật tiêu đề bảng và biểu đồ
  if (distTitle) {
    distTitle.textContent = `Phân bổ theo ${metricLabel.toLowerCase()}`;
  }
  if (metricHeader) {
    metricHeader.textContent = metricLabel;
  }

  // 3. Sắp xếp danh sách
  filteredGenres.sort((a, b) => {
    if (currentGenreSort === "alpha") {
      return a.genre_name.localeCompare(b.genre_name);
    } else if (currentGenreSort === "asc") {
      return (a[valKey] || 0) - (b[valKey] || 0);
    } else {
      // desc (mặc định)
      return (b[valKey] || 0) - (a[valKey] || 0);
    }
  });

  // Sắp xếp desc để tái sử dụng cho Top Item và Top Distribution
  const sortedByVal = [...genres].sort((a, b) => (b[valKey] || 0) - (a[valKey] || 0));
  const topItem = sortedByVal[0] || {};
  const topDistribution = sortedByVal.slice(0, 6);

  // 4. Render Khối Tổng quan (Genre Summary Box)
  if (summaryBox) {
    const topVal = topItem[valKey] || 0;
    const topPct = currentGenreMetric === "rating"
      ? `${topVal} / 5 ⭐`
      : `${Math.round((topVal / totalForPercent) * 100)}%`;

    let summaryMetricText = "Tổng số game";
    let summaryMetricVal = totals.total_games;

    if (currentGenreMetric === "wishlist") {
      summaryMetricText = "Tổng lượt Wishlist";
      summaryMetricVal = totals.total_wishlists;
    } else if (currentGenreMetric === "rating") {
      summaryMetricText = "Điểm TB cao nhất";
      summaryMetricVal = `${topVal} ⭐`;
    }

    summaryBox.innerHTML = `
      <div class="summary-row">
        <span>${summaryMetricText}</span>
        <strong>${typeof summaryMetricVal === "number" ? summaryMetricVal.toLocaleString() : summaryMetricVal}</strong>
      </div>
      <div class="summary-row">
        <span>Số thể loại</span>
        <strong>${totals.total_genres || genres.length}</strong>
      </div>
      <div class="summary-row">
        <span>Thể loại dẫn đầu</span>
        <strong style="color: #ffffff;">${escapeHtml(topItem.genre_name || "N/A")}</strong>
      </div>
      <div class="summary-row">
        <span>Tỷ lệ dẫn đầu</span>
        <strong style="color: var(--main-color);">${topPct}</strong>
      </div>
    `;
  }

  // 5. Render Biểu đồ phân bổ tiến trình (Distribution Progress Bars - Top 6 thể loại cao nhất)
  if (distList) {
    if (topDistribution.length === 0) {
      distList.innerHTML = `<p style="color: var(--text-secondary); padding: 1rem; text-align: center;">Chưa có dữ liệu phân bổ.</p>`;
    } else {
      distList.innerHTML = topDistribution
        .map((item) => {
          const val = item[valKey] || 0;
          let barPct = 0;

          if (currentGenreMetric === "rating") {
            barPct = Math.min(100, Math.round((val / 5) * 100));
          } else {
            barPct = Math.min(100, Math.round((val / totalForPercent) * 100));
          }

          const displayVal = currentGenreMetric === "rating" ? `${val} ⭐` : val.toLocaleString();

          return `
            <div class="dist-item">
              <span class="dist-label" title="${escapeHtml(item.genre_name)}">${escapeHtml(item.genre_name)}</span>
              <div class="dist-bar-wrapper">
                <div class="dist-bar-fill" style="width: ${barPct}%;"></div>
              </div>
              <span class="dist-val">${displayVal}</span>
            </div>
          `;
        })
        .join("");
    }
  }

  // 6. Render Bảng Chi tiết phân bổ (Table Rows)
  if (tableBody) {
    if (filteredGenres.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: var(--text-secondary); padding: 1.5rem;">Không tìm thấy thể loại nào phù hợp với từ khóa "${escapeHtml(genreSearchQuery)}".</td></tr>`;
      return;
    }

    tableBody.innerHTML = filteredGenres
      .map((item, index) => {
        const rank = index + 1;
        const val = item[valKey] || 0;
        let pctText = "";

        if (currentGenreMetric === "rating") {
          pctText = `${val} / 5`;
        } else {
          pctText = `${((val / totalForPercent) * 100).toFixed(1)}%`;
        }

        let formattedVal = "";
        if (currentGenreMetric === "rating") {
          formattedVal = `<div class="rating-score">${val} <i class="bx bxs-star"></i></div>`;
        } else if (currentGenreMetric === "wishlist") {
          formattedVal = `<span class="wishlist-count-badge" style="padding: 2px 10px; font-size: 0.8rem;"><i class="bx bxs-bookmark-heart"></i> ${val.toLocaleString()}</span>`;
        } else {
          formattedVal = `<strong style="color: var(--text-primary); font-size: 0.92rem;">${val.toLocaleString()}</strong>`;
        }

        return `
          <tr>
            <td style="color: var(--text-muted); font-size: 0.85rem;">${rank}</td>
            <td style="font-weight: 600; color: #ffffff;">${escapeHtml(item.genre_name)}</td>
            <td>${formattedVal}</td>
            <td style="text-align: right; color: var(--text-primary); font-weight: 500;">${pctText}</td>
          </tr>
        `;
      })
      .join("");
  }
}

/**
 * 2. Tải và render dữ liệu Thống kê Wishlist & Đánh giá (Tab 3)
 */
async function loadWishlistStatistics(root) {
  const tableBody = root.querySelector("#wishlist-table-body");
  const statTotal = root.querySelector("#stat-total-wishlist");
  const statGames = root.querySelector("#stat-games-in-wishlist");
  const statUsers = root.querySelector("#stat-users-with-wishlist");

  try {
    if (!wishlistDataCache) {
      const result = await fetchApi("/api/statistics/wishlist");

      if (!result.success || !result.data) {
        if (tableBody) {
          tableBody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--danger); padding: 1.5rem;">Không thể tải dữ liệu Wishlist.</td></tr>`;
        }
        return;
      }
      wishlistDataCache = result.data;
    }

    const { summary } = wishlistDataCache;
    if (summary) {
      if (statTotal) statTotal.textContent = (summary.total_wishlist_items || 0).toLocaleString();
      if (statGames) statGames.textContent = (summary.total_games_in_wishlist || 0).toLocaleString();
      if (statUsers) statUsers.textContent = (summary.total_users_with_wishlist || 0).toLocaleString();
    }

    renderWishlistTable(root);
    renderReviewTable(root);
  } catch (err) {
    console.error("Lỗi khi tải dữ liệu Wishlist & Đánh giá:", err);
    if (tableBody) {
      tableBody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--danger); padding: 1.5rem;">Lỗi kết nối máy chủ khi lấy dữ liệu Wishlist.</td></tr>`;
    }
  }
}

/**
 * Render Bảng Top Game được Wishlist kèm bộ lọc tình trạng và tìm kiếm theo tên
 */
function renderWishlistTable(root) {
  const tableBody = root.querySelector("#wishlist-table-body");
  if (!tableBody || !wishlistDataCache) return;

  const topGames = wishlistDataCache.topGames || [];
  const now = new Date();

  // Lọc theo tình trạng phát hành và từ khóa tìm kiếm
  const filtered = topGames.filter((game) => {
    // 1. Lọc theo tình trạng
    if (wishlistStatusFilter === "released") {
      if (!game.release_date || new Date(game.release_date) > now) return false;
    } else if (wishlistStatusFilter === "upcoming") {
      if (game.release_date && new Date(game.release_date) <= now) return false;
    }

    // 2. Lọc theo tên game
    if (wishlistSearchQuery) {
      const name = (game.name || "").toLowerCase();
      if (!name.includes(wishlistSearchQuery)) return false;
    }

    return true;
  });

  if (filtered.length === 0) {
    tableBody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--text-secondary); padding: 2rem;">Không tìm thấy tựa game nào phù hợp với bộ lọc.</td></tr>`;
    return;
  }

  tableBody.innerHTML = filtered
    .map((game, index) => {
      const rank = index + 1;
      const rankClass = rank <= 3 ? `rank-${rank}` : "";
      const imgUrl = game.image ? game.image.split(' ')[0] : "../../img/placeholder.jpg";
      const releaseDate = game.release_date
        ? new Date(game.release_date).toLocaleDateString("vi-VN")
        : "Chưa rõ";

      const tagBadges = (game.genres || "")
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean)
        .slice(0, 2)
        .map((t) => `<span class="genre-badge">${escapeHtml(t)}</span>`)
        .join("") || `<span style="color: var(--text-muted); font-size: 0.8rem;">Chưa có</span>`;

      return `
        <tr>
          <td>
            <div class="rank-badge ${rankClass}">${rank}</div>
          </td>
          <td>
            <div class="game-cell">
              <img src="${imgUrl}" alt="${escapeHtml(game.name)}" class="game-thumb" onerror="this.src='https://placehold.co/100x60/211f34/ffffff?text=Game'" />
              <span style="font-weight: 600; color: #ffffff;">${escapeHtml(game.name)}</span>
            </div>
          </td>
          <td>
            <div class="genre-tags">${tagBadges}</div>
          </td>
          <td style="color: var(--text-secondary); font-size: 0.85rem;">${releaseDate}</td>
          <td style="text-align: right;">
            <span class="wishlist-count-badge">
              <i class="bx bxs-bookmark-heart"></i>
              ${(game.wishlist_count || 0).toLocaleString()}
            </span>
          </td>
        </tr>
      `;
    })
    .join("");
}

/**
 * Render Bảng Game được đánh giá nhiều nhất kèm bộ lọc mức độ hài lòng và sắp xếp
 */
function renderReviewTable(root) {
  const reviewsBody = root.querySelector("#reviews-table-body");
  if (!reviewsBody || !wishlistDataCache) return;

  const topReviewedGames = wishlistDataCache.topReviewedGames || [];

  // 1. Lọc theo mức độ hài lòng: [ Đánh giá: Tất cả | Cực kỳ tích cực (≥ 4.5 ⭐) | Tích cực (4.0 - 4.4 ⭐) | Trung bình / Kém (< 4.0 ⭐) ]
  let filtered = topReviewedGames.filter((game) => {
    const rating = parseFloat(game.avg_rating) || 0;
    if (reviewTierFilter === "high") {
      return rating >= 4.5;
    } else if (reviewTierFilter === "medium") {
      return rating >= 4.0 && rating < 4.5;
    } else if (reviewTierFilter === "low") {
      return rating < 4.0;
    }
    return true;
  });

  // 2. Sắp xếp theo tiêu chí: [ Nhiều lượt ĐG nhất | Điểm TB cao nhất | Điểm TB thấp nhất ]
  filtered.sort((a, b) => {
    const ratingA = parseFloat(a.avg_rating) || 0;
    const ratingB = parseFloat(b.avg_rating) || 0;
    const countA = a.review_count || 0;
    const countB = b.review_count || 0;

    if (reviewSortCriteria === "rating-desc") {
      if (ratingB !== ratingA) return ratingB - ratingA;
      return countB - countA;
    } else if (reviewSortCriteria === "rating-asc") {
      if (ratingA !== ratingB) return ratingA - ratingB;
      return countB - countA;
    } else if (reviewSortCriteria === "count-asc") {
      if (countA !== countB) return countA - countB;
      return ratingB - ratingA;
    } else {
      // count-desc (mặc định: Nhiều lượt ĐG nhất)
      if (countB !== countA) return countB - countA;
      return ratingB - ratingA;
    }
  });

  if (filtered.length === 0) {
    reviewsBody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--text-secondary); padding: 2rem;">Không tìm thấy tựa game nào phù hợp với bộ lọc đánh giá.</td></tr>`;
    return;
  }

  reviewsBody.innerHTML = filtered
    .map((game, index) => {
      const rank = index + 1;
      const rankClass = rank <= 3 ? `rank-${rank}` : "";
      const imgUrl = game.image ? game.image.split(' ')[0] : "../../img/placeholder.jpg";

      const tagBadges = (game.genres || "")
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean)
        .slice(0, 2)
        .map((t) => `<span class="genre-badge">${escapeHtml(t)}</span>`)
        .join("") || `<span style="color: var(--text-muted); font-size: 0.8rem;">Chưa có</span>`;

      return `
        <tr>
          <td>
            <div class="rank-badge ${rankClass}">${rank}</div>
          </td>
          <td>
            <div class="game-cell">
              <img src="${imgUrl}" alt="${escapeHtml(game.name)}" class="game-thumb" onerror="this.src='https://placehold.co/100x60/211f34/ffffff?text=Game'" />
              <span style="font-weight: 600; color: #ffffff;">${escapeHtml(game.name)}</span>
            </div>
          </td>
          <td>
            <div class="genre-tags">${tagBadges}</div>
          </td>
          <td style="text-align: center; color: var(--text-primary); font-weight: 500;">
            <span style="display: inline-flex; align-items: center; gap: 4px;">
              <i class='bx bx-comment-detail' style='color: var(--text-muted); font-size: 1rem;'></i>
              ${(game.review_count || 0).toLocaleString()}
            </span>
          </td>
          <td style="text-align: right;">
            <div class="rating-score" style="justify-content: flex-end; font-size: 0.95rem;">
              ${game.avg_rating} <i class="bx bxs-star"></i>
            </div>
          </td>
        </tr>
      `;
    })
    .join("");
}

/**
 * 3. Tải và render dữ liệu Thống kê Phần cứng (Hardware Insights)
 */
async function loadHardwareStatistics(root) {
  const r = root || document;
  const statCpus = r.querySelector("#stat-total-cpus");
  const statGpus = r.querySelector("#stat-total-gpus");
  const statUserPcs = r.querySelector("#stat-total-user-pcs");

  const gpuDonutContainer = r.querySelector("#gpu-market-donut");
  const cpuDonutContainer = r.querySelector("#cpu-market-donut");
  const ramListContainer = r.querySelector("#ram-distribution-list");

  const topCpusBody = r.querySelector("#top-cpus-table-body");
  const topGpusBody = r.querySelector("#top-gpus-table-body");

  try {
    if (!hardwareDataCache) {
      const result = await fetchApi("/api/statistics/hardware");

      if (!result.success || !result.data) {
        const msg = result.message || "Không thể tải dữ liệu Phần cứng.";
        if (topCpusBody) topCpusBody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--danger); padding: 1.5rem;">${escapeHtml(msg)}</td></tr>`;
        if (topGpusBody) topGpusBody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--danger); padding: 1.5rem;">${escapeHtml(msg)}</td></tr>`;
        return;
      }
      hardwareDataCache = result.data;
    }

    const totals = hardwareDataCache.totals || {};
    const cpuMarketShare = hardwareDataCache.cpuMarketShare || [];
    const gpuMarketShare = hardwareDataCache.gpuMarketShare || [];
    const topCpus = hardwareDataCache.topCpus || [];
    const topGpus = hardwareDataCache.topGpus || [];
    const ramDistribution = hardwareDataCache.ramDistribution || [];

    if (statCpus) statCpus.textContent = (totals.total_cpus || 0).toLocaleString();
    if (statGpus) statGpus.textContent = (totals.total_gpus || 0).toLocaleString();
    if (statUserPcs) statUserPcs.textContent = (totals.total_user_pcs || 0).toLocaleString();

    if (gpuDonutContainer) {
      renderGpuMarketShare(gpuDonutContainer, gpuMarketShare, totals.total_gpus || 0);
    }

    if (cpuDonutContainer) {
      renderCpuMarketShare(cpuDonutContainer, cpuMarketShare, totals.total_cpus || 0);
    }

    if (ramListContainer) {
      renderRamDistribution(ramListContainer, ramDistribution, totals.total_user_pcs || 0);
    }

    renderHardwareCpuTable(r);
    renderHardwareGpuTable(r);
  } catch (err) {
    console.error("Lỗi khi tải dữ liệu Hardware:", err);
    if (topCpusBody) topCpusBody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--danger); padding: 1.5rem;">Lỗi kết nối máy chủ khi lấy dữ liệu CPU.</td></tr>`;
    if (topGpusBody) topGpusBody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--danger); padding: 1.5rem;">Lỗi kết nối máy chủ khi lấy dữ liệu GPU.</td></tr>`;
  }
}

/**
 * Render Biểu đồ Donut Thị phần GPU (NVIDIA, AMD, Intel, Khác...)
 */
function renderGpuMarketShare(container, marketShare, totalGpus) {
  if (!marketShare || marketShare.length === 0) {
    container.innerHTML = `<p style="color: var(--text-secondary); font-size: 0.85rem;">Chưa có dữ liệu</p>`;
    return;
  }

  const brandColors = {
    AMD: "#ef4444",
    NVIDIA: "#84cc16",
    Intel: "#0ea5e9",
    Apple: "#94a3b8",
    Other: "#64748b",
  };

  const total = totalGpus || marketShare.reduce((sum, item) => sum + item.count, 0) || 1;

  let currentPercent = 0;
  const gradientStops = [];

  const legendItemsHtml = marketShare.map((item) => {
    const brand = item.brand || "Other";
    const color = brandColors[brand] || brandColors.Other;
    const pct = ((item.count / total) * 100);
    const start = currentPercent.toFixed(1);
    currentPercent += pct;
    const end = currentPercent.toFixed(1);

    gradientStops.push(`${color} ${start}% ${end}%`);

    return `
      <div class="legend-item">
        <div class="legend-color">
          <div class="color-dot" style="background-color: ${color};"></div>
          <span>${escapeHtml(brand)}</span>
        </div>
        <span style="font-weight: 600;">${pct.toFixed(1)}% <small style="color: var(--text-muted); font-size: 0.75rem;">(${item.count.toLocaleString()})</small></span>
      </div>
    `;
  }).join("");

  const conicStyle = `conic-gradient(${gradientStops.join(", ")})`;

  container.innerHTML = `
    <div class="donut-chart" style="background: ${conicStyle};">
      <div class="donut-hole">
        <h3>${total.toLocaleString()}</h3>
        <p>Tổng GPU</p>
      </div>
    </div>
    <div class="chart-legend">
      ${legendItemsHtml}
    </div>
  `;
}

/**
 * Render Biểu đồ Donut Thị phần CPU (Intel vs AMD)
 */
function renderCpuMarketShare(container, marketShare, totalCpus) {
  if (!marketShare || marketShare.length === 0) {
    container.innerHTML = `<p style="color: var(--text-secondary); font-size: 0.85rem;">Chưa có dữ liệu</p>`;
    return;
  }

  const brandColors = {
    Intel: "#0ea5e9",
    AMD: "#ef4444",
    Other: "#64748b",
  };

  const total = totalCpus || marketShare.reduce((sum, item) => sum + item.count, 0) || 1;

  let currentPercent = 0;
  const gradientStops = [];

  const legendItemsHtml = marketShare.map((item) => {
    const brand = item.brand || "Other";
    const color = brandColors[brand] || brandColors.Other;
    const pct = ((item.count / total) * 100);
    const start = currentPercent.toFixed(1);
    currentPercent += pct;
    const end = currentPercent.toFixed(1);

    gradientStops.push(`${color} ${start}% ${end}%`);

    return `
      <div class="legend-item">
        <div class="legend-color">
          <div class="color-dot" style="background-color: ${color};"></div>
          <span>${escapeHtml(brand)}</span>
        </div>
        <span style="font-weight: 600;">${pct.toFixed(1)}% <small style="color: var(--text-muted); font-size: 0.75rem;">(${item.count.toLocaleString()})</small></span>
      </div>
    `;
  }).join("");

  const conicStyle = `conic-gradient(${gradientStops.join(", ")})`;

  container.innerHTML = `
    <div class="donut-chart" style="background: ${conicStyle};">
      <div class="donut-hole">
        <h3>${total.toLocaleString()}</h3>
        <p>Tổng CPU</p>
      </div>
    </div>
    <div class="chart-legend">
      ${legendItemsHtml}
    </div>
  `;
}

/**
 * Render Thanh phân bổ dung lượng RAM
 */
function renderRamDistribution(container, ramDistribution, totalUserPcs) {
  if (!ramDistribution || ramDistribution.length === 0) {
    container.innerHTML = `<p style="color: var(--text-secondary); font-size: 0.85rem;">Chưa có cấu hình máy nào được lưu.</p>`;
    return;
  }

  const total = totalUserPcs || ramDistribution.reduce((sum, item) => sum + item.count, 0) || 1;

  container.innerHTML = ramDistribution.map((item) => {
    const pct = Math.round((item.count / total) * 100);
    return `
      <div class="dist-item">
        <span class="dist-label">${escapeHtml(item.ram_tier)}</span>
        <div class="dist-bar-wrapper">
          <div class="dist-bar-fill" style="width: ${pct}%; background-color: var(--main-color);"></div>
        </div>
        <span class="dist-val">${pct}%</span>
      </div>
    `;
  }).join("");
}

/**
 * Render Bảng Top CPU máy người dùng kèm bộ lọc Hãng, Sắp xếp và Tìm kiếm
 */
function renderHardwareCpuTable(root) {
  const r = root || document;
  const topCpusBody = r.querySelector("#top-cpus-table-body");
  if (!topCpusBody || !hardwareDataCache) return;

  const topCpus = hardwareDataCache.topCpus || [];

  // 1. Lọc theo hãng và từ khóa tìm kiếm
  let filtered = topCpus.filter((hw) => {
    if (cpuBrandFilter !== "all") {
      const brand = (hw.brand || "").toLowerCase();
      if (!brand.includes(cpuBrandFilter.toLowerCase())) return false;
    }
    if (cpuSearchQuery) {
      const name = (hw.name || "").toLowerCase();
      if (!name.includes(cpuSearchQuery)) return false;
    }
    return true;
  });

  // 2. Sắp xếp theo tiêu chí: [ Phổ biến nhất | Ít phổ biến nhất | Điểm Bench cao nhất | Điểm Bench thấp nhất ]
  filtered.sort((a, b) => {
    const popA = a.user_count || 0;
    const popB = b.user_count || 0;
    const benchA = Number(a.benchmark_score) || 0;
    const benchB = Number(b.benchmark_score) || 0;

    if (cpuSortCriteria === "pop-asc") {
      if (popA !== popB) return popA - popB;
      return benchB - benchA;
    } else if (cpuSortCriteria === "bench-desc") {
      if (benchB !== benchA) return benchB - benchA;
      return popB - popA;
    } else if (cpuSortCriteria === "bench-asc") {
      if (benchA !== benchB) return benchA - benchB;
      return popB - popA;
    } else {
      // pop-desc (mặc định: Phổ biến nhất)
      if (popB !== popA) return popB - popA;
      return benchB - benchA;
    }
  });

  if (filtered.length === 0) {
    topCpusBody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--text-secondary); padding: 2rem;">Không tìm thấy CPU nào phù hợp với bộ lọc.</td></tr>`;
    return;
  }

  topCpusBody.innerHTML = filtered.map((hw, idx) => {
    const rank = idx + 1;
    const rankClass = rank <= 3 ? `rank-${rank}` : "";
    const brandLower = (hw.brand || "").toLowerCase();
    const brandClass = brandLower.includes("intel")
      ? "intel"
      : brandLower.includes("amd")
        ? "amd"
        : "other";

    const benchScoreVal = Number(hw.benchmark_score) || 0;
    const benchScore = hw.benchmark_score ? benchScoreVal.toLocaleString() : "N/A";
    const benchTier = getBenchmarkTierClass(benchScoreVal);
    const userCount = hw.user_count || 1;

    return `
      <tr>
        <td><div class="rank-badge ${rankClass}">${rank}</div></td>
        <td style="font-weight: 500; color: #ffffff;" title="${escapeHtml(hw.name)}">${escapeHtml(hw.name)}</td>
        <td><span class="brand-badge ${brandClass}">${escapeHtml(hw.brand || "Khác")}</span></td>
        <td style="text-align: right;">
          <span class="benchmark-badge ${benchTier}">
            <i class="bx bx-tachometer"></i>
            ${benchScore}
          </span>
        </td>
        <td style="text-align: right; font-weight: 600; color: var(--text-primary);">${userCount}</td>
      </tr>
    `;
  }).join("");
}

/**
 * Render Bảng Top GPU máy người dùng kèm bộ lọc Hãng, Sắp xếp và Tìm kiếm
 */
function renderHardwareGpuTable(root) {
  const r = root || document;
  const topGpusBody = r.querySelector("#top-gpus-table-body");
  if (!topGpusBody || !hardwareDataCache) return;

  const topGpus = hardwareDataCache.topGpus || [];

  // 1. Lọc theo hãng và từ khóa tìm kiếm
  let filtered = topGpus.filter((hw) => {
    if (gpuBrandFilter !== "all") {
      const brand = (hw.brand || "").toLowerCase();
      if (!brand.includes(gpuBrandFilter.toLowerCase())) return false;
    }
    if (gpuSearchQuery) {
      const name = (hw.name || "").toLowerCase();
      if (!name.includes(gpuSearchQuery)) return false;
    }
    return true;
  });

  // 2. Sắp xếp theo tiêu chí: [ Phổ biến nhất | Ít phổ biến nhất | Điểm Bench cao nhất | Điểm Bench thấp nhất ]
  filtered.sort((a, b) => {
    const popA = a.user_count || 0;
    const popB = b.user_count || 0;
    const benchA = Number(a.benchmark_score) || 0;
    const benchB = Number(b.benchmark_score) || 0;

    if (gpuSortCriteria === "pop-asc") {
      if (popA !== popB) return popA - popB;
      return benchB - benchA;
    } else if (gpuSortCriteria === "bench-desc") {
      if (benchB !== benchA) return benchB - benchA;
      return popB - popA;
    } else if (gpuSortCriteria === "bench-asc") {
      if (benchA !== benchB) return benchA - benchB;
      return popB - popA;
    } else {
      // pop-desc (mặc định: Phổ biến nhất)
      if (popB !== popA) return popB - popA;
      return benchB - benchA;
    }
  });

  if (filtered.length === 0) {
    topGpusBody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--text-secondary); padding: 2rem;">Không tìm thấy GPU nào phù hợp với bộ lọc.</td></tr>`;
    return;
  }

  topGpusBody.innerHTML = filtered.map((hw, idx) => {
    const rank = idx + 1;
    const rankClass = rank <= 3 ? `rank-${rank}` : "";
    const brandLower = (hw.brand || "").toLowerCase();
    const brandClass = brandLower.includes("nvidia")
      ? "nvidia"
      : brandLower.includes("amd")
        ? "amd"
        : brandLower.includes("intel")
          ? "intel"
          : "other";

    const benchScoreVal = Number(hw.benchmark_score) || 0;
    const benchScore = hw.benchmark_score ? benchScoreVal.toLocaleString() : "N/A";
    const benchTier = getBenchmarkTierClass(benchScoreVal);
    const userCount = hw.user_count || 1;

    return `
      <tr>
        <td><div class="rank-badge ${rankClass}">${rank}</div></td>
        <td style="font-weight: 500; color: #ffffff;" title="${escapeHtml(hw.name)}">${escapeHtml(hw.name)}</td>
        <td><span class="brand-badge ${brandClass}">${escapeHtml(hw.brand || "Khác")}</span></td>
        <td style="text-align: right;">
          <span class="benchmark-badge ${benchTier}">
            <i class="bx bx-tachometer"></i>
            ${benchScore}
          </span>
        </td>
        <td style="text-align: right; font-weight: 600; color: var(--text-primary);">${userCount}</td>
      </tr>
    `;
  }).join("");
}

/**
 * Phân cấp màu hiệu năng Benchmark theo 4 Tiers (Idea 1):
 * - Ultra (>= 15,000): Tím Neon huyền thoại
 * - High (7,000 - 14,999): Xanh Ngọc Lục Bảo Emerald
 * - Mid (3,000 - 6,999): Xanh Cyan / Sky Blue
 * - Entry (< 3,000): Xám Bạc Cool Slate
 */
function getBenchmarkTierClass(score) {
  const s = Number(score) || 0;
  if (s >= 15000) return "tier-ultra";
  if (s >= 7000) return "tier-high";
  if (s >= 3000) return "tier-mid";
  return "tier-entry";
}

/**
 * Helper định dạng ngày (dd/mm/yyyy)
 */
function formatDate(dateStr) {
  if (!dateStr) return "Chưa cập nhật";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * Helper chống XSS đơn giản
 */
function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * ============================================================================
 * MODULE XUẤT BÁO CÁO THỐNG KÊ (EXPORT STATS TO XLSX / CSV / PDF)
 * ============================================================================
 */

/**
 * Khởi tạo Module Xuất Báo Cáo Thống Kê & Mini Modal
 */
function initExportModule(root) {
  const openModalBtn = root.querySelector("#btn-open-export-modal");
  let modal = root.querySelector("#export-stats-modal") || document.querySelector("#export-stats-modal");
  if (!openModalBtn || !modal) return;

  // Di chuyển modal ra ngoài document.body để luôn canh giữa chính xác toàn màn hình (không bị ảnh hưởng bởi backdrop-filter của container cha)
  if (modal.parentElement !== document.body) {
    document.body.appendChild(modal);
  }

  const closeModalBtn = modal.querySelector("#btn-close-export-modal");
  const cancelModalBtn = modal.querySelector("#btn-cancel-export");
  const confirmExportBtn = modal.querySelector("#btn-confirm-export");
  const scopeSelect = root.querySelector("#export-scope-select");
  const targetBadge = modal.querySelector("#export-target-badge");
  const formatCards = modal.querySelectorAll(".export-option-card");

  // 1. Mở modal khi bấm nút "Xuất thống kê"
  openModalBtn.addEventListener("click", () => {
    const scope = scopeSelect ? scopeSelect.value : "tab-1";

    const scopeLabels = {
      "tab-1": "Tab 1: Chung",
      "tab-2": "Tab 2: Thể loại",
      "tab-3": "Tab 3: Wishlist & Đánh giá",
      "tab-4": "Tab 4: Phần cứng",
      "all": "Tất cả tab",
    };

    if (targetBadge) {
      targetBadge.textContent = scopeLabels[scope] || "Thống kê";
    }

    modal.classList.remove("hidden");
  });

  // 2. Đóng modal
  const closeModal = () => modal.classList.add("hidden");
  if (closeModalBtn) closeModalBtn.addEventListener("click", closeModal);
  if (cancelModalBtn) cancelModalBtn.addEventListener("click", closeModal);
  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeModal();
  });

  // 3. Chọn loại file (XLSX, CSV, PDF)
  formatCards.forEach((card) => {
    card.addEventListener("click", () => {
      formatCards.forEach((c) => {
        c.classList.remove("selected");
        const radioIcon = c.querySelector(".export-radio i");
        if (radioIcon) {
          radioIcon.className = "bx bx-circle";
        }
      });

      card.classList.add("selected");
      const radioIcon = card.querySelector(".export-radio i");
      if (radioIcon) {
        radioIcon.className = "bx bxs-check-circle";
      }

      selectedExportFormat = card.getAttribute("data-format") || "xlsx";
    });
  });

  // 4. Bắt đầu xuất file khi bấm nút xác nhận
  if (confirmExportBtn) {
    confirmExportBtn.addEventListener("click", async () => {
      const scope = scopeSelect ? scopeSelect.value : "tab-1";

      const originalBtnHtml = confirmExportBtn.innerHTML;
      confirmExportBtn.disabled = true;
      confirmExportBtn.innerHTML = `<i class="bx bx-loader-alt bx-spin"></i> Đang xuất...`;

      try {
        await executeExportStatistics(scope, selectedExportFormat);
        closeModal();
      } catch (err) {
        console.error("Lỗi khi xuất thống kê:", err);
        alert("Có lỗi xảy ra trong quá trình xuất dữ liệu: " + err.message);
      } finally {
        confirmExportBtn.disabled = false;
        confirmExportBtn.innerHTML = originalBtnHtml;
      }
    });
  }
}

/**
 * Đảm bảo nạp dữ liệu cho tất cả các tab cần xuất
 */
async function ensureDataLoadedForScope(scope) {
  const promises = [];
  if (scope === "all" || scope === "tab-1") {
    if (!generalDataCache) {
      promises.push(
        fetchApi("/api/statistics/general").then((res) => {
          if (res.success && res.data) generalDataCache = res.data;
        })
      );
    }
  }
  if (scope === "all" || scope === "tab-2") {
    if (!genreDataCache) {
      promises.push(
        fetchApi("/api/statistics/genres").then((res) => {
          if (res.success && res.data) genreDataCache = res.data;
        })
      );
    }
  }
  if (scope === "all" || scope === "tab-3") {
    if (!wishlistDataCache) {
      promises.push(
        fetchApi("/api/statistics/wishlist").then((res) => {
          if (res.success && res.data) wishlistDataCache = res.data;
        })
      );
    }
  }
  if (scope === "all" || scope === "tab-4") {
    if (!hardwareDataCache) {
      promises.push(
        fetchApi("/api/statistics/hardware").then((res) => {
          if (res.success && res.data) hardwareDataCache = res.data;
        })
      );
    }
  }
  if (promises.length > 0) {
    await Promise.all(promises);
  }
}

/**
 * Thực thi xuất dữ liệu theo định dạng đã chọn
 */
async function executeExportStatistics(scope, format) {
  await ensureDataLoadedForScope(scope);

  const dateStr = new Date().toISOString().slice(0, 10);
  const datasets = collectExportDatasets(scope);

  if (!datasets || datasets.length === 0) {
    throw new Error("Không có dữ liệu để xuất");
  }

  if (format === "xlsx") {
    await exportToExcel(datasets, scope, dateStr);
  } else if (format === "csv") {
    exportToCsv(datasets, scope);
  } else if (format === "pdf") {
    exportToPdf(datasets, scope);
  }
}

/**
 * Thu thập và cấu trúc dữ liệu xuất theo định dạng mảng JSON
 */
function collectExportDatasets(scope) {
  const result = [];

  // Tab 1: Tổng quan
  if (scope === "all" || scope === "tab-1") {
    if (generalDataCache) {
      const { totals, timeline, recentGames } = generalDataCache;
      if (totals) {
        const totalGames = totals.total_games || 0;
        const activeGames = totals.active_games || 0;
        const inactiveGames = totals.inactive_games || 0;
        const activePct = totalGames > 0 ? ((activeGames / totalGames) * 100).toFixed(1) : "100.0";
        const inactivePct = totalGames > 0 ? ((inactiveGames / totalGames) * 100).toFixed(1) : "0.0";

        result.push({
          name: "Thống kê chung",
          title: "BÁO CÁO THỐNG KÊ CHUNG - TỔNG QUAN HỆ THỐNG",
          data: [
            { "Chỉ số": "Tổng số game", "Giá trị": totalGames, "Tỷ lệ %": "100%" },
            { "Chỉ số": "Game đang hoạt động", "Giá trị": activeGames, "Tỷ lệ %": `${activePct}%` },
            { "Chỉ số": "Game ngừng hoạt động", "Giá trị": inactiveGames, "Tỷ lệ %": `${inactivePct}%` },
          ],
        });
      }
      if (timeline && timeline.length > 0) {
        result.push({
          name: "Biến động phát hành",
          title: "BIẾN ĐỘNG SỐ LƯỢNG GAME PHÁT HÀNH THEO NĂM",
          data: timeline.map((t) => ({
            "Năm phát hành": t.year,
            "Số lượng game": t.count,
          })),
        });
      }
      if (recentGames && recentGames.length > 0) {
        result.push({
          name: "Game thêm gần đây",
          title: "DANH SÁCH GAME ĐƯỢC THÊM GẦN ĐÂY",
          data: recentGames.map((g, idx) => ({
            "STT": idx + 1,
            "Mã game": g.game_id,
            "Tên game": g.name,
            "Thể loại": g.genres || "Chưa có",
            "Ngày phát hành": formatDate(g.release_date),
            "Trạng thái": g.is_active ? "Đang hoạt động" : "Ngừng hoạt động",
          })),
        });
      }
    }
  }

  // Tab 2: Thể loại
  if (scope === "all" || scope === "tab-2") {
    if (genreDataCache && genreDataCache.genres) {
      const totalGames = genreDataCache.totals?.total_games || (genreDataCache.genres.reduce((s, g) => s + (g.game_count || 0), 0) || 1);
      const totalWishlists = genreDataCache.totals?.total_wishlists || (genreDataCache.genres.reduce((s, g) => s + (g.wishlist_count || 0), 0) || 1);

      if (genreDataCache.totals) {
        const topGenre = genreDataCache.genres[0] || {};
        const topPct = topGenre.game_count ? `${((topGenre.game_count / totalGames) * 100).toFixed(1)}%` : "0%";

        result.push({
          name: "Tổng quan thể loại",
          title: "TỔNG QUAN PHÂN BỔ THỂ LOẠI GAME",
          data: [
            { "Chỉ số": "Tổng số game", "Giá trị": genreDataCache.totals.total_games || 0 },
            { "Chỉ số": "Tổng số thể loại", "Giá trị": genreDataCache.totals.total_genres || genreDataCache.genres.length || 0 },
            { "Chỉ số": "Tổng lượt Wishlist", "Giá trị": genreDataCache.totals.total_wishlists || 0 },
            { "Chỉ số": "Thể loại dẫn đầu", "Giá trị": topGenre.genre_name || "N/A" },
            { "Chỉ số": "Tỷ lệ dẫn đầu", "Giá trị": topPct },
          ],
        });
      }

      result.push({
        name: "Thống kê thể loại",
        title: "PHÂN BỔ THỐNG KÊ THEO THỂ LOẠI GAME",
        data: genreDataCache.genres.map((g, idx) => ({
          "STT": idx + 1,
          "Mã thể loại": g.tag_id,
          "Tên thể loại": g.genre_name,
          "Số lượng game": g.game_count || 0,
          "Tỷ lệ game (%)": `${((g.game_count / totalGames) * 100).toFixed(1)}%`,
          "Lượt Wishlist": g.wishlist_count || 0,
          "Tỷ lệ Wishlist (%)": `${((g.wishlist_count / totalWishlists) * 100).toFixed(1)}%`,
          "Điểm đánh giá TB": g.avg_rating || 0,
          "Số lượt đánh giá": g.review_count || 0,
        })),
      });
    }
  }

  // Tab 3: Wishlist & Đánh giá
  if (scope === "all" || scope === "tab-3") {
    if (wishlistDataCache) {
      if (wishlistDataCache.summary) {
        result.push({
          name: "Tổng quan Wishlist",
          title: "TỔNG QUAN WISHLIST & ĐÁNH GIÁ",
          data: [
            { "Chỉ số": "Tổng lượt Wishlist", "Giá trị": wishlistDataCache.summary.total_wishlist_items || 0 },
            { "Chỉ số": "Số game trong Wishlist", "Giá trị": wishlistDataCache.summary.total_games_in_wishlist || 0 },
            { "Chỉ số": "Người dùng đã Wishlist", "Giá trị": wishlistDataCache.summary.total_users_with_wishlist || 0 },
          ],
        });
      }
      if (wishlistDataCache.topGames && wishlistDataCache.topGames.length > 0) {
        result.push({
          name: "Top Wishlist",
          title: "TOP GAME ĐƯỢC THÊM VÀO WISHLIST NHIỀU NHẤT",
          data: wishlistDataCache.topGames.map((g, idx) => ({
            "Hạng": idx + 1,
            "Mã game": g.game_id,
            "Tên game": g.name,
            "Thể loại": g.genres || "Chưa có",
            "Lượt Wishlist": g.wishlist_count || 0,
          })),
        });
      }
      if (wishlistDataCache.topReviewedGames && wishlistDataCache.topReviewedGames.length > 0) {
        result.push({
          name: "Top Đánh giá",
          title: "TOP GAME ĐƯỢC ĐÁNH GIÁ NHIỀU NHẤT",
          data: wishlistDataCache.topReviewedGames.map((g, idx) => ({
            "Hạng": idx + 1,
            "Mã game": g.game_id,
            "Tên game": g.name,
            "Thể loại": g.genres || "Chưa có",
            "Số lượt đánh giá": g.review_count || 0,
            "Điểm đánh giá TB": g.avg_rating || 0,
          })),
        });
      }
    }
  }

  // Tab 4: Phần cứng
  if (scope === "all" || scope === "tab-4") {
    if (hardwareDataCache) {
      if (hardwareDataCache.totals) {
        result.push({
          name: "Tổng quan phần cứng",
          title: "TỔNG QUAN KHO PHẦN CỨNG & CẤU HÌNH NGƯỜI DÙNG",
          data: [
            { "Chỉ số": "Tổng số CPU trong kho", "Giá trị": hardwareDataCache.totals.total_cpus || 0 },
            { "Chỉ số": "Tổng số GPU trong kho", "Giá trị": hardwareDataCache.totals.total_gpus || 0 },
            { "Chỉ số": "Số cấu hình PC đã lưu", "Giá trị": hardwareDataCache.totals.total_user_pcs || 0 },
          ],
        });
      }
      if (hardwareDataCache.topCpus && hardwareDataCache.topCpus.length > 0) {
        result.push({
          name: "Top CPU",
          title: "DANH SÁCH CPU PHỔ BIẾN & HIỆU NĂNG BENCHMARK",
          data: hardwareDataCache.topCpus.map((c, idx) => ({
            "Hạng": idx + 1,
            "Tên CPU": c.name,
            "Hãng": c.brand || "Khác",
            "Điểm Benchmark": c.benchmark_score || "N/A",
            "Số máy sử dụng": c.user_count || 1,
          })),
        });
      }
      if (hardwareDataCache.topGpus && hardwareDataCache.topGpus.length > 0) {
        result.push({
          name: "Top GPU",
          title: "DANH SÁCH GPU PHỔ BIẾN & HIỆU NĂNG BENCHMARK",
          data: hardwareDataCache.topGpus.map((g, idx) => ({
            "Hạng": idx + 1,
            "Tên GPU": g.name,
            "Hãng": g.brand || "Khác",
            "Điểm Benchmark": g.benchmark_score || "N/A",
            "Số máy sử dụng": g.user_count || 1,
          })),
        });
      }
      if (hardwareDataCache.cpuMarketShare && hardwareDataCache.cpuMarketShare.length > 0) {
        const totalCpus = hardwareDataCache.totals?.total_cpus || hardwareDataCache.cpuMarketShare.reduce((s, c) => s + (c.count || 0), 0) || 1;
        result.push({
          name: "Thị phần CPU",
          title: "THỊ PHẦN THƯƠNG HIỆU CPU",
          data: hardwareDataCache.cpuMarketShare.map((c) => {
            const pct = c.percentage !== undefined ? c.percentage : Number(((c.count / totalCpus) * 100).toFixed(1));
            return {
              "Hãng CPU": c.brand,
              "Số máy": c.count,
              "Tỷ lệ %": `${pct}%`,
            };
          }),
        });
      }
      if (hardwareDataCache.gpuMarketShare && hardwareDataCache.gpuMarketShare.length > 0) {
        const totalGpus = hardwareDataCache.totals?.total_gpus || hardwareDataCache.gpuMarketShare.reduce((s, g) => s + (g.count || 0), 0) || 1;
        result.push({
          name: "Thị phần GPU",
          title: "THỊ PHẦN THƯƠNG HIỆU GPU",
          data: hardwareDataCache.gpuMarketShare.map((g) => {
            const pct = g.percentage !== undefined ? g.percentage : Number(((g.count / totalGpus) * 100).toFixed(1));
            return {
              "Hãng GPU": g.brand,
              "Số máy": g.count,
              "Tỷ lệ %": `${pct}%`,
            };
          }),
        });
      }
      if (hardwareDataCache.ramDistribution && hardwareDataCache.ramDistribution.length > 0) {
        const totalPcs = hardwareDataCache.totals?.total_user_pcs || hardwareDataCache.ramDistribution.reduce((s, r) => s + (r.count || 0), 0) || 1;
        result.push({
          name: "Phân bố RAM",
          title: "PHÂN BỐ DUNG LƯỢNG BỘ NHỚ RAM",
          data: hardwareDataCache.ramDistribution.map((r) => {
            const pct = r.percentage !== undefined ? r.percentage : Number(((r.count / totalPcs) * 100).toFixed(1));
            return {
              "Dung lượng RAM": r.ram_tier || r.ram_group || "N/A",
              "Số máy": r.count,
              "Tỷ lệ %": `${pct}%`,
            };
          }),
        });
      }
    }
  }

  return result;
}

/**
 * Xuất file Excel (.xlsx)
 */
async function exportToExcel(datasets, scope, dateStr) {
  if (!window.XLSX) {
    // Tải động SheetJS nếu chưa có sẵn
    await new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js";
      script.onload = resolve;
      script.onerror = () => reject(new Error("Không thể tải thư viện SheetJS (xlsx)"));
      document.head.appendChild(script);
    });
  }

  const wb = window.XLSX.utils.book_new();
  const usedSheetNames = new Set();

  datasets.forEach((ds) => {
    if (ds.data && ds.data.length > 0) {
      const ws = window.XLSX.utils.json_to_sheet(ds.data);
      // Giới hạn tên sheet tối đa 31 ký tự theo chuẩn Excel & tránh trùng lặp
      let sheetName = ds.name.substring(0, 31);
      if (usedSheetNames.has(sheetName)) {
        sheetName = ds.name.substring(0, 27) + "_" + (usedSheetNames.size + 1);
      }
      usedSheetNames.add(sheetName);
      window.XLSX.utils.book_append_sheet(wb, ws, sheetName);
    }
  });

  const scopeNames = {
    "tab-1": "Chung",
    "tab-2": "TheLoai",
    "tab-3": "Wishlist_DanhGia",
    "tab-4": "PhanCung",
    "all": "ToanBo_HeThong",
  };
  const fileName = `GameFit_ThongKe_${scopeNames[scope] || "BaoCao"}_${dateStr}.xlsx`;
  window.XLSX.writeFile(wb, fileName);
}

/**
 * Xuất file CSV (xuất từng file riêng cho từng bảng kèm UTF-8 BOM)
 */
function exportToCsv(datasets, scope) {
  datasets.forEach((ds, index) => {
    if (!ds.data || ds.data.length === 0) return;
    setTimeout(() => {
      const safeName = ds.name.replace(/\s+/g, "_");
      const filename = `GameFit_${safeName}.csv`;
      downloadCsv(filename, ds.data);
    }, index * 250);
  });
}

/**
 * Tải xuống 1 file CSV có hỗ trợ UTF-8 BOM
 */
function downloadCsv(filename, dataArray) {
  if (!dataArray || dataArray.length === 0) return;
  const headers = Object.keys(dataArray[0]);
  const rows = dataArray.map((row) =>
    headers
      .map((header) => {
        let val = row[header] !== undefined && row[header] !== null ? String(row[header]) : "";
        val = val.replace(/"/g, '""');
        return `"${val}"`;
      })
      .join(",")
  );
  const csvContent = "\uFEFF" + [headers.map((h) => `"${h}"`).join(","), ...rows].join("\r\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Xuất tài liệu in ấn / PDF trực quan
 */
function exportToPdf(datasets, scope) {
  const scopeNames = {
    "tab-1": "Tab 1: Thống Kê Chung",
    "tab-2": "Tab 2: Thống Kê Thể Loại",
    "tab-3": "Tab 3: Wishlist & Đánh Giá",
    "tab-4": "Tab 4: Thống Kê Phần Cứng",
    "all": "Toàn Bộ Hệ Thống (4 Tab)",
  };

  const scopeTitle = scopeNames[scope] || "Báo Cáo Thống Kê";
  const nowStr = new Date().toLocaleString("vi-VN");

  const tablesHtml = datasets
    .map((ds) => {
      if (!ds.data || ds.data.length === 0) return "";
      const headers = Object.keys(ds.data[0]);
      const headerRow = headers.map((h) => `<th>${escapeHtml(h)}</th>`).join("");
      const bodyRows = ds.data
        .map((row) => {
          const cells = headers
            .map((h) => `<td>${escapeHtml(String(row[h] !== undefined && row[h] !== null ? row[h] : ""))}</td>`)
            .join("");
          return `<tr>${cells}</tr>`;
        })
        .join("");

      return `
        <div class="pdf-section">
          <h2 class="pdf-section-title">${escapeHtml(ds.title || ds.name)}</h2>
          <table class="pdf-table">
            <thead>
              <tr>${headerRow}</tr>
            </thead>
            <tbody>
              ${bodyRows}
            </tbody>
          </table>
        </div>
      `;
    })
    .join("");

  const printHtml = `
    <!DOCTYPE html>
    <html lang="vi">
    <head>
      <meta charset="UTF-8" />
      <title>Báo cáo thống kê GameFit - ${escapeHtml(scopeTitle)}</title>
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          color: #1a1a1a;
          background: #ffffff;
          padding: 24px;
          line-height: 1.5;
        }
        .pdf-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 2px solid #fa5353;
          padding-bottom: 12px;
          margin-bottom: 20px;
        }
        .pdf-logo {
          font-size: 24px;
          font-weight: 800;
          color: #1b182b;
        }
        .pdf-logo span { color: #fa5353; }
        .pdf-meta {
          text-align: right;
          font-size: 12px;
          color: #666666;
        }
        .pdf-main-title {
          font-size: 18px;
          font-weight: 700;
          color: #1b182b;
          margin-bottom: 4px;
        }
        .pdf-section {
          margin-bottom: 24px;
          page-break-inside: avoid;
        }
        .pdf-section-title {
          font-size: 14px;
          font-weight: 700;
          color: #d93838;
          margin-bottom: 8px;
          text-transform: uppercase;
          border-left: 4px solid #fa5353;
          padding-left: 8px;
        }
        .pdf-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 12px;
          margin-bottom: 12px;
        }
        .pdf-table th {
          background-color: #f3f4f6;
          color: #111827;
          font-weight: 600;
          text-align: left;
          padding: 8px 10px;
          border: 1px solid #d1d5db;
        }
        .pdf-table td {
          padding: 6px 10px;
          border: 1px solid #e5e7eb;
          color: #374151;
        }
        .pdf-table tbody tr:nth-child(even) {
          background-color: #fafafa;
        }
        @media print {
          body { padding: 0; }
          .pdf-section { page-break-inside: avoid; }
        }
      </style>
    </head>
    <body>
      <div class="pdf-header">
        <div>
          <div class="pdf-logo">Game<span>Fit</span> Admin</div>
          <div class="pdf-main-title">${escapeHtml(scopeTitle)}</div>
        </div>
        <div class="pdf-meta">
          <p>Thời gian xuất: <strong>${escapeHtml(nowStr)}</strong></p>
          <p>Hệ thống: GameFit Dashboard Analytics</p>
        </div>
      </div>
      ${tablesHtml}
    </body>
    </html>
  `;

  const printWindow = window.open("", "_blank");
  if (printWindow) {
    printWindow.document.open();
    printWindow.document.write(printHtml);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 400);
  } else {
    alert("Vui lòng cho phép mở cửa sổ popup để in hoặc lưu file PDF.");
  }
}

// Khi mở độc lập statistics.html
document.addEventListener("DOMContentLoaded", () => {
  if (
    !document.getElementById("tab-dashboard") &&
    document.querySelector(".tab-btn")
  ) {
    initStatistics();
  }
});
