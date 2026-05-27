import type { ChannelSeed } from "./index";

// Новости на русском.
// Username без @ префикса. Проверь существование через https://t.me/s/<username>
// перед добавлением — у некоторых каналов превью отключено, парсер их пропустит.
// Цель — 10 каналов. Пустые слоты помечены TODO.
export const channels: ChannelSeed[] = [
  { username: "tass_agency" },
  { username: "rian_ru" },
  { username: "rbc_news" },
  { username: "meduzalive" },
  { username: "lentachold" },
  // TODO: ещё 5 каналов
];
