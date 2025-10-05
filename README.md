# biggmenubot

Serveur **Express + Bot Telegram** + **WebApp** réunis dans un seul projet.

- Bot: `@BiggMenuBot`
- WebApp: servie depuis `/public` à `https://biggmenubot.onrender.com/` (ou l'URL Render de ton service)

## Déploiement sur Render

1. Pousse ce dossier sur GitHub.
2. Crée un **Web Service** sur Render (Node.js).
3. Variables d'environnement à ajouter :
   - `BOT_TOKEN` : le token de ton bot Telegram
   - `TARGET_CHAT_ID` : (optionnel mais recommandé) l'id du chat Telegram qui doit recevoir les commandes.
     - Pour l'obtenir : envoie `/id` à ton bot, ou écris-lui ; on logge l'ID côté serveur au premier message.
4. Commandes:
   - Build: *(par défaut)*
   - Start: `node index.js`

## Sécurité
- L'endpoint `/api/order` vérifie `initData` de Telegram (HMAC) — seules les requêtes provenant d'une vraie WebApp Telegram sont acceptées.
- Aucune clé n'est exposée côté frontend.

## Frontend
- Le HTML actuel (copié tel quel) se trouve dans `public/index.html`, sans modification.
- Si tu utilises des fichiers `css/style.css`, `js/script.js` ou des images, place-les dans `public/css`, `public/js`, `public/images`.
  (Des dossiers vides sont déjà créés.)

## Endpoints
- `GET /` → WebApp (fichiers statiques)
- `POST /api/order` → reçoit une commande `{ initData, message }` et la transfère sur Telegram
- `GET /healthz` → simple vérification de vie

