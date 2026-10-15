// --- QUẢN LÝ DỮ LIỆU HARDWARE (CPU & GPU) ---
let cpuCurrentPage = 1;
let cpuTotalPages = 1;
let cpuSearchKeyword = "";
let currentCpusList = [];
let pendingDeleteCpuId = null;

let gpuCurrentPage = 1;
let gpuTotalPages = 1;
let gpuSearchKeyword = "";
let currentGpusList = [];
let pendingDeleteGpuId = null;

// 1. Lấy và hiển thị danh sách CPU từ DBMS (Có phân trang & sắp xếp theo CPU ID)
async function loadCpuData(page = 1, search = cpuSearchKeyword) {
  try {
    cpuCurrentPage = page;
    cpuSearchKeyword = search;

    const url = `/api/cpus?page=${page}&limit=20&search=${encodeURIComponent(search.trim())}`;

    const res = await fetch(url);
    const result = await res.json();
    if (result.success) {
      const cpus = Array.isArray(result.data)
        ? result.data
        : result.data?.data || [];
      currentCpusList = cpus;
      renderCpuTable(cpus);

      const pagination = result.pagination || result.data?.pagination || {};
      cpuTotalPages = pagination.totalPages || 1;
      const totalItems = pagination.totalItems || cpus.length;

      updateCpuPaginationUI(cpuCurrentPage, cpuTotalPages, totalItems);
    }
  } catch (error) {
    console.error("Lỗi khi tải dữ liệu CPU:", error);
  }
}

function updateCpuPaginationUI(page, totalPages, totalItems) {
  const elPage = document.getElementById("cpu-current-page");
  const elTotalPages = document.getElementById("cpu-total-pages");
  const elTotalItems = document.getElementById("cpu-total-items");
  const btnPrev = document.getElementById("btn-cpu-prev");
  const btnNext = document.getElementById("btn-cpu-next");

  if (elPage) elPage.textContent = page;
  if (elTotalPages) elTotalPages.textContent = totalPages;
  if (elTotalItems)
    elTotalItems.textContent = totalItems.toLocaleString("vi-VN");

  if (btnPrev) btnPrev.disabled = page <= 1;
  if (btnNext) btnNext.disabled = page >= totalPages;
}

function renderCpuTable(cpus) {
  const tbody = document.querySelector("#hw-cpu table.data-table tbody");
  if (!tbody) return;

  if (!cpus || cpus.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align: center;">Chưa có dữ liệu CPU trong hệ thống</td></tr>`;
    return;
  }

  tbody.innerHTML = cpus
    .map((cpu) => {
      const cpuId = cpu.cpu_id || cpu.id;
      const name = cpu.name || cpu.cpu_name || "-";
      const brand = cpu.brand || "-";
      const score =
        cpu.benchmark_score != null
          ? Number(cpu.benchmark_score).toLocaleString("vi-VN")
          : "0";

      return `
        <tr data-id="${cpuId}">
          <td>${cpuId}</td>
          <td class="text-highlight">${name}</td>
          <td>${brand}</td>
          <td class="score-val">${score}</td>
          <td class="text-right">
            <button title="Sửa" class="btn-action btn-edit btn-edit-cpu" data-id="${cpuId}">
              <i class="bx bx-edit"></i>
            </button>
            <button title="Xóa" class="btn-action btn-delete btn-delete-cpu" data-id="${cpuId}">
              <i class="bx bx-trash"></i>
            </button>
          </td>
        </tr>
      `;
    })
    .join("");
}

// 2. Lấy và hiển thị danh sách GPU từ DBMS (Có phân trang & sắp xếp theo GPU ID)
async function loadGpuData(page = 1, search = gpuSearchKeyword) {
  try {
    gpuCurrentPage = page;
    gpuSearchKeyword = search;

    const url = `/api/gpus?page=${page}&limit=20&search=${encodeURIComponent(search.trim())}`;

    const res = await fetch(url);
    const result = await res.json();
    if (result.success) {
      const gpus = Array.isArray(result.data)
        ? result.data
        : result.data?.data || [];
      currentGpusList = gpus;
      renderGpuTable(gpus);

      const pagination = result.pagination || result.data?.pagination || {};
      gpuTotalPages = pagination.totalPages || 1;
      const totalItems = pagination.totalItems || gpus.length;

      updateGpuPaginationUI(gpuCurrentPage, gpuTotalPages, totalItems);
    }
  } catch (error) {
    console.error("Lỗi khi tải dữ liệu GPU:", error);
  }
}

