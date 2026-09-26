"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useSession } from "@/lib/session";
import { mediaURL } from "@/lib/api";
import { personName } from "@/lib/format";
import type { User } from "@/lib/types";

export function Header() {
  const { user, loading, login, logout } = useSession();
  const path = usePathname();
  if (path.includes("/check-in")) return null;

  return (
    <header className="sticky top-0 z-30 border-b border-[var(--line)] bg-[var(--paper)]">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="text-[var(--ink)]">
          <span className="serif text-[1.7rem] leading-none">আলোআয়ন</span>
          <span className="ml-2 text-[15px] text-[var(--muted)]">ইভেন্ট</span>
        </Link>
        <nav className="flex items-center gap-1 text-sm">
          <Link className="rounded-[0.7rem] px-3 py-2 hover:bg-white" href="/">খুঁজুন</Link>
          <Link className="rounded-[0.7rem] px-3 py-2 hover:bg-white" href="/my-events">আমার ইভেন্ট</Link>
          <Link className="rounded-[0.7rem] px-3 py-2 hover:bg-white" href="/organizer">আয়োজন</Link>
          {user?.role === "admin" && <Link className="rounded-[0.7rem] px-3 py-2 hover:bg-white" href="/admin/events">পর্যালোচনা</Link>}
          {loading ? null : user ? (
            <UserChip user={user} onClick={logout} />
          ) : (
            <button className="btn btn-primary !py-2" onClick={() => login()}>প্রবেশ</button>
          )}
        </nav>
      </div>
    </header>
  );
}

function UserChip({ user, onClick }: { user: User; onClick: () => void }) {
  const [failed, setFailed] = useState(false);
  const src = mediaURL(user.profile_picture);
  const letters = `${user.first_name?.[0] || ""}${user.last_name?.[0] || ""}`.trim() || "আ";

  return (
    <button className="btn btn-ghost !py-1.5 !pl-1.5" onClick={onClick}>
      {src && !failed ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" className="h-7 w-7 rounded-full object-cover" onError={() => setFailed(true)} />
      ) : (
        <span className="grid h-7 w-7 place-items-center rounded-full bg-[var(--pine)] text-[11px] text-white">{letters}</span>
      )}
      {personName(user)}
    </button>
  );
}
