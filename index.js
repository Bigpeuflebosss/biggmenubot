const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const fetch = require('node-fetch');

const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
if (!TELEGRAM_TOKEN) {
  console.error("Missing TELEGRAM_TOKEN");
}
const WEBAPP_URL = process.env.WEBAPP_URL || "https://example.com"; // laisse inchangé si non défini
const API_URL = `https://api.telegram.org/bot${TELEGRAM_TOKEN}`;

const app = express();
app.set('trust proxy', 1);

// Sécurité HTTP
app.use(helmet({
  frameguard: { action: 'sameorigin' },
  referrerPolicy: { policy: 'no-referrer' }
}));
// Payload JSON
app.use(express.json({ limit: '512kb' }));
// Rate limit global
const limiter = rateLimit({
  windowMs: 10 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// --- Vérification du webhook (facultatif mais recommandé) ---
const WEBHOOK_SECRET = process.env.TELEGRAM_WEBHOOK_SECRET;
function verifyTelegram(req, res, next) {
  if (!WEBHOOK_SECRET) return next();
  const header = req.get('x-telegram-bot-api-secret-token');
  if (header && header === WEBHOOK_SECRET) return next();
  return res.status(401).send('unauthorized');
}

// --- Anti-spam par utilisateur ---
const userState = new Map(); // userId -> { lastAt, strikes, mutedUntil, seenUpdateIds:Set }
function isMuted(state) { return state.mutedUntil && Date.now() < state.mutedUntil; }
function punish(state){
  state.strikes = (state.strikes || 0) + 1;
  const durations = [60e3, 5*60e3, 30*60e3]; // 1,5,30 min
  const dur = durations[Math.min(state.strikes-1, durations.length-1)];
  state.mutedUntil = Date.now() + dur;
  return dur;
}
function allowAction(userId, updateId){
  let s = userState.get(userId);
  if (!s) { s = { lastAt: 0, strikes: 0, mutedUntil: 0, seenUpdateIds: new Set() }; userState.set(userId, s); }
  if (typeof updateId === 'number') {
    if (s.seenUpdateIds.has(updateId)) return { ok:false, reason:'dup' };
    s.seenUpdateIds.add(updateId);
    if (s.seenUpdateIds.size > 200) {
      const it = s.seenUpdateIds.values(); for (let i=0;i<50;i++) s.seenUpdateIds.delete(it.next().value);
    }
  }
  if (isMuted(s)) return { ok:false, reason:'muted', until:s.mutedUntil };
  const now = Date.now();
  if (now - s.lastAt < 3000) { const dur = punish(s); return { ok:false, reason:'cooldown', mute:dur }; }
  s.lastAt = now;
  return { ok:true };
}

// --- Utilitaires Telegram ---
async function tg(method, payload) {
  const res = await fetch(`${API_URL}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    timeout: 5000
  });
  return res.json().catch(()=>({ ok:false }));
}

async function sendWelcome(chatId) {
  return tg("sendMessage", {
    chat_id: chatId,
    text: "Bienvenue 👋",
    reply_markup: {
      inline_keyboard: [
        [{ text: "🛍️ Ouvrir le menu", url: WEBAPP_URL }],
        [
          { text: "ℹ️ Infos", callback_data: "info" },
          { text: "📞 Contact", callback_data: "contact" }
        ]
      ]
    }
  });
}

async function sendInfo(chatId) {
  return tg("sendMessage", {
    chat_id: chatId,
    text: "Infos du shop (horaires, zones, etc.).",
  });
}

async function sendContact(chatId) {
  return tg("sendMessage", {
    chat_id: chatId,
    text: "Contact : @peufcommandes",
  });
}

async function ackCallback(id) {
  try { await tg("answerCallbackQuery", { callback_query_id: id }); } catch(e) {}
}

// --- Routes ---
app.get("/", (req, res) => res.send("BigMenu bot OK"));

// Webhook (POST)
app.post("/webhook", verifyTelegram, async (req, res) => {
  try {
    const u = req.body || {};
    const userId =
      u.message?.from?.id ||
      u.callback_query?.from?.id ||
      u.inline_query?.from?.id;
    const updateId = u.update_id;

    const gate = allowAction(userId, updateId);
    if (!gate.ok) { return res.sendStatus(200); }

    if (u.message) {
      const chatId = u.message.chat.id;
      const text = u.message.text || "";
      if (text.startsWith("/start")) {
        await sendWelcome(chatId);
      } else {
        // ignore ou ajouter d'autres commandes si besoin
      }
    } else if (u.callback_query) {
      const chatId = u.callback_query.message?.chat?.id;
      const data = u.callback_query.data;
      if (u.callback_query.id) await ackCallback(u.callback_query.id);
      if (data === "info") await sendInfo(chatId);
      else if (data === "contact") await sendContact(chatId);
    }
    res.sendStatus(200);
  } catch (e) {
    console.error("webhook error", e);
    res.sendStatus(500);
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Bot listening on ${PORT}`));
