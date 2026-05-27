# Noticeboard Bot

Минимальный Telegram-бот на Cloudflare Workers (Python beta).
Единственная задача — отвечать на `/start` inline-кнопкой Open Noticeboard.

## Деплой

```bash
# 1. Установить wrangler глобально
npm install -g wrangler

# 2. Войти в Cloudflare
wrangler login

# 3. Задать секреты (wrangler спросит значение в интерпрете)
wrangler secret put BOT_TOKEN
wrangler secret put BOT_WEBHOOK_SECRET

# 4. Задеплоить
wrangler deploy
```

После деплоя wrangler покажет URL вида `https://noticeboard-bot.<subdomain>.workers.dev`.

## Регистрация webhook у Telegram

```bash
BOT_TOKEN=your_token
WORKER_URL=https://noticeboard-bot.your-subdomain.workers.dev
WEBHOOK_SECRET=your_webhook_secret

curl "https://api.telegram.org/bot${BOT_TOKEN}/setWebhook" \
  -d "url=${WORKER_URL}" \
  -d "secret_token=${WEBHOOK_SECRET}"
```

Проверка статуса webhook:

```bash
curl "https://api.telegram.org/bot${BOT_TOKEN}/getWebhookInfo"
```

## Локальная разработка

```bash
cp .dev.vars.example .dev.vars
# заполни BOT_TOKEN и BOT_WEBHOOK_SECRET
wrangler dev
```

Worker поднимется на `http://localhost:8787`. Чтобы протестировать с реальным
Telegram, проброс через [ngrok](https://ngrok.com) и временно перенаправь webhook
на ngrok URL.

## Fallback на TypeScript

Если Python beta даст сбой — рядом ляжет `bot.ts` с той же логикой на TS,
без зависимостей. Переключение занимает 15 минут, обновляем `main` в
`wrangler.toml` и редеплоим.
