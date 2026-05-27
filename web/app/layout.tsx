import type { Metadata, Viewport } from "next";
import { Inter, Oswald } from "next/font/google";
import { TelegramProvider } from "@/components/telegram-provider";
import "./globals.css";

// Inter — основной UI-шрифт
const inter = Inter({
  subsets: ["latin", "cyrillic"],
  variable: "--font-inter",
  display: "swap",
});

// Oswald — строго для брендового имени Noticeboard
const oswald = Oswald({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-oswald",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Noticeboard",
  description: "Лента из IT-каналов Telegram",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  // viewportFit=cover нужен чтобы env(safe-area-inset-*) работали
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru" className={`${inter.variable} ${oswald.variable}`}>
      <head>
        {/* Telegram WebApp SDK. Доступен как window.Telegram.WebApp после загрузки. */}
        <script src="https://telegram.org/js/telegram-web-app.js" async />
      </head>
      <body className="min-h-screen bg-background font-sans">
        <TelegramProvider>{children}</TelegramProvider>
      </body>
    </html>
  );
}
