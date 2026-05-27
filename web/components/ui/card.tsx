import * as React from "react";
import { cn } from "@/lib/utils";

// Простая shadcn-style Card. Без header/content/footer композиции —
// добавим когда понадобится. iOS-look: 16px радиус, тонкий border.
export const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-lg border border-border bg-card text-card-foreground",
      className,
    )}
    {...props}
  />
));
Card.displayName = "Card";
