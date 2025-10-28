// ------------------------
// DOM 元素
// ------------------------
const providerSelect = document.getElementById("provider");
const reviewsDiv = document.getElementById("reviews"); // 初始顯示最新3則
const starSpan = document.getElementById("star"); 
const submitBtn = document.getElementById("submit-btn");
const commentInput = document.getElementById("comment");
const ratingSelect = document.getElementById("rating");
const openModalBtn = document.getElementById("open-modal-btn");
const modal = document.getElementById("reviews-modal");
const closeModalBtn = document.getElementById("close-modal");
const allReviewsDiv = document.getElementById("all-reviews");

let reviewsVisible = false;

// ------------------------
// Navbar 載入後初始化
// ------------------------
document.addEventListener("navbarLoaded", async () => {
    if (!window.supabaseClient) {
        // console.error("supabaseClient 尚未初始化");
        return;
    }
    await loadProviders();
    await updateStarInfo();
    await loadLatestReviews(); // 初始顯示最新三則
});

// ------------------------
// 讀取服務者名單
// ------------------------
async function loadProviders() {
    const { data, error } = await window.supabaseClient
        .from("providers")
        .select("name")
        .order("name", { ascending: true });

    if (error) {
        // console.error("無法讀取服務者名單:", error.message);
        return;
    }

    providerSelect.innerHTML = "";
    data.forEach(p => {
        const option = document.createElement("option");
        option.value = p.name;
        option.textContent = p.name;
        providerSelect.appendChild(option);
    });
}

// ------------------------
// 切換服務者
// ------------------------
providerSelect.addEventListener("change", async () => {
    await updateStarInfo();
    await loadLatestReviews();
});

// ------------------------
// 送出評論
// ------------------------
submitBtn.addEventListener("click", async () => {
    if (!window.supabaseClient) {
        alert("系統尚未準備好，請稍後再試");
        return;
    }

    const { data: { session } } = await window.supabaseClient.auth.getSession();
    if (!session) {
        alert("請先登入").then(() => {
            window.location.href = "./login.html";
        });
        return;
    }

    const provider = providerSelect.value;
    const rating = parseInt(ratingSelect.value);
    const comment = commentInput.value.trim();

    if (comment === "") {
        alert("請輸入評論內容");
        return;
    }

    const user_id = session.user.id;

    // ------------------------
    // 1️⃣ 檢查是否有預約紀錄 (性能優化: 只檢查數量)
    // ------------------------
    const { count: bookingsCount, error: bookingsError } = await window.supabaseClient
        .from("bookings")
        .select("id", { count: "exact", head: true }) // 查詢優化
        .eq("user_id", user_id)
        .eq("provider_name", provider);

    if (bookingsError) {
        alert("無法確認預約紀錄：" + bookingsError.message);
        return;
    }

    if (bookingsCount === 0) { // 依據優化後的 count 檢查邏輯
        alert("⚠️ 您尚未預約過此服務者，無法評論");
        return;
    }

    // ------------------------
    // 2️⃣ 檢查是否已經評論過 (性能優化: 只檢查數量)
    // ------------------------
    const { count: reviewCount } = await window.supabaseClient
        .from("reviews")
        .select("id", { count: "exact", head: true }) // 查詢優化
        .eq("provider_name", provider)
        .eq("user_id", user_id);

    if (reviewCount > 0) { // 依據優化後的 count 檢查邏輯
        alert("⚠️ 您已對此服務者評論過，無法重複評論");
        return;
    }

    // ------------------------
    // 3️⃣ 新增評論
    // ------------------------
    const { error } = await window.supabaseClient
        .from("reviews")
        .insert([{ provider_name: provider, rating, comment, user_id }]);

    if (!error) {
        alert("✅ 評價送出成功");
        commentInput.value = "";
        ratingSelect.value = "5"; // 重置評分
        await updateStarInfo();
        await loadLatestReviews();
        if (reviewsVisible) await loadAllReviews();
    } else {
        alert("❌ 無法送出：" + error.message);
    }
});

// ------------------------
// 顯示平均星數
// ------------------------
async function updateStarInfo() {
    const provider = providerSelect.value;
    if (!provider) { 
        starSpan.textContent = ""; 
        return; 
    }

    const { data, error } = await window.supabaseClient
        .from("reviews")
        .select("rating")
        .eq("provider_name", provider);

    if (error) { 
        starSpan.textContent = "⚠️ 無法讀取資料"; 
        return; 
    }
    if (!data || data.length === 0) { 
        starSpan.textContent = "☆☆☆☆☆ (0 評價)"; 
        return; 
    }

    const count = data.length;
    const avg = data.reduce((acc, r) => acc + (r.rating || 0), 0) / count;
    const stars = "⭐".repeat(Math.round(avg)) + "☆".repeat(5 - Math.round(avg));
    starSpan.textContent = `${stars} (${avg.toFixed(1)} / 5，共 ${count} 筆評價)`;
}

// ------------------------
// 初始顯示最新三則評論
// ------------------------
async function loadLatestReviews() {
    const provider = providerSelect.value;
    if (!provider) { reviewsDiv.innerHTML = ""; return; }

    const { data, error } = await window.supabaseClient
        .from("reviews")
        .select("rating, comment, created_at")
        .eq("provider_name", provider)
        .order("created_at", { ascending: false })
        .limit(3);

    if (error) { reviewsDiv.innerHTML = "⚠️ 無法讀取資料：" + error.message; return; }
    if (!data || data.length === 0) { reviewsDiv.innerHTML = "<p>尚無評論</p>"; return; }

    reviewsDiv.innerHTML = data.map(r => {
        const stars = "⭐".repeat(r.rating || 0) + "☆".repeat(5 - (r.rating || 0));
        return `<div class="card my-2 text-start">
                    <div class="card-body">
                        <strong>${stars}</strong>
                        <p class="mb-1">${r.comment}</p>
                        <small class="text-muted">${new Date(r.created_at).toLocaleString()}</small>
                    </div>
                </div>`;
    }).join("");
}

// ------------------------
// 打開 modal 顯示全部評論
// ------------------------
openModalBtn.addEventListener("click", async () => {
    reviewsVisible = true;
    modal.style.display = "block";
    await loadAllReviews();
});

// 關閉 modal
closeModalBtn.addEventListener("click", () => {
    modal.style.display = "none";
    reviewsVisible = false;
});

// ------------------------
// 載入全部評論到 modal
// ------------------------
async function loadAllReviews() {
    const provider = providerSelect.value;
    if (!provider) { allReviewsDiv.innerHTML = ""; return; }

    const { data, error } = await window.supabaseClient
        .from("reviews")
        .select("rating, comment, created_at")
        .eq("provider_name", provider)
        .order("created_at", { ascending: false });

    if (error) { allReviewsDiv.innerHTML = "⚠️ 無法讀取資料：" + error.message; return; }
    if (!data || data.length === 0) { allReviewsDiv.innerHTML = "<p>尚無評論</p>"; return; }

    allReviewsDiv.innerHTML = data.map(r => {
        const stars = "⭐".repeat(r.rating || 0) + "☆".repeat(5 - (r.rating || 0));
        return `<div class="card my-2 text-start">
                    <div class="card-body">
                        <strong>${stars}</strong>
                        <p class="mb-1">${r.comment}</p>
                        <small class="text-muted">${new Date(r.created_at).toLocaleString()}</small>
                    </div>
                </div>`;
    }).join("");
}