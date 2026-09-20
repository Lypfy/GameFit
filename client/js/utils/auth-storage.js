/**
 * Utility functions for user authentication storage management.
 */

// Sample mock database of registered users
const mockUsers = [
  {
    fullname: "Alice",
    username: "admin@gmail.com",
    password: "admin123",
    role: "admin",
  },
  {
    fullname: "Nicole Reeyn",
    username: "user1@gmail.com",
    password: "user123",
    role: "user",
  },
];

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
  if (user && user.fullname) localStorage.setItem("fullname", user.fullname);
  if (user && user.password) localStorage.setItem("password", user.password);
}

function logoutUser() {
  localStorage.removeItem("currentUser");
}
