/**
 * Utility functions for user authentication storage management.
 */

function getCurrentUser() {
  const storedUserStr = localStorage.getItem("currentUser");
  if (storedUserStr) {
    try {
      return JSON.parse(storedUserStr);
    } catch (e) {
      console.error("Lỗi parse currentUser", e);
    }
  }
  return null;
}

function setCurrentUser(user) {
  localStorage.setItem("currentUser", JSON.stringify(user));
}

function getAuthToken() {
  return localStorage.getItem("token");
}

function logoutUser() {
  localStorage.removeItem("currentUser");
  localStorage.removeItem("token");
}

/**
 * Chuyển đổi các link ảnh bị nhà mạng Việt Nam chặn (như Steam) qua proxy CDN Cloudflare quốc tế (Weserv)
 * Giúp tải ảnh 100% mượt mà trên mọi nhà mạng (VNPT, Viettel, FPT, 4G, Wifi trường học)
 */
function getSafeImageUrl(url) {
  if (!url) return "../assets/default-game.png";
  const cleanUrl = url.trim();
  if (!cleanUrl) return "../assets/default-game.png";

  if (cleanUrl.includes("steamstatic.com") || cleanUrl.includes("steampowered.com")) {
    return `https://images.weserv.nl/?url=${encodeURIComponent(cleanUrl)}`;
  }

  return cleanUrl;
}
window.getSafeImageUrl = getSafeImageUrl;

/**
 * Trích xuất ID YouTube từ URL (hỗ trợ watch, embed, youtu.be)
 */
function getYouTubeVideoId(url) {
  if (!url) return null;
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/i);
  return match ? match[1] : null;
}
window.getYouTubeVideoId = getYouTubeVideoId;

/**
 * Xử lý hover preview video cho card game (Hỗ trợ cả file MP4 trực tiếp và YouTube Iframe)
 */
function handleGameCardHover(box, isEnter) {
  if (isEnter) {
    box.style.transform = "scale(1.05)";
    const v = box.querySelector("video");
    const i = box.querySelector("img");
    if (v) {
      v.style.opacity = 1;
      if (i) i.style.opacity = 0;
      v.play().catch(() => {});
    } else {
      const ytId = box.getAttribute("data-yt-id");
      if (ytId) {
        const wrapper = box.querySelector(".media-wrapper");
        if (wrapper && !wrapper.querySelector("iframe")) {
          const iframe = document.createElement("iframe");
          iframe.src = `https://www.youtube.com/embed/${ytId}?autoplay=1&mute=1&controls=0&showinfo=0&modestbranding=1&loop=1&playlist=${ytId}&playsinline=1&enablejsapi=1&rel=0`;
          iframe.style.cssText = "position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: 0; pointer-events: none; z-index: 2;";
          iframe.setAttribute("allow", "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share");
          iframe.setAttribute("referrerpolicy", "strict-origin-when-cross-origin");
          wrapper.appendChild(iframe);
        }
      }
    }
  } else {
    box.style.transform = "scale(1)";
    const v = box.querySelector("video");
    const i = box.querySelector("img");
    if (v) {
      v.style.opacity = 0;
      if (i) i.style.opacity = 1;
      v.pause();
      v.currentTime = 0;
    }
    const iframes = box.querySelectorAll("iframe");
    iframes.forEach((f) => f.remove());
  }
}
window.handleGameCardHover = handleGameCardHover;
