import { NextResponse } from "next/server";
import { extractValidatedUser } from "@/lib/api-auth";
import { supabaseAdmin } from "@/lib/supabase";

export const runtime = "edge";

interface ToggleBody {
  post_id: number;
}

/**
 * POST /api/likes
 * Body: { post_id: number }
 *
 * Toggle: если лайк уже стоит — удаляет, иначе создаёт.
 * Заодно делает upsert пользователя в таблицу users (lazy registration).
 *
 * Response: { liked: boolean, like_count: number }
 *
 * Auth обязательна. Без валидного X-Telegram-Init-Data возвращает 401.
 */
export async function POST(request: Request) {
  const validated = await extractValidatedUser(request);
  if (!validated) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: ToggleBody;
  try {
    body = (await request.json()) as ToggleBody;
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  if (!body.post_id || typeof body.post_id !== "number") {
    return NextResponse.json({ error: "post_id required" }, { status: 400 });
  }

  const userId = validated.user.id;
  const postId = body.post_id;

  // Lazy upsert пользователя — первый лайк регистрирует юзера в нашей БД
  const { error: userError } = await supabaseAdmin.from("users").upsert(
    {
      telegram_id: userId,
      first_name: validated.user.first_name,
      last_name: validated.user.last_name ?? null,
      username: validated.user.username ?? null,
      photo_url: validated.user.photo_url ?? null,
      language_code: validated.user.language_code ?? null,
      last_seen_at: new Date().toISOString(),
    },
    { onConflict: "telegram_id" },
  );
  if (userError) {
    console.error("User upsert failed:", userError);
    return NextResponse.json({ error: "User upsert failed" }, { status: 500 });
  }

  // Проверяем текущее состояние лайка
  const { data: existing } = await supabaseAdmin
    .from("likes")
    .select("user_id")
    .eq("user_id", userId)
    .eq("post_id", postId)
    .maybeSingle();

  let nowLiked: boolean;

  if (existing) {
    const { error } = await supabaseAdmin
      .from("likes")
      .delete()
      .eq("user_id", userId)
      .eq("post_id", postId);
    if (error) {
      return NextResponse.json({ error: "Delete failed" }, { status: 500 });
    }
    nowLiked = false;
  } else {
    const { error } = await supabaseAdmin
      .from("likes")
      .insert({ user_id: userId, post_id: postId });
    if (error) {
      // Возможен FK violation если post_id не существует
      return NextResponse.json({ error: "Insert failed" }, { status: 500 });
    }
    nowLiked = true;
  }

  // Возвращаем актуальный счётчик лайков для этого поста
  const { count } = await supabaseAdmin
    .from("likes")
    .select("*", { count: "exact", head: true })
    .eq("post_id", postId);

  return NextResponse.json({
    liked: nowLiked,
    like_count: count ?? 0,
  });
}
