// Минимальные TypeScript-типы для window.Telegram.WebApp.
// Полное API: https://core.telegram.org/bots/webapps

export interface TelegramUserData {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  photo_url?: string;
  is_premium?: boolean;
}

export interface TelegramThemeParams {
  bg_color?: string;
  text_color?: string;
  hint_color?: string;
  link_color?: string;
  button_color?: string;
  button_text_color?: string;
  secondary_bg_color?: string;
  header_bg_color?: string;
  accent_text_color?: string;
  section_bg_color?: string;
}

export interface TelegramWebApp {
  ready: () => void;
  expand: () => void;
  close: () => void;

  initData: string;
  initDataUnsafe: {
    user?: TelegramUserData;
    auth_date?: number;
    hash?: string;
    query_id?: string;
    start_param?: string;
  };

  colorScheme: "light" | "dark";
  themeParams: TelegramThemeParams;

  openTelegramLink: (url: string) => void;
  openLink: (url: string, options?: { try_instant_view?: boolean }) => void;

  HapticFeedback: {
    impactOccurred: (style: "light" | "medium" | "heavy" | "rigid" | "soft") => void;
    notificationOccurred: (type: "error" | "success" | "warning") => void;
    selectionChanged: () => void;
  };

  BackButton: {
    show: () => void;
    hide: () => void;
    onClick: (cb: () => void) => void;
    offClick: (cb: () => void) => void;
  };

  MainButton: {
    setText: (text: string) => void;
    show: () => void;
    hide: () => void;
    enable: () => void;
    disable: () => void;
    onClick: (cb: () => void) => void;
    offClick: (cb: () => void) => void;
  };
}

declare global {
  interface Window {
    Telegram?: {
      WebApp: TelegramWebApp;
    };
  }
}

export {};
