-- 0002_rls.sql
-- Row Level Security. Применяется второй.
--
-- Архитектурное решение: клиент НИКОГДА не ходит напрямую в Supabase с anon key.
-- Все чтения и записи идут через Next.js route handlers с service_role.
-- service_role bypass-ит RLS, поэтому наш API работает беспрепятственно.
-- RLS включается как defense-in-depth на случай утечки anon key или ошибки конфига.
--
-- Если в будущем решим открыть клиенту прямой доступ к чтению ленты —
-- добавим policy `posts_public_read` ниже и оставим записи через service_role.

alter table channels enable row level security;
alter table posts enable row level security;
alter table users enable row level security;
alter table likes enable row level security;
alter table reports enable row level security;

-- Никаких policies не создаём — это значит RLS блокирует ВСЁ для anon и authenticated ролей.
-- service_role обходит RLS по умолчанию.
