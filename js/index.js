require("dotenv").config(); // 載入 .env 或 Replit Secrets

const express = require("express");
const cors = require("cors");
const { createClient } = require("@supabase/supabase-js");

const app = express();
app.use(cors());
app.use(express.json());

// 印出來確認 Replit Secrets 是否讀到
console.log("SUPABASE_URL:", process.env.SUPABASE_URL);
console.log(
  "SUPABASE_ANON_KEY:",
  process.env.SUPABASE_ANON_KEY ? "✅ 已讀取" : "❌ 未讀取",
);

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY,
);

// POST /reviews - 新增一筆評價
app.post("/reviews", async (req, res) => {
  const { provider_name, rating, comment } = req.body;

  const { error } = await supabase
    .from("reviews")
    .insert([{ provider_name, rating, comment }]);

  if (error) {
    console.error("插入錯誤：", error.message);
    return res.status(500).json({ error: error.message });
  }

  res.json({ message: "✅ 成功新增評價！" });
});

// GET /reviews?provider=名字 - 查詢某位服務者的所有評價
app.get("/reviews", async (req, res) => {
  const { provider } = req.query;

  const { data, error } = await supabase
    .from("reviews")
    .select("*")
    .eq("provider_name", provider)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("查詢錯誤：", error.message);
    return res.status(500).json({ error: error.message });
  }

  res.json(data);
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`✅ 伺服器已啟動 http://localhost:${port}`);
});
