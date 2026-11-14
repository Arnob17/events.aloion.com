"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AloionMark } from "@/components/aloion-mark";

export function Footer() {
  const pathname = usePathname();
  if (pathname.includes("/check-in")) return null;

  return (
    <footer className="border-t border-[var(--line)] bg-[#eeebe2] text-[var(--ink)]">
      <div className="mx-auto max-w-5xl px-4 py-12">
        <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-4">
          <div className="sm:col-span-2">
            <Link href="/" className="inline-flex items-center gap-2">
              <AloionMark className="h-6 w-6" />
              <span className="serif text-xl font-bold">আলোআয়ন ইভেন্ট</span>
            </Link>
            <p className="mt-3 max-w-sm text-sm text-[var(--muted)]">
              বাংলাদেশের স্কুল, কলেজ ও বিশ্ববিদ্যালয়ের ক্লাব, বিজ্ঞান উৎসব, অলিম্পিয়াড ও সাংস্কৃতিক অনুষ্ঠানের সম্পূর্ণ ম্যানেজমেন্ট প্ল্যাটফর্ম।
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-sm">এক্সপ্লোর</h4>
            <ul className="mt-3 space-y-2 text-sm text-[var(--muted)]">
              <li>
                <Link href="/" className="hover:text-[var(--pine)]">
                  ইভেন্ট সার্চ
                </Link>
              </li>
              <li>
                <Link href="/my-events" className="hover:text-[var(--pine)]">
                  আমার টিকিট ও সার্টিফিকেট
                </Link>
              </li>
              <li>
                <Link href="/organizer" className="hover:text-[var(--pine)]">
                  অর্গানাইজার হাব
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-sm">জনপ্রিয় ইভেন্ট</h4>
            <ul className="mt-3 space-y-2 text-sm text-[var(--muted)]">
              <li>বিজ্ঞান ও অলিম্পিয়াড</li>
              <li>আইটি ও হ্যাকাথন</li>
              <li>বিতর্ক ও কুইজ উৎসব</li>
              <li>ওয়ার্কশপ ও সেমিনার</li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-[var(--line)] pt-6 text-xs text-[var(--muted)] sm:flex-row">
          <p>© আলোআয়ন ইভেন্ট। সর্বস্বত্ব সংরক্ষিত।</p>
          <div className="flex gap-4">
            <Link href="/" className="hover:underline">
              হোম
            </Link>
            <Link href="/organizer" className="hover:underline">
              অর্গানাইজারদের জন্য
            </Link>
            <Link href="/my-events" className="hover:underline">
              অংশগ্রহণকারী প্রোফাইল
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
