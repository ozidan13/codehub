import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

// Optimized font loading with Apple-inspired configuration
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap", // Improves loading performance
  preload: true,
  fallback: ["-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
  preload: false, // Only preload primary font
  fallback: ["SF Mono", "Monaco", "Cascadia Code", "monospace"],
});

export const metadata: Metadata = {
  title: "CodeHub - Learning Tracker Platform",
  description: "Track your learning progress across five comprehensive programming platforms. Submit task summaries, receive feedback, and advance your skills systematically.",
  keywords: ["programming", "learning", "algorithms", "javascript", "oop", "solid principles", "design patterns"],
  authors: [{ name: "CodeHub Team" }],
  openGraph: {
    title: "CodeHub - Learning Tracker Platform",
    description: "Master programming step by step with structured learning and progress tracking",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
