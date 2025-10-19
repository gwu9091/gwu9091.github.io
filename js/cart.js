document.addEventListener("navbarLoaded", async () => {
    const supabase = window.supabaseClient;

    const cartItemsDiv = document.getElementById("cart-items");
    const totalPriceSpan = document.getElementById("total-price");
    const clearCartBtn = document.getElementById("clear-cart");
    const checkoutBtn = document.getElementById("checkout-btn");

    // 取得登入會員
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;

    if (!user) { 
        alert("請先登入會員！");
        setTimeout(() => { window.location.href = "./login.html"; }, 100);
        return;
    }

    // DOM 元素不存在就直接返回
    if (!cartItemsDiv || !totalPriceSpan || !clearCartBtn || !checkoutBtn) return;

    let cart = [];

    // 讀取購物車
    async function loadCart() {
        const { data, error } = await supabase
            .from("carts")
            .select("items")
            .eq("user_id", user.id)
            .maybeSingle();

        if (error) console.error("讀取購物車失敗:", error);
        cart = data?.items || [];
        renderCart();
    }

    // 渲染購物車
    function renderCart() {
        if (cart.length === 0) {
            cartItemsDiv.innerHTML = "<p>購物車是空的</p>";
            totalPriceSpan.textContent = 0;
            return;
        }

        let html = '';
        let total = 0;

        cart.forEach((item, index) => {
            total += Number(item.price) * item.quantity;
            html += `
                <div class="d-flex justify-content-between align-items-center border-bottom py-2">
                    <div><strong>${item.name}</strong> x ${item.quantity}</div>
                    <div>
                        ${item.price * item.quantity} 元
                        <button class="btn btn-sm btn-outline-danger ms-2 remove-btn" data-index="${index}">❌</button>
                    </div>
                </div>
            `;
        });

        cartItemsDiv.innerHTML = html;
        totalPriceSpan.textContent = total;
    }

    // 刪除商品事件委派
    cartItemsDiv.addEventListener("click", async (e) => {
        if (e.target.classList.contains("remove-btn")) {
            const index = Number(e.target.dataset.index);
            cart.splice(index, 1);
            await saveCart();
            renderCart();
        }
    });

    // 清空購物車
    clearCartBtn.addEventListener("click", async () => {
        cart = [];
        await saveCart();
        renderCart();
    });

    // ✅ 結帳：建立訂單 + 清空購物車
    checkoutBtn.addEventListener("click", async () => {
        if (cart.length === 0) {
            alert("購物車是空的！");
            return;
        }

        // 計算總價
        const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

        try {
            // Step 1️⃣：寫入 orders 表
            const { error: orderError } = await supabase
                .from("orders")
                .insert({
                    user_id: user.id,
                    items: cart,
                    total_price: total,
                    created_at: new Date().toISOString()
                });

            if (orderError) throw orderError;

            // Step 2️⃣：清空購物車
            cart = [];
            await saveCart();
            renderCart();

            // Step 3️⃣：提示使用者
            alert("✅ 結帳成功，訂單已建立！感謝您的購買！");

        } catch (err) {
            console.error("建立訂單失敗:", err.message);
            alert("❌ 結帳失敗，請稍後再試！");
        }
    });

    // 儲存購物車到 Supabase
    async function saveCart() {
        try {
            const { data, error } = await supabase
                .from("carts")
                .upsert(
                    {
                        user_id: user.id,
                        items: cart,
                        updated_at: new Date().toISOString()
                    },
                    { onConflict: "user_id" }
                );
            if (error) throw error;
            return data;
        } catch (err) {
            console.error("購物車儲存失敗:", err.message);
            return null;
        }
    }

    // 初次載入
    await loadCart();
});
