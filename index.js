// Server + Bot unified
const express = require("express");
const TelegramBot = require("node-telegram-bot-api");
const crypto = require("crypto");
const path = require("path");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;
const TOKEN = process.env.BOT_TOKEN;
const TARGET_CHAT_ID = process.env.TARGET_CHAT_ID || null;

if (!TOKEN) {
  console.error("❌ BOT_TOKEN manquant. Ajoute BOT_TOKEN dans tes variables d'environnement.");
  process.exit(1);
}

// 1) Bot
const bot = new TelegramBot(TOKEN, { polling: true });

bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;

  const webAppUrl = process.env.WEBAPP_URL || "https://biggmenubot.onrender.com";
  const welcome = `Bienvenue sur Big Menu 🍃

Ouvre le menu ci-dessous pour passer commande.`;

  bot.sendMessage(chatId, welcome, {
    reply_markup: {
      keyboard: [[{ text: "🛍️ Ouvrir le menu", web_app: { url: webAppUrl } }]],
      resize_keyboard: true,
    },
  });
});

// Petit utilitaire pour récupérer facilement l'ID de chat
bot.onText(/\/id/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, `Ton chat_id est: \`${chatId}\``, { parse_mode: "Markdown" });
  console.log("➡️ chat_id:", chatId);
});

// Log de base pour aider à récupérer des IDs si besoin
bot.on("message", (msg) => {
  console.log("📩 Message reçu de", msg.from?.username || msg.from?.id, "chat_id:", msg.chat?.id);
});

// 2) Express middlewares
app.use(express.json({ limit: "1mb" }));

// 3) Static files (WebApp)
const publicDir = path.join(__dirname, "public");
app.use(express.static(publicDir));

// 4) Healthcheck
app.get("/healthz", (req, res) => res.json({ ok: true }));

// 5) Telegram WebApp initData verification
function verifyTelegramInitData(initData) {
  try {
    const urlParams = new URLSearchParams(initData);
    const hash = urlParams.get("hash");
    if (!hash) return false;

    urlParams.delete("hash");
    const dataCheckString = Array.from(urlParams.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}=${v}`)
      .join("\n");

    const secretKey = crypto
      .createHmac("sha256", "WebAppData")
      .update(TOKEN)
      .digest();

    const hmac = crypto
      .createHmac("sha256", secretKey)
      .update(dataCheckString)
      .digest("hex");

    return hmac === hash;
  } catch (e) {
    console.error("verifyTelegramInitData error:", e);
    return false;
  }
}

// 6) Order endpoint (optional for your current frontend; safe to keep)
app.post("/api/order", async (req, res) => {
  try {
    const { initData, message } = req.body || {};

    if (!initData || !verifyTelegramInitData(initData)) {
      return res.status(403).json({ error: "initData invalide" });
    }

    const params = new URLSearchParams(initData);
    const userJson = params.get("user");
    let user = {};
    try {
      user = JSON.parse(decodeURIComponent(userJson || "{}"));
    } catch {}

    const username =
      user?.username ? `@${user.username}` : [user?.first_name, user?.last_name].filter(Boolean).join(" ") || "Client";

    const text = `📦 *Nouvelle commande Big Menu*\n👤 ${username}\n\n🛒 ${message || "(message vide)"}\n`;

    if (TARGET_CHAT_ID) {
      await bot.sendMessage(TARGET_CHAT_ID, text, { parse_mode: "Markdown" });
    } else if (user?.id) {
      await bot.sendMessage(user.id, text, { parse_mode: "Markdown" });
    }

    res.json({ ok: true });
  } catch (err) {
    console.error("Erreur /api/order:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// 7) Start server
app.listen(PORT, () => {
  console.log(`✅ Serveur en ligne sur port ${PORT}`);
  console.log(`🌐 WebApp: http://localhost:${PORT}/`);
});
