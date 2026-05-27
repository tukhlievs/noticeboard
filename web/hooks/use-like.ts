"use client";

import { useCallback } from "react";
import { useApiClient } from "@/lib/api-client";

export interface LikeResponse {
  liked: boolean;
  like_count: number;
}

/**
 * Хук для toggle лайка. Возвращает функцию, которая дёргает POST /api/likes
 * и возвращает актуальное состояние лайка + счётчик.
 *
 * Бросает Error если запрос не удался (например 401 без auth).
 * Вызывающий код должен ловить и откатывать оптимистичный UI.
 */
export function useLike() {
  const api = useApiClient();

  return useCallback(
    (postId: number): Promise<LikeResponse> =>
      api.request<LikeResponse>("/api/likes", {
        method: "POST",
        body: JSON.stringify({ post_id: postId }),
      }),
    [api],
  );
}
