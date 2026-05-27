"""
Noticeboard Telegram bot — webhook handler на Cloudflare Workers Python beta.

Единственная задача: принять update от Telegram через webhook, на /start
ответить inline-кнопкой Open Noticeboard. Всё остальное (лента, лайки,
профиль) живёт в Next.js Mini App.

Почему Python на Workers? Cloudflare Workers Python beta (Pyodide-based)
существует как реальный продукт с конца 2024. Для такого простого webhook
этого хватает: парсим входящий JSON, вызываем Bot API обратно через fetch.
Никаких тяжёлых фреймворков вроде aiogram или python-telegram-bot не нужно.

Fallback: если Python beta поломается при деплое или выполнении,
тот же handler переписывается на TypeScript за полчаса. Логика одинаковая.
"""

from js import Response, fetch, Object
from pyodide.ffi import to_js
import json


def _to_js(obj):
    """Конвертирует Python dict/list в JS-объект пригодный для fetch options."""
    return to_js(obj, dict_converter=Object.fromEntries)


async def send_message(env, chat_id, text, reply_markup=None):
    """Вызов Telegram Bot API sendMessage."""
    url = f"https://api.telegram.org/bot{env.BOT_TOKEN}/sendMessage"

    payload = {"chat_id": chat_id, "text": text, "parse_mode": "HTML"}
    if reply_markup is not None:
        payload["reply_markup"] = reply_markup

    init = _to_js({
        "method": "POST",
        "headers": {"Content-Type": "application/json"},
        "body": json.dumps(payload),
    })

    await fetch(url, init)


async def handle_start(env, message):
    """Ответ на /start — приветствие и кнопка открытия Mini App."""
    chat_id = message["chat"]["id"]
    user = message.get("from", {})
    first_name = user.get("first_name", "")

    greeting = (
        f"Привет, {first_name}!\n\n"
        f"<b>Noticeboard</b> — лента постов из IT-каналов Telegram. "
        f"Нажми кнопку ниже, чтобы открыть."
    )

    reply_markup = {
        "inline_keyboard": [[
            {
                "text": "Open Noticeboard",
                "web_app": {"url": env.MINI_APP_URL},
            }
        ]]
    }

    await send_message(env, chat_id, greeting, reply_markup=reply_markup)


async def on_fetch(request, env):
    """Точка входа Cloudflare Worker. Валидирует webhook secret и диспатчит."""

    # GET — health check или случайный визит браузером
    if request.method != "POST":
        return Response.new("Noticeboard bot is alive", status=200)

    # Telegram присылает X-Telegram-Bot-Api-Secret-Token, если setWebhook был
    # с параметром secret_token. Защищает от случайных POST с интернета.
    expected_secret = env.BOT_WEBHOOK_SECRET
    received_secret = request.headers.get("X-Telegram-Bot-Api-Secret-Token")
    if received_secret != expected_secret:
        return Response.new("Unauthorized", status=401)

    # Парсим update
    try:
        body_text = await request.text()
        update = json.loads(body_text)
    except Exception:
        return Response.new("Bad Request", status=400)

    # Диспатч апдейта
    if "message" in update:
        message = update["message"]
        text = message.get("text", "")
        if text.startswith("/start"):
            await handle_start(env, message)

    # Всегда возвращаем 200 — иначе Telegram будет ретраить тот же update
    return Response.new("OK", status=200)
