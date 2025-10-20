document.addEventListener("navbarLoaded", async () => {
    if (!window.supabaseClient) return //console.error("Supabase 尚未初始化");
    const supabase = window.supabaseClient;

    const productList = document.getElementById("product-list");
    const payBtn = document.querySelector('#pay');

    // 取得登入會員
    const { data: { session } } = await supabase.auth.getSession();
    const currentUser = session?.user;

    // 購物車按鈕
    payBtn.addEventListener('click', () => {
        if (!currentUser) {
            alert("請先登入會員才能使用購物車").then(() => {
              window.location.href = "./login.html";
            });
            return;
        }
        window.location.href = "./cart.html";
    });

    // 載入商品
    async function loadProducts() {
        try {
            const { data, error } = await supabase
                .from("products")
                .select("*")
                .order("created_at", { ascending: false });

            if (error) throw error;

            productList.innerHTML = data.map(p => `
                <div class="col-md-3">
                  <div class="card h-100">
                    <img src="${p.image_url}" class="card-img-top" alt="${p.name}">
                    <div class="card-body">
                      <h5 class="card-title">${p.name}</h5>
                      <p class="card-text">${p.description}</p>
                      <p class="card-text"><strong>$${p.price}</strong></p>
                      <button class="btn btn-primary add-to-cart" 
                        data-id="${p.id}" data-name="${p.name}" data-price="${p.price}">
                        加入購物車
                      </button>
                    </div>
                  </div>
                </div>
            `).join("");

            // 綁定加入購物車按鈕
            document.querySelectorAll(".add-to-cart").forEach(btn => {
                btn.addEventListener("click", async () => {
                    const { data: sessionData } = await supabase.auth.getSession();
                    const currentUser = sessionData.session?.user;
                    if (!currentUser) {
                        alert("請先登入會員才能使用購物車").then(() => {
                          window.location.href = "./login.html";
                        });
                        return;
                    }

                    const product = {
                        id: btn.dataset.id,
                        name: btn.dataset.name,
                        price: parseFloat(btn.dataset.price),
                        quantity: 1
                    };

                    // 讀取購物車
                    let { data: cart } = await supabase
                        .from("carts")
                        .select("*")
                        .eq("user_id", currentUser.id)
                        .maybeSingle();

                    try {
                        if (!cart) {
                            // 新增購物車
                            await supabase.from("carts").insert([{ user_id: currentUser.id, items: [product] }]);
                        } else {
                            // 更新購物車
                            const index = cart.items.findIndex(i => i.id == product.id);
                            if (index > -1) cart.items[index].quantity += 1;
                            else cart.items.push(product);

                            await supabase
                                .from("carts")
                                .update({ items: cart.items, updated_at: new Date().toISOString() })
                                .eq("user_id", currentUser.id);
                        }
                        alert(`${product.name} 已加入購物車`);
                    } catch (err) {
                        //console.error(err);
                        alert("加入購物車失敗，請稍後再試");
                    }
                });
            });

        } catch (err) {
            productList.innerHTML = `<p class="text-danger">無法讀取商品資料：${err.message}</p>`;
        }
    }
    loadProducts();
});
