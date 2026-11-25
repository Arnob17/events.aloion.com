"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AloionMark } from "@/components/aloion-mark";
import { StatusBadge } from "@/components/ui";
import { api } from "@/lib/api";
import { registrationWindow, timeLeft, when } from "@/lib/format";
import { useSession } from "@/lib/session";
import type { PublicEvent } from "@/lib/types";

/** The registration box on the event page: deadline, the viewer's own registration, or the register button. */
export function EventGate({ event: initial }: { event: PublicEvent }) {
  const { user, loading, login } = useSession();
  const [event, setEvent] = useState<PublicEvent>(initial);

  useEffect(() => {
    if (loading || !user) return;
    api.event(initial.slug).then(setEvent).catch(() => undefined);
  }, [initial.slug, loading, user]);

  const state = registrationWindow(event);
  const mine = user ? event.my_registration : null;
  const full = event.capacity != null && event.registration_count >= event.capacity && !event.waitlist_enabled;

  return (
    <div>
      <div className="flex items-center justify-between gap-2">
        <p className="font-bold">রেজিস্ট্রেশন</p>
        {state === "open" ? <StatusBadge status="registration_open" label="চলছে" /> : state === "not_yet" ? <StatusBadge status="submitted" label="শিগগির খুলবে" /> : <StatusBadge status="registration_closed" label="বন্ধ" />}
      </div>

      {state === "open" && event.registration_closes_at && (
        <div className="mt-3 rounded-[var(--radius-sm)] bg-[var(--gold-soft)] px-3 py-2 text-sm">
          <p className="font-semibold text-[#7a5206]">শেষ তারিখ: {when(event.registration_closes_at, event.timezone)}</p>
          <p className="text-xs text-[#7a5206]/80">{timeLeft(event.registration_closes_at)}</p>
        </div>
      )}
      {state === "not_yet" && event.registration_opens_at && <p className="mt-3 text-sm">রেজিস্ট্রেশন খুলবে {when(event.registration_opens_at, event.timezone)}</p>}
      {state === "ended" && <p className="mt-3 text-sm muted">রেজিস্ট্রেশনের সময় শেষ হয়েছে {when(event.registration_closes_at, event.timezone)}।</p>}
      {state === "closed" && <p className="mt-3 text-sm muted">এই মুহূর্তে রেজিস্ট্রেশন খোলা নেই।</p>}

      {loading ? (
        <div className="skeleton mt-4 h-11" />
      ) : mine ? (
        <div className="mt-4 rounded-[var(--radius-sm)] border border-[var(--pine)]/30 bg-[var(--pine-soft)] p-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-semibold text-[var(--pine-deep)]">আপনি রেজিস্টার্ড</p>
            <StatusBadge status={mine.status} />
          </div>
          <p className="mt-1 font-mono text-sm">{mine.public_code}</p>
          <Link href={`/tickets/${mine.public_code}`} className="btn btn-primary mt-3 w-full">টিকিট দেখুন</Link>
        </div>
      ) : state !== "open" ? null : full ? (
        <p className="notice notice-warn mt-4">সব সিট পূর্ণ হয়ে গেছে।</p>
      ) : !user ? (
        <div className="mt-4">
          <button className="btn btn-primary btn-lg w-full" onClick={() => login(`${window.location.origin}/events/${event.slug}/register`)}>
            <AloionMark className="h-5 w-5" />লগইন করে রেজিস্ট্রেশন
          </button>
          <p className="mt-2 text-xs muted">আলোআয়ন অ্যাকাউন্ট দিয়ে লগইন করুন। টিকিট আর কনফার্মেশন সেই ইমেইলে যাবে।</p>
        </div>
      ) : (
        <Link href={`/events/${event.slug}/register`} className="btn btn-primary btn-lg mt-4 w-full">এখনই রেজিস্ট্রেশন করুন</Link>
      )}
    </div>
  );
}
