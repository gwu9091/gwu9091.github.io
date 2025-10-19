
document.addEventListener("navbarLoaded", () => {
    if (!window.supabaseClient) return;

    const forgotForm = document.getElementById("forgot-form");
    const emailInput = document.getElementById("email");
    const messageDiv = document.getElementById("message");
    const submitBtn = forgotForm.querySelector("button");

    forgotForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        messageDiv.textContent = "";

        const email = emailInput.value.trim();
        if (!email) {
            messageDiv.innerHTML = `<span class="text-danger">❌ 請輸入電子郵件</span>`;
            return;
        }

        // 禁用按鈕，避免連續點擊
        submitBtn.disabled = true;

        try {
            const { data, error } = await window.supabaseClient.auth.resetPasswordForEmail(email, {
                redirectTo: window.location.origin + "/reset-password.html"
            });

            if (error) {
                // 判斷是否為短時間內重複請求
                if (error.message.includes("For security purposes")) {
                    messageDiv.innerHTML = `<span class="text-danger">❌ 請稍候再重試，避免重複請求</span>`;
                } else {
                    messageDiv.innerHTML = `<span class="text-danger">❌ ${error.message}</span>`;
                }
            } else {
                messageDiv.innerHTML = `<span class="text-success">✅ 重設密碼郵件已送出，請檢查信箱</span>`;
                forgotForm.reset();
            }
        } finally {
            // 4 秒後再啟用按鈕
            setTimeout(() => submitBtn.disabled = false, 10000);
        }
    });
});
