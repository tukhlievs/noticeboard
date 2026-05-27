-- 0003_indexes_and_view.sql
-- Индексы для производительности и view для удобного чтения ленты.

-- Сортировка ленты по времени публикации
create index posts_created_at_idx on posts (created_at desc);
create index posts_posted_at_idx on posts (posted_at desc);

-- Фильтр по каналу (для будущего экрана Follows)
create index posts_channel_id_idx on posts (channel_id);

-- Основной индекс для feed-запроса: фильтр по типу + сортировка
create index posts_feed_idx on posts (post_type, posted_at desc);

-- Индексы для лайков (агрегация и проверка "лайкнул ли пользователь")
create index likes_post_id_idx on likes (post_id);
create index likes_user_id_idx on likes (user_id);

-- View post_with_likes — пост + канал + счётчик лайков одним запросом.
-- Используется в API route /api/feed: select * from post_with_likes ...
create view post_with_likes as
select
  p.id,
  p.channel_id,
  p.message_id,
  p.text,
  p.media_type,
  p.media_url,
  p.post_type,
  p.views,
  p.posted_at,
  p.created_at,
  c.username as channel_username,
  c.title as channel_title,
  c.avatar_url as channel_avatar_url,
  coalesce(l.like_count, 0) as like_count
from posts p
join channels c on c.id = p.channel_id
left join (
  select post_id, count(*) as like_count
  from likes
  group by post_id
) l on l.post_id = p.id;

comment on view post_with_likes is
  'Денормализованная view для ленты. Возвращает посты с данными канала и счётчиком лайков. Использовать в API route с фильтром post_type=content.';
