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
