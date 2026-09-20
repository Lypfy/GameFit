const users = [
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

const LoginForm = document.getElementById("LoginForm");
const SignUpForm = document.getElementById("SignUpForm");
const showSignup = document.getElementById("showSignup");
const showLogin = document.getElementById("showLogin");

LoginForm.addEventListener("submit", function (e) {
  e.preventDefault();

  const username = document.getElementById("login-username").value;
  const password = document.getElementById("login-password").value;
  const user = users.find(
    (u) => u.username === username && u.password === password,
  );
  if (user) {
    localStorage.setItem("fullname", user.fullname);
    localStorage.setItem("password", user.password);
    localStorage.setItem("currentUser", JSON.stringify(user));

    if (user.role === "admin") {
      showToast("Welcome Admin!");
      setTimeout(() => {
        window.location.href = "../home.html";
      }, 1000);
    } else {
      showToast("Welcome User!");
      setTimeout(() => {
        window.location.href = "../home.html";
      }, 1000);
    }
  } else {
    showToast("Sai tài khoản hoặc mật khẩu!", true);
  }
});
SignUpForm.addEventListener("submit", function (e) {
  e.preventDefault();
  const fullname = document.getElementById("signup-fullname").value;
  const username = document.getElementById("signup-username").value;
  const password = document.getElementById("signup-password").value;
  const password_confirm = document.getElementById(
    "signup-password-confirm",
  ).value;
  const userExist = users.find((u) => u.username === username);
  if (userExist) {
    alert("Username already exists!");
    return;
  } else if (password !== password_confirm) {
    alert("Wrong password repeat!");
    return;
  } else {
    users.push({ fullname, username, password, role: "user" });
    showToast("Sign up successful!");
    SignUpForm.reset();
    SignUpForm.style.display = "none";
    LoginForm.style.display = "block";
  }
});

showSignup.addEventListener("click", (e) => {
  e.preventDefault();
  LoginForm.style.display = "none";
  SignUpForm.style.display = "block";
});

showLogin.addEventListener("click", (e) => {
  e.preventDefault();
  SignUpForm.reset();
  SignUpForm.style.display = "none";
  LoginForm.style.display = "block";
});

function showToast(message, isError = false) {
  const toast = document.getElementById("toast");
  toast.innerText = message;
  toast.style.backgroundColor = isError ? "red" : "green";
  toast.classList.add("show");
  setTimeout(() => {
    toast.classList.remove("show");
  }, 1500);
}
function setupPasswordToggle(inputId, toggleId) {
  const passwordInput = document.getElementById(inputId);
  const togglePassword = document.getElementById(toggleId);
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
