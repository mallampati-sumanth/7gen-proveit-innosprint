import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ProveIt — Autonomous AWS Deployment Agent",
  description:
    "ProveIt: Do not just suggest the fix — prove it. Autonomous AWS deployment and self-healing powered by Gemini Flash + multi-agent reasoning.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
