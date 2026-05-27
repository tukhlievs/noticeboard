import type { ChannelSeed } from "./index";

// Crypto and financial markets in English.
// 9 channels verified, 1 slot open.
export const channels: ChannelSeed[] = [
  { username: "Cointelegraph", title: "Cointelegraph" },
  { username: "bitcoin", title: "Bitcoin" },
  { username: "blockworks_news", title: "Blockworks" },
  { username: "BinanceAnnouncements", title: "Binance Announcements" },
  { username: "Crypto", title: "Bloomberg Crypto" },
  { username: "coinmarketcapofficial", title: "CoinMarketCap" },
  { username: "WatcherGuru", title: "Watcher Guru" },
  { username: "defi_pulse", title: "Crypto Hold" },
  { username: "glassnode", title: "Glassnode" },
  // TODO: one slot open — try NFT, DeFi protocols, or specific L1 chain channels
];
