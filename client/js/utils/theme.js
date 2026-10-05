/**
 * GameFit Theme Manager (Light / Dark Mode)
 * - Executes immediately to set document data-theme attribute before rendering
 * - Manages persistent theme setting in localStorage
 * - Initializes and updates the theme toggle button in the top-right header
 */
(function () {
  const THEME_KEY = "gamefit_theme";

  // Get saved theme or default to dark
  function getStoredTheme() {
    return localStorage.getItem(THEME_KEY) || "dark";
  }

  // Synchronously apply theme to HTML tag to prevent page flashing
  function applyTheme(theme) {
    if (theme === "light") {
      document.documentElement.setAttribute("data-theme", "light");
    } else {
      document.documentElement.removeAttribute("data-theme");
    }
  }

  // Apply immediately on load
  applyTheme(getStoredTheme());

  // Function to create or update theme toggle button UI
  function updateToggleIcon(btn, theme) {
    if (!btn) return;
    const isLight = theme === "light";
    const iconClass = isLight ? "bx bx-moon" : "bx bx-sun";
    const titleText = isLight ? "Chuyển sang giao diện Tối" : "Chuyển sang giao diện Sáng";
    
    btn.setAttribute("title", titleText);
    btn.setAttribute("aria-label", titleText);
    btn.innerHTML = `<i class="${iconClass}"></i>`;
  }

  // Setup DOM interaction
  function initThemeToggle() {
    let toggleBtn = document.getElementById("theme-toggle");
    const navIcon = document.querySelector(".nav-icon");

    // Auto-inject button into .nav-icon if missing
    if (!toggleBtn && navIcon) {
      toggleBtn = document.createElement("button");
      toggleBtn.id = "theme-toggle";
      toggleBtn.className = "theme-toggle-btn";
      toggleBtn.type = "button";
      
      const userBox = navIcon.querySelector(".user-box");
      if (userBox) {
        navIcon.insertBefore(toggleBtn, userBox);
      } else {
        navIcon.appendChild(toggleBtn);
      }
    }

    if (toggleBtn) {
      updateToggleIcon(toggleBtn, getStoredTheme());

      // Avoid duplicate listener bindings
      if (!toggleBtn.dataset.themeBound) {
        toggleBtn.dataset.themeBound = "true";
        toggleBtn.addEventListener("click", function () {
          const currentTheme = getStoredTheme();
          const newTheme = currentTheme === "light" ? "dark" : "light";
          
          localStorage.setItem(THEME_KEY, newTheme);
          applyTheme(newTheme);
          updateToggleIcon(toggleBtn, newTheme);
        });
      }
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initThemeToggle);
  } else {
    initThemeToggle();
  }
})();
