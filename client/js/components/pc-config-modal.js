/**
 * Computer Configuration Modal Logic.
 * Handles fetching, displaying, and updating a user's PC config.
 */
document.addEventListener("DOMContentLoaded", function () {
  const pcConfigModal = document.getElementById("my_pc_config");
  const pcConfigOverlay = document.getElementById("pc-config-overlay");
  const closePcConfigModal = document.getElementById("close-pc-config-modal");
  const cancelPcBtn = document.getElementById("cancel-pc-config-btn");
  const pcConfigForm = document.getElementById("pc-config-form");
  
  // Since btn-my-pc-config is inside the dropdown, we must use event delegation 
  // or fetch it when it's rendered, but since it's hardcoded in HTML, we can get it directly.
  const btnMyPcConfig = document.getElementById("btn-my-pc-config");
  const userDropdown = document.getElementById("user-dropdown");

  const pcIdInput = document.getElementById("pc-id");
  const pcNameInput = document.getElementById("pc-name");
  const pcOsInput = document.getElementById("pc-os");
  // CPU/GPU: hidden id inputs (combobox stores the resolved ID here)
  const pcCpuInput = document.getElementById("pc-cpu");
  const pcGpuInput = document.getElementById("pc-gpu");
  const pcRamInput = document.getElementById("pc-ram");
  const pcStorageInput = document.getElementById("pc-storage");

  function hidePcConfigModal() {
    if (pcConfigModal) pcConfigModal.classList.remove("active");
  }

  if (closePcConfigModal) closePcConfigModal.addEventListener("click", hidePcConfigModal);
  if (cancelPcBtn) cancelPcBtn.addEventListener("click", hidePcConfigModal);
  if (pcConfigOverlay) pcConfigOverlay.addEventListener("click", hidePcConfigModal);

  if (btnMyPcConfig) {
    btnMyPcConfig.addEventListener("click", async function (e) {
      e.preventDefault();
      // Hide the user dropdown
      if (userDropdown) userDropdown.classList.remove("active");
      
      const currentUser = getCurrentUser();
      if (!currentUser) {
        showToast("Vui lòng đăng nhập để xem cấu hình máy tính!", true);
        return;
      }

      try {
        // Redirect to the dedicated My PC Config page
        let targetPath = "html/user/my_pc_config.html"; // default from root
        const currentPath = window.location.pathname;
        
        if (currentPath.includes("/admin/")) {
          targetPath = "../../html/user/my_pc_config.html";
        } else if (currentPath.includes("/user/")) {
          targetPath = "my_pc_config.html";
        } else if (currentPath.includes("/html/")) {
          targetPath = "user/my_pc_config.html";
        }
        
        window.location.href = targetPath;
      } catch (error) {
        console.error("Lỗi chuyển hướng:", error);
      }
    });
  }

  if (pcConfigForm) {
    pcConfigForm.addEventListener("submit", async function (e) {
      e.preventDefault();
      
      const currentUser = getCurrentUser();
      if (!currentUser) return;

      // Ensure fields are parsed correctly, avoiding NaN issues.
      const pcData = {
        user_id: currentUser.user_id,
        pc_name: pcNameInput.value.trim(),
        os: pcOsInput.value.trim(),
        cpu_id: parseInt(pcCpuInput.value.trim()) || null,
        gpu_id: parseInt(pcGpuInput.value.trim()) || null,
        ram: parseInt(pcRamInput.value.trim()) || null,
        storage: parseInt(pcStorageInput.value.trim()) || null,
      };

      const pcId = pcIdInput.value.trim();
      let method = "POST";
      
      if (pcId) {
        // Update existing PC Config
        method = "PUT";
        pcData.pc_id = parseInt(pcId);
      }

      try {
        const response = await fetch("/api/computer-config", {
          method: method,
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(pcData),
        });

        const result = await response.json();

        if (result.success) {
          showToast(pcId ? "Cập nhật cấu hình máy tính thành công!" : "Tạo cấu hình máy tính thành công!");
          hidePcConfigModal();
        } else {
          showToast(result.message || "Có lỗi xảy ra khi lưu cấu hình", true);
        }
      } catch (error) {
        console.error("Lỗi khi lưu cấu hình:", error);
        showToast("Lỗi kết nối đến máy chủ", true);
      }
    });
  }
});
