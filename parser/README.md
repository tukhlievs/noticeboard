# Noticeboard Parser

Cloudflare Worker, который раз в N минут парсит публичные Telegram-каналы через
HTTP-эндпоинт `t.me/s/{username}` и складывает посты в Supabase.

## Почему HTTP, а не Telethon

Telegram отдаёт публичные каналы с `@username` в HTML-виде по адресу
`https://t.me/s/{username}` — это страница превью, которую видит любой,
кто откроет канал без авторизации. На странице последние 20-30 постов с
полным текстом, медиа-превью, временем и счётчиками. Этого достаточно для
ленты в стиле X.

Преимущества HTTP-подхода против MTProto/Telethon:

- Парсер живёт на **Cloudflare Worker** — не нужен VPS, Hetzner или Fly.io.
- **Не нужен Telegram-аккаунт** — никаких номеров, сессий, риска бана аккаунта.
- **Stateless** — каждый cron-запуск независим, нет файла .session.
- **Никаких 2FA, MTProto, AES-IGE** — просто `fetch` и парсинг HTML.
- **Идентичность бренда** — Telegram не знает кто мы, нет следов.

Ограничения, которые надо понимать:

- Глубина истории — только последние 20-30 постов. Для ленты норм, для архива нет.
- Telegram может rate-limit-ить агрессивный скрейпинг. Парсер чанкает запросы.
- HTML-структура может меняться без предупреждения. Парсер ломкий по природе.
- Некоторые каналы отключают превью — для них `t.me/s` вернёт 404, мы их пропустим.
- Просмотры, реакции, комментарии частично или полностью недоступны.

## Структура

```
parser/
├── src/
│   ├── index.ts                 # Worker entry: scheduled + fetch handlers
│   ├── scraper.ts               # Парсинг HTML t.me/s страниц
│   ├── supabase.ts              # Supabase admin client
│   └── channels/
│       ├── index.ts             # Агрегатор + типы Channel/ChannelSeed
│       ├── news_ru.ts           # 10 новостных каналов на русском
│       ├── news_en.ts           # 10 новостных каналов на английском
│       ├── crypto_ru.ts         # 10 крипто-каналов на русском
│       ├── crypto_en.ts         # 10 крипто-каналов на английском
│       ├── programming_ru.ts    # 10 ИТ-каналов на русском
│       ├── programming_en.ts    # 10 ИТ-каналов на английском
│       ├── cars_ru.ts           # 10 авто-каналов на русском
│       └── cars_en.ts           # 10 авто-каналов на английском
├── wrangler.toml
├── package.json
└── tsconfig.json
```

## Настройка

1. Заполни файлы `src/channels/*.ts` своими каналами (по 10 на каждый, без `@`)
2. Применить миграцию `supabase/migrations/0005_channels_metadata.sql` в SQL Editor
3. Деплой:

```bash
cd parser
npm install
wrangler login
wrangler secret put SUPABASE_URL
wrangler secret put SUPABASE_SERVICE_ROLE_KEY
wrangler deploy
```

Cron-trigger в `wrangler.toml` настроен на `*/5 * * * *` — парсер запускается
каждые 5 минут автоматически. Ручной запуск для отладки — GET-запрос на
`https://noticeboard-parser.<your-subdomain>.workers.dev/scrape`.

## Архитектура цикла

Каждые 5 минут:

1. Worker читает все каналы из всех файлов через `channels/index.ts`
2. Чанкает их по 10 параллельных запросов с паузой между чанками
3. Для каждого канала: `GET https://t.me/s/{username}`, парсит HTML
4. Upsert канала в `channels` (title и avatar обновляются)
5. Bulk insert постов в `posts` с `on conflict do nothing`
6. Логирует статистику в stdout (Cloudflare dashboard → Logs)

Дедупликация на уровне БД через `unique (channel_id, message_id)`.
Повторный парсинг тех же постов не создаёт дубли.
