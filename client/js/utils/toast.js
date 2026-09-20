/**
 * Utility function to display toast notifications.
 * @param {string} message - Message to display
 * @param {boolean} isError - Whether the toast represents an error
 * @param {string} toastId - Element ID of the toast container (defaults to 'home-toast')
 */
function showToast(message, isError = false, toastId = "home-toast") {
  const toast = document.getElementById(toastId);
  if (!toast) return;

  if (toastId === "home-toast") {
    toast.innerHTML = isError
      ? `<i class="bx bx-error-circle" style="color: #ef4444; font-size: 1.2rem;"></i> ${message}`
      : `<i class="bx bx-check-circle" style="color: #22c55e; font-size: 1.2rem;"></i> ${message}`;
  } else {
    toast.innerText = message;
    toast.style.backgroundColor = isError ? "#ef4444" : "#22c55e";
  }

  toast.classList.add("show");
  setTimeout(function () {
    toast.classList.remove("show");
  }, 2500);
}
