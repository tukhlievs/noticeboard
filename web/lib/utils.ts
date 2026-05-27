import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// shadcn-стандартный helper для объединения классов Tailwind.
// Используем во всех компонентах: cn("base", isActive && "active", className)
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
