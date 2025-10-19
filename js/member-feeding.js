// member-feeding.js
document.addEventListener("DOMContentLoaded", async () => {
  const supabaseClient = supabase.createClient(
    "https://cbmimzpydtmjvanvoh.supabase.co",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNibWltenB5dGRtdGp2YW52YW9oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg0MjE2MzUsImV4cCI6MjA2Mzk5NzYzNX0.YHon747wNSjx6-ZcG-344tlKXtKqXxl-VYu1Vtbusgo"
  );

  // ---------- 取得目前使用者 ----------
  const { data: { session } } = await supabaseClient.auth.getSession();
  const currentUser = session?.user;
  if (!currentUser) { alert("請先登入會員"); return; }

  // ---------- tab 切換 ----------
  function initTabSwitch(btnSel, contentSel) {
    document.querySelectorAll(btnSel).forEach(btn => {
      btn.addEventListener("click", () => {
        document.querySelectorAll(btnSel).forEach(b => b.classList.remove("active"));
        document.querySelectorAll(contentSel).forEach(c => c.classList.add("hidden"));
        btn.classList.add("active");
        document.getElementById(btn.dataset.target).classList.remove("hidden");
      });
    });
  }
  initTabSwitch(".tab-btn", ".tab-content");
  initTabSwitch(".pet-tab", ".pet-tab-content");

  // ---------- 生成本週日期 ----------
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

  // ---------- 餵食紀錄分頁 ----------
  let currentStartIndex = 0;
  function getDisplayCount() {
    return window.innerWidth < 768 ? 2 : 3; // 手機 2 天，平板以上 3 天
  }

  async function loadFeedingTable() {
    const tbody = document.getElementById("feeding-tbody");
    tbody.innerHTML = "";

    const { data: pets } = await supabaseClient
      .from("pets").select("id").eq("user_id", currentUser.id);
    if (!pets || pets.length === 0) { 
      tbody.innerHTML = "<tr><td colspan='8'>請先新增寵物</td></tr>"; 
      return; 
    }

    const petId = pets[0].id;
    const weekDates = getWeekDates();
    const meals = ["morning", "noon", "evening"];
    const mealNames = ["早餐", "午餐", "晚餐"];

    const { data: feedingData } = await supabaseClient
      .from("pet_feeding").select("*")
      .eq("pet_id", petId).in("feeding_date", weekDates);

    // 分頁顯示
    const displayCount = getDisplayCount();
    const displayDates = weekDates.slice(currentStartIndex, currentStartIndex + displayCount);
    if (displayDates.length === 0) currentStartIndex = 0; 
    const finalDates = weekDates.slice(currentStartIndex, currentStartIndex + displayCount);

    // 表頭
    const weekdays = ["周一","周二","周三","周四","周五","周六","周日"];
    const thead = tbody.closest("table").querySelector("thead");
    thead.innerHTML = "<tr><th>餐別</th>" +
      finalDates.map(d => `<th>${weekdays[weekDates.indexOf(d)]}</th>`).join("") + "</tr>";

    // 表身
    meals.forEach((meal, idx) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `<td>${mealNames[idx]}</td>` +
        finalDates.map(date => {
          const rec = feedingData.find(f => f.feeding_date === date);
          return `<td><input type="text" class="form-control feeding-${meal}" data-date="${date}" value="${rec?.["feeding_"+meal]||''}"></td>`;
        }).join("");
      tbody.appendChild(tr);
    });

    // 最後更新時間
    const lastUpdateEl = document.getElementById("last-update");
    const latestUpdate = feedingData?.sort((a,b)=>new Date(b.updated_at)-new Date(a.updated_at))[0]?.updated_at;
    lastUpdateEl.textContent = latestUpdate ? `最後更新: ${new Date(latestUpdate).toLocaleString()}` : "尚無更新";
  }

  // ---------- 下一天 / 上一天按鈕 ----------
  document.getElementById("next-days-btn").addEventListener("click", () => {
    const weekDates = getWeekDates();
    const displayCount = getDisplayCount();
    currentStartIndex += displayCount;
    if (currentStartIndex >= weekDates.length) currentStartIndex = 0;
    loadFeedingTable();
  });

  // ---------- 儲存餵食紀錄 ----------
  document.getElementById("feeding-form").addEventListener("submit", async e => {
    e.preventDefault();
    const { data: pets } = await supabaseClient.from("pets").select("id").eq("user_id", currentUser.id);
    if (!pets || pets.length === 0) return alert("請先新增寵物！");
    const petId = pets[0].id;

    const records = [];
    ["morning","noon","evening"].forEach(meal => {
      document.querySelectorAll(`.feeding-${meal}`).forEach(input => {
        records.push({
          pet_id: petId,
          feeding_date: input.dataset.date,
          ["feeding_"+meal]: input.value,
          updated_at: new Date().toISOString()
        });
      });
    });

    const { error } = await supabaseClient.from("pet_feeding")
      .upsert(records, { onConflict: ["pet_id","feeding_date"] });

    const msgEl = document.getElementById("feeding-message");
    msgEl.innerHTML = error 
      ? `<span class="text-danger">儲存失敗: ${error.message}</span>` 
      : `<span class="text-success">餵食紀錄已儲存</span>`;
    setTimeout(() => msgEl.innerHTML = "", 2000);
    loadFeedingTable();
  });

  // ---------- 初始化載入 ----------
  loadFeedingTable();
});
