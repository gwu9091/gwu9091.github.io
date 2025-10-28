// ------------------------
// Supabase 初始化
// ------------------------
// 保持本地初始化以確保功能正常
const { createClient } = supabase;
const supabaseClient = createClient(
    "https://cbmimzpytdmtjvanvaoh.supabase.co",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNibWltenB5dGRtdGp2YW52YW9oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg0MjE2MzUsImV4cCI6MjA2Mzk5NzYzNX0.YHon747wNSjx6-ZcG-344tlKXtKqXxl-VYu1Vtbusgo"
);

document.addEventListener("DOMContentLoaded", () => {
    const loginForm = document.getElementById("login-form");
    const errorMessage = document.getElementById("error-message");

    loginForm?.addEventListener("submit", async function (event) {
        event.preventDefault();

        const email = document.getElementById("email").value;
        const password = document.getElementById("password").value;
        errorMessage.style.display = "none";
        errorMessage.textContent = "";

        try {
            const { error } = await supabaseClient.auth.signInWithPassword({
                email,
                password,
            });

            if (error) {
                // 判斷錯誤類型
                if (error.message.includes("Invalid login credentials")) {
                    errorMessage.textContent = "❌ 帳號或密碼錯誤，請重新輸入";
                } else if (error.message.includes("Email not confirmed")) {
                    errorMessage.textContent = "❌ 請先驗證電子郵件，然後再登入";
                } else {
                    errorMessage.textContent = "❌ 登入失敗：" + error.message;
                }
                errorMessage.style.display = "block";
            } else {
                // 登入成功
                // 使用 SweetAlert2 彈窗後回傳 Promise
                alert("✅ 登入成功！").then(() => {
                    const referrer = document.referrer;
                    const loginPath = window.location.origin + "/login.html";
                    const resetPath = window.location.origin + "/reset-password.html";

                    if (referrer.includes(resetPath)) {
                        window.location.href = "index.html";
                    } else if (referrer && !referrer.includes(loginPath)) {
                        window.location.href = referrer; // 返回來源頁
                    } else {
                        window.location.href = "index.html"; // 沒有來源頁或來源為登入頁則跳首頁
                    }
                });
            }
        } catch (err) {
            errorMessage.textContent = "❌ 登入過程發生錯誤，請稍後再試";
            errorMessage.style.display = "block";
        }
    });
});