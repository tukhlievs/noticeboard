// Cloudflare Worker entry point для Noticeboard parser.
//
// Два режима:
//   1. scheduled — запускается cron-триггером каждые 5 минут (см. wrangler.toml)
//   2. fetch — ручной запуск через GET /scrape для отладки
//
// Логика: для всех каналов из channels/index.ts параллельно (чанками по 10)
// скачивает t.me/s/{username}, парсит HTML, делает upsert канала и bulk insert
// постов в Supabase. Повторные посты отсекаются через unique-constraint
// (channel_id, message_id) с on conflict do nothing.

import { allChannels, type Channel } from "./channels";
import { scrapeChannel, type ScrapedChannel } from "./scraper";
import { getSupabase, type Env } from "./supabase";

// Размер пачки параллельных HTTP-запросов. Слишком большой → Telegram
// начинает 429-ить. Слишком маленький → cron не успевает за 30 секунд CPU.
const CHUNK_SIZE = 10;
const CHUNK_DELAY_MS = 200;

export default {
  async scheduled(_event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
    // waitUntil гарантирует, что Worker не убьют до завершения scrapeAll
    ctx.waitUntil(scrapeAll(env));
  },

  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/scrape") {
      const result = await scrapeAll(env);
      return Response.json(result);
    }

    if (url.pathname === "/health") {
      return new Response("ok", { status: 200 });
    }

    return new Response(
      "Noticeboard parser. POST /scrape to trigger manually.",
      { status: 200 },
    );
  },
};

interface ScrapeStats {
  total_channels: number;
  successful_channels: number;
  failed_channels: number;
  new_posts: number;
  duration_ms: number;
}

async function scrapeAll(env: Env): Promise<ScrapeStats> {
  const start = Date.now();
  const supabase = getSupabase(env);
  const channels = allChannels;

  let successful = 0;
  let failed = 0;
  let newPosts = 0;

  // Чанкуем чтобы не превысить Telegram rate-limit и Cloudflare CPU-cap
  for (let i = 0; i < channels.length; i += CHUNK_SIZE) {
    const chunk = channels.slice(i, i + CHUNK_SIZE);

    const results = await Promise.all(
      chunk.map(async (channel) => {
        const scraped = await scrapeChannel(channel.username);
        if (!scraped) return { ok: false, posts: 0 };

        const inserted = await storeScraped(supabase, channel, scraped);
        return { ok: true, posts: inserted };
      }),
    );

    for (const r of results) {
      if (r.ok) {
        successful += 1;
        newPosts += r.posts;
      } else {
        failed += 1;
      }
    }

    // Небольшая пауза между чанками
    if (i + CHUNK_SIZE < channels.length) {
      await sleep(CHUNK_DELAY_MS);
    }
  }

  const stats: ScrapeStats = {
    total_channels: channels.length,
    successful_channels: successful,
    failed_channels: failed,
    new_posts: newPosts,
    duration_ms: Date.now() - start,
  };

  console.log("Scrape complete:", stats);
  return stats;
}

async function storeScraped(
  supabase: ReturnType<typeof getSupabase>,
  channel: Channel,
  scraped: ScrapedChannel,
): Promise<number> {
  // 1. Upsert канала. id = username, RLS bypass через service_role.
  const { error: channelError } = await supabase.from("channels").upsert(
    {
      id: scraped.username,
      username: scraped.username,
      title: scraped.title,
      avatar_url: scraped.avatar_url,
      topic: channel.topic,
      language: channel.language,
      last_post_at:
        scraped.posts.length > 0 ? scraped.posts[0].posted_at : null,
    },
    { onConflict: "id" },
  );

  if (channelError) {
    console.error(`[${scraped.username}] Channel upsert failed:`, channelError);
    return 0;
  }

  if (scraped.posts.length === 0) return 0;

  // 2. Bulk insert постов с on conflict do nothing.
  // Supabase JS не имеет нативного "ignore duplicates" — используем
  // upsert с onConflict, но в payload не меняем существующие поля.
  // Поскольку у posts unique (channel_id, message_id), upsert с ignoreDuplicates
  // эффективно даёт insert-if-not-exists.
  const rows = scraped.posts.map((p) => ({
    channel_id: scraped.username,
    message_id: p.message_id,
    text: p.text,
    media_type: p.media_type,
    media_url: p.media_url,
    post_type: "content",
    posted_at: p.posted_at,
  }));

  const { data, error } = await supabase
    .from("posts")
    .upsert(rows, {
      onConflict: "channel_id,message_id",
      ignoreDuplicates: true,
    })
    .select("id");

  if (error) {
    console.error(`[${scraped.username}] Posts insert failed:`, error);
    return 0;
  }

  return data?.length ?? 0;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
