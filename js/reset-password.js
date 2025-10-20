document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("reset-form");
    const message = document.getElementById("message");

    // 取得 URL 上的 access_token
    const urlParams = new URLSearchParams(window.location.search);
    const access_token = urlParams.get("access_token");

    if (!access_token) {
        message.textContent = "❌ 無效的重設密碼連結，請重新申請重設郵件。";
        message.className = "text-center text-danger mt-3";
        form.style.display = "none";
        return;
    }

    form.addEventListener("submit", async (event) => {
        event.preventDefault();
        message.textContent = "";
        message.className = "text-center mt-3";

        const newPassword = document.getElementById("new-password").value.trim();
        if (!newPassword) {
            message.textContent = "❌ 請輸入新密碼！";
            message.classList.add("text-danger");
            return;
        }

        try {
            // 使用 access_token 重設密碼
            const { data, error } = await window.supabaseClient.auth.updateUser(
                { password: newPassword },
                { accessToken: access_token }
            );

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
});
