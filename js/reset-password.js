document.addEventListener("DOMContentLoaded", async () => {
  const form = document.getElementById("reset-form");
  const message = document.getElementById("message");

  // 取得 URL 上的 token（Supabase 重設密碼預設是 token）
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get("token");

  if (!token) {
    message.textContent = "❌ 無效的重設密碼連結，請重新申請重設郵件。";
    message.className = "text-center text-danger mt-3";
    form.style.display = "none";
    return;
  }

  try {
    // 將 token 設為 session
    const { data: sessionData, error: sessionError } = await supabase.auth.setSession({ access_token: token });
    if (sessionError) {
      message.textContent = "❌ 連結失效或已過期，請重新申請重設郵件。";
      message.className = "text-center text-danger mt-3";
      form.style.display = "none";
      return;
    }

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      message.textContent = "";
      message.className = "text-center mt-3";

      const newPassword = document.getElementById("new-password").value.trim();
      if (!newPassword) {
        message.textContent = "❌ 請輸入新密碼！";
        message.classList.add("text-danger");
        return;
      }

      try {
        // 更新密碼
        const { data, error } = await supabase.auth.updateUser({ password: newPassword });

        if (error) {
          message.textContent = "❌ 重設失敗：" + error.message;
          message.classList.add("text-danger");
        } else {
          message.textContent = "✅ 密碼已成功更新！即將導向首頁...";
          message.classList.add("text-success");
          setTimeout(() => {
            window.location.href = "index.html";
          }, 2000);
        }
      } catch (err) {
        message.textContent = "❌ 系統錯誤：" + err.message;
        message.classList.add("text-danger");
      }
    });

  } catch (err) {
    message.textContent = "❌ 系統錯誤：" + err.message;
    message.className = "text-center text-danger mt-3";
    form.style.display = "none";
  }
});
