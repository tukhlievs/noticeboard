import { createClient } from "@supabase/supabase-js";

// Серверный Supabase-клиент с service_role ключом.
//
// ВАЖНО: этот файл импортируется ТОЛЬКО на сервере (route handlers, server
// components). НЕ использовать в "use client" компонентах — иначе service_role
// ключ утечёт в браузер и в Cloudflare bundle.
//
// service_role обходит RLS, поэтому через этот клиент мы читаем и пишем
// что угодно. Защита прав доступа реализуется логикой нашего API.

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error(
    "Missing Supabase env vars. Скопируй .env.local.example в .env.local и заполни.",
  );
}

export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});
