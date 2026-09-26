import type { Metadata } from "next";
import { Noto_Sans_Bengali, Noto_Serif_Bengali } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/header";
import { SessionProvider } from "@/lib/session";

const sans = Noto_Sans_Bengali({
  subsets: ["bengali", "latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-geist",
});
const serif = Noto_Serif_Bengali({
  subsets: ["bengali", "latin"],
  weight: ["500", "600", "700"],
  variable: "--font-newsreader",
});

const site = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3001";

export const metadata: Metadata = {
  metadataBase: new URL(site),
  title: { default: "আলোআয়ন ইভেন্ট", template: "%s · আলোআয়ন ইভেন্ট" },
  description: "আলোআয়নের ইভেন্ট খুঁজুন, নাম লিখুন, এবং আয়োজন করুন।",
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="bn">
      <body className={`${sans.variable} ${serif.variable} antialiased`}>
        <SessionProvider>
          <Header />
          {children}
        </SessionProvider>
      </body>
    </html>
  );
}
