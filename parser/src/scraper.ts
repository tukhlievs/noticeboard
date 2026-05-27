// Парсинг публичных Telegram-каналов через t.me/s/{username}.
//
// Telegram отдаёт публичную страницу канала любому, кто откроет URL вида
// https://t.me/s/durov — без авторизации, без MTProto. Страница содержит
// последние 20-30 сообщений в HTML-виде. Парсим регекспами по data-атрибутам
// и классам — структура у Telegram стабильная уже несколько лет.

export interface ScrapedPost {
  channel_username: string;
  message_id: number;
  text: string | null;
  posted_at: string; // ISO-8601
  media_url: string | null;
  media_type: "photo" | "video" | null;
}

export interface ScrapedChannel {
  username: string;
  title: string;
  avatar_url: string | null;
  posts: ScrapedPost[];
}

const TME_BASE = "https://t.me/s/";

// User-Agent похожий на браузер — Telegram иногда отдаёт минимальный
// ответ ботам с пустым UA. Не маскировка, просто полнота HTML.
const USER_AGENT =
  "Mozilla/5.0 (compatible; NoticeboardBot/1.0; +https://noticeboard.example)";

/**
 * Скачивает страницу канала и парсит её. Возвращает null если канал
 * не существует, отключил превью или превысил rate-limit.
 */
export async function scrapeChannel(username: string): Promise<ScrapedChannel | null> {
  const url = TME_BASE + encodeURIComponent(username);

  let response: Response;
  try {
    response = await fetch(url, {
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "text/html",
      },
    });
  } catch (e) {
    console.error(`[${username}] Fetch failed:`, e);
    return null;
  }

  if (response.status === 404) {
    console.warn(`[${username}] Channel not found or has no preview`);
    return null;
  }
  if (response.status === 429) {
    console.warn(`[${username}] Rate limited by Telegram`);
    return null;
  }
  if (!response.ok) {
    console.error(`[${username}] HTTP ${response.status}`);
    return null;
  }

  const html = await response.text();
  return parseChannelHtml(username, html);
}

/**
 * Парсит HTML страницы канала.
 *
 * Структура t.me/s/{username}:
 *   <meta property="og:title" content="Channel Title">
 *   <i class="tgme_page_photo_image ..."><img src="https://cdn..."></i>
 *   <div class="tgme_widget_message_wrap">
 *     <div class="tgme_widget_message ..." data-post="username/msg_id">
 *       <div class="tgme_widget_message_text ...">Post HTML content</div>
 *       <a class="tgme_widget_message_photo_wrap ..." style="background-image:url('...')">
 *       <time datetime="2024-...">...</time>
 *     </div>
 *   </div>
 */
function parseChannelHtml(username: string, html: string): ScrapedChannel {
  // Имя канала и аватар
  const titleMatch = html.match(/<meta property="og:title" content="([^"]+)"/);
  const title = titleMatch ? decodeHtmlEntities(titleMatch[1]) : username;

  const avatarMatch = html.match(
    /<i class="tgme_page_photo_image[^"]*"[^>]*>\s*<img src="([^"]+)"/,
  );
  const avatar_url = avatarMatch ? avatarMatch[1] : null;

  // Посты. Каждый <div class="tgme_widget_message_wrap"> содержит один пост.
  // Извлекаем содержимое каждого wrap-а через ленивый матч до следующего wrap.
  const posts: ScrapedPost[] = [];

  const wrapRegex =
    /<div class="tgme_widget_message_wrap[^"]*"[\s\S]*?(?=<div class="tgme_widget_message_wrap"|<div class="tme_no_messages_found"|$)/g;

  for (const wrapMatch of html.matchAll(wrapRegex)) {
    const postHtml = wrapMatch[0];

    // message_id из data-post="username/msg_id"
    const dataPostMatch = postHtml.match(/data-post="[^"\/]+\/(\d+)"/);
    if (!dataPostMatch) continue;
    const message_id = parseInt(dataPostMatch[1], 10);
    if (Number.isNaN(message_id)) continue;

    // Текст. Может содержать вложенный HTML (ссылки, эмодзи, переносы).
    const textMatch = postHtml.match(
      /<div class="tgme_widget_message_text[^"]*"[^>]*>([\s\S]*?)<\/div>/,
    );
    const text = textMatch ? htmlToText(textMatch[1]) : null;

    // Время поста. datetime= в формате ISO-8601.
    const dateMatch = postHtml.match(/<time[^>]*datetime="([^"]+)"/);
    const posted_at = dateMatch ? dateMatch[1] : new Date().toISOString();

    // Медиа: фото через background-image:url('...') или video src="...".
    let media_url: string | null = null;
    let media_type: "photo" | "video" | null = null;

    const photoMatch = postHtml.match(
      /tgme_widget_message_photo_wrap[^>]*style="[^"]*background-image:\s*url\(['"]?([^'"\)]+)/,
    );
    if (photoMatch) {
      media_url = photoMatch[1];
      media_type = "photo";
    } else {
      const videoMatch = postHtml.match(
        /<video[^>]*src="([^"]+)"|tgme_widget_message_video_thumb[^>]*background-image:\s*url\(['"]?([^'"\)]+)/,
      );
      if (videoMatch) {
        media_url = videoMatch[1] ?? videoMatch[2] ?? null;
        media_type = "video";
      }
    }

    // Пропускаем пустые посты (служебные сообщения, удалённые)
    if (!text && !media_url) continue;

    posts.push({
      channel_username: username,
      message_id,
      text,
      posted_at,
      media_url,
      media_type,
    });
  }

  return { username, title, avatar_url, posts };
}

// HTML → plain text с сохранением переносов строк.
function htmlToText(html: string): string {
  return decodeHtmlEntities(
    html
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/p>/gi, "\n\n")
      .replace(/<[^>]+>/g, ""),
  ).trim();
}

// Базовые HTML-сущности. Полную декодировку через DOMParser использовать нельзя —
// в Workers DOMParser отсутствует.
function decodeHtmlEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#036;/g, "$")
    .replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code, 10)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, code) =>
      String.fromCharCode(parseInt(code, 16)),
    );
}
