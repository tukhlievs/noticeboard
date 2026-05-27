"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useApiClient } from "@/lib/api-client";
import type { Post } from "@/components/post-card";

interface FeedResponse {
  posts: Post[];
  nextCursor: string | null;
}

interface UseFeedResult {
  posts: Post[];
  isLoading: boolean;
  hasMore: boolean;
  error: string | null;
  loadMore: () => Promise<void>;
  /**
   * Прямое обновление состояния — нужно для оптимистичного UI лайков.
   * Использовать через функциональный setter: setPosts(prev => ...).
   */
  setPosts: React.Dispatch<React.SetStateAction<Post[]>>;
}

/**
 * Хук, который загружает ленту постранично из /api/feed.
 *
 * Первая страница грузится один раз при монтировании.
 * Последующие — через loadMore(), который вызывает infinite scroll трекер
 * на странице через intersection observer.
 *
 * Refs используются для защиты от двойных загрузок при ре-рендерах.
 */
export function useFeed(): UseFeedResult {
  const api = useApiClient();
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Refs — чтобы стабильно проверять состояние внутри loadMore без stale closure
  const cursorRef = useRef<string | null>(null);
  const hasMoreRef = useRef(true);
  const isLoadingRef = useRef(false);

  const loadMore = useCallback(async () => {
    if (isLoadingRef.current || !hasMoreRef.current) return;

    isLoadingRef.current = true;
    setIsLoading(true);
    setError(null);

    try {
      const params = cursorRef.current
        ? `?cursor=${encodeURIComponent(cursorRef.current)}`
        : "";
      const response = await api.request<FeedResponse>(`/api/feed${params}`);
      setPosts((prev) => [...prev, ...response.posts]);
      cursorRef.current = response.nextCursor;
      hasMoreRef.current = response.nextCursor !== null;
      setHasMore(response.nextCursor !== null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      isLoadingRef.current = false;
      setIsLoading(false);
    }
  }, [api]);

  // Первичная загрузка ровно один раз на маунт
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    loadMore();
  }, []);

  return { posts, isLoading, hasMore, error, loadMore, setPosts };
}
