"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AccountGate } from "@/components/account-gate";
import { AwardIcon, TicketIcon } from "@/components/icons";
import { RegistrationCard } from "@/components/registration-card";
import { EmptyState, PageLoading } from "@/components/ui";
import { api } from "@/lib/api";
import { whenDay } from "@/lib/format";
import { useSession } from "@/lib/session";
import type { Certificate, Registration } from "@/lib/types";

export default function MyEventsPage() {
  const { user, loading } = useSession();
  const [rows, setRows] = useState<Registration[] | null>(null);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [tab, setTab] = useState<"upcoming" | "past" | "certificates">("upcoming");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) return;
    api.mine().then((data) => {
      setRows(data.registrations || []);
      setCertificates(data.certificates || []);
    }).catch((err: Error) => setError(err.message));
  }, [user]);

  if (loading) return <PageLoading />;
  if (!user) {
    return (
      <main className="mx-auto max-w-lg px-4 py-14">
        <AccountGate title="আপনার টিকিট" body="আলোআয়ন দিয়ে লগইন করুন। যেসব ইভেন্টে রেজিস্ট্রেশন করেছেন, কোন সেগমেন্টে, কখন হবে, সেটা এখানে দেখা যাবে।" />
      </main>
    );
  }

  const cutoff = Date.now() - 86400000;
  const upcoming = (rows || []).filter((row) => !row.event_starts_at || new Date(row.event_starts_at).getTime() >= cutoff);
  const past = (rows || []).filter((row) => row.event_starts_at && new Date(row.event_starts_at).getTime() < cutoff);
  const shown = tab === "upcoming" ? upcoming : past;

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="serif text-3xl sm:text-4xl">আমার টিকিট</h1>
      <p className="mt-1 muted">{user.email} · কনফার্মেশনের চিঠি এই ইমেইলে যায়।</p>
      {error && <p className="notice notice-error mt-4">{error}</p>}
      <div className="tabs mt-6" role="tablist">
        <button role="tab" className="tab" aria-selected={tab === "upcoming"} onClick={() => setTab("upcoming")}>আসছে <span className="tab-count">{upcoming.length.toLocaleString("bn-BD")}</span></button>
        <button role="tab" className="tab" aria-selected={tab === "past"} onClick={() => setTab("past")}>আগের <span className="tab-count">{past.length.toLocaleString("bn-BD")}</span></button>
        <button role="tab" className="tab" aria-selected={tab === "certificates"} onClick={() => setTab("certificates")}>সার্টিফিকেট <span className="tab-count">{certificates.length.toLocaleString("bn-BD")}</span></button>
      </div>
      <div className="mt-5 space-y-3">
        {rows === null && !error && <><div className="skeleton h-24" /><div className="skeleton h-24" /></>}
        {tab !== "certificates" && rows !== null && shown.map((row) => <RegistrationCard key={row.public_code} registration={row} compact />)}
        {tab !== "certificates" && rows !== null && shown.length === 0 && (
          <EmptyState icon={<TicketIcon />} title={tab === "upcoming" ? "সামনে কোনো ইভেন্ট নেই" : "আগের কোনো ইভেন্ট নেই"} body="ইভেন্ট খুঁজে রেজিস্ট্রেশন করলে টিকিট এখানে থাকবে।" action={<Link href="/" className="btn btn-primary">ইভেন্ট খুঁজুন</Link>} />
        )}
        {tab === "certificates" && certificates.map((cert) => (
          <Link key={cert.hash} href={`/certificates/${cert.hash}`} className="card flex items-center gap-3 p-4">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[var(--gold-soft)] text-[#7a5206]"><AwardIcon className="h-5 w-5" /></div>
            <div className="min-w-0">
              <p className="font-bold break-words">{cert.title}</p>
              <p className="text-sm muted">{cert.event_title} · {whenDay(cert.issued_at)}</p>
            </div>
          </Link>
        ))}
        {tab === "certificates" && certificates.length === 0 && <EmptyState icon={<AwardIcon />} title="এখনো সার্টিফিকেট নেই" body="অর্গানাইজার সার্টিফিকেট দিলে সেটা এখানে দেখা যাবে।" />}
      </div>
    </main>
  );
}
