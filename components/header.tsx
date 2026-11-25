"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useSession } from "@/lib/session";
import { mediaURL } from "@/lib/api";
import { personName, statusLabel } from "@/lib/format";
import type { User } from "@/lib/types";

const LINKS = [
  { href: "/", label: "ইভেন্ট খুঁজুন", match: (path: string) => path === "/" || path.startsWith("/events") },
  { href: "/my-events", label: "আমার টিকিট", match: (path: string) => path.startsWith("/my-events") || path.startsWith("/tickets") },
  { href: "/organizer", label: "অর্গানাইজ করুন", match: (path: string) => path.startsWith("/organizer") },
];

export function Header() {
  const { user, loading, login, logout } = useSession();
  const path = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [path]);

  if (path.includes("/check-in") || path.endsWith("/print")) return null;

  const links = [...LINKS, ...(user?.role === "admin" ? [{ href: "/admin/events", label: "অ্যাডমিন রিভিউ", match: (p: string) => p.startsWith("/admin") }] : [])];

  return (
    <header className="no-print sticky top-0 z-40 border-b border-[var(--line)] bg-[var(--paper)]/90 backdrop-blur supports-[backdrop-filter]:bg-[var(--paper)]/80">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4">
        <Link href="/" className="min-w-0 shrink-0" aria-label="আলোআয়ন ইভেন্ট, হোম">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/navbar_log.png" alt="আলোআয়ন ইভেন্ট" className="h-11 w-auto" />
        </Link>
        <nav className="hidden items-center gap-1 md:flex" aria-label="মূল মেনু">
          {links.map((link) => {
            const active = link.match(path);
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={`rounded-[var(--radius-sm)] px-3 py-2 text-[0.95rem] font-semibold transition ${active ? "bg-white text-[var(--pine-deep)] shadow-sm" : "text-[var(--ink-2)] hover:bg-white/70"}`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
        <div className="flex items-center gap-2">
          {!loading && !user && <button className="btn btn-primary btn-sm" onClick={() => login()}>লগইন</button>}
          {!loading && user && <AccountMenu user={user} logout={logout} />}
          <button
            type="button"
            className="btn btn-ghost btn-sm md:!hidden"
            aria-expanded={open}
            aria-label={open ? "মেনু বন্ধ করুন" : "মেনু খুলুন"}
            onClick={() => setOpen((value) => !value)}
          >
            {open ? "✕" : "☰"}
          </button>
        </div>
      </div>
      {open && (
        <nav className="border-t border-[var(--line)] bg-[var(--paper)] px-4 py-2 md:hidden" aria-label="মোবাইল মেনু">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={link.match(path) ? "page" : undefined}
              className={`block rounded-[var(--radius-sm)] px-3 py-3 font-semibold ${link.match(path) ? "bg-white text-[var(--pine-deep)]" : ""}`}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}

function AccountMenu({ user, logout }: { user: User; logout: () => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        className="flex items-center gap-2 rounded-full border border-[var(--line-strong)] bg-white py-1 pr-3 pl-1 text-sm font-semibold shadow-sm hover:bg-[var(--paper)]"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <Avatar user={user} />
        <span className="hidden max-w-[9rem] truncate sm:inline">{user.first_name || personName(user)}</span>
        <span aria-hidden="true" className="text-xs muted">▾</span>
      </button>
      {open && (
        <div role="menu" className="absolute right-0 mt-2 w-64 overflow-hidden rounded-[var(--radius)] border border-[var(--line)] bg-white shadow-[var(--shadow-lg)]">
          <div className="border-b border-[var(--line)] px-4 py-3">
            <p className="truncate font-semibold">{personName(user)}</p>
            <p className="truncate text-sm muted">{user.email}</p>
            {user.role === "admin" && <p className="mt-1 text-xs font-semibold text-[var(--pine)]">{statusLabel("admin")}</p>}
          </div>
          <div className="p-1.5 text-sm">
            <Link role="menuitem" href="/my-events" className="block rounded-[var(--radius-sm)] px-3 py-2 hover:bg-[var(--paper)]">আমার টিকিট ও সার্টিফিকেট</Link>
            <Link role="menuitem" href="/organizer" className="block rounded-[var(--radius-sm)] px-3 py-2 hover:bg-[var(--paper)]">আমার পরিচালিত ইভেন্ট</Link>
            <button role="menuitem" className="block w-full rounded-[var(--radius-sm)] px-3 py-2 text-left text-[var(--danger)] hover:bg-[var(--danger-soft)]" onClick={logout}>লগআউট</button>
          </div>
        </div>
      )}
    </div>
  );
}

function Avatar({ user }: { user: User }) {
  const [failed, setFailed] = useState(false);
  const src = mediaURL(user.profile_picture);
  const letters = `${user.first_name?.[0] || ""}${user.last_name?.[0] || ""}`.trim() || "আ";
  if (src && !failed) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt="" className="h-8 w-8 shrink-0 rounded-full object-cover" onError={() => setFailed(true)} />;
  }
  return <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[var(--pine)] text-xs text-white">{letters}</span>;
}
