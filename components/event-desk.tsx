"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { CheckIn } from "@/components/check-in";
import { Certificates } from "@/components/desk/certificates";
import { Counter } from "@/components/desk/counter";
import { Fields, Food, Gifts, Segments } from "@/components/desk/catalog";
import { Overview } from "@/components/desk/overview";
import { Registrations } from "@/components/desk/registrations";
import { Settings } from "@/components/desk/settings";
import { AwardIcon, CheckCircleIcon, GiftIcon, HelpCircleIcon, LayersIcon, QrCodeIcon, ShieldCheckIcon, SparklesIcon, UsersIcon, UtensilsIcon } from "@/components/icons";
import { StatusBadge } from "@/components/ui";
import { AccountGate } from "@/components/account-gate";
import { api } from "@/lib/api";
import { statusLabel } from "@/lib/format";
import { useSession } from "@/lib/session";
import type { Workspace } from "@/lib/types";

type NavItem = { key: string; label: string; icon: ReactNode; need?: string; group: "run" | "setup" };

const NAV: NavItem[] = [
  { key: "", label: "সামারি", icon: <SparklesIcon className="h-4 w-4" />, group: "run" },
  { key: "registrations", label: "রেজিস্ট্রেশন", icon: <UsersIcon className="h-4 w-4" />, group: "run" },
  { key: "check-in", label: "গেট চেক-ইন", icon: <QrCodeIcon className="h-4 w-4" />, need: "check_in", group: "run" },
  { key: "counter", label: "খাবার ও গিফট কাউন্টার", icon: <CheckCircleIcon className="h-4 w-4" />, need: "distribute", group: "run" },
  { key: "segments", label: "সেগমেন্ট", icon: <LayersIcon className="h-4 w-4" />, need: "manage_content", group: "setup" },
  { key: "fields", label: "রেজিস্ট্রেশন প্রশ্ন", icon: <HelpCircleIcon className="h-4 w-4" />, need: "manage_content", group: "setup" },
  { key: "food", label: "খাবার", icon: <UtensilsIcon className="h-4 w-4" />, need: "manage_content", group: "setup" },
  { key: "gifts", label: "গিফট", icon: <GiftIcon className="h-4 w-4" />, need: "manage_content", group: "setup" },
  { key: "certificates", label: "সার্টিফিকেট", icon: <AwardIcon className="h-4 w-4" />, need: "issue_certificate", group: "setup" },
  { key: "settings", label: "সেটিংস ও টিম", icon: <ShieldCheckIcon className="h-4 w-4" />, need: "edit", group: "setup" },
];

export function EventDesk({ id, section }: { id: string; section: string }) {
  const { user, loading } = useSession();
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [error, setError] = useState("");

  const reload = useCallback(async () => {
    try {
      setWorkspace(await api.workspace(Number(id)));
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "ইভেন্ট লোড হয়নি");
    }
  }, [id]);

  useEffect(() => {
    if (!loading && user) reload();
  }, [reload, loading, user]);

  if (!loading && !user) {
    return <main className="mx-auto max-w-lg px-4 py-14"><AccountGate title="অর্গানাইজার ডেস্ক" body="এই ইভেন্ট পরিচালনা করতে আলোআয়ন দিয়ে লগইন করুন।" /></main>;
  }
  if (!workspace) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-8">
        {error ? <p className="notice notice-error">{error}</p> : <><div className="skeleton h-8 w-72" /><div className="skeleton mt-6 h-64" /></>}
      </main>
    );
  }

  const base = `/organizer/events/${id}`;
  const nav = NAV.filter((item) => !item.need || workspace.actions.includes(item.need));
  const current = nav.find((item) => item.key === section) || nav[0];
  const href = (key: string) => (key ? `${base}/${key}` : base);

  // Check-in is used on phones at the gate: full width, no sidebar.
  if (section === "check-in") {
    return (
      <main className="min-h-screen bg-[var(--paper)] px-4 py-4">
        <div className="mx-auto mb-4 flex max-w-4xl items-center justify-between gap-3">
          <Link href={base} className="btn btn-ghost btn-sm">← ডেস্ক</Link>
          <p className="min-w-0 truncate font-bold">{workspace.event.title}</p>
        </div>
        <CheckIn eventId={workspace.event.id} />
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <Link href="/organizer" className="text-sm font-semibold text-[var(--pine)]">← সব ইভেন্ট</Link>
          <h1 className="serif mt-1 text-2xl break-words sm:text-3xl">{workspace.event.title}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
            <StatusBadge status={workspace.event.status} />
            <span className="badge badge-plain badge-gray">আপনার রোল: {statusLabel(workspace.role)}</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {workspace.actions.includes("check_in") && <Link href={`${base}/check-in`} className="btn btn-ghost"><QrCodeIcon className="h-4 w-4" />চেক-ইন খুলুন</Link>}
          <Link href={`/events/${workspace.event.slug}`} className="btn btn-ghost" target="_blank">পাবলিক পাতা ↗</Link>
        </div>
      </div>
      {workspace.review_note && (
        <p className="notice notice-warn mt-4"><strong className="shrink-0">অ্যাডমিনের নোট:</strong> {workspace.review_note}</p>
      )}

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[14rem_minmax(0,1fr)]">
        <nav aria-label="ইভেন্ট ডেস্ক" className="min-w-0">
          <div className="tabs lg:hidden">
            {nav.map((item) => (
              <Link key={item.key} href={href(item.key)} className="tab" aria-selected={item.key === current.key}>{item.label}</Link>
            ))}
          </div>
          <div className="hidden lg:sticky lg:top-24 lg:block">
            {(["run", "setup"] as const).map((group) => {
              const items = nav.filter((item) => item.group === group);
              if (items.length === 0) return null;
              return (
                <div key={group} className="mb-5">
                  <p className="mb-1.5 px-3 text-xs font-bold muted">{group === "run" ? "পরিচালনা" : "সেটআপ"}</p>
                  {items.map((item) => {
                    const active = item.key === current.key;
                    return (
                      <Link
                        key={item.key}
                        href={href(item.key)}
                        aria-current={active ? "page" : undefined}
                        className={`flex items-center gap-2.5 rounded-[var(--radius-sm)] px-3 py-2 text-[0.93rem] font-semibold ${active ? "bg-white text-[var(--pine-deep)] shadow-sm" : "text-[var(--ink-2)] hover:bg-white/60"}`}
                      >
                        <span className={active ? "text-[var(--pine)]" : "muted"}>{item.icon}</span>
                        {item.label}
                      </Link>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </nav>

        <div className="min-w-0">
          {current.key === "" && <Overview workspace={workspace} reload={reload} />}
          {current.key === "registrations" && <Registrations workspace={workspace} reload={reload} />}
          {current.key === "counter" && <Counter workspace={workspace} reload={reload} />}
          {current.key === "segments" && <Segments workspace={workspace} reload={reload} />}
          {current.key === "fields" && <Fields workspace={workspace} reload={reload} />}
          {current.key === "food" && <Food workspace={workspace} reload={reload} />}
          {current.key === "gifts" && <Gifts workspace={workspace} reload={reload} />}
          {current.key === "certificates" && <Certificates workspace={workspace} />}
          {current.key === "settings" && <Settings workspace={workspace} reload={reload} />}
        </div>
      </div>
    </main>
  );
}
