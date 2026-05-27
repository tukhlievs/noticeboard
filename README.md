# Noticeboard

> Telegram Mini App — an endless feed of posts from public Telegram channels, in the style of X. Built end-to-end on Cloudflare and Supabase as a learning project to ship a real product.

<p>
  <a href="https://nextjs.org/"><img alt="Next.js" src="https://img.shields.io/badge/Next.js-15-000000?style=flat&logo=nextdotjs&logoColor=white"></a>
  <a href="https://react.dev/"><img alt="React" src="https://img.shields.io/badge/React-19-61DAFB?style=flat&logo=react&logoColor=white"></a>
  <a href="https://www.typescriptlang.org/"><img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5.6-3178C6?style=flat&logo=typescript&logoColor=white"></a>
  <a href="https://www.python.org/"><img alt="Python" src="https://img.shields.io/badge/Python-3.12-3776AB?style=flat&logo=python&logoColor=white"></a>
  <a href="https://workers.cloudflare.com/"><img alt="Cloudflare Workers" src="https://img.shields.io/badge/Cloudflare-Workers-F38020?style=flat&logo=cloudflare&logoColor=white"></a>
  <a href="https://supabase.com/"><img alt="Supabase" src="https://img.shields.io/badge/Supabase-Postgres-3FCF8E?style=flat&logo=supabase&logoColor=white"></a>
  <a href="https://tailwindcss.com/"><img alt="Tailwind CSS" src="https://img.shields.io/badge/Tailwind-3.4-06B6D4?style=flat&logo=tailwindcss&logoColor=white"></a>
  <a href="https://ui.shadcn.com/"><img alt="shadcn/ui" src="https://img.shields.io/badge/shadcn%2Fui-black?style=flat&logo=shadcnui&logoColor=white"></a>
  <a href="https://core.telegram.org/bots/webapps"><img alt="Telegram Mini Apps" src="https://img.shields.io/badge/Telegram-Mini%20App-26A5E4?style=flat&logo=telegram&logoColor=white"></a>
</p>

## Overview

Noticeboard turns Telegram into a curated X-like reader. Public channels across several niches (news, crypto, programming, cars, in both Russian and English) are aggregated into a single infinite-scroll feed with iOS-style design and native Telegram identity. There is no signup or separate profile flow — your Telegram avatar and `@username` carry over automatically through the Mini App SDK.

The entire stack runs on Cloudflare's edge plus Supabase Postgres. No VPS, no Telegram user account acting as a parser, no MTProto session to babysit. Public-channel content is fetched over plain HTTP from `t.me/s/{username}` preview pages, which means the parser is just another Cloudflare Worker on a cron trigger.

## Architecture

Three independent services, one database.

```
┌──────────────────┐      ┌──────────────────┐      ┌──────────────────┐
│  web (Mini App)  │      │  bot (webhook)   │      │ parser (cron job)│
│  Next.js 15 + TS │      │  Python on CF    │      │   TS on CF       │
│  Cloudflare Pages│      │  Workers (beta)  │      │   Workers        │
└─────────┬────────┘      └─────────┬────────┘      └─────────┬────────┘
          │                         │                         │
          │ initData HMAC           │ /start replies          │ scrapes
          │ via Web Crypto API      │ with WebApp button      │ t.me/s/...
          └─────────────────────────┴───────────┬─────────────┘
                                                ▼
                                  ┌──────────────────────────┐
                                  │   Supabase Postgres      │
                                  │   channels / posts /     │
                                  │   users / likes / ...    │
                                  └──────────────────────────┘
```

- **`web/`** — Next.js Mini App. Renders the feed, handles likes, exposes the Telegram-validated user. Deployed to Cloudflare Pages via `@cloudflare/next-on-pages`.
- **`bot/`** — Minimal Telegram webhook in Python. On `/start` it replies with an inline button that opens the Mini App. Runs on Cloudflare Workers Python beta.
- **`parser/`** — Cron-triggered TypeScript Worker. Every 5 minutes it scrapes the `t.me/s/{username}` HTML preview for ~80 curated channels, extracts text/media/timestamps via regex, and upserts into Supabase.

## Tech stack

| Layer | Choice | Why |
| --- | --- | --- |
| Frontend | Next.js 15, TypeScript, React 19 | App Router with edge runtime support |
| Styling | Tailwind CSS, shadcn/ui (no Radix) | iOS-style tokens via CSS variables, lean bundle |
| Typography | Inter (UI) + Oswald (brand wordmark) | Loaded via `next/font/google` |
| Frontend host | Cloudflare Pages | Edge deployment, free tier, single ecosystem |
| Bot runtime | Cloudflare Workers Python beta | Pyodide-based, webhook shape fits perfectly |
| Parser runtime | Cloudflare Workers + Cron Triggers | Scheduled execution, no VPS needed |
| Database | Supabase Postgres | Migrations checked into repo, RLS as defense |
| Auth | Telegram WebApp initData | HMAC-SHA256 verified server-side via Web Crypto |
| Content source | `t.me/s/{username}` public preview | No MTProto, no Telegram account, no ban risk |

