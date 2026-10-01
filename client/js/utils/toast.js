/**
 * Utility function to display toast notifications.
 * @param {string} message - Message to display
 * @param {boolean} isError - Whether the toast represents an error
 * @param {string} toastId - Element ID of the toast container (defaults to 'home-toast')
 */
function showToast(message, type = false, toastId = "home-toast") {
  const toast = document.getElementById(toastId);
  if (!toast) return;

  const isDelete =
    type === "delete" ||
    type === "trash" ||
    (typeof message === "string" && message.toLowerCase().includes("xóa"));
  const isErr = type === true || type === "error";

  let iconHtml = "";
  if (type === "remove" || type === "x" || type === "x-circle") {
    iconHtml = `<i class="bx bx-x-circle" style="color: #ef4444; font-size: 1.2rem;"></i>`;
  } else if (type === "trash") {
    iconHtml = `<i class="bx bx-trash" style="color: #ef4444; font-size: 1.2rem;"></i>`;
  } else if (isDelete || isErr) {
    // Icon alert-circle / error-circle màu đỏ
    iconHtml = `<i class="bx bx-error-circle" style="color: #ef4444; font-size: 1.2rem;"></i>`;
  } else {
    // Dấu tích màu xanh (Thêm thành công / Thông báo thành công)
    iconHtml = `<i class="bx bx-check-circle" style="color: #22c55e; font-size: 1.2rem;"></i>`;
  }

  if (toastId === "home-toast") {
    toast.innerHTML = `${iconHtml} ${message}`;
  } else {
    toast.innerText = message;
    toast.style.backgroundColor = isDelete || isErr ? "#ef4444" : "#22c55e";
  }

  toast.classList.add("show");
  if (toast._toastTimeout) {
    clearTimeout(toast._toastTimeout);
  }
  toast._toastTimeout = setTimeout(function () {
    toast.classList.remove("show");
    toast._toastTimeout = null;
  }, 2500);
}
