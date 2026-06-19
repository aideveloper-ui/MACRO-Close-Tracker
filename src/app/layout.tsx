import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { authEnabled } from "@/lib/auth";
import "./globals.css";

export const metadata: Metadata = {
  title: "MACRO Media — Accounting & Finance",
  description: "Monthly close tracker and department reference for MACRO Media, LLC.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;0,6..72,600;1,6..72,400&family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        {/* ClerkProvider goes inside <body>. Only mount it once keys exist,
            so the app still runs in open dev mode without them. */}
        {authEnabled ? <ClerkProvider>{children}</ClerkProvider> : children}
      </body>
    </html>
  );
}