function updateGpuPaginationUI(page, totalPages, totalItems) {
  const elPage = document.getElementById("gpu-current-page");
  const elTotalPages = document.getElementById("gpu-total-pages");
  const elTotalItems = document.getElementById("gpu-total-items");
  const btnPrev = document.getElementById("btn-gpu-prev");
  const btnNext = document.getElementById("btn-gpu-next");

  if (elPage) elPage.textContent = page;
  if (elTotalPages) elTotalPages.textContent = totalPages;
  if (elTotalItems)
    elTotalItems.textContent = totalItems.toLocaleString("vi-VN");

  if (btnPrev) btnPrev.disabled = page <= 1;
  if (btnNext) btnNext.disabled = page >= totalPages;
}

function renderGpuTable(gpus) {
  const tbody = document.querySelector("#hw-gpu table.data-table tbody");
  if (!tbody) return;

  if (!gpus || gpus.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align: center;">Chưa có dữ liệu GPU trong hệ thống</td></tr>`;
    return;
  }

  tbody.innerHTML = gpus
    .map((gpu) => {
      const gpuId = gpu.gpu_id || gpu.id;
      const name = gpu.name || gpu.gpu_name || "-";
      const brand = gpu.brand || "-";
      const score =
        gpu.benchmark_score != null
          ? Number(gpu.benchmark_score).toLocaleString("vi-VN")
          : "0";

      return `
        <tr data-id="${gpuId}">
          <td>${gpuId}</td>
          <td class="text-highlight">${name}</td>
          <td>${brand}</td>
          <td class="score-val">${score}</td>
          <td class="text-right">
            <button title="Sửa" class="btn-action btn-edit btn-edit-gpu" data-id="${gpuId}">
              <i class="bx bx-edit"></i>
            </button>
            <button title="Xóa" class="btn-action btn-delete btn-delete-gpu" data-id="${gpuId}">
              <i class="bx bx-trash"></i>
            </button>
          </td>
        </tr>
      `;
    })
    .join("");
}

