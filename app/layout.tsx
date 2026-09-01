import type { Metadata } from "next";
import { DM_Sans, Playfair_Display } from "next/font/google";
import Image from "next/image";
import Link from "next/link";
import "./globals.css";

const sans = DM_Sans({ subsets: ["latin"], variable: "--font-sans" });
const display = Playfair_Display({ subsets: ["latin"], variable: "--font-display" });

export const metadata: Metadata = {
  title: "ReelPick — Your next movie, found",
  description: "Save your IMDb watchlist and let chance choose movie night.",
  icons: {
    icon: "/favicon.png",
    apple: "/icon.png",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${sans.variable} ${display.variable}`}>
        <header className="nav">
          <Link href="/" className="brand brand-logo" aria-label="ReelPick home">
            <Image src="/reelpick-logo.png" alt="ReelPick" width={1049} height={258} priority />
          </Link>
          <nav><Link href="/">Discover</Link><Link href="/add" className="add-link">+ Add a film</Link></nav>
        </header>
        {children}
        <footer>
          <div className="brand footer-brand"><Image src="/favicon.png" alt="" width={192} height={192} /> ReelPick</div>
          <p>Less scrolling. More watching.</p>
        </footer>
      </body>
    </html>
  );
}
