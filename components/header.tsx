"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useSession } from "@/lib/session";
import { mediaURL } from "@/lib/api";
import { personName } from "@/lib/format";
import type { User } from "@/lib/types";

const LINKS = [
  ["/", "খুঁজুন"],
  ["/my-events", "আমার ইভেন্ট"],
  ["/organizer", "আয়োজন"],
] as const;

export function Header() {
  const { user, loading, login, logout } = useSession();
  const path = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [path]);

  if (path.includes("/check-in")) return null;

  return (
    <header className="sticky top-0 z-30 border-b border-[var(--line)] bg-[var(--paper)]">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
        <Link href="/" className="min-w-0 shrink-0" aria-label="আলোআয়ন ইভেন্ট">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/navbar_log.png" alt="আলোআয়ন ইভেন্ট" className="h-14 w-auto sm:h-[4.5rem]" />
        </Link>
        <nav className="hidden items-center gap-1 text-sm md:flex">
          <SiteLinks user={user} />
          <AccountSlot loading={loading} user={user} login={login} logout={logout} />
        </nav>
        <button
          type="button"
          className="btn btn-ghost !px-3 !py-2 md:!hidden"
          aria-expanded={open}
          aria-label={open ? "মেনু বন্ধ করুন" : "মেনু খুলুন"}
          onClick={() => setOpen((value) => !value)}
        >
          {open ? "বন্ধ" : "মেনু"}
        </button>
      </div>
      {open && (
        <nav className="border-t border-[var(--line)] px-4 py-3 md:hidden">
          <div className="mx-auto flex max-w-5xl flex-col gap-1 text-sm">
            <SiteLinks user={user} stacked />
            <div className="pt-2">
              <AccountSlot loading={loading} user={user} login={login} logout={logout} stacked />
            </div>
          </div>
        </nav>
      )}
    </header>
  );
}

function SiteLinks({ user, stacked = false }: { user: User | null; stacked?: boolean }) {
  const item = stacked ? "rounded-[0.7rem] px-3 py-3 hover:bg-white" : "rounded-[0.7rem] px-3 py-2 hover:bg-white";
  return (
    <>
      {LINKS.map(([href, label]) => (
        <Link key={href} className={item} href={href}>{label}</Link>
      ))}
      {user?.role === "admin" && <Link className={item} href="/admin/events">পর্যালোচনা</Link>}
    </>
  );
}

function AccountSlot({ loading, user, login, logout, stacked = false }: { loading: boolean; user: User | null; login: (next?: string) => void; logout: () => void; stacked?: boolean }) {
  if (loading) return null;
  if (user) return <UserChip user={user} onClick={logout} wide={stacked} />;
  return <button className={`btn btn-primary !py-2 ${stacked ? "w-full" : ""}`} onClick={() => login()}>প্রবেশ</button>;
}

function UserChip({ user, onClick, wide = false }: { user: User; onClick: () => void; wide?: boolean }) {
  const [failed, setFailed] = useState(false);
  const src = mediaURL(user.profile_picture);
  const letters = `${user.first_name?.[0] || ""}${user.last_name?.[0] || ""}`.trim() || "আ";

  return (
    <button className={`btn btn-ghost !py-1.5 !pl-1.5 ${wide ? "w-full justify-start" : "max-w-[14rem]"}`} onClick={onClick}>
      {src && !failed ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" className="h-7 w-7 shrink-0 rounded-full object-cover" onError={() => setFailed(true)} />
      ) : (
        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[var(--pine)] text-[11px] text-white">{letters}</span>
      )}
      <span className="truncate">{personName(user)}</span>
    </button>
  );
}
