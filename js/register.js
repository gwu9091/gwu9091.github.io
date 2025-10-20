// 初始化 Supabase
const supabaseClient = supabase.createClient(
  "https://cbmimzpytdmtjvanvaoh.supabase.co",
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNibWltenB5dGRtdGp2YW52YW9oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg0MjE2MzUsImV4cCI6MjA2Mzk5NzYzNX0.YHon747wNSjx6-ZcG-344tlKXtKqXxl-VYu1Vtbusgo"
);

const form = document.getElementById("register-form");
const errorMessage = document.getElementById("error-message");

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  errorMessage.style.display = "none";
  errorMessage.style.color = "red";

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();

  // 🔹 密碼檢查
  if (!password || password.length < 6 || !/[A-Za-z]/.test(password)) {
    errorMessage.textContent = "密碼至少 6 個字，且需包含至少一個字母";
    errorMessage.style.display = "block";
    return;
  }

  try {
    // 🔹 呼叫 Supabase SQL Function 檢查帳號是否存在
    const { data: checkData, error: checkError } = await supabaseClient.rpc("check_user", { email });
    if (checkError) throw checkError;

    if (checkData.exists) {
      errorMessage.textContent = "⚠️ 帳號已存在";
      errorMessage.style.display = "block";
      return;
    }

    // 🔹 註冊新使用者（會自動寄驗證信）
    const { data: signUpData, error: signUpError } = await supabaseClient.auth.signUp({
      email,
      password
    });
    if (signUpError) throw signUpError;

    // 🔹 提示使用者檢查信箱
    errorMessage.style.color = "green";
    errorMessage.innerHTML = `
      ✅ 註冊成功！<br>
      已寄出驗證信到 <strong>${email}</strong>，請前往信箱完成驗證。
    `;
    errorMessage.style.display = "block";

    // 可選：3秒後自動跳轉登入頁
    setTimeout(() => window.location.href = "login.html", 3000);

  } catch (err) {
    errorMessage.textContent = "系統錯誤：" + err.message;
    errorMessage.style.display = "block";
  }
});
