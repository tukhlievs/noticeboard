-- 0001_init.sql
-- Базовая схема Noticeboard. Применяется первой.

create extension if not exists pgcrypto;

-- Типы постов для фильтрации в ленте
create type post_type as enum ('content', 'ad', 'casino', 'adult');

-- Каналы, которые мы парсим
create table channels (
  id text primary key,
  username text unique,
  title text not null,
  avatar_url text,
  topic text not null default 'it',
  is_blocked boolean not null default false,
  first_seen_at timestamptz not null default now(),
  last_post_at timestamptz
);

comment on table channels is
  'Список Telegram-каналов, которые парсит парсер. id хранится как text, так как Telegram channel ids могут быть очень большими bigint значениями.';

-- Пользователи Mini App
-- Авторегистрируются из Telegram initData при первом открытии приложения
create table users (
  telegram_id bigint primary key,
  username text,
  first_name text,
  last_name text,
  photo_url text,
  language_code text,
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);

comment on table users is
  'Пользователи Mini App. Supabase Auth не используется — данные приходят из validated Telegram initData, первичный ключ telegram_id.';

-- Посты
create table posts (
  id bigserial primary key,
  channel_id text not null references channels(id) on delete cascade,
  message_id bigint not null,
  text text,
  media_type text,
  media_url text,
  post_type post_type not null default 'content',
  views integer default 0,
  posted_at timestamptz not null,
  created_at timestamptz not null default now(),
  unique (channel_id, message_id)
);

comment on table posts is
  'Посты, спарсенные из каналов. Уникальность по (channel_id, message_id) защищает от дублей при повторных проходах парсера.';

-- Лайки. Один лайк на пользователя на пост.
create table likes (
  user_id bigint not null references users(telegram_id) on delete cascade,
  post_id bigint not null references posts(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, post_id)
);

-- Жалобы пользователей. Канал блокируется руками админа на основе этих жалоб.
create table reports (
  id bigserial primary key,
  post_id bigint references posts(id) on delete cascade,
  channel_id text references channels(id) on delete cascade,
  user_id bigint references users(telegram_id) on delete set null,
  reason text not null,
  created_at timestamptz not null default now()
);
