/**
 * Navbar hamburger menu toggle logic.
 */
document.addEventListener("DOMContentLoaded", function () {
  const menuIcon = document.querySelector(".menu-icon");
  const navbar = document.querySelector(".menu");

  if (menuIcon && navbar) {
    menuIcon.onclick = () => {
      menuIcon.classList.toggle("move");
      navbar.classList.toggle("active");
    };
  }
});
