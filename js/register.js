// ------------------------
// 初始化 Supabase (保持本地初始化以確保功能正常)
// ------------------------
const supabaseClient = supabase.createClient(
  "https://lslsapzffervvvnqwxcb.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxzbHNhcHpmZmVydnZ2bnF3eGNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE0MzAyOTQsImV4cCI6MjA5NzAwNjI5NH0.L-aDGm1eTwDZMsxMGZ90v3IjXIl9mCC7y-fnut_Qyqk"
);

document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("register-form");
    const errorMessage = document.getElementById("error-message");

    form?.addEventListener("submit", async (e) => {
        e.preventDefault();
        errorMessage.style.display = "none";
        errorMessage.style.color = "red";

        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value.trim();

        try {
            // 🔹 檢查帳號是否存在
            // 註：這裡假設您在 Supabase 中有一個名為 "check_user" 的 RLS 啟用函數
            const { data: checkData, error: checkError } = await supabaseClient.rpc("check_user", { email });
            if (checkError) throw checkError;

            if (checkData.exists) {
                errorMessage.textContent = "⚠️ 帳號已存在，請直接登入。";
                errorMessage.style.display = "block";
                return;
            }

            // 🔹 註冊新使用者
            const { error: signUpError } = await supabaseClient.auth.signUp({
                email,
                password
            });
            if (signUpError) throw signUpError;

            // 🔹 顯示成功訊息
            errorMessage.style.color = "green";
            errorMessage.innerHTML = `
                ✅ 註冊成功！<br>
                已寄出驗證信至 <strong>${email}</strong>，請前往信箱完成驗證。
            `;
            errorMessage.style.display = "block";

            // 註冊成功後跳轉到登入頁，讓使用者完成驗證後登入
            setTimeout(() => window.location.href = "login.html", 3000);

        } catch (err) {
            let msg = err.message;

            // 🔹 錯誤訊息翻譯（自動判斷英文內容）
            if (msg.includes('Email address') && msg.includes('invalid')) {
                msg = '信箱格式無效，請輸入正確的電子郵件地址。';
            } 
            else if (msg.includes('Password should contain at least one character')) {
                msg = '密碼需包含大小寫字母與數字（例如 Abc123）。';
            }

            errorMessage.textContent = msg;
            errorMessage.style.display = "block";
        }
    });
});