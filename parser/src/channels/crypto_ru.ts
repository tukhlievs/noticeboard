import type { ChannelSeed } from "./index";

// Криптовалюты и финансовые рынки на русском.
// 9 каналов проверены, 1 слот свободен.
export const channels: ChannelSeed[] = [
  { username: "forklog", title: "ForkLog" },
  { username: "cryptodaily", title: "Crypto Daily" },
  { username: "defi_news", title: "DeFi RU News" },
  { username: "incrypted", title: "Incrypted" },
  { username: "bitcoin_translated", title: "Bitcoin Translated" },
  { username: "markettwits", title: "MarketTwits" },
  { username: "cryptonewsroom", title: "Cryptonews" },
  { username: "bitkogan", title: "bitkogan" },
  { username: "if_market_news", title: "IF News" },
  // TODO: один канал — найди что-то по NFT, DeFi или специфическим монетам
];
