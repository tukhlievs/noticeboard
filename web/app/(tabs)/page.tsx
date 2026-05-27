"use client";

import { useEffect, useRef } from "react";
import { PostCard } from "@/components/post-card";
import { SkeletonPostCard } from "@/components/skeleton-post-card";
import { useFeed } from "@/hooks/use-feed";
import { useLike } from "@/hooks/use-like";

export default function GeneralPage() {
  const { posts, isLoading, hasMore, error, loadMore, setPosts } = useFeed();
  const toggleLike = useLike();
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Infinite scroll через intersection observer.
  // Когда невидимый sentinel-div снизу страницы появляется во viewport
  // (с упреждением 200px), грузим следующую страницу.
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasMore && !isLoading) {
          loadMore();
        }
      },
      { rootMargin: "200px" },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, isLoading, loadMore]);

  // Обработчик лайка — оптимистично уже применён внутри PostCard.
  // Здесь синхронизируемся с сервером и откатываем при ошибке.
  const handleLike = async (postId: number, nextState: boolean) => {
    try {
      const result = await toggleLike(postId);
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? { ...p, is_liked: result.liked, like_count: result.like_count }
            : p,
        ),
      );
    } catch {
      // Откат оптимистичного UI — PostCard уже обновил локально, отменяем
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? {
                ...p,
                is_liked: !nextState,
                like_count: p.like_count + (nextState ? -1 : 1),
              }
            : p,
        ),
      );
    }
  };

  return (
    <main>
      <header className="safe-top sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="px-4 py-3">
          <h1 className="font-brand text-2xl uppercase tracking-wide">
            Noticeboard
          </h1>
        </div>
      </header>

      {error && (
        <div className="border-b border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          Не удалось загрузить ленту: {error}
        </div>
      )}

      <div>
        {posts.map((post) => (
          <PostCard key={post.id} post={post} onLike={handleLike} />
        ))}

        {isLoading && (
          <>
            <SkeletonPostCard />
            <SkeletonPostCard />
          </>
        )}

        {!isLoading && hasMore && <div ref={sentinelRef} className="h-1" />}

        {!hasMore && posts.length > 0 && (
          <div className="px-4 py-8 text-center text-sm text-muted-foreground">
            Это все посты
          </div>
        )}

        {!isLoading && !hasMore && posts.length === 0 && !error && (
          <div className="px-4 py-16 text-center">
            <p className="text-muted-foreground">
              Лента пустая. Парсер ещё не подключён.
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              Применить миграцию 0004_seed.sql в Supabase SQL Editor, чтобы
              увидеть тестовые посты.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
