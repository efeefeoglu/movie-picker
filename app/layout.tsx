import type { Metadata } from "next";
import { DM_Sans, Playfair_Display } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const sans = DM_Sans({ subsets: ["latin"], variable: "--font-sans" });
const display = Playfair_Display({ subsets: ["latin"], variable: "--font-display" });

export const metadata: Metadata = {
  title: "ReelPick — Your next movie, found",
  description: "Save your IMDb watchlist and let chance choose movie night.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${sans.variable} ${display.variable}`}>
        <header className="nav">
          <Link href="/" className="brand"><span>R</span> ReelPick</Link>
          <nav><Link href="/">Discover</Link><Link href="/add" className="add-link">+ Add a film</Link></nav>
        </header>
        {children}
        <footer><div className="brand"><span>R</span> ReelPick</div><p>Less scrolling. More watching.</p></footer>
      </body>
    </html>
  );
}
