import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "InnerPilot — AI Emotional Performance Coach",
  description: "Master your emotions. Maximize your performance. Track, analyze, and optimize your emotional state daily.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased min-h-screen">{children}</body>
    </html>
  );
}
