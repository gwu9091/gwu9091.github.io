const supabase = window.supabase.createClient(
   "https://cbmimzpytdmtjvanvaoh.supabase.co",
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNibWltenB5dGRtdGp2YW52YW9oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg0MjE2MzUsImV4cCI6MjA2Mzk5NzYzNX0.YHon747wNSjx6-ZcG-344tlKXtKqXxl-VYu1Vtbusgo"
);

const form = document.getElementById("register-form");
const errorMessage = document.getElementById("error-message");
const submitButton = form.querySelector("button[type=submit]");

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  errorMessage.style.display = "none";
  submitButton.disabled = true;

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();

  // 密碼檢查
  if (!password || password.length < 6 || !/[A-Za-z]/.test(password)) {
    errorMessage.textContent = "密碼至少 6 個字，且需包含至少一個字母";
    errorMessage.style.display = "block";
    submitButton.disabled = false;
    return;
  }

  try {
    const { data, error } = await supabase.auth.signUp({ email, password });

    if (error) {
      if (error.message.toLowerCase().includes("already registered")) {
        errorMessage.textContent = "⚠️ 帳號已存在，請直接登入！";
        errorMessage.style.color = "orange";
        errorMessage.style.display = "block";
        setTimeout(() => window.location.href = "login.html", 3000);
      } else {
        errorMessage.textContent = "註冊失敗：" + error.message;
        errorMessage.style.color = "red";
        errorMessage.style.display = "block";
        submitButton.disabled = false;
      }
    } else {
      errorMessage.textContent = "✅ 註冊成功，請至信箱點擊驗證信完成驗證";
      errorMessage.style.color = "green";
      errorMessage.style.display = "block";
      setTimeout(() => window.location.href = "login.html", 3000);
    }

  } catch (err) {
    errorMessage.textContent = "系統錯誤：" + err.message;
    errorMessage.style.color = "red";
    errorMessage.style.display = "block";
    submitButton.disabled = false;
  }
});
