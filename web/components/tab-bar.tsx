"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, Bookmark, User } from "lucide-react";
import { cn } from "@/lib/utils";

// Нижний таббар в iOS-стиле.
// Floating-эффект через backdrop-blur и полупрозрачный фон.
// Safe area inset снизу учитывает home indicator на iPhone.
const TABS = [
  { href: "/", label: "General", icon: Home },
  { href: "/search", label: "Search", icon: Search },
  { href: "/follows", label: "Follows", icon: Bookmark },
  { href: "/profile", label: "Profile", icon: User },
] as const;

export function TabBar() {
  const pathname = usePathname();

  return (
    <nav
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50",
        "border-t border-border",
        "bg-background/80 backdrop-blur-xl",
        "safe-bottom",
      )}
    >
      <ul className="mx-auto flex max-w-md items-stretch justify-around">
        {TABS.map(({ href, label, icon: Icon }) => {
          const isActive =
            href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                className={cn(
                  "flex flex-col items-center gap-0.5 py-2 transition-colors",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon
                  className="h-6 w-6"
                  strokeWidth={isActive ? 2.5 : 2}
                  fill={isActive ? "currentColor" : "none"}
                />
                <span className="text-[10px] font-medium tracking-tight">
                  {label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
