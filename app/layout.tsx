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
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{
            __html: `
(() => {
  try {
    const stored = localStorage.getItem("orgis.theme");
    const theme = stored === "dark" || stored === "light" ? stored : null;
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    }
  } catch {}
})();
            `.trim()
          }}
        />
      </head>
      <body className="min-h-screen bg-background text-foreground antialiased">
        <div className="flex min-h-screen flex-col">
          <div className="flex-1">{children}</div>
          <footer className="border-t border-border/70 bg-background/70 py-8 backdrop-blur supports-[backdrop-filter]:bg-background/55 transition-colors">
            <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
              <div className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
                <span
                  className="h-2 w-2 rounded-full bg-slate-900 dark:bg-slate-100"
                  aria-hidden="true"
                />
                <span className="font-semibold text-slate-900 dark:text-white">
                  Organised Real-time Global Inbox System
                </span>
                <span className="text-slate-400 dark:text-slate-500">&middot;</span>
                <span className="text-slate-600 dark:text-slate-300">by</span>
                <span className="font-semibold text-slate-900 dark:text-white">YBG</span>
              </div>

              <div className="text-xs text-slate-500 dark:text-slate-400">
                <span>&copy; {year}</span>
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}

