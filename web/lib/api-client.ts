"use client";

import { useMemo } from "react";
import { useTelegram } from "@/components/telegram-provider";

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = "ApiError";
  }
}

/**
 * Клиент для запросов к нашим /api endpoints.
 * Автоматически добавляет X-Telegram-Init-Data заголовок если initData доступен.
 */
export class ApiClient {
  constructor(private initData: string | null) {}

  async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const headers = new Headers(options.headers);
    if (options.body && !headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }
    if (this.initData) {
      headers.set("X-Telegram-Init-Data", this.initData);
    }

    const response = await fetch(path, { ...options, headers });

    if (!response.ok) {
      let message = `HTTP ${response.status}`;
      try {
        const body = (await response.json()) as { error?: string };
        if (body.error) message = body.error;
      } catch {
        // body не JSON — оставляем дефолтное сообщение
      }
      throw new ApiError(response.status, message);
    }

    return response.json() as Promise<T>;
  }
}

/**
 * React hook для получения мемоизированного ApiClient.
 * Клиент пересоздаётся только когда меняется initData (например, после
 * того как Telegram WebApp SDK загрузился).
 */
export function useApiClient(): ApiClient {
  const { initData } = useTelegram();
  return useMemo(() => new ApiClient(initData), [initData]);
}