// Khởi tạo các sự kiện phân trang và tìm kiếm cho CPU / GPU
function initHardwareActions() {
  // Tìm kiếm CPU
  const cpuSearch = document.querySelector("#hw-cpu .table-search input");
  if (cpuSearch) {
    cpuSearch.addEventListener("input", function (e) {
      loadCpuData(1, e.target.value.trim());
    });
  }

  // Nút Phân trang CPU
  const btnCpuPrev = document.getElementById("btn-cpu-prev");
  const btnCpuNext = document.getElementById("btn-cpu-next");
  if (btnCpuPrev) {
    btnCpuPrev.addEventListener("click", () => {
      if (cpuCurrentPage > 1) {
        loadCpuData(cpuCurrentPage - 1);
      }
    });
  }
  if (btnCpuNext) {
    btnCpuNext.addEventListener("click", () => {
      if (cpuCurrentPage < cpuTotalPages) {
        loadCpuData(cpuCurrentPage + 1);
      }
    });
  }

  // Tìm kiếm GPU
  const gpuSearch = document.querySelector("#hw-gpu .table-search input");
  if (gpuSearch) {
    gpuSearch.addEventListener("input", function (e) {
      loadGpuData(1, e.target.value.trim());
    });
  }

  // Nút Phân trang GPU
  const btnGpuPrev = document.getElementById("btn-gpu-prev");
  const btnGpuNext = document.getElementById("btn-gpu-next");
  if (btnGpuPrev) {
    btnGpuPrev.addEventListener("click", () => {
      if (gpuCurrentPage > 1) {
        loadGpuData(gpuCurrentPage - 1);
      }
    });
  }
  if (btnGpuNext) {
    btnGpuNext.addEventListener("click", () => {
      if (gpuCurrentPage < gpuTotalPages) {
        loadGpuData(gpuCurrentPage + 1);
      }
    });
  }

  // --- MODAL THÊM CPU MỚI ---
  const btnAddCpu = document.getElementById("btn-add-cpu");
  const cpuModal = document.getElementById("cpu-add-modal");
  const cpuForm = document.getElementById("cpu-add-form");
  const closeCpuModal = document.getElementById("close-cpu-add-modal");
  const cancelCpuBtn = document.getElementById("cancel-cpu-add-btn");
  const cpuOverlay = document.getElementById("cpu-add-modal");

  function hideCpuModal() {
    if (cpuModal) cpuModal.classList.remove("active");
    if (cpuForm) cpuForm.reset();
  }

  if (btnAddCpu) {
    btnAddCpu.addEventListener("click", () => {
      if (cpuModal) cpuModal.classList.add("active");
    });
  }
  if (closeCpuModal) closeCpuModal.addEventListener("click", hideCpuModal);
  if (cancelCpuBtn) cancelCpuBtn.addEventListener("click", hideCpuModal);
  if (cpuOverlay) {
    cpuOverlay.addEventListener("click", function (e) {
      if (e.target === cpuOverlay) hideCpuModal();
    });
  }

  if (cpuForm) {
    cpuForm.addEventListener("submit", async function (e) {
      e.preventDefault();
      const name = document.getElementById("add-cpu-name").value.trim();
      const brand = document.getElementById("add-cpu-brand").value;
      const score =
        parseInt(document.getElementById("add-cpu-score").value, 10) || 0;

      if (!name) {
        showToast("Vui lòng nhập tên CPU!", true);
        return;
      }

      try {
        const res = await fetch("/api/cpus", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            cpu_name: name,
            name,
            brand,
            benchmark_score: score,
          }),
        });
        const result = await res.json();
        if (result.success || res.ok) {
          showToast("Thêm CPU mới thành công!");
          hideCpuModal();
          loadCpuData(1);
        } else {
          showToast(result.message || "Thêm CPU thất bại!", true);
        }
      } catch (err) {
        console.error("Lỗi khi thêm CPU:", err);
        showToast("Lỗi kết nối khi thêm CPU!", true);
      }
    });
  }

  // --- MODAL CẬP NHẬT CPU ---
  const cpuEditModal = document.getElementById("cpu-edit-modal");
  const cpuEditForm = document.getElementById("cpu-edit-form");
  const closeCpuEditModal = document.getElementById("close-cpu-edit-modal");
  const cancelCpuEditBtn = document.getElementById("cancel-cpu-edit-btn");
  const cpuEditOverlay = document.getElementById("cpu-edit-modal");

  function hideCpuEditModal() {
    if (cpuEditModal) cpuEditModal.classList.remove("active");
    if (cpuEditForm) cpuEditForm.reset();
  }

  if (closeCpuEditModal) closeCpuEditModal.addEventListener("click", hideCpuEditModal);
  if (cancelCpuEditBtn) cancelCpuEditBtn.addEventListener("click", hideCpuEditModal);
  if (cpuEditOverlay) {
    cpuEditOverlay.addEventListener("click", function (e) {
      if (e.target === cpuEditOverlay) hideCpuEditModal();
    });
  }

  if (cpuEditForm) {
    cpuEditForm.addEventListener("submit", async function (e) {
      e.preventDefault();
      const cpuId = document.getElementById("edit-cpu-id").value;
      const name = document.getElementById("edit-cpu-name").value.trim();
      const brand = document.getElementById("edit-cpu-brand").value;
      const score = parseInt(document.getElementById("edit-cpu-score").value, 10) || 0;

      if (!cpuId) {
        showToast("Thiếu ID CPU hợp lệ!", true);
        return;
      }
      if (!name) {
        showToast("Vui lòng nhập tên CPU!", true);
        return;
      }

      try {
        const res = await fetch(`/api/cpus/${cpuId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            cpu_name: name,
            brand,
            benchmark_score: score,
          }),
        });
        const result = await res.json();
        if (result.success || res.ok) {
          showToast("Cập nhật CPU thành công!");
          hideCpuEditModal();
          loadCpuData(cpuCurrentPage);
        } else {
          showToast(result.message || "Cập nhật CPU thất bại!", true);
        }
      } catch (err) {
        console.error("Lỗi khi cập nhật CPU:", err);
        showToast("Lỗi kết nối khi cập nhật CPU!", true);
      }
    });
  }

  // --- MODAL XÓA CPU ---
  const deleteCpuModal = document.getElementById("delete-cpu-modal");
  const closeDeleteCpuModal = document.getElementById("close-delete-cpu-modal");
  const cancelDeleteCpuBtn = document.getElementById("cancel-delete-cpu-btn");
  const confirmDeleteCpuBtn = document.getElementById("confirm-delete-cpu-btn");
  const deleteCpuOverlay = document.getElementById("delete-cpu-overlay");

  function hideDeleteCpuModal() {
    if (deleteCpuModal) deleteCpuModal.classList.remove("active");
    pendingDeleteCpuId = null;
  }

  if (closeDeleteCpuModal) closeDeleteCpuModal.addEventListener("click", hideDeleteCpuModal);
  if (cancelDeleteCpuBtn) cancelDeleteCpuBtn.addEventListener("click", hideDeleteCpuModal);
  if (deleteCpuOverlay) deleteCpuOverlay.addEventListener("click", hideDeleteCpuModal);

  if (confirmDeleteCpuBtn) {
    confirmDeleteCpuBtn.addEventListener("click", async function () {
      if (!pendingDeleteCpuId) return;
      confirmDeleteCpuBtn.disabled = true;
      confirmDeleteCpuBtn.textContent = "Đang xóa...";
      try {
        const res = await fetch(`/api/cpus/${pendingDeleteCpuId}`, {
          method: "DELETE",
        });
        const result = await res.json();
        if (result.success || res.ok) {
          showToast("Xóa CPU thành công!");
          hideDeleteCpuModal();
          loadCpuData(cpuCurrentPage);
        } else {
          showToast(result.message || "Xóa CPU thất bại!", true);
        }
      } catch (err) {
        console.error("Lỗi khi xóa CPU:", err);
        showToast("Lỗi kết nối khi xóa CPU!", true);
      } finally {
        confirmDeleteCpuBtn.disabled = false;
        confirmDeleteCpuBtn.textContent = "Xóa ngay";
      }
    });
  }

  // Event Delegation trên bảng CPU cho nút Sửa & Xóa
  const cpuTbody = document.querySelector("#hw-cpu table.data-table tbody");
  if (cpuTbody) {
    cpuTbody.addEventListener("click", function (e) {
      const btnEdit = e.target.closest(".btn-edit-cpu");
      const btnDelete = e.target.closest(".btn-delete-cpu");

      if (btnEdit) {
        const cpuId = btnEdit.getAttribute("data-id");
        const targetCpu = currentCpusList.find(
          (c) => (c.cpu_id || c.id).toString() === cpuId.toString()
        );
        if (targetCpu) {
          document.getElementById("edit-cpu-id").value = targetCpu.cpu_id || targetCpu.id;
          document.getElementById("edit-cpu-name").value = targetCpu.name || targetCpu.cpu_name || "";
          document.getElementById("edit-cpu-brand").value = targetCpu.brand || "";
          document.getElementById("edit-cpu-score").value = targetCpu.benchmark_score != null ? targetCpu.benchmark_score : 0;
          if (cpuEditModal) cpuEditModal.classList.add("active");
        }
      }

      if (btnDelete) {
        const cpuId = btnDelete.getAttribute("data-id");
        const targetCpu = currentCpusList.find(
          (c) => (c.cpu_id || c.id).toString() === cpuId.toString()
        );
        pendingDeleteCpuId = cpuId;
        const confirmMsg = document.getElementById("delete-cpu-confirm-msg");
        if (confirmMsg && targetCpu) {
          confirmMsg.innerHTML = `Bạn có chắc chắn muốn xóa CPU <strong>"${targetCpu.name || targetCpu.cpu_name}"</strong> (Mã: #${cpuId}) không?`;
        }
        if (deleteCpuModal) deleteCpuModal.classList.add("active");
      }
    });
  }

  // --- MODAL THÊM GPU MỚI ---
  const btnAddGpu = document.getElementById("btn-add-gpu");
  const gpuModal = document.getElementById("gpu-add-modal");
  const gpuForm = document.getElementById("gpu-add-form");
  const closeGpuModal = document.getElementById("close-gpu-add-modal");
  const cancelGpuBtn = document.getElementById("cancel-gpu-add-btn");
  const gpuOverlay = document.getElementById("gpu-add-modal");

  function hideGpuModal() {
    if (gpuModal) gpuModal.classList.remove("active");
    if (gpuForm) gpuForm.reset();
  }

  if (btnAddGpu) {
    btnAddGpu.addEventListener("click", () => {
      if (gpuModal) gpuModal.classList.add("active");
    });
  }
  if (closeGpuModal) closeGpuModal.addEventListener("click", hideGpuModal);
  if (cancelGpuBtn) cancelGpuBtn.addEventListener("click", hideGpuModal);
  if (gpuOverlay) {
    gpuOverlay.addEventListener("click", function (e) {
      if (e.target === gpuOverlay) hideGpuModal();
    });
  }

  if (gpuForm) {
    gpuForm.addEventListener("submit", async function (e) {
      e.preventDefault();
      const name = document.getElementById("add-gpu-name").value.trim();
      const brand = document.getElementById("add-gpu-brand").value;
      const score =
        parseInt(document.getElementById("add-gpu-score").value, 10) || 0;

      if (!name) {
        showToast("Vui lòng nhập tên GPU!", true);
        return;
      }

      try {
        const res = await fetch("/api/gpus", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            gpu_name: name,
            name,
            brand,
            benchmark_score: score,
          }),
        });
        const result = await res.json();
        if (result.success || res.ok) {
          showToast("Thêm GPU mới thành công!");
          hideGpuModal();
          loadGpuData(1);
        } else {
          showToast(result.message || "Thêm GPU thất bại!", true);
        }
      } catch (err) {
        console.error("Lỗi khi thêm GPU:", err);
        showToast("Lỗi kết nối khi thêm GPU!", true);
      }
    });
  }

  // --- MODAL CẬP NHẬT GPU ---
  const gpuEditModal = document.getElementById("gpu-edit-modal");
  const gpuEditForm = document.getElementById("gpu-edit-form");
  const closeGpuEditModal = document.getElementById("close-gpu-edit-modal");
  const cancelGpuEditBtn = document.getElementById("cancel-gpu-edit-btn");
  const gpuEditOverlay = document.getElementById("gpu-edit-modal");

  function hideGpuEditModal() {
    if (gpuEditModal) gpuEditModal.classList.remove("active");
    if (gpuEditForm) gpuEditForm.reset();
  }

  if (closeGpuEditModal) closeGpuEditModal.addEventListener("click", hideGpuEditModal);
  if (cancelGpuEditBtn) cancelGpuEditBtn.addEventListener("click", hideGpuEditModal);
  if (gpuEditOverlay) {
    gpuEditOverlay.addEventListener("click", function (e) {
      if (e.target === gpuEditOverlay) hideGpuEditModal();
    });
  }

  if (gpuEditForm) {
    gpuEditForm.addEventListener("submit", async function (e) {
      e.preventDefault();
      const gpuId = document.getElementById("edit-gpu-id").value;
      const name = document.getElementById("edit-gpu-name").value.trim();
      const brand = document.getElementById("edit-gpu-brand").value;
      const score = parseInt(document.getElementById("edit-gpu-score").value, 10) || 0;

      if (!gpuId) {
        showToast("Thiếu ID GPU hợp lệ!", true);
        return;
      }
      if (!name) {
        showToast("Vui lòng nhập tên GPU!", true);
        return;
      }

      try {
        const res = await fetch(`/api/gpus/${gpuId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            gpu_name: name,
            brand,
            benchmark_score: score,
          }),
        });
        const result = await res.json();
        if (result.success || res.ok) {
          showToast("Cập nhật GPU thành công!");
          hideGpuEditModal();
          loadGpuData(gpuCurrentPage);
        } else {
          showToast(result.message || "Cập nhật GPU thất bại!", true);
        }
      } catch (err) {
        console.error("Lỗi khi cập nhật GPU:", err);
        showToast("Lỗi kết nối khi cập nhật GPU!", true);
      }
    });
  }

  // --- MODAL XÓA GPU ---
  const deleteGpuModal = document.getElementById("delete-gpu-modal");
  const closeDeleteGpuModal = document.getElementById("close-delete-gpu-modal");
  const cancelDeleteGpuBtn = document.getElementById("cancel-delete-gpu-btn");
  const confirmDeleteGpuBtn = document.getElementById("confirm-delete-gpu-btn");
  const deleteGpuOverlay = document.getElementById("delete-gpu-overlay");

  function hideDeleteGpuModal() {
    if (deleteGpuModal) deleteGpuModal.classList.remove("active");
    pendingDeleteGpuId = null;
  }

  if (closeDeleteGpuModal) closeDeleteGpuModal.addEventListener("click", hideDeleteGpuModal);
  if (cancelDeleteGpuBtn) cancelDeleteGpuBtn.addEventListener("click", hideDeleteGpuModal);
  if (deleteGpuOverlay) deleteGpuOverlay.addEventListener("click", hideDeleteGpuModal);

  if (confirmDeleteGpuBtn) {
    confirmDeleteGpuBtn.addEventListener("click", async function () {
      if (!pendingDeleteGpuId) return;
      confirmDeleteGpuBtn.disabled = true;
      confirmDeleteGpuBtn.textContent = "Đang xóa...";
      try {
        const res = await fetch(`/api/gpus/${pendingDeleteGpuId}`, {
          method: "DELETE",
        });
        const result = await res.json();
        if (result.success || res.ok) {
          showToast("Xóa GPU thành công!");
          hideDeleteGpuModal();
          loadGpuData(gpuCurrentPage);
        } else {
          showToast(result.message || "Xóa GPU thất bại!", true);
        }
      } catch (err) {
        console.error("Lỗi khi xóa GPU:", err);
        showToast("Lỗi kết nối khi xóa GPU!", true);
      } finally {
        confirmDeleteGpuBtn.disabled = false;
        confirmDeleteGpuBtn.textContent = "Xóa ngay";
      }
    });
  }

  // Event Delegation trên bảng GPU cho nút Sửa & Xóa
  const gpuTbody = document.querySelector("#hw-gpu table.data-table tbody");
  if (gpuTbody) {
    gpuTbody.addEventListener("click", function (e) {
      const btnEdit = e.target.closest(".btn-edit-gpu");
      const btnDelete = e.target.closest(".btn-delete-gpu");

      if (btnEdit) {
        const gpuId = btnEdit.getAttribute("data-id");
        const targetGpu = currentGpusList.find(
          (g) => (g.gpu_id || g.id).toString() === gpuId.toString()
        );
        if (targetGpu) {
          document.getElementById("edit-gpu-id").value = targetGpu.gpu_id || targetGpu.id;
          document.getElementById("edit-gpu-name").value = targetGpu.name || targetGpu.gpu_name || "";
          document.getElementById("edit-gpu-brand").value = targetGpu.brand || "";
          document.getElementById("edit-gpu-score").value = targetGpu.benchmark_score != null ? targetGpu.benchmark_score : 0;
          if (gpuEditModal) gpuEditModal.classList.add("active");
        }
      }

      if (btnDelete) {
        const gpuId = btnDelete.getAttribute("data-id");
        const targetGpu = currentGpusList.find(
          (g) => (g.gpu_id || g.id).toString() === gpuId.toString()
        );
        pendingDeleteGpuId = gpuId;
        const confirmMsg = document.getElementById("delete-gpu-confirm-msg");
        if (confirmMsg && targetGpu) {
          confirmMsg.innerHTML = `Bạn có chắc chắn muốn xóa GPU <strong>"${targetGpu.name || targetGpu.gpu_name}"</strong> (Mã: #${gpuId}) không?`;
        }
        if (deleteGpuModal) deleteGpuModal.classList.add("active");
      }
    });
  }
}