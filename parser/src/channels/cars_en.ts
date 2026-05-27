import type { ChannelSeed } from "./index";

// Cars and motorsport in English. 3 channels verified, 7 slots open.
//
// NOTE: Cars are a thin niche on Telegram — most automotive content lives
// on YouTube and Instagram. Consider swapping this topic for finance,
// marketing, design, business, or travel where Telegram has more channels.
export const channels: ChannelSeed[] = [
  { username: "topgear", title: "Top Gear" },
  { username: "autoblog", title: "AutoBlog" },
  { username: "formula1", title: "Formula 1" },
  // TODO: 7 slots — see note above on rethinking the niche
];
