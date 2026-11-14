"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { FieldLabel } from "@/components/field-label";
import {
  CalendarIcon,
  MapPinIcon,
  SearchIcon,
  SparklesIcon,
  TicketIcon,
  UsersIcon,
} from "@/components/icons";
import { api, mediaURL } from "@/lib/api";
import { CATEGORIES, categoryLabel, place, statusLabel, whenDay } from "@/lib/format";
import type { EventCard } from "@/lib/types";

function parseDateParts(dateStr?: string | null) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  const day = new Intl.DateTimeFormat("bn-BD", { day: "numeric", timeZone: "Asia/Dhaka" }).format(d);
  const month = new Intl.DateTimeFormat("bn-BD", { month: "short", timeZone: "Asia/Dhaka" }).format(d);
  return { day, month };
}

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
    api
      .events(query ? `?${query}` : "")
      .then((data) => setEvents(data.events || []))
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoaded(true));
  }, [q, category, location, registration]);

  const featured = events.find((event) => event.featured);
  const rest = events.filter((event) => event.id !== featured?.id);
  const isFiltered = Boolean(q || category || location || registration);

  return (
    <main className="mx-auto max-w-5xl px-4 pb-20">
      {/* Hero section */}
      <header className="border-b border-[var(--line)] py-10 sm:py-14">
        <h1 className="serif text-4xl leading-[1.1] sm:text-5xl md:text-6xl">
          স্কুল, কলেজ ও কমিউনিটির ইভেন্ট
        </h1>
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-[var(--muted)] sm:text-lg">
          বিজ্ঞান উৎসব, অলিম্পিয়াড, কনফারেন্স, কর্মশালা ও প্রতিযোগিতা। অনলাইনে সময়সূচি ও সেগমেন্ট দেখে রেজিস্ট্রেশন সম্পন্ন করুন এবং ডিজিটাল টিকিট সংগ্রহ করুন।
        </p>

        {/* Quick Category Chips */}
        <div className="mt-6 flex flex-wrap items-center gap-1.5 pt-2">
          <button
            type="button"
            onClick={() => setCategory("")}
            className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
              category === ""
                ? "bg-[var(--ink)] text-[var(--paper)]"
                : "border border-[var(--line)] bg-white text-[var(--ink)] hover:bg-[var(--paper)]"
            }`}
          >
            সব ইভেন্ট
          </button>
          {CATEGORIES.slice(0, 7).map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => setCategory(category === item.value ? "" : item.value)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                category === item.value
                  ? "bg-[var(--pine)] text-white"
                  : "border border-[var(--line)] bg-white text-[var(--ink)] hover:bg-[var(--paper)]"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Filters */}
        <form
          className="mt-6 rounded-2xl border border-[var(--line)] bg-white p-4 shadow-sm"
          onSubmit={(event) => event.preventDefault()}
        >
          <div className="grid items-end gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <FieldLabel label="ইভেন্ট সার্চ">
              <div className="relative">
                <input
                  className="field pr-9"
                  placeholder="ইভেন্টের নাম বা বিষয়..."
                  value={q}
                  onChange={(event) => setQ(event.target.value)}
                />
                <SearchIcon className="pointer-events-none absolute right-3 top-3.5 h-4 w-4 text-[var(--muted)]" />
              </div>
            </FieldLabel>
            <FieldLabel label="ক্যাটাগরি">
              <select
                className="field"
                value={category}
                onChange={(event) => setCategory(event.target.value)}
              >
                <option value="">সব ক্যাটাগরি</option>
                {CATEGORIES.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </FieldLabel>
            <FieldLabel label="লোকেশন">
              <select
                className="field"
                value={location}
                onChange={(event) => setLocation(event.target.value)}
              >
                <option value="">যেকোনো লোকেশন</option>
                <option value="physical">ফিজিক্যাল (মাঠ বা অডিটোরিয়াম)</option>
                <option value="online">অনলাইন</option>
                <option value="hybrid">হাইব্রিড</option>
              </select>
            </FieldLabel>
            <FieldLabel label="রেজিস্ট্রেশন">
              <select
                className="field"
                value={registration}
                onChange={(event) => setRegistration(event.target.value)}
              >
                <option value="">সব রেজিস্ট্রেশন</option>
                <option value="open">রেজিস্ট্রেশন চলছে</option>
                <option value="closed">রেজিস্ট্রেশন বন্ধ</option>
              </select>
            </FieldLabel>
          </div>

          {isFiltered && (
            <div className="mt-3 flex items-center justify-between border-t border-[var(--line)] pt-3 text-xs text-[var(--muted)]">
              <span>ফিল্টার সক্রিয়</span>
              <button
                type="button"
                onClick={() => {
                  setQ("");
                  setCategory("");
                  setLocation("");
                  setRegistration("");
                }}
                className="text-[var(--pine)] hover:underline"
              >
                সব ফিল্টার মুছুন
              </button>
            </div>
          )}
        </form>
      </header>

      {error && <p className="mt-6 text-sm text-red-700">{error}</p>}

      {/* Featured Event Spotlight */}
      {featured && (
        <section className="mt-8">
          <h2 className="serif text-2xl font-bold">নির্বাচিত ইভেন্ট</h2>
          <Link
            href={`/events/${featured.slug}`}
            className="card mt-3 grid overflow-hidden transition hover:shadow-md md:grid-cols-[1.1fr_1fr]"
          >
            {featured.cover_image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={mediaURL(featured.cover_image_url)}
                alt=""
                className="h-64 w-full object-cover md:h-full"
              />
            ) : (
              <div className="grid h-64 place-items-center bg-[var(--pine)]/15 text-[var(--pine)] md:h-full">
                <TicketIcon className="h-16 w-16" />
              </div>
            )}
            <div className="flex flex-col justify-between p-6 sm:p-8">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded bg-[var(--paper)] px-2.5 py-0.5 text-xs font-semibold text-[var(--pine)]">
                    {categoryLabel(featured.category)}
                  </span>
                  <span className="rounded bg-[var(--pine)]/10 px-2.5 py-0.5 text-xs font-medium text-[var(--pine)]">
                    {statusLabel(featured.status)}
                  </span>
                </div>
                <h2 className="serif mt-3 text-2xl font-bold leading-tight break-words sm:text-3xl">
                  {featured.title}
                </h2>
                {featured.summary && (
                  <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
                    {featured.summary}
                  </p>
                )}
              </div>

              <div className="mt-6 border-t border-[var(--line)] pt-4">
                <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-[var(--muted)]">
                  <div className="flex items-center gap-1.5">
                    <CalendarIcon className="h-4 w-4 text-[var(--pine)]" />
                    <span>{whenDay(featured.starts_at, featured.timezone)}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MapPinIcon className="h-4 w-4 text-[var(--pine)]" />
                    <span>{place(featured)}</span>
                  </div>
                  <div className="flex items-center gap-1.5 font-semibold text-[var(--ink)]">
                    <UsersIcon className="h-4 w-4 text-[var(--pine)]" />
                    <span>{(featured.registration_count || 0).toLocaleString("bn-BD")} জন রেজিস্টার্ড</span>
                  </div>
                </div>
              </div>
            </div>
          </Link>
        </section>
      )}

      {/* Event Grid */}
      {rest.length > 0 && (
        <section className="mt-12">
          <div className="flex items-center justify-between">
            <h2 className="serif text-2xl sm:text-3xl">
              {featured ? "অন্যান্য ইভেন্ট" : "সকল ইভেন্ট"}
            </h2>
            <span className="text-xs text-[var(--muted)]">
              {rest.length.toLocaleString("bn-BD")}টি ইভেন্ট পাওয়া গেছে
            </span>
          </div>
          <div className="mt-6 grid gap-6 sm:grid-cols-2">
            {rest.map((event) => (
              <EventTile key={event.id} event={event} />
            ))}
          </div>
        </section>
      )}

      {/* Empty State */}
      {loaded && events.length === 0 && (
        <div className="card mt-10 p-12 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[var(--pine)]/10 text-[var(--pine)]">
            <CalendarIcon className="h-6 w-6" />
          </div>
          <h3 className="serif mt-4 text-xl">এই ক্যাটাগরিতে কোনো ইভেন্ট পাওয়া যায়নি</h3>
          <p className="mt-1 text-sm text-[var(--muted)]">
            অনুগ্রহ করে অন্য শব্দ বা ভিন্ন ফিল্টার নির্বাচন করে পুনরায় অনুসন্ধান করুন।
          </p>
          <button
            type="button"
            onClick={() => {
              setQ("");
              setCategory("");
              setLocation("");
              setRegistration("");
            }}
            className="btn btn-ghost mt-4 !text-xs"
          >
            ফিল্টার রিসেট করুন
          </button>
        </div>
      )}
    </main>
  );
}

function EventTile({ event }: { event: EventCard }) {
  const dateParts = parseDateParts(event.starts_at);

  return (
    <Link
      href={`/events/${event.slug}`}
      className="card group flex flex-col overflow-hidden transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="relative aspect-[16/9] w-full overflow-hidden bg-[var(--pine)]/10">
        {event.cover_image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={mediaURL(event.cover_image_url)}
            alt=""
            className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
          />
        ) : (
          <div className="grid h-full w-full place-items-center text-[var(--pine)]">
            <TicketIcon className="h-12 w-12 opacity-40" />
          </div>
        )}

        {/* Date Stub Badge */}
        {dateParts && (
          <div className="absolute left-3 top-3 flex flex-col items-center rounded-lg border border-black/10 bg-white/95 px-2.5 py-1 shadow-sm backdrop-blur-sm">
            <span className="serif text-lg font-bold leading-none text-[var(--ink)]">
              {dateParts.day}
            </span>
            <span className="text-[10px] font-medium text-[var(--pine)]">
              {dateParts.month}
            </span>
          </div>
        )}

        {/* Category Pill */}
        <div className="absolute right-3 top-3">
          <span className="rounded-full bg-black/60 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur-sm">
            {categoryLabel(event.category)}
          </span>
        </div>
      </div>

      <div className="flex flex-1 flex-col justify-between p-5">
        <div>
          <span className="text-xs font-medium text-[var(--pine)]">
            {statusLabel(event.status)}
          </span>
          <h3 className="serif mt-1 text-xl font-bold leading-snug break-words group-hover:text-[var(--pine)]">
            {event.title}
          </h3>
          {event.summary && (
            <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-[var(--muted)]">
              {event.summary}
            </p>
          )}
        </div>

        <div className="mt-4 border-t border-[var(--line)] pt-3 text-xs text-[var(--muted)]">
          <div className="flex items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-1.5">
              <MapPinIcon className="h-3.5 w-3.5 shrink-0 text-[var(--pine)]" />
              <span className="truncate">{place(event)}</span>
            </div>
            <div className="flex shrink-0 items-center gap-1 font-semibold text-[var(--ink)]">
              <UsersIcon className="h-3.5 w-3.5 text-[var(--pine)]" />
              <span>{(event.registration_count || 0).toLocaleString("bn-BD")} জন</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
