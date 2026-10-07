/**
 * Logic for My PC Config Page
 */

document.addEventListener("DOMContentLoaded", function () {
  const configsGrid = document.getElementById("configs-grid");
  const btnAddConfigTop = document.getElementById("btn-add-config-top");

  // Modal elements
  const pcConfigModal = document.getElementById("pc-config-overlay");
  const closePcConfigModal = document.getElementById("close-pc-config-modal");
  const cancelPcBtn = document.getElementById("cancel-pc-config-btn");
  const pcConfigForm = document.getElementById("pc-config-form");

  // Form inputs
  const pcIdInput = document.getElementById("pc-id");
  const pcNameInput = document.getElementById("pc-name");
  const pcOsInput = document.getElementById("pc-os");
  // CPU/GPU: hidden id inputs (filled by combobox component)
  const pcCpuIdInput = document.getElementById("pc-cpu");
  const pcGpuIdInput = document.getElementById("pc-gpu");
  const pcRamInput = document.getElementById("pc-ram");
  const pcStorageInput = document.getElementById("pc-storage");

  let userConfigs = [];

  // Check login
  const currentUser = getCurrentUser();
  if (!currentUser) {
    window.location.href = "../auth/login_register.html";
    return;
  }

  // Fetch and render data
  async function loadConfigs() {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/computer-config`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const result = await response.json();

      if (result.success) {
        userConfigs = result.data || [];
        renderConfigs();
      } else {
        configsGrid.innerHTML = `<div class="empty-state">
          <i class="bx bx-error-circle" style="color: var(--danger);"></i>
          <p>${result.message || "Không thể tải dữ liệu"}</p>
        </div>`;
      }
    } catch (error) {
      console.error("Lỗi:", error);
      configsGrid.innerHTML = `<div class="empty-state">
        <i class="bx bx-error" style="color: var(--danger);"></i>
        <p>Lỗi kết nối máy chủ!</p>
      </div>`;
    }
  }

  function renderConfigs() {
    if (userConfigs.length === 0) {
      configsGrid.innerHTML = `
        <div class="empty-state">
          <i class="bx bx-desktop"></i>
          <p>Bạn chưa thêm cấu hình máy tính nào.</p>
        </div>
      `;
      return;
    }

    configsGrid.innerHTML = userConfigs
      .map(
        (config) => `
      <div class="config-card">
        <div class="config-header">
          <div class="config-title">
            <div class="config-icon"><i class="bx bx-desktop"></i></div>
            <div class="config-name-badge">
              <h3 style="font-size: 18px; margin-bottom: 0;">${config.pc_name || "Máy tính"}</h3>
            </div>
          </div>
        </div>
        <div class="config-details">
          <div class="detail-row">
            <div class="detail-label">OS:</div>
            <div class="detail-value">${config.os || "N/A"}</div>
          </div>
          <div class="detail-row">
            <div class="detail-label">CPU:</div>
            <div class="detail-value">${config.cpu_name || `ID: ${config.cpu_id}`}</div>
          </div>
          <div class="detail-row">
            <div class="detail-label">GPU:</div>
            <div class="detail-value">${config.gpu_name || `ID: ${config.gpu_id}`}</div>
          </div>
          <div class="detail-row">
            <div class="detail-label">RAM:</div>
            <div class="detail-value">${config.ram ? config.ram + "GB" : "N/A"}</div>
          </div>
          <div class="detail-row">
            <div class="detail-label">Storage:</div>
            <div class="detail-value">${config.storage ? config.storage + "GB" : "N/A"}</div>
          </div>
        </div>
        <div class="config-actions">
          <button class="btn-edit" onclick="editConfig(${config.pc_id})">
            <i class="bx bx-edit-alt"></i> Sửa
          </button>
          <button class="btn-delete" onclick="deleteConfig(${config.pc_id})">
            <i class="bx bx-trash"></i> Xóa
          </button>
        </div>
      </div>
    `,
      )
      .join("");
  }

  // Make functions global so inline onclick works
  window.editConfig = function (pcId) {
    const config = userConfigs.find((c) => c.pc_id === pcId);
    if (!config) return;

    pcIdInput.value = config.pc_id;
    pcNameInput.value = config.pc_name || "";
    pcOsInput.value = config.os || "";
    pcRamInput.value = config.ram || "";
    pcStorageInput.value = config.storage || "";

    // Populate combobox hidden ids
    if (pcCpuIdInput) pcCpuIdInput.value = config.cpu_id || "";
    if (pcGpuIdInput) pcGpuIdInput.value = config.gpu_id || "";

    // Populate combobox visible text with cpu_name / gpu_name
    const cpuTextInput = pcCpuIdInput
      ?.closest(".hw-combobox")
      ?.querySelector("[data-hw-search]");
    const gpuTextInput = pcGpuIdInput
      ?.closest(".hw-combobox")
      ?.querySelector("[data-hw-search]");
    if (cpuTextInput)
      cpuTextInput.value =
        config.cpu_name || (config.cpu_id ? `CPU ID: ${config.cpu_id}` : "");
    if (gpuTextInput)
      gpuTextInput.value =
        config.gpu_name || (config.gpu_id ? `GPU ID: ${config.gpu_id}` : "");

    pcConfigModal.classList.add("active");
  };

  window.deleteConfig = async function (pcId) {
    if (!confirm("Bạn có chắc chắn muốn xóa cấu hình này?")) return;

    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/computer-config", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ user_id: currentUser.user_id, pc_id: pcId }),
      });
      const result = await response.json();

      if (result.success) {
        showToast("Đã xóa cấu hình máy tính");
        loadConfigs();
      } else {
        showToast(result.message || "Xóa thất bại", true);
      }
    } catch (error) {
      showToast("Lỗi kết nối", true);
    }
  };

  // Modal handlers
  function hideModal() {
    pcConfigModal.classList.remove("active");
  }

  btnAddConfigTop.addEventListener("click", () => {
    pcConfigForm.reset();
    pcIdInput.value = "";
    // Clear combobox text fields
    const cpuText = pcCpuIdInput
      ?.closest(".hw-combobox")
      ?.querySelector("[data-hw-search]");
    const gpuText = pcGpuIdInput
      ?.closest(".hw-combobox")
      ?.querySelector("[data-hw-search]");
    if (cpuText) cpuText.value = "";
    if (gpuText) gpuText.value = "";
    pcConfigModal.classList.add("active");
  });

  closePcConfigModal.addEventListener("click", hideModal);
  cancelPcBtn.addEventListener("click", hideModal);

  // Close when click outside
  pcConfigModal.addEventListener("click", (e) => {
    if (e.target === pcConfigModal) hideModal();
  });

  // Submit form
  pcConfigForm.addEventListener("submit", async function (e) {
    e.preventDefault();

    const ramValue = parseInt(pcRamInput.value.trim());
    const storageValue = parseInt(pcStorageInput.value.trim());

    if (ramValue < 0 || storageValue < 0) {
      showToast("RAM và Lưu trữ không được là số âm!", true);
      return;
    }

    const pcData = {
      user_id: currentUser.user_id,
      pc_name: pcNameInput.value.trim(),
      os: pcOsInput.value.trim(),
      cpu_id: parseInt(pcCpuIdInput?.value) || null,
      gpu_id: parseInt(pcGpuIdInput?.value) || null,
      ram: ramValue || null,
      storage: storageValue || null,
    };

    const pcId = pcIdInput.value.trim();
    let method = "POST";

    if (pcId) {
      method = "PUT";
      pcData.pc_id = parseInt(pcId);
    }

    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/computer-config", {
        method: method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(pcData),
      });

      const result = await response.json();

      if (result.success) {
        showToast(
          pcId ? "Cập nhật thành công!" : "Tạo cấu hình mới thành công!",
        );
        hideModal();
        loadConfigs();
      } else {
        showToast(result.message || "Lỗi lưu cấu hình", true);
      }
    } catch (error) {
      showToast("Lỗi hệ thống", true);
    }
  });

  // Initial load
  loadConfigs();
});
