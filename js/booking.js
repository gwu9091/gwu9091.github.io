document.addEventListener("navbarLoaded", async () => {
    // 固定的服務時間列表
    const FIXED_SERVICE_TIMES = ["09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00"];

    const supabase = window.supabaseClient;
    if (!supabase) return //console.error("Supabase 尚未初始化");

    const providerSelect = document.getElementById('provider-select');
    const serviceTypeSelect = document.getElementById('service-type');
    const providerInfoDiv = document.getElementById('provider-info');
    const providerImg = document.getElementById('provider-img');
    const providerNameEl = document.getElementById('provider-name');
    const providerSpecialtyEl = document.getElementById('provider-specialty');
    const ratingEl = document.getElementById('provider-rating');
    const priceEl = document.getElementById('price-display');
    const dateInput = document.getElementById('date');
    const timeInput = document.getElementById('time');
    const ownerInput = document.getElementById('owner-name');
    const petInput = document.getElementById('pet-name');
    const submitBtn = document.getElementById('submit-btn');

    // 取得登入使用者
    const { data: { session } } = await supabase.auth.getSession();
    const currentUser = session?.user;
    if (!currentUser) {
        return alert("請先登入").then(() => {
            window.location.href = "./login.html";
        });
    }

    // ------------------------
    // 核心功能：載入並自動填入會員資料
    // ------------------------
    let hasPet = false;
    async function loadAndAutoFillUserData() {
        // 載入會員姓名 (owner-name)
        const { data: profile } = await supabase
            .from("profiles")
            .select("full_name")
            .eq("user_id", currentUser.id)
            .single();
        if (profile?.full_name) {
            ownerInput.value = profile.full_name;
        }

        // 載入寵物姓名 (pet-name)
        const { data: pet } = await supabase
            .from("pets")
            .select("pet_name")
            .eq("user_id", currentUser.id)
            .limit(1)
            .maybeSingle();
        
        if (pet?.pet_name) {
            petInput.value = pet.pet_name;
            petInput.disabled = false; // **修正點：允許編輯**
            hasPet = true;
        } else {
            petInput.value = '請先在會員中心新增寵物';
            petInput.disabled = true;
            hasPet = false;
            submitBtn.disabled = true; // 無寵物則禁用預約按鈕
        }
    }


    // --- 輔助函式：初始化時間選擇器 ---
    function updateTimeInputOptions(availableTimes) {
        timeInput.innerHTML = `<option value="" disabled selected>請選擇時間</option>`;
        if (availableTimes && availableTimes.length > 0) {
            availableTimes.forEach(t => {
                const opt = document.createElement('option');
                opt.value = t;
                opt.textContent = t;
                timeInput.appendChild(opt);
            });
        } else {
            const opt = document.createElement('option');
            opt.value = '';
            opt.textContent = '該日已無可用時間';
            timeInput.appendChild(opt);
            timeInput.value = '';
        }
    }
    
    // ------------------------
    // 服務者、服務項目等初始化邏輯...
    // ------------------------
    
    // 1️⃣ 讀取服務者列表
    const { data: providers, error: providerError } = await supabase
        .from('providers')
        .select('*')
        .order('created_at', { ascending: true });

    if (providerError) {
        providerSelect.innerHTML = `<option disabled>無法載入服務者</option>`;
        return;
    }

    providerSelect.innerHTML = `<option value="" disabled selected>請選擇服務者</option>`;
    providers.forEach(p => {
        const option = document.createElement('option');
        option.value = p.id;
        option.textContent = p.name;
        providerSelect.appendChild(option);
    });

    // 2️⃣ 讀取服務類型與價格
    let servicePrices = {};
    const { data: services, error: serviceError } = await supabase
        .from('services')
        .select('*');

    if (!serviceError) services.forEach(s => servicePrices[s.name] = s.price);

    serviceTypeSelect.innerHTML = `<option value="" disabled selected>請選擇</option>`;
    services.forEach(s => {
        const opt = document.createElement('option');
        opt.value = s.name;
        opt.textContent = s.name;
        serviceTypeSelect.appendChild(opt);
    });
    
    // --- 輔助函式：讀取評價 ---
    async function loadRating(providerName) {
        const { data, error } = await supabase
            .from("reviews")
            .select("rating")
            .eq("provider_name", providerName);

        if (error) { ratingEl.textContent = "⚠️ 無法讀取評價"; return; }
        if (!data || data.length === 0) { ratingEl.textContent = "尚無評價"; return; }

        const avg = data.reduce((acc, r) => acc + r.rating, 0) / data.length;
        const stars = "⭐".repeat(Math.round(avg)) + "☆".repeat(5 - Math.round(avg));
        ratingEl.textContent = `${stars} (${data.length} 評價)`;
    }


    // 3️⃣ 選服務者 → 顯示資訊
    providerSelect.addEventListener('change', async () => {
        const selectedId = providerSelect.value;
        const info = providers.find(p => p.id == selectedId);

        if (info) {
            providerInfoDiv.style.display = 'flex';
            providerImg.src = info.img || './img/user.png';
            providerNameEl.textContent = info.name;
            providerSpecialtyEl.textContent = info.specialty;
            await loadRating(info.name);

            dateInput.value = '';
            updateTimeInputOptions(null);
        } else {
            providerInfoDiv.style.display = 'none';
        }
        priceEl.textContent = `價格：- 元`;
    });

    // 4️⃣ 選服務類型 → 顯示價格
    serviceTypeSelect.addEventListener('change', () => {
        const type = serviceTypeSelect.value;
        const price = servicePrices[type] || 0;
        priceEl.textContent = `價格：${price} 元`;
    });

    // 5️⃣ 選日期 → 過濾已被預約的時間
    dateInput.addEventListener('change', async () => {
        const selectedDate = dateInput.value;
        const providerId = providerSelect.value;
        
        if (!selectedDate || !providerId) {
            return updateTimeInputOptions(null);
        }

        const { data: bookings } = await supabase
            .from('bookings')
            .select('time')
            .eq('provider_id', providerId)
            .eq('date', selectedDate);

        const bookedTimes = bookings ? bookings.map(b => b.time) : [];
        let availableTimes = FIXED_SERVICE_TIMES.filter(t => !bookedTimes.includes(t));

        // 核心修正: 排除當天已過時段
        const todayString = new Date().toISOString().split('T')[0];
        if (selectedDate === todayString) {
            const now = new Date();
            const currentHour = now.getHours();
            
            availableTimes = availableTimes.filter(t => {
                const hour = parseInt(t.split(':')[0], 10);
                return hour > currentHour; 
            });
        }
        
        updateTimeInputOptions(availableTimes);
    });

    // 7️⃣ 提交預約
    submitBtn.addEventListener('click', async () => {
        if (!hasPet) {
             return alert("請先在會員中心新增您的寵物資料！");
        }

        const providerId = providerSelect.value;
        const providerName = providers.find(p => p.id == providerId)?.name;
        const serviceType = serviceTypeSelect.value;
        const date = dateInput.value;
        const time = timeInput.value;
        const ownerName = ownerInput.value;
        const petName = petInput.value; // **使用使用者可能修改過的值**
        const price = servicePrices[serviceType] || 0;

        if (!providerId || !serviceType || !date || !time || !ownerName || !petName) {
            return alert("請填寫完整資料！");
        }

        const { error } = await supabase
            .from('bookings')
            .insert([{
                user_id: currentUser.id,
                provider_id: providerId,
                provider_name: providerName,
                service_type: serviceType,
                date,
                time,
                owner_name: ownerName,
                pet_name: petName,
                price,
                status: 'pending'
            }]);

        if (error) alert("預約失敗：" + error.message);
        else {
            alert(`預約成功！\n服務者：${providerName}\n日期：${date} ${time}\n價格：${price} 元`);
            
            // 提交成功後，只重置預約相關欄位，保留會員資料和寵物資料的當前值
            providerSelect.value = '';
            providerInfoDiv.style.display = 'none';
            serviceTypeSelect.value = '';
            priceEl.textContent = `價格：- 元`;
            dateInput.value = new Date().toISOString().split('T')[0];
            updateTimeInputOptions(null);
        }
    });


    // ------------------------
    // 初始化
    // ------------------------
    await loadAndAutoFillUserData(); // 呼叫自動填入功能
    
    // 初始化日期限制
    dateInput.min = new Date().toISOString().split('T')[0];
    updateTimeInputOptions(FIXED_SERVICE_TIMES);
});