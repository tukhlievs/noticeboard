import { Construction } from "lucide-react";

interface ComingSoonProps {
  title: string;
}

// Заглушка для Search и Follows экранов.
//
// Когда найдёшь подходящий Telegram duck-стикер (или любой WebP/PNG),
// положи его в public/stickers/duck.webp и раскомментируй <img> ниже,
// убрав иконку Construction. Размер 128x128 хорошо смотрится.
export function ComingSoon({ title }: ComingSoonProps) {
  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center px-6 text-center">
      {/*
      <img
        src="/stickers/duck.webp"
        alt=""
        className="mb-4 h-32 w-32"
      />
      */}
      <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-muted">
        <Construction className="h-10 w-10 text-muted-foreground" strokeWidth={1.5} />
      </div>
      <h2 className="text-2xl font-semibold text-foreground">{title}</h2>
      <p className="mt-1.5 text-sm text-muted-foreground">
        Раздел в доработке
      </p>
    </div>
  );
}
