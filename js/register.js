const supabase = window.supabase.createClient(
  "https://cbmimzpytdmtjvanvaoh.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNibWltenB5dGRtdGp2YW52YW9oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg0MjE2MzUsImV4cCI6MjA2Mzk5NzYzNX0.YHon747wNSjx6-ZcG-344tlKXtKqXxl-VYu1Vtbusgo"
);

const form = document.getElementById("register-form");
const errorMessage = document.getElementById("error-message");
const submitButton = form.querySelector("button[type=submit]");

let countdown = 0;
let countdownInterval;

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  errorMessage.style.display = "none";
  submitButton.disabled = true;

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();

  try {
    const { data, error } = await supabase.auth.signUp({ email, password });

    if (error) {
      if (error.message.includes("20 seconds")) {
        // 20 秒限制
        countdown = 20;
        errorMessage.textContent = `請等待 ${countdown} 秒後再重試`;
        errorMessage.style.display = "block";

        countdownInterval = setInterval(() => {
          countdown--;
          if (countdown > 0) {
            errorMessage.textContent = `請等待 ${countdown} 秒後再重試`;
          } else {
            clearInterval(countdownInterval);
            submitButton.disabled = false;
            errorMessage.style.display = "none";
          }
        }, 1000);

      } else if (error.message.includes("already registered")) {
        // 帳號已存在，提示後跳登入頁
        errorMessage.style.display = "block";
        errorMessage.style.color = "orange";
        errorMessage.textContent = "⚠️ 帳號已存在，請直接登入！";
        setTimeout(() => {
          window.location.href = "login.html";
        }, 3000);

      } else {
        errorMessage.textContent = "註冊失敗：" + error.message;
        errorMessage.style.display = "block";
        submitButton.disabled = false;
      }
    } else {
      // 註冊成功
      errorMessage.style.display = "block";
      errorMessage.style.color = "green";
      errorMessage.textContent = "✅ 註冊成功，請至信箱點擊驗證信完成驗證！即將跳轉登入頁...";
      setTimeout(() => {
        window.location.href = "login.html";
      }, 3000);
    }
  } catch (err) {
    errorMessage.textContent = "系統錯誤：" + err.message;
    errorMessage.style.display = "block";
    submitButton.disabled = false;
  }
});
