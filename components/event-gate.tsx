"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AccountGate } from "@/components/account-gate";
import { RegistrationCard } from "@/components/registration-card";
import { api } from "@/lib/api";
import { useSession } from "@/lib/session";
import type { PublicEvent } from "@/lib/types";

export function EventGate({ slug, open }: { slug: string; open: boolean }) {
  const { user, loading } = useSession();
  const [event, setEvent] = useState<PublicEvent | null>(null);

  useEffect(() => {
    if (loading) return;
    api.event(slug).then(setEvent).catch(() => undefined);
  }, [slug, loading, user]);

  if (loading) return <p className="mt-5 text-sm text-[var(--muted)]">অ্যাকাউন্ট দেখা হচ্ছে…</p>;

  const mine = event?.my_registration;
  if (user && mine) return <div className="mt-5"><RegistrationCard registration={{ ...mine, event_slug: mine.event_slug || slug, event_title: mine.event_title || event?.title }} /></div>;

  if (!user) {
    return (
      <div className="mt-5">
        <AccountGate
          title="আলোআয়ন দিয়ে রেজিস্ট্রেশন"
          body="রেজিস্ট্রেশন করতে লগইন করুন। তারপর এই পাতায় টিকিট, সেগমেন্ট, খাবার ও সময় থাকবে।"
        />
      </div>
    );
  }

  const isOpen = event ? event.status === "registration_open" : open;
  if (!isOpen) return <p className="mt-5 text-sm text-[var(--muted)]">রেজিস্ট্রেশন এখন খোলা নেই।</p>;

  return <Link href={`/events/${slug}/register`} className="btn btn-primary mt-5 w-full">এখনই রেজিস্ট্রেশন করুন</Link>;
}
