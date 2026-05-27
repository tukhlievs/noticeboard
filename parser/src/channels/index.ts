// Агрегатор всех каналов из тематических файлов.
//
// Каждый файл news_ru.ts, crypto_en.ts и т.д. экспортирует массив
// ChannelSeed — это username + опциональный title.
// Здесь оборачиваем их с topic и language, получаем полный Channel.

import { channels as newsRu } from "./news_ru";
import { channels as newsEn } from "./news_en";
import { channels as cryptoRu } from "./crypto_ru";
import { channels as cryptoEn } from "./crypto_en";
import { channels as programmingRu } from "./programming_ru";
import { channels as programmingEn } from "./programming_en";
import { channels as carsRu } from "./cars_ru";
import { channels as carsEn } from "./cars_en";

export interface ChannelSeed {
  username: string;
  title?: string;
}

export type Topic = "news" | "crypto" | "programming" | "cars";
export type Language = "ru" | "en";

export interface Channel extends ChannelSeed {
  topic: Topic;
  language: Language;
}

function tag(
  seeds: ChannelSeed[],
  topic: Topic,
  language: Language,
): Channel[] {
  return seeds.map((s) => ({ ...s, topic, language }));
}

export const allChannels: Channel[] = [
  ...tag(newsRu, "news", "ru"),
  ...tag(newsEn, "news", "en"),
  ...tag(cryptoRu, "crypto", "ru"),
  ...tag(cryptoEn, "crypto", "en"),
  ...tag(programmingRu, "programming", "ru"),
  ...tag(programmingEn, "programming", "en"),
  ...tag(carsRu, "cars", "ru"),
  ...tag(carsEn, "cars", "en"),
];
