"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AloionMark } from "@/components/aloion-mark";
import { api } from "@/lib/api";
import { statusLabel, whenDay } from "@/lib/format";
import { useSession } from "@/lib/session";
import type { EventCard } from "@/lib/types";

export default function OrganizerHome() {
  const { user, loading, login } = useSession();
  const [events, setEvents] = useState<EventCard[]>([]);

  useEffect(() => {
    if (!user) return;
    api.managed().then((data) => setEvents(data.events || [])).catch(() => undefined);
  }, [user]);

  if (loading) return <main className="p-10">লোড হচ্ছে…</main>;
  if (!user) return <main className="mx-auto max-w-lg px-4 py-16"><h1 className="serif text-4xl sm:text-5xl">আয়োজন</h1><p className="mt-3">ইভেন্ট বানাতে ও চালাতে আলোআয়ন দিয়ে প্রবেশ করুন।</p><button className="btn btn-primary mt-5" onClick={() => login()}><AloionMark />আলোআয়ন দিয়ে চালিয়ে যান</button></main>;

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <h1 className="serif text-4xl sm:text-5xl">আপনার ইভেন্ট</h1>
        <Link href="/organizer/events/new" className="btn btn-primary w-full sm:w-auto">ইভেন্ট তৈরি</Link>
      </div>
      <div className="mt-6 space-y-3">
        {events.map((event) => (
          <Link key={event.id} href={`/organizer/events/${event.id}`} className="card flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
            <span className="min-w-0"><strong className="break-words">{event.title}</strong><span className="mt-1 block text-sm text-[var(--muted)]">{whenDay(event.starts_at, event.timezone)} · {event.registration_count} জন নিবন্ধিত</span></span>
            <span className="text-sm capitalize">{statusLabel(event.status)}</span>
          </Link>
        ))}
        {events.length === 0 && <p className="text-[var(--muted)]">আপনি এখনো কোনো ইভেন্ট তৈরি করেননি।</p>}
      </div>
    </main>
  );
}
