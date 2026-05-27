/** @type {import('next').NextConfig} */
const nextConfig = {
  // Cloudflare Pages совместимость идёт через next-on-pages при build:pages.
  // Глобально runtime: "edge" не ставим — отдельные route handlers смогут
  // явно указать `export const runtime = "edge"` где это нужно.

  images: {
    // Avatar URLs из Telegram CDN
    remotePatterns: [
      { protocol: "https", hostname: "**.telegram.org" },
      { protocol: "https", hostname: "**.cdn-telegram.org" },
      { protocol: "https", hostname: "t.me" },
    ],
  },

  experimental: {
    typedRoutes: false,
  },
};

export default nextConfig;
