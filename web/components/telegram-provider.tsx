"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { TelegramUserData } from "@/lib/telegram-webapp";

interface TelegramContextValue {
  user: TelegramUserData | null;
  initData: string | null;
  isReady: boolean;
  colorScheme: "light" | "dark";
  isInTelegram: boolean;
}

const TelegramContext = createContext<TelegramContextValue>({
  user: null,
  initData: null,
  isReady: false,
  colorScheme: "light",
  isInTelegram: false,
});

// Dev fallback — чтобы `npm run dev` на localhost не падал.
// Используется ТОЛЬКО когда window.Telegram.WebApp не появился за секунду.
const DEV_USER: TelegramUserData = {
  id: 12345,
  first_name: "Dev",
  last_name: "User",
  username: "devuser",
  language_code: "ru",
};

export function TelegramProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<TelegramUserData | null>(null);
  const [initData, setInitData] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [colorScheme, setColorScheme] = useState<"light" | "dark">("light");
  const [isInTelegram, setIsInTelegram] = useState(false);

  useEffect(() => {
    // Telegram WebApp SDK подключён через <script async> в app/layout.tsx.
    // Опрашиваем window.Telegram.WebApp каждые 50 мс пока не появится.
    let attempts = 0;
    const interval = setInterval(() => {
      attempts += 1;
      const tg = window.Telegram?.WebApp;

      if (tg) {
        clearInterval(interval);

        // Сообщить Telegram что приложение готово к показу
        tg.ready();
        // Развернуть на полную высоту
        tg.expand();

        // Извлечь пользователя из initDataUnsafe.
        // initDataUnsafe не проверен криптографически — для отображения это ОК.
        // Для серверных операций используем server-side validateInitData.
        const u = tg.initDataUnsafe?.user;
        if (u) {
          setUser(u);
          setInitData(tg.initData);
          setIsInTelegram(true);
        }

        const scheme = tg.colorScheme ?? "light";
        setColorScheme(scheme);
        if (scheme === "dark") {
          document.documentElement.classList.add("dark");
        } else {
          document.documentElement.classList.remove("dark");
        }

        setIsReady(true);
        return;
      }

      // Если за 1 секунду SDK не появился — мы не в Telegram (открыто в браузере)
      if (attempts > 20) {
        clearInterval(interval);
        if (process.env.NODE_ENV === "development") {
          setUser(DEV_USER);
        }
        setIsReady(true);
      }
    }, 50);

    return () => clearInterval(interval);
  }, []);

  return (
    <TelegramContext.Provider
      value={{ user, initData, isReady, colorScheme, isInTelegram }}
    >
      {children}
    </TelegramContext.Provider>
  );
}

export function useTelegram() {
  return useContext(TelegramContext);
}
