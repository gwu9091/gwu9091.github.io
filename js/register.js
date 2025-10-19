
const supabase = window.supabase.createClient(
    "https://cbmimzpytdmtjvanvaoh.supabase.co",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNibWltenB5dGRtdGp2YW52YW9oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg0MjE2MzUsImV4cCI6MjA2Mzk5NzYzNX0.YHon747wNSjx6-ZcG-344tlKXtKqXxl-VYu1Vtbusgo"
);

document
    .getElementById("register-form")
    .addEventListener("submit", async function (event) {
        event.preventDefault();

        const email = document.getElementById("email").value;
        const password = document.getElementById("password").value;
        const errorMessage = document.getElementById("error-message");

        const { data, error } = await supabase.auth.signUp({
            email,
            password,
        });

        if (error) {
            errorMessage.textContent = "註冊失敗：" + error.message;
            errorMessage.style.display = "block";
        } else {
            errorMessage.style.display = "none";
            alert("註冊成功，請至信箱點擊驗證信完成驗證！");
            window.location.href = "login.html";
        }
    });
