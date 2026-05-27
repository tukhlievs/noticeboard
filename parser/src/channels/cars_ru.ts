import type { ChannelSeed } from "./index";

// Автомобили и автоспорт на русском. 3 канала проверены, 7 слотов свободны.
//
// ВАЖНО: на Telegram авто-ниша объективно слабая — большинство автоконтента
// живёт на YouTube и Instagram. Рассмотри замену темы на финансы, маркетинг,
// дизайн, бизнес или путешествия — там каналов с активной аудиторией больше.
export const channels: ChannelSeed[] = [
  { username: "autonews", title: "AutoNews" },
  { username: "f1news_ru", title: "F1 News" },
  { username: "formula_one_news", title: "Formula-1 News" },
  // TODO: 7 slots — нишу стоит пересмотреть, см. комментарий выше
];
