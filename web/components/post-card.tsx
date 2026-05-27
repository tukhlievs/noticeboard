"use client";

import { useState } from "react";
import { ChevronRight, ExternalLink, Heart } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

export interface Post {
  id: number;
  channel_username: string | null;
  channel_title: string;
  channel_avatar_url: string | null;
  message_id: number;
  text: string | null;
  media_url: string | null;
  media_type: string | null;
  posted_at: string;
  like_count: number;
  is_liked?: boolean;
}

interface PostCardProps {
  post: Post;
  onLike?: (postId: number, nextState: boolean) => void;
}

// Если текст поста длиннее этого порога, по умолчанию показываются
// только первые MAX_PREVIEW_CHARS символов с кнопкой "Читать дальше".
// Изображения никогда не прячутся — всегда рендерятся под текстом.
const MAX_PREVIEW_CHARS = 800;

export function PostCard({ post, onLike }: PostCardProps) {
  const [liked, setLiked] = useState(post.is_liked ?? false);
  const [count, setCount] = useState(post.like_count);
  const [isExpanded, setIsExpanded] = useState(false);

  // Усекаем текст по последней границе слова перед лимитом.
  const { preview, hasMore } = post.text
    ? truncateAtWord(post.text, MAX_PREVIEW_CHARS)
    : { preview: "", hasMore: false };
  const displayText = isExpanded ? post.text : preview;

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Оптимистичный UI — сразу обновляем интерфейс.
    // Родительский компонент откатит через onLike если API упадёт.
    const next = !liked;
    setLiked(next);
    setCount((c) => c + (next ? 1 : -1));
    onLike?.(post.id, next);

    // Тактильная отдача внутри Telegram
    window.Telegram?.WebApp?.HapticFeedback?.impactOccurred("light");
  };

  const handleExpand = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(true);
    window.Telegram?.WebApp?.HapticFeedback?.selectionChanged();
  };

  const openOriginal = () => {
    if (!post.channel_username) return;
    const url = `https://t.me/${post.channel_username}/${post.message_id}`;
    const tg = window.Telegram?.WebApp;
    if (tg?.openTelegramLink) {
      tg.openTelegramLink(url);
    } else {
      window.open(url, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <article className="border-b border-border bg-card px-4 py-3">
      <header className="flex items-start gap-3">
        <Avatar
          src={post.channel_avatar_url}
          fallback={post.channel_title}
          size={40}
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-1.5 text-sm">
            <span className="truncate font-semibold text-foreground">
              {post.channel_title}
            </span>
            {post.channel_username && (
              <span className="truncate text-muted-foreground">
                @{post.channel_username}
              </span>
            )}
            <span className="shrink-0 text-muted-foreground">·</span>
            <time
              className="shrink-0 text-muted-foreground"
              dateTime={post.posted_at}
              suppressHydrationWarning
            >
              {formatRelativeTime(post.posted_at)}
            </time>
          </div>
        </div>
      </header>

      {post.text && (
        <div className="mt-2 text-[15px] leading-snug text-foreground">
          <p className="whitespace-pre-wrap break-words">{displayText}</p>
          {hasMore && !isExpanded && (
            <button
              onClick={handleExpand}
              className="mt-1 inline-flex items-center gap-0.5 text-sm font-medium text-primary active:opacity-70"
              aria-label="Показать пост целиком"
            >
              Читать дальше
              <ChevronRight className="h-4 w-4" strokeWidth={2.5} />
            </button>
          )}
        </div>
      )}

      {post.media_url && (
        <button
          onClick={openOriginal}
          className="mt-3 block w-full overflow-hidden rounded-md border border-border"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={post.media_url}
            alt=""
            className="max-h-96 w-full object-cover"
          />
        </button>
      )}

      <footer className="mt-3 flex items-center gap-4">
        <button
          onClick={handleLike}
          className={cn(
            "flex items-center gap-1.5 text-sm transition-colors",
            liked
              ? "text-destructive"
              : "text-muted-foreground hover:text-destructive",
          )}
          aria-label={liked ? "Убрать лайк" : "Поставить лайк"}
        >
          <Heart
            className="h-5 w-5"
            fill={liked ? "currentColor" : "none"}
            strokeWidth={2}
          />
          {count > 0 && <span className="tabular-nums">{count}</span>}
        </button>

        <button
          onClick={openOriginal}
          className="ml-auto flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          aria-label="Открыть оригинал в Telegram"
        >
          <ExternalLink className="h-5 w-5" />
        </button>
      </footer>
    </article>
  );
}

// Относительное время в стиле X: "5 мин", "2 ч", "3 д", дальше дата.
function formatRelativeTime(iso: string): string {
  const ts = new Date(iso).getTime();
  if (Number.isNaN(ts)) return "";
  const diffSec = Math.max(0, Math.floor((Date.now() - ts) / 1000));

  if (diffSec < 60) return "сейчас";
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)} мин`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)} ч`;
  if (diffSec < 604800) return `${Math.floor(diffSec / 86400)} д`;
  return new Date(iso).toLocaleDateString("ru", {
    day: "numeric",
    month: "short",
  });
}

// Усекает текст по границе слова. Ищет последний пробел или перенос строки
// в пределах последних 60 символов перед maxChars, чтобы не резать слова
// посередине. Если граница слова не найдена (длинное слово/URL без пробелов) —
// режет жёстко по maxChars.
function truncateAtWord(
  text: string,
  maxChars: number,
): { preview: string; hasMore: boolean } {
  if (text.length <= maxChars) {
    return { preview: text, hasMore: false };
  }
  const search = text.slice(0, maxChars);
  const lastSpace = search.lastIndexOf(" ");
  const lastNewline = search.lastIndexOf("\n");
  const wordBoundary = Math.max(lastSpace, lastNewline);
  const cut = wordBoundary > maxChars - 60 ? wordBoundary : maxChars;
  return {
    preview: text.slice(0, cut).trimEnd(),
    hasMore: true,
  };
}
