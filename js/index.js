// ============================
// index.js
// ============================

// ------------------------
// Swiper 初始化（空白先初始化，稍後會重新載入最新新聞）
// ------------------------
let newsSwiper = null;

// ------------------------
// 等待 navbar 載入完成再操作 Supabase
// ------------------------
document.addEventListener("navbarLoaded", async () => {
  if (!window.supabaseClient) {
    // console.error("Supabase Client 尚未初始化！");
    return;
  }
  const supabase = window.supabaseClient;

  // ========================
  // Providers 功能
  // ========================
  try {
    const { data: providers, error: providerError } = await supabase
      .from("providers")
      .select("*")
      .order("created_at", { ascending: true });
    if (providerError) throw providerError;

    renderProviders(providers);
    loadRatings();

    // 篩選 Providers
    document.querySelectorAll(".service-icon").forEach(icon => {
      icon.addEventListener("click", () => {
        document.querySelectorAll(".service-icon").forEach(i => i.classList.remove("active"));
        icon.classList.add("active");
        filterProviders(icon.dataset.category);
      });
    });
  } catch (err) {
    // console.error("讀取 Providers 失敗：", err);
  }

  function renderProviders(providers) {
    const container = document.getElementById("provider-list");
    container.innerHTML = `<h2 id="providers" class="fs-2 text-center mt-2">熱門服務者</h2>`;
    providers.forEach(p => {
      const div = document.createElement("div");
      div.className = "provider col-lg-3 mb-4";
      div.dataset.provider = p.name;
      div.dataset.services = p.specialty;
      div.innerHTML = `
        <img src="${p.img}" class="img-fluid rounded">
        <div>
          <strong>${p.name}</strong><br>
          <span class="rating">讀取中...</span><br>
          專長：${p.specialty}
        </div>`;
      container.appendChild(div);
    });
  }

  async function loadRatings() {
    const providerDivs = document.querySelectorAll(".provider");
    for (const div of providerDivs) {
      const providerName = div.dataset.provider;
      const ratingEl = div.querySelector(".rating");
      const { data, error } = await supabase
        .from("reviews")
        .select("rating")
        .eq("provider_name", providerName);

      if (error) { 
        ratingEl.textContent = "⚠️ 無法讀取"; 
        continue; 
      }
      if (!data || data.length === 0) { 
        ratingEl.textContent = "尚無評價"; 
        continue; 
      }

      const avg = data.reduce((acc, r) => acc + r.rating, 0) / data.length;
      ratingEl.textContent = "⭐".repeat(Math.round(avg)) + "☆".repeat(5 - Math.round(avg)) +
                             ` (${data.length} 評價)`;
    }
  }

  function filterProviders(category) {
    document.querySelectorAll(".provider").forEach(p => {
      const services = p.dataset.services.split("、").map(s => s.trim());
      p.style.display = category === "all" || services.includes(category) ? "block" : "none";
    });
  }

  // ========================
  // 最新消息列表功能（分頁）
  // ========================
  const newsList = document.getElementById("news-list");
  const prevBtn = document.getElementById("prev-page");
  const nextBtn = document.getElementById("next-page");
  const modal = new bootstrap.Modal(document.getElementById("newsModal"));

  let page = 1;
  const pageSize = 5;
  let totalNews = 0;

  async function loadNewsList() {
    try {
      // 取得總筆數
      const { count, error: countError } = await supabase
        .from("news")
        .select("*", { count: "exact", head: true });
      if (countError) throw countError;
      totalNews = count;

      // 取得該頁新聞
      const { data, error } = await supabase
        .from("news")
        .select("*")
        .order("created_at", { ascending: false })
        .range((page - 1) * pageSize, page * pageSize - 1);
      if (error) throw error;

      if (!data || data.length === 0) {
        newsList.innerHTML = `<p class="text-center text-muted">目前沒有新聞。</p>`;
        return;
      }

      // 渲染新聞列表
      newsList.innerHTML = data.map(n => `
        <div class="news-item mb-3" style="cursor:pointer" 
             data-id="${n.id}" data-title="${n.title}" data-content="${n.content}"
             data-image="${n.image_url}" data-author="${n.author}">
          <strong>${n.title}</strong> 
          <span class="text-secondary small">(${new Date(n.created_at).toLocaleDateString()})</span>
          <p class="text-truncate">${n.content}</p>
        </div>
      `).join("");

      // 點擊彈窗
      document.querySelectorAll(".news-item").forEach(item => {
        item.addEventListener("click", () => {
          document.getElementById("newsModalTitle").innerText = item.dataset.title;
          document.getElementById("newsModalContent").innerText = item.dataset.content;
          document.getElementById("newsModalImage").src = item.dataset.image;
          document.getElementById("newsModalAuthor").innerText = `發布者：${item.dataset.author}`;
          modal.show();
        });
      });

      // 控制上一頁 / 下一頁按鈕
      prevBtn.disabled = page <= 1;
      nextBtn.disabled = page * pageSize >= totalNews;

    } catch (err) {
      // console.error("載入新聞失敗：", err);
      newsList.innerHTML = `<p class="text-center text-danger">載入新聞時發生錯誤。</p>`;
    }
  }

  prevBtn.addEventListener("click", () => { 
    if (page > 1) { page--; loadNewsList(); } 
  });
  nextBtn.addEventListener("click", () => { 
    if (page * pageSize < totalNews) { page++; loadNewsList(); } 
  });

  // 首次載入
  loadNewsList();

  // ========================
  // Swiper 顯示最新三則新聞
  // ========================
  const swiperWrapper = document.getElementById("news-swiper-wrapper");

  async function loadNewsSwiper() {
    try {
      const { data: news, error } = await supabase
        .from("news")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(3);
      if (error) throw error;

      swiperWrapper.innerHTML = ""; // 清空

      news.forEach(n => {
        const slide = document.createElement("div");
        slide.className = "swiper-slide";
        slide.innerHTML = `
          <img src="${n.image_url || 'https://dummyimage.com/600x300/ddd/000.jpg&text=No+Image'}"
               class="img-fluid rounded" style="cursor:pointer;" alt="${n.title}">`;

        // 點擊圖片彈 Modal
        slide.querySelector("img").addEventListener("click", () => {
          document.getElementById("newsModalTitle").innerText = n.title;
          document.getElementById("newsModalContent").innerText = n.content;
          document.getElementById("newsModalImage").src = n.image_url;
          document.getElementById("newsModalAuthor").innerText = `發布者：${n.author}`;
          modal.show();
        });

        swiperWrapper.appendChild(slide);
      });

      // 初始化 Swiper（若已存在則先 destroy）
      if (newsSwiper) newsSwiper.destroy(true, true);

      newsSwiper = new Swiper(".mySwiper", {
        pagination: { el: ".swiper-pagination" },
        navigation: { nextEl: ".swiper-button-next", prevEl: ".swiper-button-prev" },
        loop: true,
      });

    } catch (err) {
      // console.error("載入 Swiper 新聞失敗：", err);
    }
  }

  // 首次載入
  loadNewsSwiper();
});
