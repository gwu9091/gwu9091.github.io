// booking.js
document.addEventListener("navbarLoaded", async () => {
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
        });}


    // 1️⃣ 讀取服務者列表
    const { data: providers, error: providerError } = await supabase
        .from('providers')
        .select('*')
        .order('created_at', { ascending: true });

    if (providerError) {
        // console.error("讀取 providers 失敗:", providerError);
        providerSelect.innerHTML = `<option disabled>無法載入服務者</option>`;
        return;
    }

    providerSelect.innerHTML = `<option value="" disabled selected>請選擇服務者</option>`;
    providers.forEach(p => {
        const option = document.createElement('option');
        option.value = p.id; // 這裡改成使用 provider_id
        option.textContent = p.name;
        providerSelect.appendChild(option);
    });

    // 2️⃣ 讀取服務類型與價格
    let servicePrices = {};
    const { data: services, error: serviceError } = await supabase
        .from('services')
        .select('*');

    if (serviceError) {//console.error("讀取 services 失敗:", serviceError) 
    }
    else services.forEach(s => servicePrices[s.name] = s.price);

    serviceTypeSelect.innerHTML = `<option value="" disabled selected>請選擇</option>`;
    services.forEach(s => {
        const opt = document.createElement('option');
        opt.value = s.name;
        opt.textContent = s.name;
        serviceTypeSelect.appendChild(opt);
    });

    // 3️⃣ 選服務者 → 顯示資訊
    providerSelect.addEventListener('change', async () => {
        const selectedId = providerSelect.value;
        const info = providers.find(p => p.id == selectedId);

        if (info) {
            providerInfoDiv.style.display = 'flex';
            providerImg.src = info.img;
            providerNameEl.textContent = info.name;
            providerSpecialtyEl.textContent = info.specialty;
            await loadRating(info.name);

            dateInput.value = '';
            timeInput.innerHTML = `<option value="" disabled selected>請選擇時間</option>`;
        } else {
            providerInfoDiv.style.display = 'none';
        }
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
        if (!selectedDate || !providerId) return;

        const { data: bookings } = await supabase
            .from('bookings')
            .select('time')
            .eq('provider_id', providerId)
            .eq('date', selectedDate);

        const bookedTimes = bookings ? bookings.map(b => b.time) : [];
        const allTimes = Array.from({ length: 10 }, (_, i) => `${9 + i}:00`);
        const availableTimes = allTimes.filter(t => !bookedTimes.includes(t));

        timeInput.innerHTML = '';
        if (availableTimes.length > 0) {
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
        }
    });

    // 6️⃣ 讀取評價
    async function loadRating(providerName) {
        const { data, error } = await supabase
            .from("reviews")
            .select("rating")
            .eq("provider_name", providerName);

        if (error) {
            ratingEl.textContent = "⚠️ 無法讀取評價";
            return;
        }

        if (!data || data.length === 0) {
            ratingEl.textContent = "尚無評價";
            return;
        }

        const avg = data.reduce((acc, r) => acc + r.rating, 0) / data.length;
        const stars = "⭐".repeat(Math.round(avg)) + "☆".repeat(5 - Math.round(avg));
        ratingEl.textContent = `${stars} (${data.length} 評價)`;
    }

    // 7️⃣ 提交預約
    submitBtn.addEventListener('click', async () => {
        const providerId = providerSelect.value;
        const providerName = providers.find(p => p.id == providerId)?.name;
        const serviceType = serviceTypeSelect.value;
        const date = dateInput.value;
        const time = timeInput.value;
        const ownerName = ownerInput.value;
        const petName = petInput.value;
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
            providerSelect.value = '';
            providerInfoDiv.style.display = 'none';
            serviceTypeSelect.value = '';
            priceEl.textContent = `價格：- 元`;
            dateInput.value = '';
            timeInput.innerHTML = `<option value="" disabled selected>請選擇時間</option>`;
            ownerInput.value = '';
            petInput.value = '';
        }
    });
});
