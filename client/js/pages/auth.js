/**
 * Logic for Authentication Page (Login / Sign Up).
 */
document.addEventListener("DOMContentLoaded", function () {
  const LoginForm = document.getElementById("LoginForm");
  const SignUpForm = document.getElementById("SignUpForm");
  const showSignup = document.getElementById("showSignup");
  const showLogin = document.getElementById("showLogin");

  if (LoginForm) {
    LoginForm.addEventListener("submit", async function (e) {
      e.preventDefault();

      const username = document.getElementById("login-username").value.trim();
      const password = document.getElementById("login-password").value.trim();

      try {
        // Sử dụng biến API_URL từ file config.js (nếu chưa add vào HTML thì mặc định dùng localhost)
        const BASE_URL = window.API_URL || "http://localhost:5000/api";

        const response = await fetch(`${BASE_URL}/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (response.ok) {
          // Lưu token và thông tin user vào localStorage
          localStorage.setItem("token", data.token);
          setCurrentUser(data.user);

          showToast(`Xin chào ${data.user.username}!`, false, "toast");

          setTimeout(() => {
            window.location.href = "../home.html";
          }, 1000);
        } else {
          showToast(data.message || "Sai tài khoản hoặc mật khẩu!", true, "toast");
        }
      } catch (error) {
        console.error("Lỗi:", error);
        showToast("Không thể kết nối đến Máy chủ!", true, "toast");
      }
    });
  }

  if (SignUpForm) {
    SignUpForm.addEventListener("submit", async function (e) {
      e.preventDefault();
      const username = document.getElementById("signup-fullname").value.trim();
      const email = document.getElementById("signup-username").value.trim();

      if (!email) return;

      const password = document.getElementById("signup-password").value.trim();
      const password_confirm = document.getElementById("signup-password-confirm").value.trim();

      if (password !== password_confirm) {
        showToast("Mật khẩu nhập lại không khớp!", true, "toast");
        return;
      }

      try {
        const BASE_URL = window.API_URL || "http://localhost:5000/api";

        const response = await fetch(`${BASE_URL}/auth/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, email, password })
        });

        const data = await response.json();

        if (response.ok) {
          showToast("Đăng ký thành công! Vui lòng đăng nhập.", false, "toast");
          SignUpForm.reset();
          SignUpForm.style.display = "none";
          LoginForm.style.display = "block";
        } else {
          showToast(data.message, true, "toast");
        }
      } catch (error) {
        console.error("Lỗi:", error);
        showToast("Lỗi kết nối đến Máy chủ", true, "toast");
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
