document.addEventListener("DOMContentLoaded", async () => {
    // ------------------------
    // Supabase 初始化
    // ------------------------
    const supabaseClient = supabase.createClient(
        "https://cbmimzpytdmtjvanvaoh.supabase.co",
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNibWltenB5dGRtdGp2YW52YW9oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg0MjE2MzUsImV4cCI6MjA2Mzk5NzYzNX0.YHon747wNSjx6-ZcG-344tlKXtKqXxl-VYu1Vtbusgo"
    );

    // ------------------------
    // 取得使用者 session
    // ------------------------
    const { data: { session } } = await supabaseClient.auth.getSession();
    const currentUser = session?.user;

    if (!currentUser) {
        alert("請先登入會員,才能使用會員功能").then(() => {
          window.location.href = "./login.html";
        });
        return;
    }

    // ------------------------
    // 側邊分頁切換
    // ------------------------
    function initTabSwitch(buttonsSelector, contentsSelector) {
        const buttons = document.querySelectorAll(buttonsSelector);
        const contents = document.querySelectorAll(contentsSelector);
        buttons.forEach(btn => {
            btn.addEventListener("click", () => {
                buttons.forEach(b => b.classList.remove("active"));
                contents.forEach(c => c.classList.add("hidden"));
                btn.classList.add("active");
                document.getElementById(btn.dataset.target).classList.remove("hidden");
            });
        });
    }
    initTabSwitch(".tab-btn", ".tab-content");
    initTabSwitch(".pet-tab", ".pet-tab-content");
    function initTabSwitch(buttonsSelector, contentsSelector) {
        const buttons = document.querySelectorAll(buttonsSelector);
        const contents = document.querySelectorAll(contentsSelector);
        buttons.forEach(btn => {
            btn.addEventListener("click", () => {
                buttons.forEach(b => b.classList.remove("active"));
                contents.forEach(c => c.classList.add("hidden"));
                btn.classList.add("active");
                const target = btn.dataset.target;
                const el = document.getElementById(target);
                if (el) el.classList.remove("hidden");
            });
        });
    }

    // 初始化 tab
    initTabSwitch(".tab-btn", ".tab-content");        // 左側主要頁面
    initTabSwitch(".pet-tab", ".pet-tab-content");    // 寵物子頁面
    initTabSwitch(".order-tab", ".order-tab-content");// 訂單子頁面


    // ------------------------
    // 登出 & 修改密碼
    // ------------------------
    const logoutBtn = document.getElementById("logout");
    const updatePasswordBtn = document.getElementById("update-password-btn");
    const messageEl = document.getElementById("message");

    logoutBtn?.addEventListener("click", async () => {
        const { error } = await supabaseClient.auth.signOut();
        if (error) messageEl.innerHTML = `<span class="text-danger">登出失敗: ${error.message}</span>`;
        else {
            messageEl.innerHTML = `<span class="text-success">已登出，正在跳轉...</span>`;
            setTimeout(() => window.location.href = "./login.html", 800);
        }
    });

    updatePasswordBtn?.addEventListener("click", () => {
        window.location.href = "./reset-password.html";
    });

    // ------------------------
    // 載入會員資料
    // ------------------------
    async function loadProfile() {
        const userId = currentUser?.id;
        if (!userId) return;

        const { data: userData, error: userError } = await supabaseClient.auth.getUser();
        if (userError || !userData.user) return;

        const { data: profileData, error: profileError } = await supabaseClient
            .from("profiles")
            .select("*")
            .eq("user_id", userId)
            .single();

        if (profileError && profileError.code !== "PGRST116") {
            return alert("載入會員資料失敗：" + profileError.message);
        }

        const profile = profileData || { full_name: "", phone: "", address: "", gender: "" };

        document.getElementById("user-info").innerHTML = `
    <div class="card p-3 mb-3">
      <p><strong>會員ID:</strong> ${userData.user.id}</p>
      <p><strong>Email:</strong> ${userData.user.email}</p>

      <div class="mb-2">
        <label>姓名</label>
        <input type="text" class="form-control" id="profile-full_name" value="${profile.full_name}">
      </div>
      <div class="mb-2">
        <label>電話</label>
        <input type="text" class="form-control" id="profile-phone" value="${profile.phone}">
      </div>
      <div class="mb-2">
        <label>地址</label>
        <input type="text" class="form-control" id="profile-address" value="${profile.address}">
      </div>
      <div class="mb-2">
        <label>性別</label>
        <select class="form-control" id="profile-gender">
          <option value="">請選擇</option>
          <option value="男" ${profile.gender === "男" ? "selected" : ""}>男</option>
          <option value="女" ${profile.gender === "女" ? "selected" : ""}>女</option>
          <option value="其他" ${profile.gender === "其他" ? "selected" : ""}>其他</option>
        </select>
      </div>

      <button class="btn btn-primary" id="save-profile-btn">保存會員資料</button>
      <div id="profile-message" class="mt-2"></div>
    </div>
  `;

        document.getElementById("save-profile-btn").addEventListener("click", async () => {
            const full_name = document.getElementById("profile-full_name").value;
            const phone = document.getElementById("profile-phone").value;
            const address = document.getElementById("profile-address").value;
            const gender = document.getElementById("profile-gender").value;

            const { error } = await supabaseClient
                .from("profiles")
                .upsert([{
                    user_id: userId,
                    full_name,
                    phone,
                    address,
                    gender,
                    updated_at: new Date().toISOString()
                }]);

            const msgEl = document.getElementById("profile-message");
            if (error) alert("儲存失敗：" + error.message);
            else msgEl.textContent = '會員資料已保存';
        });
    }

    // ------------------------
    // 載入寵物資料
    // ------------------------
    async function loadPets() {
        const { data: pets, error } = await supabaseClient
            .from("pets")
            .select("*")
            .eq("user_id", currentUser.id);

        const petListEl = document.getElementById("pet-list");
        const newPetForm = document.getElementById("new-pet-form");

        if (error) return petListEl.innerHTML = `<p>⚠️ 無法載入寵物資料</p>`;

        if (!pets || pets.length === 0) {
            newPetForm.style.display = "block";
            petListEl.innerHTML = "";
        } else {
            newPetForm.style.display = "none";
            const pet = pets[0];
            petListEl.innerHTML = `
        <div class="card p-3 mb-3" data-id="${pet.id}">
          <div class="mb-2">寵物姓名<input type="text" class="form-control pet-name" value="${pet.pet_name}"></div>
          <div class="mb-2">品種<input type="text" class="form-control pet-species" value="${pet.species}"></div>
          <div class="mb-2">年齡<input type="number" class="form-control pet-age" value="${pet.age || ''}"></div>
          <div class="mb-2">生日<input type="date" class="form-control pet-birthday" value="${pet.birthday || ''}"></div>
          <div class="mb-2">上次疫苗施打日期<input type="date" class="form-control pet-vaccine" value="${pet.last_vaccine || ''}"></div>
          <button class="btn btn-primary btn-sm save-pet-btn">保存</button>
        </div>
      `;

            document.querySelector(".save-pet-btn").addEventListener("click", async e => {
                const card = e.target.closest(".card");
                const id = card.dataset.id;
                const pet_name = card.querySelector(".pet-name").value;
                const species = card.querySelector(".pet-species").value;
                let age = card.querySelector(".pet-age").value;
                age = age === "" ? null : parseInt(age, 10);
                const birthday = card.querySelector(".pet-birthday").value || null;
                const last_vaccine = card.querySelector(".pet-vaccine").value || null;

                if (!pet_name.trim()) return alert("至少先填寫寵物姓名再送出喔");

                const { error } = await supabaseClient
                    .from("pets")
                    .update({ pet_name, species, age, birthday, last_vaccine })
                    .eq("id", id);

                if (error) alert("更新失敗：" + error.message);
                else { alert("已保存"); loadPets(); }
            });
        }
    }

    // ------------------------
    // 新增寵物
    // ------------------------
    document.getElementById("add-pet-btn")?.addEventListener("click", async e => {
        e.preventDefault();
        const pet_name = document.getElementById("new-pet-name").value;
        const species = document.getElementById("new-pet-species").value;
        let age = document.getElementById("new-pet-age").value;
        age = age === "" ? null : parseInt(age, 10);
        const birthday = document.getElementById("new-pet-birthday").value || null;
        const last_vaccine = document.getElementById("new-pet-vaccine").value || null;

        if (!pet_name.trim()) return alert("至少先填寫寵物姓名再送出喔");

        const { data: pets } = await supabaseClient
            .from("pets")
            .select("id")
            .eq("user_id", currentUser.id);

        if (pets && pets.length > 0) return alert("每位會員只能新增一隻寵物喔！");

        const { error } = await supabaseClient
            .from("pets")
            .insert([{ user_id: currentUser.id, pet_name, species, age, birthday, last_vaccine }]);

        if (error) alert("新增失敗：" + error.message);
        else {
            alert("新增成功");
            document.getElementById("new-pet-form").style.display = "none";
            ["new-pet-name", "new-pet-species", "new-pet-age", "new-pet-birthday", "new-pet-vaccine"]
                .forEach(id => document.getElementById(id).value = "");
            loadPets();
        }
    });

    // ------------------------
    // 生成本週日期
    // ------------------------
    function getWeekDates() {
        const today = new Date();
        const day = today.getDay();
        const diffToMonday = day === 0 ? -6 : 1 - day;
        const monday = new Date(today);
        monday.setDate(today.getDate() + diffToMonday);

        return Array.from({ length: 7 }, (_, i) => {
            const d = new Date(monday);
            d.setDate(monday.getDate() + i);
            return d.toISOString().split("T")[0];
        });
    }

    // ------------------------
    // 載入餵食表格
    // ------------------------
    async function loadFeedingTable() {
        const tbody = document.getElementById("feeding-tbody");
        tbody.innerHTML = "";

        const { data: pets } = await supabaseClient
            .from("pets")
            .select("id")
            .eq("user_id", currentUser.id);
        if (!pets || pets.length === 0) {
            tbody.innerHTML = `<tr><td colspan="8">請先新增寵物</td></tr>`;
            document.getElementById("last-update").textContent = `最後更新: 無資料`;
            return;
        }

        const petId = pets[0].id;
        const weekDates = getWeekDates();
        const weekdays = ["周一", "周二", "周三", "周四", "周五", "周六", "周日"];
        const meals = ["morning", "noon", "evening"];
        const mealNames = ["早餐", "午餐", "晚餐"];

        const { data: feedingData } = await supabaseClient
            .from("pet_feeding")
            .select("*")
            .eq("pet_id", petId)
            .in("feeding_date", weekDates);

        const existingDates = feedingData?.map(f => f.feeding_date) || [];
        const missingDates = weekDates.filter(d => !existingDates.includes(d));
        if (missingDates.length) {
            await supabaseClient.from("pet_feeding").insert(
                missingDates.map(date => ({
                    pet_id: petId,
                    feeding_date: date,
                    feeding_morning: "",
                    feeding_noon: "",
                    feeding_evening: ""
                }))
            );
        }

        const { data: latestData } = await supabaseClient
            .from("pet_feeding")
            .select("*")
            .eq("pet_id", petId)
            .in("feeding_date", weekDates);

        meals.forEach((meal, idx) => {
            const tr = document.createElement("tr");
            tr.innerHTML = `<td>${mealNames[idx]}</td>` +
                weekDates.map(date => {
                    const rec = latestData.find(r => r.feeding_date === date);
                    return `<td><input type="text" class="form-control feeding-${meal}" data-date="${date}" value="${rec?.["feeding_" + meal] || ''}" placeholder="${weekdays[weekDates.indexOf(date)]}"></td>`;
                }).join("");
            tbody.appendChild(tr);
        });

        const thead = tbody.closest("table").querySelector("thead");
        thead.innerHTML = "<tr><th>餐別</th>" + weekdays.map(d => `<th>${d}</th>`).join("") + "</tr>";

        const lastUpdateEl = document.getElementById("last-update");
        const latestUpdate = latestData?.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))[0]?.updated_at;
        lastUpdateEl.textContent = latestUpdate
            ? `最後更新: ${new Date(latestUpdate).toLocaleString()}`
            : `最後更新: 尚無更新`;
    }

    // ------------------------
    // 儲存餵食紀錄
    // ------------------------
    document.getElementById("feeding-form")?.addEventListener("submit", async e => {
        e.preventDefault();
        const { data: pets } = await supabaseClient
            .from("pets")
            .select("id")
            .eq("user_id", currentUser.id);
        if (!pets || pets.length === 0) return alert("請先新增寵物！");
        const petId = pets[0].id;

        const weekDates = getWeekDates();
        const records = [];

        weekDates.forEach(date => {
            const morning = document.querySelector(`.feeding-morning[data-date='${date}']`)?.value || "";
            const noon = document.querySelector(`.feeding-noon[data-date='${date}']`)?.value || "";
            const evening = document.querySelector(`.feeding-evening[data-date='${date}']`)?.value || "";

            records.push({
                pet_id: petId,
                feeding_date: date,
                feeding_morning: morning,
                feeding_noon: noon,
                feeding_evening: evening,
                updated_at: new Date().toISOString()
            });
        });

        const { error } = await supabaseClient.from("pet_feeding").upsert(records, {
            onConflict: ["pet_id", "feeding_date"]
        });

        const msgEl = document.getElementById("feeding-message");
        const lastUpdateEl = document.getElementById("last-update");

        msgEl.innerHTML = error
            ? `<span class="text-danger">儲存失敗: ${error.message}</span>`
            : `<span class="text-success">餵食紀錄已儲存</span>`;

        if (!error) lastUpdateEl.textContent = `最後更新: ${new Date().toLocaleString()}`;
        setTimeout(() => { msgEl.innerHTML = ""; }, 2000);
    });

    // ------------------------
    // 載入歷史訂單（orders 表）
    // ------------------------
    async function loadOrders() {
        const container = document.getElementById("history-order-list");
        if (!container) return;

        try {
            const { data: orders, error } = await supabaseClient
                .from("orders")
                .select("*")
                .eq("user_id", currentUser?.id)
                .order("created_at", { ascending: false });

            if (error) throw error;

            if (!orders || orders.length === 0) {
                container.innerHTML = `<p>尚無訂單紀錄</p>`;
                return;
            }

            container.innerHTML = orders.map(o => {
                let items = [];
                if (Array.isArray(o.items)) items = o.items;
                else if (typeof o.items === "string") {
                    try { items = JSON.parse(o.items); } catch { items = []; }
                }

                const itemsHtml = items.map(it => `<li>${it.name} × ${it.quantity} ($${it.price})</li>`).join("");

                return `
                    <div class="card p-3 mb-3">
                        <p><strong>訂單ID:</strong> ${o.id}</p>
                        <ul>${itemsHtml}</ul>
                        <p><strong>總金額:</strong> $${o.total_price}</p>
                        <p><small>下單時間: ${new Date(o.created_at).toLocaleString()}</small></p>
                    </div>
                `;
            }).join("");

        } catch (err) {
            // console.error("載入歷史訂單失敗:", err);
            container.innerHTML = `<p>⚠️ 無法載入訂單</p>`;
        }
    }

    async function loadBookings() {
        const activeOrderList = document.getElementById("active-order-list");
        if (!activeOrderList) return;

        try {
            const { data: activeOrders, error: activeError } = await supabaseClient
                .from("bookings")
                .select("*")
                .eq("user_id", currentUser.id)
                .in("status", ["pending", "confirmed"])
                .order("date", { ascending: true })
                .order("time", { ascending: true });

            if (activeError) throw activeError;

            if (!activeOrders || activeOrders.length === 0) {
                activeOrderList.innerHTML = "<p>尚無已預約服務者</p>";
                return;
            }

            activeOrderList.innerHTML = "";
            activeOrders.forEach(order => {
                const div = document.createElement("div");
                div.className = "order-card card p-3 mb-2";
                div.innerHTML = `
                    <p><strong>服務者：</strong>${order.provider_name}</p>
                    <p><strong>服務項目：</strong>${order.service_type}</p>
                    <p><strong>日期時間：</strong>${order.date} ${order.time}</p>
                    <p><strong>價格：</strong>${order.price} 元</p>
                    <p><strong>寵物：</strong>${order.pet_name}</p>
                    <p><strong>狀態：</strong>${order.status}</p>
                `;document.addEventListener("DOMContentLoaded", async () => {
    // ------------------------
    // Supabase 初始化
    // ------------------------
    const supabaseClient = supabase.createClient(
        "https://cbmimzpytdmtjvanvaoh.supabase.co",
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNibWltenB5dGRtdGp2YW52YW9oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg0MjE2MzUsImV4cCI6MjA2Mzk5NzYzNX0.YHon747wNSjx6-ZcG-344tlKXtKqXxl-VYu1Vtbusgo"
    );

    // ------------------------
    // 取得使用者 session
    // ------------------------
    const { data: { session } } = await supabaseClient.auth.getSession();
    const currentUser = session?.user;

    if (!currentUser) {
        alert("請先登入會員,才能使用會員功能").then(() => {
          window.location.href = "./login.html";
        });
        return;
    }

    // ------------------------
    // 側邊分頁切換
    // ------------------------
    function initTabSwitch(buttonsSelector, contentsSelector) {
        const buttons = document.querySelectorAll(buttonsSelector);
        const contents = document.querySelectorAll(contentsSelector);
        buttons.forEach(btn => {
            btn.addEventListener("click", () => {
                buttons.forEach(b => b.classList.remove("active"));
                contents.forEach(c => c.classList.add("hidden"));
                btn.classList.add("active");
                document.getElementById(btn.dataset.target).classList.remove("hidden");
            });
        });
    }
    initTabSwitch(".tab-btn", ".tab-content");
    initTabSwitch(".pet-tab", ".pet-tab-content");
    function initTabSwitch(buttonsSelector, contentsSelector) {
        const buttons = document.querySelectorAll(buttonsSelector);
        const contents = document.querySelectorAll(contentsSelector);
        buttons.forEach(btn => {
            btn.addEventListener("click", () => {
                buttons.forEach(b => b.classList.remove("active"));
                contents.forEach(c => c.classList.add("hidden"));
                btn.classList.add("active");
                const target = btn.dataset.target;
                const el = document.getElementById(target);
                if (el) el.classList.remove("hidden");
            });
        });
    }

    // 初始化 tab
    initTabSwitch(".tab-btn", ".tab-content");        // 左側主要頁面
    initTabSwitch(".pet-tab", ".pet-tab-content");    // 寵物子頁面
    initTabSwitch(".order-tab", ".order-tab-content");// 訂單子頁面


    // ------------------------
    // 登出 & 修改密碼
    // ------------------------
    const logoutBtn = document.getElementById("logout");
    const updatePasswordBtn = document.getElementById("update-password-btn");
    const messageEl = document.getElementById("message");

    logoutBtn?.addEventListener("click", async () => {
        const { error } = await supabaseClient.auth.signOut();
        if (error) messageEl.innerHTML = `<span class="text-danger">登出失敗: ${error.message}</span>`;
        else {
            messageEl.innerHTML = `<span class="text-success">已登出，正在跳轉...</span>`;
            setTimeout(() => window.location.href = "./login.html", 800);
        }
    });

    updatePasswordBtn?.addEventListener("click", () => {
        window.location.href = "./reset-password.html";
    });

    // ------------------------
    // 載入會員資料
    // ------------------------
    async function loadProfile() {
        const userId = currentUser?.id;
        if (!userId) return;

        const { data: userData, error: userError } = await supabaseClient.auth.getUser();
        if (userError || !userData.user) return;

        const { data: profileData, error: profileError } = await supabaseClient
            .from("profiles")
            .select("*")
            .eq("user_id", userId)
            .single();

        if (profileError && profileError.code !== "PGRST116") {
            return alert("載入會員資料失敗：" + profileError.message);
        }

        const profile = profileData || { full_name: "", phone: "", address: "", gender: "" };

        document.getElementById("user-info").innerHTML = `
    <div class="card p-3 mb-3">
      <p><strong>會員ID:</strong> ${userData.user.id}</p>
      <p><strong>Email:</strong> ${userData.user.email}</p>

      <div class="mb-2">
        <label>姓名</label>
        <input type="text" class="form-control" id="profile-full_name" value="${profile.full_name}">
      </div>
      <div class="mb-2">
        <label>電話</label>
        <input type="text" class="form-control" id="profile-phone" value="${profile.phone}">
      </div>
      <div class="mb-2">
        <label>地址</label>
        <input type="text" class="form-control" id="profile-address" value="${profile.address}">
      </div>
      <div class="mb-2">
        <label>性別</label>
        <select class="form-control" id="profile-gender">
          <option value="">請選擇</option>
          <option value="男" ${profile.gender === "男" ? "selected" : ""}>男</option>
          <option value="女" ${profile.gender === "女" ? "selected" : ""}>女</option>
          <option value="其他" ${profile.gender === "其他" ? "selected" : ""}>其他</option>
        </select>
      </div>

      <button class="btn btn-primary" id="save-profile-btn">保存會員資料</button>
      <div id="profile-message" class="mt-2"></div>
    </div>
  `;

        document.getElementById("save-profile-btn").addEventListener("click", async () => {
            const full_name = document.getElementById("profile-full_name").value;
            const phone = document.getElementById("profile-phone").value;
            const address = document.getElementById("profile-address").value;
            const gender = document.getElementById("profile-gender").value;

            const { error } = await supabaseClient
                .from("profiles")
                .upsert([{
                    user_id: userId,
                    full_name,
                    phone,
                    address,
                    gender,
                    updated_at: new Date().toISOString()
                }]);

            const msgEl = document.getElementById("profile-message");
            if (error) alert("儲存失敗：" + error.message);
            else msgEl.textContent = '會員資料已保存';
        });
    }

    // ------------------------
    // 載入寵物資料
    // ------------------------
    async function loadPets() {
        const { data: pets, error } = await supabaseClient
            .from("pets")
            .select("*")
            .eq("user_id", currentUser.id);

        const petListEl = document.getElementById("pet-list");
        const newPetForm = document.getElementById("new-pet-form");

        if (error) return petListEl.innerHTML = `<p>⚠️ 無法載入寵物資料</p>`;

        if (!pets || pets.length === 0) {
            newPetForm.style.display = "block";
            petListEl.innerHTML = "";
        } else {
            newPetForm.style.display = "none";
            const pet = pets[0];
            petListEl.innerHTML = `
        <div class="card p-3 mb-3" data-id="${pet.id}">
          <div class="mb-2">寵物姓名<input type="text" class="form-control pet-name" value="${pet.pet_name}"></div>
          <div class="mb-2">品種<input type="text" class="form-control pet-species" value="${pet.species}"></div>
          <div class="mb-2">年齡<input type="number" class="form-control pet-age" value="${pet.age || ''}"></div>
          <div class="mb-2">生日<input type="date" class="form-control pet-birthday" value="${pet.birthday || ''}"></div>
          <div class="mb-2">上次疫苗施打日期<input type="date" class="form-control pet-vaccine" value="${pet.last_vaccine || ''}"></div>
          <button class="btn btn-primary btn-sm save-pet-btn">保存</button>
        </div>
      `;

            document.querySelector(".save-pet-btn").addEventListener("click", async e => {
                const card = e.target.closest(".card");
                const id = card.dataset.id;
                const pet_name = card.querySelector(".pet-name").value;
                const species = card.querySelector(".pet-species").value;
                let age = card.querySelector(".pet-age").value;
                age = age === "" ? null : parseInt(age, 10);
                const birthday = card.querySelector(".pet-birthday").value || null;
                const last_vaccine = card.querySelector(".pet-vaccine").value || null;

                if (!pet_name.trim()) return alert("至少先填寫寵物姓名再送出喔");

                const { error } = await supabaseClient
                    .from("pets")
                    .update({ pet_name, species, age, birthday, last_vaccine })
                    .eq("id", id);

                if (error) alert("更新失敗：" + error.message);
                else { alert("已保存"); loadPets(); }
            });
        }
    }

    // ------------------------
    // 新增寵物
    // ------------------------
    document.getElementById("add-pet-btn")?.addEventListener("click", async e => {
        e.preventDefault();
        const pet_name = document.getElementById("new-pet-name").value;
        const species = document.getElementById("new-pet-species").value;
        let age = document.getElementById("new-pet-age").value;
        age = age === "" ? null : parseInt(age, 10);
        const birthday = document.getElementById("new-pet-birthday").value || null;
        const last_vaccine = document.getElementById("new-pet-vaccine").value || null;

        if (!pet_name.trim()) return alert("至少先填寫寵物姓名再送出喔");

        const { data: pets } = await supabaseClient
            .from("pets")
            .select("id")
            .eq("user_id", currentUser.id);

        if (pets && pets.length > 0) return alert("每位會員只能新增一隻寵物喔！");

        const { error } = await supabaseClient
            .from("pets")
            .insert([{ user_id: currentUser.id, pet_name, species, age, birthday, last_vaccine }]);

        if (error) alert("新增失敗：" + error.message);
        else {
            alert("新增成功");
            document.getElementById("new-pet-form").style.display = "none";
            ["new-pet-name", "new-pet-species", "new-pet-age", "new-pet-birthday", "new-pet-vaccine"]
                .forEach(id => document.getElementById(id).value = "");
            loadPets();
        }
    });

    // ------------------------
    // 生成本週日期
    // ------------------------
    function getWeekDates() {
        const today = new Date();
        const day = today.getDay();
        const diffToMonday = day === 0 ? -6 : 1 - day;
        const monday = new Date(today);
        monday.setDate(today.getDate() + diffToMonday);

        return Array.from({ length: 7 }, (_, i) => {
            const d = new Date(monday);
            d.setDate(monday.getDate() + i);
            return d.toISOString().split("T")[0];
        });
    }

    // ------------------------
    // 載入餵食表格
    // ------------------------
    async function loadFeedingTable() {
        const tbody = document.getElementById("feeding-tbody");
        tbody.innerHTML = "";

        const { data: pets } = await supabaseClient
            .from("pets")
            .select("id")
            .eq("user_id", currentUser.id);
        if (!pets || pets.length === 0) {
            tbody.innerHTML = `<tr><td colspan="8">請先新增寵物</td></tr>`;
            document.getElementById("last-update").textContent = `最後更新: 無資料`;
            return;
        }

        const petId = pets[0].id;
        const weekDates = getWeekDates();
        const weekdays = ["周一", "周二", "周三", "周四", "周五", "周六", "周日"];
        const meals = ["morning", "noon", "evening"];
        const mealNames = ["早餐", "午餐", "晚餐"];

        const { data: feedingData } = await supabaseClient
            .from("pet_feeding")
            .select("*")
            .eq("pet_id", petId)
            .in("feeding_date", weekDates);

        const existingDates = feedingData?.map(f => f.feeding_date) || [];
        const missingDates = weekDates.filter(d => !existingDates.includes(d));
        if (missingDates.length) {
            await supabaseClient.from("pet_feeding").insert(
                missingDates.map(date => ({
                    pet_id: petId,
                    feeding_date: date,
                    feeding_morning: "",
                    feeding_noon: "",
                    feeding_evening: ""
                }))
            );
        }

        const { data: latestData } = await supabaseClient
            .from("pet_feeding")
            .select("*")
            .eq("pet_id", petId)
            .in("feeding_date", weekDates);

        meals.forEach((meal, idx) => {
            const tr = document.createElement("tr");
            tr.innerHTML = `<td>${mealNames[idx]}</td>` +
                weekDates.map(date => {
                    const rec = latestData.find(r => r.feeding_date === date);
                    return `<td><input type="text" class="form-control feeding-${meal}" data-date="${date}" value="${rec?.["feeding_" + meal] || ''}" placeholder="${weekdays[weekDates.indexOf(date)]}"></td>`;
                }).join("");
            tbody.appendChild(tr);
        });

        const thead = tbody.closest("table").querySelector("thead");
        thead.innerHTML = "<tr><th>餐別</th>" + weekdays.map(d => `<th>${d}</th>`).join("") + "</tr>";

        const lastUpdateEl = document.getElementById("last-update");
        const latestUpdate = latestData?.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))[0]?.updated_at;
        lastUpdateEl.textContent = latestUpdate
            ? `最後更新: ${new Date(latestUpdate).toLocaleString()}`
            : `最後更新: 尚無更新`;
    }

    // ------------------------
    // 儲存餵食紀錄
    // ------------------------
    document.getElementById("feeding-form")?.addEventListener("submit", async e => {
        e.preventDefault();
        const { data: pets } = await supabaseClient
            .from("pets")
            .select("id")
            .eq("user_id", currentUser.id);
        if (!pets || pets.length === 0) return alert("請先新增寵物！");
        const petId = pets[0].id;

        const weekDates = getWeekDates();
        const records = [];

        weekDates.forEach(date => {
            const morning = document.querySelector(`.feeding-morning[data-date='${date}']`)?.value || "";
            const noon = document.querySelector(`.feeding-noon[data-date='${date}']`)?.value || "";
            const evening = document.querySelector(`.feeding-evening[data-date='${date}']`)?.value || "";

            records.push({
                pet_id: petId,
                feeding_date: date,
                feeding_morning: morning,
                feeding_noon: noon,
                feeding_evening: evening,
                updated_at: new Date().toISOString()
            });
        });

        const { error } = await supabaseClient.from("pet_feeding").upsert(records, {
            onConflict: ["pet_id", "feeding_date"]
        });

        const msgEl = document.getElementById("feeding-message");
        const lastUpdateEl = document.getElementById("last-update");

        msgEl.innerHTML = error
            ? `<span class="text-danger">儲存失敗: ${error.message}</span>`
            : `<span class="text-success">餵食紀錄已儲存</span>`;

        if (!error) lastUpdateEl.textContent = `最後更新: ${new Date().toLocaleString()}`;
        setTimeout(() => { msgEl.innerHTML = ""; }, 2000);
    });

    // ------------------------
    // 載入歷史訂單（orders 表）
    // ------------------------
    async function loadOrders() {
        const container = document.getElementById("history-order-list");
        if (!container) return;

        try {
            const { data: orders, error } = await supabaseClient
                .from("orders")
                .select("*")
                .eq("user_id", currentUser?.id)
                .order("created_at", { ascending: false });

            if (error) throw error;

            if (!orders || orders.length === 0) {
                container.innerHTML = `<p>尚無訂單紀錄</p>`;
                return;
            }

            container.innerHTML = orders.map(o => {
                let items = [];
                if (Array.isArray(o.items)) items = o.items;
                else if (typeof o.items === "string") {
                    try { items = JSON.parse(o.items); } catch { items = []; }
                }

                const itemsHtml = items.map(it => `<li>${it.name} × ${it.quantity} ($${it.price})</li>`).join("");

                return `
                    <div class="card p-3 mb-3">
                        <p><strong>訂單ID:</strong> ${o.id}</p>
                        <ul>${itemsHtml}</ul>
                        <p><strong>總金額:</strong> $${o.total_price}</p>
                        <p><small>下單時間: ${new Date(o.created_at).toLocaleString()}</small></p>
                    </div>
                `;
            }).join("");

        } catch (err) {
            // console.error("載入歷史訂單失敗:", err);
            container.innerHTML = `<p>⚠️ 無法載入訂單</p>`;
        }
    }

    async function loadBookings() {
        const activeOrderList = document.getElementById("active-order-list");
        if (!activeOrderList) return;

        try {
            const { data: activeOrders, error: activeError } = await supabaseClient
                .from("bookings")
                .select("*")
                .eq("user_id", currentUser.id)
                .in("status", ["pending", "confirmed"])
                .order("date", { ascending: true })
                .order("time", { ascending: true });

            if (activeError) throw activeError;

            if (!activeOrders || activeOrders.length === 0) {
                activeOrderList.innerHTML = "<p>尚無已預約服務者</p>";
                return;
            }

            activeOrderList.innerHTML = "";
            activeOrders.forEach(order => {
                const div = document.createElement("div");
                div.className = "order-card card p-3 mb-2";
                div.innerHTML = `
                    <p><strong>服務者：</strong>${order.provider_name}</p>
                    <p><strong>服務項目：</strong>${order.service_type}</p>
                    <p><strong>日期時間：</strong>${order.date} ${order.time}</p>
                    <p><strong>價格：</strong>${order.price} 元</p>
                    <p><strong>寵物：</strong>${order.pet_name}</p>
                    <p><strong>狀態：</strong>${order.status}</p>
                `;
                activeOrderList.appendChild(div);
            });
        } catch (err) {
            // console.error("讀取已預約訂單失敗:", err);
            activeOrderList.innerHTML = "<p>無法載入已預約服務者</p>";
        }
    }

    // ------------------------
    // 初始化載入
    // ------------------------
    await loadProfile();
    await loadPets();
    await loadFeedingTable();
    await loadOrders();
    await loadBookings();
});

                activeOrderList.appendChild(div);
            });
        } catch (err) {
            // console.error("讀取已預約訂單失敗:", err);
            activeOrderList.innerHTML = "<p>無法載入已預約服務者</p>";
        }
    }

    // ------------------------
    // 初始化載入
    // ------------------------
    await loadProfile();
    await loadPets();
    await loadFeedingTable();
    await loadOrders();
    await loadBookings();
});
