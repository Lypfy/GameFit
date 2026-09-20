/**
 * Logic for Authentication Page (Login / Sign Up).
 */
document.addEventListener("DOMContentLoaded", function () {
  const LoginForm = document.getElementById("LoginForm");
  const SignUpForm = document.getElementById("SignUpForm");
  const showSignup = document.getElementById("showSignup");
  const showLogin = document.getElementById("showLogin");

  if (LoginForm) {
    LoginForm.addEventListener("submit", function (e) {
      e.preventDefault();

      const username = document.getElementById("login-username").value.trim();
      const password = document.getElementById("login-password").value.trim();

      const user = mockUsers.find(
        (u) => u.username === username && u.password === password
      );

      if (user) {
        setCurrentUser(user);
        showToast(user.role === "admin" ? "Welcome Admin!" : "Welcome User!", false, "toast");

        setTimeout(() => {
          // From client/html/auth/login_register.html back to client/html/home.html
          window.location.href = "../home.html";
        }, 1000);
      } else {
        showToast("Sai tài khoản hoặc mật khẩu!", true, "toast");
      }
    });
  }

  if (SignUpForm) {
    SignUpForm.addEventListener("submit", function (e) {
      e.preventDefault();
      const fullname = document.getElementById("signup-fullname").value.trim();
      const username = document.getElementById("signup-username").value.trim();
      const password = document.getElementById("signup-password").value.trim();
      const password_confirm = document.getElementById("signup-password-confirm").value.trim();

      const userExist = mockUsers.find((u) => u.username === username);
      if (userExist) {
        alert("Username already exists!");
        return;
      } else if (password !== password_confirm) {
        alert("Wrong password repeat!");
        return;
      } else {
        mockUsers.push({ fullname, username, password, role: "user" });
        showToast("Sign up successful!", false, "toast");
        SignUpForm.reset();
        SignUpForm.style.display = "none";
        LoginForm.style.display = "block";
      }
    });
  }

  if (showSignup) {
    showSignup.addEventListener("click", (e) => {
      e.preventDefault();
      LoginForm.style.display = "none";
      SignUpForm.style.display = "block";
    });
  }

  if (showLogin) {
    showLogin.addEventListener("click", (e) => {
      e.preventDefault();
      SignUpForm.reset();
      SignUpForm.style.display = "none";
      LoginForm.style.display = "block";
    });
  }

  function setupPasswordToggle(inputId, toggleId) {
    const passwordInput = document.getElementById(inputId);
    const togglePassword = document.getElementById(toggleId);
    if (!passwordInput || !togglePassword) return;

    passwordInput.addEventListener("input", function () {
      togglePassword.style.display = passwordInput.value ? "block" : "none";
    });

    togglePassword.addEventListener("click", function () {
      if (passwordInput.type === "password") {
        passwordInput.type = "text";
        togglePassword.classList.remove("bx-show");
        togglePassword.classList.add("bx-hide");
      } else {
        passwordInput.type = "password";
        togglePassword.classList.remove("bx-hide");
        togglePassword.classList.add("bx-show");
      }
    });
  }

  setupPasswordToggle("login-password", "toggle-login-password");
  setupPasswordToggle("signup-password", "toggle-signup-password");
  setupPasswordToggle("signup-password-confirm", "toggle-signup-confirm");
});
