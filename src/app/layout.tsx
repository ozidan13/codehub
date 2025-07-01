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
  title: "كود هاب - منصة تتبع التعلم",
  description: "تتبع تقدمك في التعلم عبر خمس منصات برمجة شاملة. قدم ملخصات المهام، احصل على التغذية الراجعة، وطور مهاراتك بشكل منهجي.",
  keywords: ["البرمجة", "التعلم", "الخوارزميات", "جافاسكريبت", "البرمجة الكائنية", "مبادئ SOLID", "أنماط التصميم"],
  authors: [{ name: "فريق كود هاب" }],
  openGraph: {
    title: "كود هاب - منصة تتبع التعلم",
    description: "أتقن البرمجة خطوة بخطوة مع التعلم المنظم وتتبع التقدم",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl">
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
