-- 0005_channels_metadata.sql
-- Добавляем language column в channels.
-- Topic у нас уже есть — расширяем смыслом (news, crypto, programming, cars).

alter table channels
  add column if not exists language text not null default 'ru';

-- Индекс для быстрого поиска по нише и языку
create index if not exists channels_topic_language_idx
  on channels (topic, language);

comment on column channels.language is
  'Язык канала (ru, en). Используется парсером для разделения тематик по языку.';
