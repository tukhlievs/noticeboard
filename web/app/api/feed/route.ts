import { NextResponse } from "next/server";
import { extractValidatedUser } from "@/lib/api-auth";
import { supabaseAdmin } from "@/lib/supabase";
import type { Post } from "@/components/post-card";

// Деплоится на Cloudflare edge через next-on-pages
export const runtime = "edge";

const PAGE_SIZE = 20;

/**
 * GET /api/feed?cursor=<iso-timestamp>
 *
 * Возвращает страницу постов из view post_with_likes:
 *   - фильтр post_type=content (отсеиваем ad/casino/adult)
 *   - сортировка по posted_at DESC
 *   - курсорная пагинация: cursor = posted_at последнего поста из предыдущей страницы
 *
 * Auth опциональна. Если есть валидный initData, в каждом посте дополнительно
 * выставляется is_liked=true/false для текущего пользователя.
 *
 * Response: { posts: Post[], nextCursor: string | null }
 */
export async function GET(request: Request) {
  const validated = await extractValidatedUser(request);
  const userId = validated?.user.id;

  const url = new URL(request.url);
  const cursor = url.searchParams.get("cursor");

  let query = supabaseAdmin
    .from("post_with_likes")
    .select("*")
    .eq("post_type", "content")
    .order("posted_at", { ascending: false })
    .limit(PAGE_SIZE);

  if (cursor) {
    query = query.lt("posted_at", cursor);
  }

  const { data: rows, error } = await query;

  if (error) {
    console.error("Feed query failed:", error);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }

  const posts = (rows ?? []) as Post[];

  // Если пользователь авторизован, подмешиваем is_liked
  let likedPostIds = new Set<number>();
  if (userId && posts.length > 0) {
    const postIds = posts.map((p) => p.id);
    const { data: likes } = await supabaseAdmin
      .from("likes")
      .select("post_id")
      .eq("user_id", userId)
      .in("post_id", postIds);
    if (likes) {
      likedPostIds = new Set(likes.map((l) => l.post_id as number));
    }
  }

  const postsWithLikes: Post[] = posts.map((p) => ({
    ...p,
    is_liked: likedPostIds.has(p.id),
  }));

  // Следующий курсор — posted_at последнего поста. null если это последняя страница.
  const nextCursor =
    posts.length === PAGE_SIZE
      ? posts[posts.length - 1].posted_at
      : null;

  return NextResponse.json({ posts: postsWithLikes, nextCursor });
}
