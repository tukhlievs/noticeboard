import type { ChannelSeed } from "./index";

// Programming, IT, and AI in English. 6 channels verified, 4 slots open.
// Telegram has fewer high-quality EN programming channels than RU —
// consider broadening to specific stack channels (Swift, Kotlin, Go, etc.).
export const channels: ChannelSeed[] = [
  { username: "github_status", title: "GitHub Status" },
  { username: "rustlangnews", title: "Rust Lang News" },
  { username: "TypeScriptDaily", title: "TypeScript Daily" },
  { username: "theaiwave", title: "The AI Wave" },
  { username: "towardsdatascience", title: "Towards Data Science" },
  { username: "data_science_jobs", title: "Data Science Jobs" },
  // TODO: 4 slots — try Swift/Kotlin/Go community channels, AI/ML newsletters,
  //                or company eng-blog mirrors (Cloudflare, Vercel, GitHub Blog)
];
