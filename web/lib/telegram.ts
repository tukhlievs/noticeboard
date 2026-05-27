// Валидация Telegram Mini App initData.
//
// КРИТИЧЕСКАЯ безопасность: НИКОГДА не доверяй данным пользователя, пришедшим
// из браузера, без проверки HMAC-SHA256 подписи. Telegram даёт initData строку
// при открытии Mini App; её нужно проверить на бэкенде через bot token.
//
// Алгоритм (из официальной документации Telegram):
//   1. Получить initData как URL-encoded query string
//   2. Извлечь поле `hash` (это полученный HMAC)
//   3. Из оставшихся полей сформировать data-check-string:
//      отсортированные по ключу `key=value`, склеенные через \n
//   4. Вычислить secret_key = HMAC_SHA256("WebAppData", bot_token)
//   5. Вычислить наш HMAC = HMAC_SHA256(secret_key, data-check-string)
//   6. Сравнить с полученным `hash` (constant-time)
//
// Реализация использует Web Crypto API (crypto.subtle), а не node:crypto,
// потому что route handlers деплоятся на Cloudflare edge через next-on-pages,
// где node:crypto не работает. Web Crypto работает и в Node 20+, и на edge.

import type { TelegramUserData } from "./telegram-webapp";

export interface ValidatedInitData {
  user: TelegramUserData;
  auth_date: number;
  query_id?: string;
  start_param?: string;
}

/**
 * Возвращает распарсенные данные если подпись валидна и auth_date свежий,
 * иначе null. Никогда не выбрасывает исключения для невалидных данных.
 *
 * Async потому что Web Crypto API асинхронный.
 */
export async function validateInitData(
  initData: string,
  botToken: string,
  maxAgeSeconds = 86400,
): Promise<ValidatedInitData | null> {
  if (!initData || !botToken) return null;

  const params = new URLSearchParams(initData);
  const receivedHash = params.get("hash");
  if (!receivedHash) return null;

  // Удаляем hash и формируем data-check-string
  params.delete("hash");
  const dataCheckString = Array.from(params.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join("\n");

  const encoder = new TextEncoder();

  // Шаг 1: secret_key = HMAC_SHA256(message=botToken, key="WebAppData")
  const secretKeyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode("WebAppData"),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const secretKeyBuffer = await crypto.subtle.sign(
    "HMAC",
    secretKeyMaterial,
    encoder.encode(botToken),
  );

  // Шаг 2: hash = HMAC_SHA256(message=dataCheckString, key=secret_key)
  const hashKey = await crypto.subtle.importKey(
    "raw",
    secretKeyBuffer,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const computedBuffer = await crypto.subtle.sign(
    "HMAC",
    hashKey,
    encoder.encode(dataCheckString),
  );
  const computedHash = bufferToHex(computedBuffer);

  // Constant-time сравнение — защита от timing attack
  if (!timingSafeEqual(computedHash, receivedHash)) {
    return null;
  }

  // Проверяем свежесть auth_date
  const authDate = Number(params.get("auth_date"));
  if (!authDate || Number.isNaN(authDate)) return null;
  const ageSeconds = Math.floor(Date.now() / 1000) - authDate;
  if (ageSeconds > maxAgeSeconds) return null;

  // Парсим user JSON
  const userRaw = params.get("user");
  if (!userRaw) return null;
  let user: TelegramUserData;
  try {
    user = JSON.parse(userRaw) as TelegramUserData;
  } catch {
    return null;
  }
  if (typeof user.id !== "number" || typeof user.first_name !== "string") {
    return null;
  }

  return {
    user,
    auth_date: authDate,
    query_id: params.get("query_id") ?? undefined,
    start_param: params.get("start_param") ?? undefined,
  };
}

function bufferToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}