## Project structure

```
noticeboard/
├── web/                        Next.js Mini App
│   ├── app/
│   │   ├── (tabs)/             Route group: General / Search / Follows / Profile
│   │   ├── api/feed/           GET /api/feed   — paginated posts
│   │   ├── api/likes/          POST /api/likes — toggle like
│   │   └── layout.tsx          Inter + Oswald fonts, TelegramProvider
│   ├── components/
│   │   ├── ui/                 Button, Card, Avatar (no Radix)
│   │   ├── post-card.tsx       Post UI with "Read more" expand at 800 chars
│   │   ├── tab-bar.tsx         iOS-style bottom tab bar
│   │   └── telegram-provider.tsx
│   ├── lib/
│   │   ├── telegram.ts         validateInitData via Web Crypto API
│   │   ├── api-auth.ts         Server-side initData extractor
│   │   └── supabase.ts         service_role client (server-only)
│   └── hooks/                  useFeed, useLike with intersection observer
│
├── bot/                        Telegram bot webhook
│   ├── bot.py                  on_fetch handler, /start → Open Mini App button
│   └── wrangler.toml           Python Workers config
│
├── parser/                     HTTP scraper on cron
│   ├── src/
│   │   ├── index.ts            scheduled + fetch handlers
│   │   ├── scraper.ts          t.me/s HTML → ScrapedPost[]
│   │   ├── supabase.ts         service_role client
│   │   └── channels/           Per-niche channel lists (RU + EN)
│   └── wrangler.toml           Cron: */5 * * * *
│
└── supabase/migrations/        SQL migrations for Supabase SQL Editor
    ├── 0001_init.sql           channels, users, posts, likes, reports + post_type enum
    ├── 0002_rls.sql            RLS enabled, no public policies (service_role only)
    ├── 0003_indexes_and_view.sql
    ├── 0004_seed.sql           Test data
    └── 0005_channels_metadata.sql
```

## Getting started

### Prerequisites

- Node.js 20 or newer
- A Cloudflare account (free tier is enough)
- A Supabase project
- A Telegram bot created via [@BotFather](https://t.me/BotFather)

### Setup

1. **Database.** Open Supabase SQL Editor and run migrations `0001` through `0005` in order.
2. **Web (local).** From `web/`, copy `.env.local.example` to `.env.local`, fill in `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and `TELEGRAM_BOT_TOKEN`. Then `npm install && npm run dev` and open `http://localhost:3000`.
3. **Bot.** From `bot/`, run `wrangler login`, `wrangler secret put BOT_TOKEN`, `wrangler secret put BOT_WEBHOOK_SECRET`, then `wrangler deploy`. Register the webhook with Telegram via the standard `setWebhook` call (see `bot/README.md`).
4. **Parser.** From `parser/`, populate `src/channels/*.ts` with the channel usernames you want to scrape, run `npm install`, `wrangler secret put SUPABASE_URL`, `wrangler secret put SUPABASE_SERVICE_ROLE_KEY`, then `wrangler deploy`. The cron trigger activates automatically.
5. **Web (production).** From `web/`, run `npm run pages:deploy` to ship to Cloudflare Pages. Take the resulting URL, paste it into BotFather under your bot's Mini App configuration.

Each package has its own README with deployment specifics.

## Features

### Current (MVP-1)

- Infinite scroll feed of posts from curated public channels
- iOS-style bottom tab bar: General / Search / Follows / Profile
- "Read more" expand button for long posts, truncated at 800 characters with word-boundary detection
- Optimistic likes with server reconciliation and rollback on failure
- Native Telegram identity via initData — no signup flow
- Deep-link to the original post in Telegram via `openTelegramLink`
- Rule-based content filter (ads, casino, 18+)
- Light and dark themes via Tailwind tokens

### Planned (MVP-2)

- In-app comments with thread storage
- ML-based content classifier (scikit-learn, then transformers) replacing the keyword filter
- Active Search and Follows screens
- Per-user feed ranking based on likes
- Channel list grown from ~80 to several hundred
- Pull-to-refresh
- Telegram theme params mapped onto CSS variables

## Security notes

- All API routes that mutate data validate Telegram initData with HMAC-SHA256 against the bot token, with constant-time comparison and a 24-hour `auth_date` freshness window.
- Validation uses Web Crypto (`crypto.subtle`), not `node:crypto`, so the same code runs on Cloudflare edge and Node.
- `SUPABASE_SERVICE_ROLE_KEY` lives server-side only; the client never talks to Supabase directly.
- Row Level Security is enabled on all tables with no public policies — `service_role` bypass via our API routes is the only write path.

## License

MIT.

---

Built by [@tukhlievs](https://github.com/tukhlievs).
