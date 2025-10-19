
document.addEventListener("navbarLoaded", () => {
    if (!window.supabaseClient) {
        console.error("supabaseClient 尚未初始化");
        return;
    }

    const form = document.getElementById("reset-form");
    const message = document.getElementById("message");

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
            const { data, error } = await window.supabaseClient.auth.updateUser({
                password: newPassword,
            });

            if (error) {
                // 自訂各種常見錯誤訊息
                if (error.message.includes("New password should be different")) {
                    message.textContent = "❌ 新密碼不能與舊密碼相同！請輸入新的密碼";
                } else if (error.message.includes("Auth session missing")) {
                    message.textContent = "❌ 重設密碼連結已失效，請重新申請重設郵件。";
                } else if (error.message.includes("Password should contain at least one character")) {
                    message.textContent = "❌ 密碼需包含至少一個字母及一個數字，請重新輸入";
                } else {
                    message.textContent = "❌ 重設失敗：" + error.message;
                }
                message.classList.add("text-danger");
            } else {
                message.textContent = "✅ 密碼已成功更新！即將導向登入頁面...";
                message.classList.add("text-success");
                setTimeout(() => {
                    window.location.href = "login.html";
                }, 2000);
            }
        } catch (err) {
            message.textContent = "❌ 系統錯誤：" + err.message;
            message.classList.add("text-danger");
            console.error(err);
        }
    });
});
