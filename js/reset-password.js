document.addEventListener("DOMContentLoaded", async () => {
  // 確認 supabase 已載入
  if (!window.supabase) {
    console.error("Supabase 尚未載入！");
    return;
  }

  // 初始化 Supabase client
  const supabaseClient = supabase.createClient(
    "https://cbmimzpytdmtjvanvaoh.supabase.co",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNibWltenB5dGRtdGp2YW52YW9oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg0MjE2MzUsImV4cCI6MjA2Mzk5NzYzNX0.YHon747wNSjx6-ZcG-344tlKXtKqXxl-VYu1Vtbusgo"
  );

  // 取得 DOM 元素
  const form = document.getElementById("reset-form");
  const message = document.getElementById("message");
  const passwordInput = document.getElementById("new-password");

  if (!form || !message || !passwordInput) {
    console.error("必要 DOM 元素不存在！請檢查 HTML");
    return;
  }

  // 取得 URL 上的 access_token（忘記密碼流程）
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get("access_token");

  // 判斷模式
  const mode = token ? "recovery" : "login";

  // 提示文字
  if (mode === "recovery") {
    message.textContent = "請輸入新密碼完成重設";
    message.className = "text-center text-info mt-3";
  } else {
    message.textContent = "請輸入新密碼來修改你的密碼";
    message.className = "text-center text-info mt-3";
  }

  // 表單提交
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    message.textContent = "";
    message.className = "text-center mt-3";

    const newPassword = passwordInput.value.trim();
    if (!newPassword || newPassword.length < 6 || !/[A-Za-z]/.test(newPassword)) {
      message.textContent = "❌ 密碼至少 6 個字，且需包含至少一個字母";
      message.classList.add("text-danger");
      return;
    }

    try {
      let result;

      if (mode === "recovery") {
        // 忘記密碼，用 access_token
        result = await supabaseClient.auth.updateUser(
          { password: newPassword },
          { accessToken: token }
        );
      } else {
        // 登入後修改密碼
        const { data: userData } = await supabaseClient.auth.getUser();
        if (!userData || !userData.user) {
          message.textContent = "❌ 尚未登入，無法修改密碼";
          message.classList.add("text-danger");
          return;
        }
        result = await supabaseClient.auth.updateUser({ password: newPassword });
      }

      // 錯誤處理與翻譯
      if (result.error) {
        let errMsg = result.error.message;

        // 🔹 翻譯常見錯誤訊息
        if (errMsg.includes("Password should contain at least one character")) {
          errMsg = "密碼需包含大小寫字母與數字（例如 Abc123）。";
        } else if (errMsg.includes("Email address") && errMsg.includes("invalid")) {
          errMsg = "信箱格式無效，請輸入正確的電子郵件地址。";
        }

        message.textContent = "❌ 更新失敗：" + errMsg;
        message.classList.add("text-danger");
      } else {
        message.textContent = "✅ 密碼已成功更新！即將導向首頁...";
        message.classList.add("text-success");
        setTimeout(() => window.location.href = "index.html", 2000);
      }

    } catch (err) {
      message.textContent = "❌ 系統錯誤：" + err.message;
      message.classList.add("text-danger");
    }
  });
});
