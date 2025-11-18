document.addEventListener("DOMContentLoaded", async function () {
  const navbarContainer = document.getElementById("navbar-placeholder");
  if (!navbarContainer) return;

  try {
    const response = await fetch("navbar.html");
    const navbarHtml = await response.text();
    navbarContainer.innerHTML = navbarHtml;

    // ------------------------
    // 初始化 Supabase
    // ------------------------
    const { createClient } = supabase;
    window.supabaseClient = createClient(
      "https://cbmimzpytdmtjvanvaoh.supabase.co",
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNibWltenB5dGRtdGp2YW52YW9oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg0MjE2MzUsImV4cCI6MjA2Mzk5NzYzNX0.YHon747wNSjx6-ZcG-344tlKXtKqXxl-VYu1Vtbusgo"
    );

    // 取得登入狀態
    const { data } = await window.supabaseClient.auth.getSession();
    const session = data?.session;
    const authLinksContainer = document.getElementById("auth-links");

    if (authLinksContainer) {
      authLinksContainer.innerHTML = "";

      if (session) {
  // ------------------------
  // 已登入：建立會員中心 / 登出
  // ------------------------
  const li = document.createElement("li");
  li.classList.add("nav-item", "d-flex", "align-items-center");

  // 會員中心
  const memberLink = document.createElement("a");
  memberLink.href = "member.html";
  memberLink.textContent = "會員中心";
  memberLink.classList.add("nav-link");

  // 分隔符
  const divider = document.createElement("span");
  divider.textContent = "/";
  divider.classList.add("text-white", "mx-1");

  // 登出
  const logoutLink = document.createElement("a");
  logoutLink.href = "#";
  logoutLink.textContent = "登出";
  logoutLink.classList.add("nav-link");

  // 登出事件
  logoutLink.addEventListener("click", async (e) => {
    e.preventDefault();
    await window.supabaseClient.auth.signOut();

    if (typeof window.showAlert === "function") {
      window.showAlert("您已登出！", "success");
    } else {
      alert("您已登出！");
    }

    setTimeout(() => location.reload(), 1500);
  });

  li.appendChild(memberLink);
  li.appendChild(divider);
  li.appendChild(logoutLink);

  authLinksContainer.appendChild(li);
} else {
        // ------------------------
        // 未登入
        // ------------------------
        const loginLink = document.createElement("a");
        loginLink.href = "login.html";
        loginLink.textContent = "登入";
        loginLink.classList.add("nav-link");
        authLinksContainer.appendChild(loginLink);
      }
    }

    // ------------------------
    // 修正 active 標示（會員中心可正常顯示）
    // ------------------------
    const currentPage = window.location.pathname.split("/").pop();
    const navLinks = document.querySelectorAll(".navbar .nav-link");

    navLinks.forEach((link) => {
      // <a> 連結
      if (link.tagName === "A") {
        const linkPage = link.getAttribute("href");
        if (linkPage === currentPage || (linkPage === "index.html" && currentPage === "")) {
          link.classList.add("active");
        } else {
          link.classList.remove("active");
        }
      }

      // <span> (會員中心 / 登出)
      else if (link.tagName === "SPAN") {
        const memberInner = link.querySelector('a[href="member.html"]');
        if (memberInner) {
          const linkPage = memberInner.getAttribute("href");
          if (linkPage === currentPage) {
            link.classList.add("active");
          } else {
            link.classList.remove("active");
          }
        }
      }
    });

    document.dispatchEvent(new Event("navbarLoaded"));
  } catch (err) {
    console.error("導覽列載入錯誤：", err);
  }
});
