import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Orgis",
  applicationName: "Orgis",
  description:
    "Orgis is a priority-sorted chat compilation app for messages from WhatsApp, Telegram, Discord, Slack, and more."
};

export default function RootLayout({
  children
}: Readonly<{
  children: ReactNode;
}>) {
  const year = new Date().getFullYear();

  return (
    <html lang="en">
      <body className="min-h-screen bg-background text-foreground antialiased">
        <div className="flex min-h-screen flex-col">
          <div className="flex-1">{children}</div>
          <footer className="border-t border-slate-200/70 bg-white/55 py-8 backdrop-blur">
            <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
              <div className="flex items-center gap-2 text-sm text-slate-700">
                <span className="h-2 w-2 rounded-full bg-slate-900" aria-hidden="true" />
                <span className="font-semibold text-slate-900">Orgis</span>
                <span className="text-slate-400">&middot;</span>
                <span className="text-slate-600">by</span>
                <span className="font-semibold text-slate-900">YBG</span>
              </div>

              <div className="text-xs text-slate-500">
                <span>&copy; {year}</span>
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}

