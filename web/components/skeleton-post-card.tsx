// Skeleton-плейсхолдер карточки поста.
// Показывается пока грузится следующая страница ленты через infinite scroll.
export function SkeletonPostCard() {
  return (
    <div className="animate-pulse border-b border-border px-4 py-3">
      <div className="flex items-start gap-3">
        <div className="h-10 w-10 shrink-0 rounded-full bg-muted" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-1/3 rounded bg-muted" />
          <div className="space-y-1.5 pt-1">
            <div className="h-3 w-full rounded bg-muted" />
            <div className="h-3 w-5/6 rounded bg-muted" />
            <div className="h-3 w-2/3 rounded bg-muted" />
          </div>
        </div>
      </div>
    </div>
  );
}
