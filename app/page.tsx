"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { FieldLabel } from "@/components/field-label";
import { api, mediaURL } from "@/lib/api";
import { CATEGORIES, categoryLabel, place, statusLabel, whenDay } from "@/lib/format";
import type { EventCard } from "@/lib/types";

export default function DiscoverPage() {
  const [events, setEvents] = useState<EventCard[]>([]);
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("");
  const [location, setLocation] = useState("");
  const [registration, setRegistration] = useState("");
  const [error, setError] = useState("");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (category) params.set("category", category);
    if (location) params.set("location", location);
    if (registration) params.set("registration", registration);
    const query = params.toString();
    setLoaded(false);
    api.events(query ? `?${query}` : "")
      .then((data) => setEvents(data.events || []))
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoaded(true));
  }, [q, category, location, registration]);

  const featured = events.find((event) => event.featured);
  const rest = events.filter((event) => event.id !== featured?.id);

  return (
    <main className="mx-auto max-w-5xl px-4 pb-16">
      <header className="border-b border-[var(--line)] py-10">
        <h1 className="serif text-4xl leading-tight sm:text-5xl">ইভেন্ট</h1>
        <p className="mt-3 max-w-xl text-lg text-[var(--muted)]">
          স্কুল, ক্লাব ও কমিউনিটির ইভেন্ট। আলোআয়ন অ্যাকাউন্টে রেজিস্ট্রেশন করুন। টিকিট, সময় ও সেগমেন্ট এই পাতায় থাকবে।
        </p>
        <form className="mt-6 grid items-end gap-2 sm:grid-cols-2 lg:grid-cols-4" onSubmit={(event) => event.preventDefault()}>
          <FieldLabel label="ইভেন্ট সার্চ">
            <input className="field" value={q} onChange={(event) => setQ(event.target.value)} />
          </FieldLabel>
          <FieldLabel label="ক্যাটাগরি">
            <select className="field" value={category} onChange={(event) => setCategory(event.target.value)}>
              <option value="">সব ক্যাটাগরি</option>
              {CATEGORIES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
            </select>
          </FieldLabel>
          <FieldLabel label="লোকেশন">
            <select className="field" value={location} onChange={(event) => setLocation(event.target.value)}>
              <option value="">যেকোনো লোকেশন</option>
              <option value="physical">ফিজিক্যাল</option>
              <option value="online">অনলাইন</option>
              <option value="hybrid">হাইব্রিড</option>
            </select>
          </FieldLabel>
          <FieldLabel label="রেজিস্ট্রেশন">
            <select className="field" value={registration} onChange={(event) => setRegistration(event.target.value)}>
              <option value="">সব রেজিস্ট্রেশন</option>
              <option value="open">রেজিস্ট্রেশন চলছে</option>
              <option value="closed">রেজিস্ট্রেশন বন্ধ</option>
            </select>
          </FieldLabel>
        </form>
      </header>

      {error && <p className="mt-6 text-red-700">{error}</p>}

      {featured && (
        <Link href={`/events/${featured.slug}`} className={`mt-8 items-start gap-6 border-b border-[var(--line)] pb-8 ${featured.cover_image_url ? "grid md:grid-cols-[240px_1fr]" : "block"}`}>
          {featured.cover_image_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={mediaURL(featured.cover_image_url)} alt="" className="aspect-[4/3] w-full rounded-[0.7rem] object-cover" />
          )}
          <div>
            <p className="text-sm text-[var(--pine)]">{metaLine(featured)}</p>
            <h2 className="serif mt-1 text-3xl leading-tight break-words sm:text-4xl">{featured.title}</h2>
            {featured.summary && <p className="mt-3 text-[var(--muted)]">{featured.summary}</p>}
            <p className="mt-4 text-sm">{whenDay(featured.starts_at, featured.timezone)} · {place(featured)}</p>
            <p className="mt-1 text-sm text-[var(--muted)]">{featured.registration_count.toLocaleString("bn-BD")} জন রেজিস্টার্ড</p>
          </div>
        </Link>
      )}

      {rest.length > 0 && (
        <section className="pt-8">
          <h2 className="serif text-3xl">{featured ? "আরও ইভেন্ট" : "ইভেন্ট"}</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {rest.map((event) => <EventTile key={event.id} event={event} />)}
          </div>
        </section>
      )}
      {loaded && events.length === 0 && <p className="pt-8 text-[var(--muted)]">এই সার্চে কোনো ইভেন্ট নেই।</p>}
    </main>
  );
}

function EventTile({ event }: { event: EventCard }) {
  return (
    <Link href={`/events/${event.slug}`} className="card block overflow-hidden">
      {event.cover_image_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={mediaURL(event.cover_image_url)} alt="" className="aspect-[16/9] w-full object-cover" />
      )}
      <div className="p-4">
        <p className="text-sm text-[var(--pine)]">{metaLine(event)}</p>
        <h3 className="serif mt-1 text-2xl leading-tight break-words">{event.title}</h3>
        <p className="mt-2 text-sm text-[var(--muted)]">{whenDay(event.starts_at, event.timezone)} · {place(event)}</p>
        <p className="mt-3 text-sm">{event.registration_count.toLocaleString("bn-BD")} জন রেজিস্টার্ড</p>
      </div>
    </Link>
  );
}

function metaLine(event: EventCard) {
  return [categoryLabel(event.category), statusLabel(event.status)].filter(Boolean).join(" · ");
}
