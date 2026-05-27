import { validateInitData, type ValidatedInitData } from "./telegram";

// Имя заголовка в нижнем регистре — Headers нормализуют регистр при чтении.
const HEADER_NAME = "x-telegram-init-data";

/**
 * Достаёт initData из заголовка X-Telegram-Init-Data и валидирует его.
 *
 * Возвращает данные пользователя если initData валиден, null иначе.
 * Использовать в каждом route handler, которому нужна авторизация.
 */
export async function extractValidatedUser(
  request: Request,
): Promise<ValidatedInitData | null> {
  const initData = request.headers.get(HEADER_NAME);
  if (!initData) return null;

  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) {
    console.error("TELEGRAM_BOT_TOKEN not configured in env");
    return null;
  }

  return validateInitData(initData, botToken);
}
