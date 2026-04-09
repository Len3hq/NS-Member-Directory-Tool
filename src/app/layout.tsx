import type { Metadata } from "next";
import { Inter, Geist_Mono } from "next/font/google";
import "./globals.css";
import ScrollingTicker from "@/components/ScrollingTicker";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "NS Member Directory",
  description: "Network School member directory — find builders, professionals, and collaborators.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" style={{ colorScheme: 'light' }}>
      <body className={`${inter.variable} ${geistMono.variable} antialiased`}>
        <ScrollingTicker />
        {children}
        <footer className="border-t border-[var(--border)] bg-white">
          <div className="max-w-6xl mx-auto px-5 sm:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-[var(--muted)]">
            <span>
              Made with ❤️ by{' '}
              <a
                href="https://len3.xyz"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-[var(--foreground)] hover:underline"
              >
                @len3
              </a>
              {' '}&amp;{' '}
              <span className="font-medium text-[var(--foreground)]">@taoofdev</span>
            </span>
            <a
              href="https://github.com/Len3hq/NS-Member-Directory-Tool"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[var(--foreground)] transition-colors"
            >
              View on GitHub ↗
            </a>
            <span className="text-center sm:text-right text-[var(--muted-2)]">
              Unofficial dashboard · not affiliated with NS
            </span>
          </div>
        </footer>
      </body>
    </html>
  );
}
