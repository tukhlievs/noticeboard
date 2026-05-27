"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface AvatarProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "children"> {
  src?: string | null;
  fallback?: string;
  size?: number;
  alt?: string;
}

// Кастомная Avatar без зависимостей от Radix.
// При ошибке загрузки src показывает инициалы из fallback.
export function Avatar({
  src,
  fallback,
  size = 40,
  alt = "",
  className,
  ...props
}: AvatarProps) {
  const [errored, setErrored] = React.useState(false);
  const showFallback = !src || errored;

  return (
    <div
      className={cn(
        "relative inline-flex shrink-0 overflow-hidden rounded-full bg-muted",
        className,
      )}
      style={{ width: size, height: size }}
      {...props}
    >
      {!showFallback && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src ?? ""}
          alt={alt}
          onError={() => setErrored(true)}
          className="h-full w-full object-cover"
        />
      )}
      {showFallback && (
        <span
          aria-hidden="true"
          className="flex h-full w-full items-center justify-center text-sm font-medium uppercase text-muted-foreground"
        >
          {fallback?.trim().slice(0, 2) ?? "?"}
        </span>
      )}
    </div>
  );
}
