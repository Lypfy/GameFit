/**
 * Notification Component (Quả chuông & Dropdown thông báo trên Navbar)
 * Quản lý hiển thị icon chuông, badge số lượng chưa đọc, và popover danh sách thông báo.
 */

function formatNotifDate(dateStr) {
  if (!dateStr) return "";
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

function closeNotificationDropdown() {
  const notifDropdown = document.getElementById("notification-dropdown");
  const notifBtn = document.getElementById("notification-btn");
  if (notifDropdown) notifDropdown.classList.remove("active");
  if (notifBtn) notifBtn.classList.remove("active");
}

async function updateNotificationBadge() {
  const token = localStorage.getItem("token");
  if (!token) return;

  try {
    const res = await fetch("/api/notifications/unread-count", {
      headers: { Authorization: `Bearer ${token}` }
    });
    const result = await res.json();
    if (result.success) {
      const count = result.count || 0;
      const badge = document.getElementById("notification-badge");
      const headerCount = document.getElementById("notification-header-count");

      if (badge) {
        if (count > 0) {
          badge.textContent = count > 99 ? "99+" : String(count);
          badge.style.display = "flex";
        } else {
          badge.style.display = "none";
        }
      }

      if (headerCount) {
        if (count > 0) {
          headerCount.textContent = `${count} mới`;
          headerCount.style.display = "inline-block";
        } else {
          headerCount.style.display = "none";
        }
      }
    }
  } catch (err) {
    // Không làm gián đoạn UI nếu mất kết nối
  }
}

async function loadNotificationList() {
  const listEl = document.getElementById("notification-list");
  if (!listEl) return;

  const token = localStorage.getItem("token");
  if (!token) return;

  listEl.innerHTML = `
    <div class="notification-loading">
      <i class='bx bx-loader-alt bx-spin'></i>
      Đang tải thông báo...
    </div>
  `;

  try {
    const res = await fetch("/api/notifications?limit=25", {
      headers: { Authorization: `Bearer ${token}` }
    });
    const result = await res.json();

    if (result.success && Array.isArray(result.data)) {
      if (result.data.length === 0) {
        listEl.innerHTML = `
          <div class="notification-empty">
            <i class='bx bx-bell-off'></i>
            <p>Bạn chưa có thông báo nào</p>
          </div>
        `;
        return;
      }

      listEl.innerHTML = result.data.map((item) => {
        let iconClass = "type-default";
        let iconHtml = "<i class='bx bx-info-circle'></i>";
        if (item.type === "REVIEW_HIDDEN") {
          iconClass = "type-hidden";
          iconHtml = "<i class='bx bx-shield-x'></i>";
        } else if (item.type === "REPORT_RESULT") {
          iconClass = "type-report";
          iconHtml = "<i class='bx bx-check-circle'></i>";
        }

        const isUnread = !item.is_read;
        const timeFormatted = formatNotifDate(item.created_at);

        return `
          <div class="notification-item ${isUnread ? "unread" : ""}" 
               data-id="${item.notification_id}" 
               data-target-url="${item.target_url || ""}" 
               data-is-read="${item.is_read ? "1" : "0"}">
            <div class="notification-item-icon ${iconClass}">
              ${iconHtml}
            </div>
            <div class="notification-item-content">
              <div class="notification-item-title">${item.title || "Thông báo"}</div>
              <div class="notification-item-message">${item.message || ""}</div>
              <div class="notification-item-time">
                <i class='bx bx-time-five'></i> ${timeFormatted}
              </div>
            </div>
            ${isUnread ? `<span class="notification-unread-dot" title="Chưa đọc"></span>` : ""}
          </div>
        `;
      }).join("");
    } else {
      listEl.innerHTML = `
        <div class="notification-empty">
          <p style="color: #ef4444;">Không thể tải danh sách thông báo</p>
        </div>
      `;
    }
  } catch (err) {
    console.error("Lỗi khi tải thông báo:", err);
    listEl.innerHTML = `
      <div class="notification-empty">
        <p style="color: #ef4444;">Lỗi kết nối máy chủ</p>
      </div>
    `;
  }
}

function initNotificationComponent() {
  const userBox = document.querySelector(".user-box");
  const token = localStorage.getItem("token");

  // Nếu chưa đăng nhập hoặc không có container user-box, ẩn hoặc không render
  if (!token || !userBox) {
    const existingWrap = document.getElementById("notification-wrap");
    if (existingWrap) existingWrap.style.display = "none";
    return;
  }

  let notifWrap = document.getElementById("notification-wrap");
  const userCapsule = document.getElementById("user-profile-capsule");
  const userDropdown = document.getElementById("user-dropdown");

  if (!notifWrap) {
    notifWrap = document.createElement("div");
    notifWrap.className = "notification-wrap";
    notifWrap.id = "notification-wrap";
    notifWrap.innerHTML = `
      <button type="button" class="notification-btn" id="notification-btn" title="Thông báo" aria-label="Thông báo">
        <i class='bx bx-bell'></i>
        <span class="notification-badge" id="notification-badge">0</span>
      </button>
      <div class="notification-dropdown" id="notification-dropdown">
        <div class="notification-header">
          <div class="notification-header-title">
            <i class='bx bxs-bell-ring'></i>
            <h4>Thông báo</h4>
            <span class="notification-header-count" id="notification-header-count">0</span>
          </div>
          <button type="button" class="btn-mark-all-read" id="btn-mark-all-read" title="Đánh dấu tất cả là đã đọc">
            <i class='bx bx-check-double'></i> Đã đọc tất cả
          </button>
        </div>
        <div class="notification-list" id="notification-list">
          <div class="notification-loading">
            <i class='bx bx-loader-alt bx-spin'></i>
            Đang tải thông báo...
          </div>
        </div>
      </div>
    `;

    userBox.insertBefore(notifWrap, userCapsule || userDropdown || userBox.firstChild);

    // Xử lý click nút chuông
    const notifBtn = notifWrap.querySelector("#notification-btn");
    const notifDropdown = notifWrap.querySelector("#notification-dropdown");

    if (notifBtn && notifDropdown) {
      notifBtn.addEventListener("click", function (e) {
        e.stopPropagation();
        // Đóng user dropdown nếu đang mở
        if (userDropdown) userDropdown.classList.remove("active");
        if (userCapsule) userCapsule.classList.remove("active");

        const isActive = notifDropdown.classList.toggle("active");
        notifBtn.classList.toggle("active", isActive);

        if (isActive) {
          loadNotificationList();
        }
      });
    }

    // Xử lý bấm "Đã đọc tất cả"
    const markAllBtn = notifWrap.querySelector("#btn-mark-all-read");
    if (markAllBtn) {
      markAllBtn.addEventListener("click", async function (e) {
        e.stopPropagation();
        const currentToken = localStorage.getItem("token");
        if (!currentToken) return;

        try {
          const res = await fetch("/api/notifications/read", {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${currentToken}`
            },
            body: JSON.stringify({})
          });
          const result = await res.json();
          if (result.success) {
            const items = notifWrap.querySelectorAll(".notification-item.unread");
            items.forEach((item) => {
              item.classList.remove("unread");
              item.setAttribute("data-is-read", "1");
              const dot = item.querySelector(".notification-unread-dot");
              if (dot) dot.remove();
            });

            const badge = document.getElementById("notification-badge");
            const headerCount = document.getElementById("notification-header-count");
            if (badge) badge.style.display = "none";
            if (headerCount) headerCount.style.display = "none";
          }
        } catch (err) {
          console.error("Lỗi khi đánh dấu đã đọc tất cả:", err);
        }
      });
    }

    // Xử lý bấm vào từng thông báo
    const listEl = notifWrap.querySelector("#notification-list");
    if (listEl) {
      listEl.addEventListener("click", async function (e) {
        const item = e.target.closest(".notification-item");
        if (!item) return;

        const notifId = item.getAttribute("data-id");
        const targetUrl = item.getAttribute("data-target-url");
        const isRead = item.getAttribute("data-is-read") === "1";

        if (!isRead && notifId) {
          const currentToken = localStorage.getItem("token");
          try {
            fetch("/api/notifications/read", {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${currentToken}`
              },
              body: JSON.stringify({ notification_id: notifId })
            }).then(() => updateNotificationBadge());

            item.classList.remove("unread");
            item.setAttribute("data-is-read", "1");
            const dot = item.querySelector(".notification-unread-dot");
            if (dot) dot.remove();
          } catch (err) {
            console.error("Lỗi đánh dấu đã đọc:", err);
          }
        }

        if (targetUrl && targetUrl !== "#") {
          closeNotificationDropdown();

          // Chuẩn hóa URL bắt đầu bằng "/"
          const formattedUrl = targetUrl.startsWith("/") ? targetUrl : "/" + targetUrl;
          const targetBase = formattedUrl.split("#")[0];
          const hash = formattedUrl.includes("#") ? formattedUrl.split("#")[1] : null;
          const currentPathAndQuery = window.location.pathname + window.location.search;

          // Nếu đang ở cùng một trang chi tiết game
          if (hash && (window.location.href.includes(targetBase) || currentPathAndQuery === targetBase)) {
            window.location.hash = hash;
            const targetEl = document.getElementById(hash) || document.querySelector(".review-card.is-hidden-warning");
            if (targetEl) {
              targetEl.scrollIntoView({ behavior: "smooth", block: "center" });
              targetEl.classList.add("highlight-pulse");
              setTimeout(() => targetEl.classList.remove("highlight-pulse"), 3500);
            }
          } else {
            window.location.href = formattedUrl;
          }
        }
      });
    }
  } else {
    notifWrap.style.display = "inline-flex";
  }

  updateNotificationBadge();
}

document.addEventListener("DOMContentLoaded", function () {
  initNotificationComponent();

  // Polling cập nhật số lượng badge mỗi 30s
  setInterval(updateNotificationBadge, 30000);

  // Đóng notification dropdown khi click ra ngoài
  document.addEventListener("click", function (e) {
    const notifWrap = document.getElementById("notification-wrap");
    if (notifWrap && !notifWrap.contains(e.target)) {
      closeNotificationDropdown();
    }
  });
});
