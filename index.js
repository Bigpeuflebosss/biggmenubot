// Server + Bot unified
const express = require("express");
const TelegramBot = require("node-telegram-bot-api");
const crypto = require("crypto");
const path = require("path");
require("dotenv").config();


// === Protection anti-spam globale : verrou dur ===
const userLocks = new Map();

async function withUserLock(userId, action, cooldownMs = 3000) {
  const now = Date.now();
  const lock = userLocks.get(userId);
  if (lock && now - lock < cooldownMs) {
    return { blocked: true };
  }
  userLocks.set(userId, now);
  try {
    await action();
  } finally {
    setTimeout(() => userLocks.delete(userId), cooldownMs);
  }
  return { blocked: false };
}



// === Security helpers added: cooldowns and rate-limiting ===
const userCooldowns = new Map(); // userId -> timestamp (ms)
const orderRateLimits = new Map(); // ip -> {count, firstTs}

// simple helper to enforce cooldown per user (ms)
function checkUserCooldown(userId, cooldownMs = 3000) {
  const now = Date.now();
  if (!userId) return false;
  if (userCooldowns.has(userId) && (now - userCooldowns.get(userId) < cooldownMs)) {
    return false;
  }
  userCooldowns.set(userId, now);
  return true;
}

// simple per-IP rate limiter: max 5 requests per 60s
function checkRateLimit(ip, maxRequests = 5, windowMs = 60 * 1000) {
  if (!ip) return false;
  const now = Date.now();
  const rec = orderRateLimits.get(ip);
  if (!rec) {
    orderRateLimits.set(ip, { count: 1, firstTs: now   });
  if (result.blocked) {
    await bot.sendMessage(userId, '⏳ Patiente un instant avant de renvoyer une commande.');
  }
});
    return true;
  }
  if (now - rec.firstTs > windowMs) {
    // reset window
    orderRateLimits.set(ip, { count: 1, firstTs: now   });
  if (result.blocked) {
    await bot.sendMessage(userId, '⏳ Patiente un instant avant de renvoyer une commande.');
  }
});
    return true;
  }
  if (rec.count >= maxRequests) return false;
  rec.count += 1;
  return true;
}


const app = express();
const PORT = process.env.PORT || 3000;
const TOKEN = process.env.BOT_TOKEN;
const TARGET_CHAT_ID = process.env.TARGET_CHAT_ID || null;

if (!TOKEN) {
  console.error("❌ BOT_TOKEN manquant. Ajoute BOT_TOKEN dans tes variables d'environnement.");
  process.exit(1);
}

// 1) Bot
const bot = new TelegramBot(TOKEN, { polling: true   });
  if (result.blocked) {
    await bot.sendMessage(userId, '⏳ Patiente un instant avant de renvoyer une commande.');
  }
});

// --- Anti-spam listener for incoming messages (3s cooldown per user)
try {
  
} catch(e){ console.error("anti-spam listener failed", e && e.message); }

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
  if (result.blocked) {
    await bot.sendMessage(userId, '⏳ Patiente un instant avant de renvoyer une commande.');
  }
});
  });
  if (result.blocked) {
    await bot.sendMessage(userId, '⏳ Patiente un instant avant de renvoyer une commande.');
  }
});

// Petit utilitaire pour récupérer facilement l'ID de chat
bot.onText(/\/id/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, `Ton chat_id est: \`${chatId}\``, { parse_mode: "Markdown"   });
  if (result.blocked) {
    await bot.sendMessage(userId, '⏳ Patiente un instant avant de renvoyer une commande.');
  }
});
  console.log("➡️ chat_id:", chatId);
  });
  if (result.blocked) {
    await bot.sendMessage(userId, '⏳ Patiente un instant avant de renvoyer une commande.');
  }
});

// Log de base pour aider à récupérer des IDs si besoin


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

  // --- Security checks: rate-limit by IP and verify initData HMAC ---
  try {
    const ip = (req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress || '').split(',')[0].trim();
    if (!checkRateLimit(ip)) {
      return res.status(429).json({ error: "Too many requests"   });
  if (result.blocked) {
    await bot.sendMessage(userId, '⏳ Patiente un instant avant de renvoyer une commande.');
  }
});
    }
  } catch(e) {
    // continue on error
  }

  // verify initData if provided
  if (req.body && req.body.initData && !verifyTelegramInitData(req.body.initData, process.env.BOT_TOKEN)) {
    return res.status(403).json({ error: "initData invalide"   });
  if (result.blocked) {
    await bot.sendMessage(userId, '⏳ Patiente un instant avant de renvoyer une commande.');
  }
});
  }


  try {
    const { initData, message } = req.body || {};

    if (!initData || !verifyTelegramInitData(initData)) {
      return res.status(403).json({ error: "initData invalide"   });
  if (result.blocked) {
    await bot.sendMessage(userId, '⏳ Patiente un instant avant de renvoyer une commande.');
  }
});
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
      await bot.sendMessage(TARGET_CHAT_ID, text, { parse_mode: "Markdown"   });
  if (result.blocked) {
    await bot.sendMessage(userId, '⏳ Patiente un instant avant de renvoyer une commande.');
  }
});
    } else if (user?.id) {
      await bot.sendMessage(user.id, text, { parse_mode: "Markdown"   });
  if (result.blocked) {
    await bot.sendMessage(userId, '⏳ Patiente un instant avant de renvoyer une commande.');
  }
});
    }

    res.json({ ok: true   });
  if (result.blocked) {
    await bot.sendMessage(userId, '⏳ Patiente un instant avant de renvoyer une commande.');
  }
});
  } catch (err) {
    console.error("Erreur /api/order:", err);
    res.status(500).json({ error: "Erreur serveur"   });
  if (result.blocked) {
    await bot.sendMessage(userId, '⏳ Patiente un instant avant de renvoyer une commande.');
  }
});
  }
  });
  if (result.blocked) {
    await bot.sendMessage(userId, '⏳ Patiente un instant avant de renvoyer une commande.');
  }
});

// 7) Start server
app.listen(PORT, () => {
  console.log(`✅ Serveur en ligne sur port ${PORT}`);
  console.log(`🌐 WebApp: http://localhost:${PORT}/`);
  });
  if (result.blocked) {
    await bot.sendMessage(userId, '⏳ Patiente un instant avant de renvoyer une commande.');
  }
});
