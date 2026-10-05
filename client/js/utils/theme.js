/**
 * GameFit Theme Manager (Light / Dark Mode)
 * - Executes immediately to set document data-theme attribute before rendering
 * - Manages persistent theme setting in localStorage
 * - Initializes and synchronizes the theme switch in the navbar
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

  // Function to sync switch state
  function updateToggleState(theme) {
    const isLight = theme === "light";
    const titleText = isLight ? "Chuyển sang giao diện Tối" : "Chuyển sang giao diện Sáng";

    const toggleInputs = document.querySelectorAll('input#theme-toggle, input.theme-toggle-input');
    toggleInputs.forEach((input) => {
      input.checked = isLight;
      const parentLabel = input.closest(".theme-switch, .switch");
      if (parentLabel) {
        parentLabel.setAttribute("title", titleText);
        parentLabel.setAttribute("aria-label", titleText);
      }
    });
  }

  // Setup DOM interaction
  function initThemeToggle() {
    let toggleInput = document.getElementById("theme-toggle");
    const navIcon = document.querySelector(".nav-icon");

    // Auto-inject switch if missing
    if (!toggleInput && navIcon) {
      const switchLabel = document.createElement("label");
      switchLabel.className = "switch theme-switch";
      switchLabel.title = "Chuyển đổi giao diện Sáng / Tối";
      switchLabel.innerHTML = `
        <input type="checkbox" id="theme-toggle" class="theme-toggle-input" />
        <span class="slider"></span>
      `;

      const userBox = navIcon.querySelector(".user-box");
      if (userBox) {
        navIcon.insertBefore(switchLabel, userBox);
      } else {
        navIcon.appendChild(switchLabel);
      }
    }

    // Set initial UI state
    updateToggleState(getStoredTheme());

    // Bind change listeners to all switches
    document.querySelectorAll('input#theme-toggle, input.theme-toggle-input').forEach((input) => {
      if (!input.dataset.themeBound) {
        input.dataset.themeBound = "true";
        input.addEventListener("change", function () {
          const newTheme = this.checked ? "light" : "dark";
          localStorage.setItem(THEME_KEY, newTheme);
          applyTheme(newTheme);
          updateToggleState(newTheme);
        });
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initThemeToggle);
  } else {
    initThemeToggle();
  }
})();


