"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AccountGate } from "@/components/account-gate";
import { RegistrationCard } from "@/components/registration-card";
import { api } from "@/lib/api";
import { useSession } from "@/lib/session";
import type { Certificate, Registration } from "@/lib/types";

export default function MyEventsPage() {
  const { user, loading } = useSession();
  const [rows, setRows] = useState<Registration[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) return;
    api.mine().then((data) => {
      setRows(data.registrations || []);
      setCertificates(data.certificates || []);
    }).catch((err: Error) => setError(err.message));
  }, [user]);

  if (loading) return <main className="mx-auto max-w-3xl px-4 py-16">আপনার ইভেন্ট লোড হচ্ছে…</main>;
  if (!user) {
    return (
      <main className="mx-auto max-w-lg px-4 py-16">
        <AccountGate title="আপনার ইভেন্ট" body="আলোআয়ন দিয়ে লগইন করুন। যেসব ইভেন্টে রেজিস্ট্রেশন করেছেন, কোন সেগমেন্টে, কখন হবে, সেটা এখানে দেখা যাবে।" />
      </main>
    );
  }

  const now = Date.now();
  const upcoming = rows.filter((row) => !row.event_starts_at || new Date(row.event_starts_at).getTime() >= now - 86400000);
  const past = rows.filter((row) => row.event_starts_at && new Date(row.event_starts_at).getTime() < now - 86400000);

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="serif text-4xl sm:text-5xl">আমার ইভেন্ট</h1>
      <p className="mt-2 text-[var(--muted)]">{user.email} হিসেবে লগইন করা। কনফার্মেশনের চিঠি এই ইমেইলে যায়।</p>
      {error && <p className="mt-4 text-sm text-red-700">{error}</p>}
      <Section title="আসছে" rows={upcoming} />
      <Section title="আগের" rows={past} />
      <section className="mt-10">
        <h2 className="serif text-3xl">সার্টিফিকেট</h2>
        <div className="mt-3 space-y-2">
          {certificates.map((cert) => (
            <Link key={cert.hash} href={`/certificates/${cert.hash}`} className="card block p-4">
              <strong>{cert.title}</strong>
              <p className="text-sm text-[var(--muted)]">{cert.event_title}</p>
            </Link>
          ))}
          {certificates.length === 0 && <p className="text-[var(--muted)]">অর্গানাইজার সার্টিফিকেট দিলে সেটা এখানে দেখা যাবে।</p>}
        </div>
      </section>
    </main>
  );
}

function Section({ title, rows }: { title: string; rows: Registration[] }) {
  return (
    <section className="mt-8">
      <h2 className="serif text-3xl">{title}</h2>
      <div className="mt-3 space-y-4">
        {rows.map((row) => <RegistrationCard key={row.public_code} registration={row} compact />)}
        {rows.length === 0 && <p className="text-[var(--muted)]">এখনো কিছু নেই।</p>}
      </div>
    </section>
  );
}
