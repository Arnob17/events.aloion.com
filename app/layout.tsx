import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import ClickGuard from "@/components/click-guard";
import { SessionProvider } from "@/lib/session";

const site = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3001";

export const metadata: Metadata = {
  metadataBase: new URL(site),
  title: { default: "আলোআয়ন ইভেন্ট", template: "%s · আলোআয়ন ইভেন্ট" },
  description: "আলোআয়নের ইভেন্ট সার্চ করুন, রেজিস্ট্রেশন করুন, এবং অর্গানাইজ করুন।",
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="bn">
      <body className="flex min-h-screen flex-col antialiased">
        <SessionProvider>
          <ClickGuard />
          <Header />
          <div className="flex-1">
            {children}
          </div>
          <Footer />
        </SessionProvider>
      </body>
    </html>
  );
}
