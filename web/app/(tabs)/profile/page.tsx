"use client";

import { Avatar } from "@/components/ui/avatar";
import { useTelegram } from "@/components/telegram-provider";

export default function ProfilePage() {
  const { user, isReady, isInTelegram } = useTelegram();

  if (!isReady) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center">
        <div className="text-sm text-muted-foreground">Загрузка</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center px-6 text-center">
        <p className="text-sm text-muted-foreground">
          Открой приложение через Telegram, чтобы увидеть профиль
        </p>
      </div>
    );
  }

  const fullName = [user.first_name, user.last_name].filter(Boolean).join(" ");

  return (
    <main className="safe-top">
      <header className="border-b border-border bg-background/80 px-4 py-3 backdrop-blur-xl">
        <h1 className="font-brand text-2xl uppercase tracking-wide">Profile</h1>
      </header>

      <section className="px-6 py-8">
        <div className="flex flex-col items-center text-center">
          <Avatar
            src={user.photo_url}
            fallback={user.first_name}
            size={96}
            className="mb-4"
          />
          <p className="text-xl font-semibold text-foreground">{fullName}</p>
          {user.username && (
            <p className="text-sm text-muted-foreground">@{user.username}</p>
          )}
          <div className="mt-1 text-xs text-muted-foreground">
            ID {user.id}
            {!isInTelegram && " · dev mode"}
          </div>
        </div>

        <div className="mt-8 space-y-2">
          <InfoRow
            label="Язык интерфейса"
            value={user.language_code ?? "не указан"}
          />
          <InfoRow
            label="Telegram Premium"
            value={user.is_premium ? "да" : "нет"}
          />
        </div>
      </section>
    </main>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
