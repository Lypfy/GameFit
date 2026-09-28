/**
 * Searchable Combobox for CPU / GPU selection.
 * Searches by partial name via API and stores the selected ID in a hidden input.
 *
 * Usage: call initHwCombobox(containerEl, type, onSelect)
 *   containerEl  – the .hw-combobox wrapper element
 *   type         – 'cpu' | 'gpu'
 *   onSelect     – optional callback(id, name) when user picks an item
 *
 * The container must have:
 *   - input[data-hw-search]  – the visible text input
 *   - input[data-hw-id]      – hidden, holds the resolved id
 *   - .hw-combobox-dropdown  – dropdown ul / div
 *   - .hw-combobox-icon      – chevron icon
 */

(function () {
  const DEBOUNCE_MS = 280;

  function debounce(fn, delay) {
    let t;
    return function (...args) {
      clearTimeout(t);
      t = setTimeout(() => fn.apply(this, args), delay);
    };
  }

  /**
   * Initialise a single hw-combobox container.
   * @param {HTMLElement} container
   * @param {'cpu'|'gpu'} type
   * @param {Function} [onSelect]
   */
  function initHwCombobox(container, type, onSelect) {
    if (!container) return;

    const textInput = container.querySelector("[data-hw-search]");
    const idInput   = container.querySelector("[data-hw-id]");
    const dropdown  = container.querySelector(".hw-combobox-dropdown");

    if (!textInput || !idInput || !dropdown) return;

    let currentQuery = "";
    let abortCtrl = null;

    // ── helpers ──────────────────────────────────────────
    function openDropdown() {
      container.classList.add("open");
    }

    function closeDropdown() {
      container.classList.remove("open");
    }

    function setStatus(html) {
      dropdown.innerHTML = `<div class="hw-combobox-status">${html}</div>`;
    }

    function renderItems(items) {
      if (!items || items.length === 0) {
        setStatus('<i class="bx bx-search-alt"></i> Không tìm thấy kết quả');
        return;
      }

      const icon = type === "cpu" ? "bx-chip" : "bx-tv";
      dropdown.innerHTML = items
        .map(
          (item) => `
          <div class="hw-combobox-item" 
               data-id="${type === 'cpu' ? item.cpu_id : item.gpu_id}" 
               data-name="${item.name || ''}">
            <div class="hw-combobox-item-icon">
              <i class="bx ${icon}"></i>
            </div>
            <div class="hw-combobox-item-info">
              <div class="hw-combobox-item-name">${item.name || ''}</div>
              <div class="hw-combobox-item-brand">${item.brand || ""}</div>
            </div>
          </div>`
        )
        .join("");

      // bind click on each item
      dropdown.querySelectorAll(".hw-combobox-item").forEach((el) => {
        el.addEventListener("click", () => {
          const id   = el.dataset.id;
          const name = el.dataset.name;
          selectItem(id, name);
        });
      });
    }

    function selectItem(id, name) {
      idInput.value   = id;
      textInput.value = name;
      closeDropdown();
      if (typeof onSelect === "function") onSelect(id, name);
    }

    // ── API call ─────────────────────────────────────────
    async function search(query) {
      if (!query || query.trim() === "") {
        setStatus('<i class="bx bx-info-circle"></i> Nhập tên để tìm kiếm');
        return;
      }

      setStatus('<i class="bx bx-loader-alt bx-spin"></i> Đang tìm...');

      if (abortCtrl) abortCtrl.abort();
      abortCtrl = new AbortController();

      try {
        const endpoint =
          type === "cpu"
            ? `/api/cpus/search?name=${encodeURIComponent(query)}`
            : `/api/gpus/search?name=${encodeURIComponent(query)}`;

        const res  = await fetch(endpoint, { signal: abortCtrl.signal });
        const json = await res.json();

        if (json.success) {
          renderItems(json.data);
        } else {
          setStatus('<i class="bx bx-error"></i> Lỗi tải dữ liệu');
        }
      } catch (err) {
        if (err.name !== "AbortError") {
          setStatus('<i class="bx bx-error"></i> Lỗi kết nối');
        }
      }
    }

    const debouncedSearch = debounce(search, DEBOUNCE_MS);

    // ── events ───────────────────────────────────────────
    textInput.addEventListener("focus", () => {
      openDropdown();
      if (textInput.value.trim()) {
        search(textInput.value.trim());
      } else {
        setStatus('<i class="bx bx-info-circle"></i> Nhập tên để tìm kiếm');
      }
    });

    textInput.addEventListener("input", () => {
      // Clear stored id when user modifies text
      idInput.value = "";
      currentQuery  = textInput.value.trim();
      openDropdown();
      debouncedSearch(currentQuery);
    });

    // Close when clicking outside
    document.addEventListener("click", (e) => {
      if (!container.contains(e.target)) {
        closeDropdown();
      }
    });

    // Keyboard navigation
    textInput.addEventListener("keydown", (e) => {
      const items = dropdown.querySelectorAll(".hw-combobox-item");
      const highlighted = dropdown.querySelector(".hw-combobox-item.highlighted");
      let idx = -1;

      if (items.length === 0) return;

      items.forEach((el, i) => { if (el === highlighted) idx = i; });

      if (e.key === "ArrowDown") {
        e.preventDefault();
        const next = items[idx + 1] || items[0];
        highlighted && highlighted.classList.remove("highlighted");
        next.classList.add("highlighted");
        next.scrollIntoView({ block: "nearest" });
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        const prev = items[idx - 1] || items[items.length - 1];
        highlighted && highlighted.classList.remove("highlighted");
        prev.classList.add("highlighted");
        prev.scrollIntoView({ block: "nearest" });
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (highlighted) {
          selectItem(highlighted.dataset.id, highlighted.dataset.name);
        }
      } else if (e.key === "Escape") {
        closeDropdown();
      }
    });
  }

  /**
   * Initialise all .hw-combobox elements in the given root (default: document).
   * Looks for data-hw-type="cpu" or "gpu" on the container.
   */
  function initAllHwComboboxes(root) {
    root = root || document;
    root.querySelectorAll(".hw-combobox[data-hw-type]").forEach((el) => {
      const type = el.dataset.hwType;
      if (type === "cpu" || type === "gpu") {
        initHwCombobox(el, type);
      }
    });
  }

  // Expose globally
  window.initHwCombobox      = initHwCombobox;
  window.initAllHwComboboxes = initAllHwComboboxes;

  // Auto-init on DOMContentLoaded
  document.addEventListener("DOMContentLoaded", () => {
    initAllHwComboboxes(document);
  });
})();
