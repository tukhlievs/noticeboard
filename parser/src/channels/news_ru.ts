import type { ChannelSeed } from "./index";

// Новости на русском. 10 каналов, все проверены через t.me/s/<username>.
export const channels: ChannelSeed[] = [
  { username: "lentachold", title: "Лентач" },
  { username: "tass_agency", title: "ТАСС" },
  { username: "rbc_news", title: "РБК. Новости. Главное" },
  { username: "rian_ru", title: "РИА Новости" },
  { username: "meduzalive", title: "Медуза — LIVE" },
  { username: "forbesrussia", title: "Forbes Russia" },
  { username: "kommersant", title: "Коммерсантъ" },
  { username: "vedomosti", title: "ВЕДОМОСТИ" },
  { username: "breakingmash", title: "Mash" },
  { username: "interfaxonline", title: "Интерфакс" },
];
