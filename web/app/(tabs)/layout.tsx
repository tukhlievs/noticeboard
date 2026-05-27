import { TabBar } from "@/components/tab-bar";

// Общий layout для четырёх таб-экранов: General, Search, Follows, Profile.
// TabBar fixed снизу, контент имеет pb-20 чтобы не уезжать под него.
export default function TabsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen pb-20">
      {children}
      <TabBar />
    </div>
  );
}
