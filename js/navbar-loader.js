document.addEventListener("DOMContentLoaded", async function() {
  const navbarContainer = document.getElementById("navbar-placeholder");
  if (!navbarContainer) return;

  try {
    const response = await fetch("navbar.html");
    const navbarHtml = await response.text();
    navbarContainer.innerHTML = navbarHtml;

    // ------------------------
    // 初始化 Supabase 並設為全域變數
    // ------------------------
    const { createClient } = supabase;
    window.supabaseClient = createClient(
      "https://cbmimzpytdmtjvanvaoh.supabase.co",
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNibWltenB5dGRtdGp2YW52YW9oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg0MjE2MzUsImV4cCI6MjA2Mzk5NzYzNX0.YHon747wNSjx6-ZcG-344tlKXtKqXxl-VYu1Vtbusgo"
    );

    // ------------------------
    // 取得登入狀態
    // ------------------------
    const { data } = await window.supabaseClient.auth.getSession();
    const session = data?.session;
    const authLinksContainer = document.getElementById("auth-links");

    if (authLinksContainer) {
      authLinksContainer.innerHTML = "";

      if (session) {
        // 已登入
        const logoutLink = document.createElement("a");
        logoutLink.href = "#";
        logoutLink.textContent = "登出";
        logoutLink.addEventListener("click", async (e) => {
          e.preventDefault();
          await window.supabaseClient.auth.signOut();
          alert("您已登出！");
          setTimeout(() => location.reload(), 2000);
        });

        const divider = document.createElement("span");
        divider.className = "divider";
        divider.textContent = " / ";

        const memberLink = document.createElement("a");
        memberLink.href = "member.html";
        memberLink.textContent = "會員中心";

        authLinksContainer.appendChild(memberLink);
        authLinksContainer.appendChild(divider);
        authLinksContainer.appendChild(logoutLink);
      } else {
        // 未登入
        const loginLink = document.createElement("a");
        loginLink.href = "login.html";
        loginLink.textContent = "登入";
        authLinksContainer.appendChild(loginLink);
      }
    }

    // ------------------------
    // 自動設定目前頁面 active 狀態
    // ------------------------
    const currentPage = window.location.pathname.split("/").pop();
    const navLinks = document.querySelectorAll(".navbar .nav-link");

    navLinks.forEach(link => {
      const linkPage = link.getAttribute("href");
      if (linkPage === currentPage || (linkPage === "index.html" && currentPage === "")) {
        link.classList.add("active");
      } else {
        link.classList.remove("active");
      }
    });

    // ------------------------
    // 通知 navbar 載入完成
    // ------------------------
    document.dispatchEvent(new Event("navbarLoaded"));

  } catch (err) {
    console.error("導覽列載入錯誤：", err);
  }
});
