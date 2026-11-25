"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { MapPinIcon, SearchIcon, TicketIcon } from "@/components/icons";
import { api, mediaURL } from "@/lib/api";
import { CATEGORIES, categoryLabel, num, place, registrationWindow, statusLabel, timeLeft, when } from "@/lib/format";
import type { EventCard } from "@/lib/types";

const TZ = "Asia/Dhaka";
const fmt = (options: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat("bn-BD", { timeZone: TZ, ...options });
const dayNum = fmt({ day: "numeric" });
const weekday = fmt({ weekday: "short" });
const monthShort = fmt({ month: "short" });
const monthYear = fmt({ month: "long", year: "numeric" });
const timeOfDay = fmt({ hour: "numeric", minute: "2-digit" });

/** Upcoming means it has not ended yet (or has no date); everything else is past. */
function isUpcoming(event: EventCard, now: number) {
  if (event.status === "completed" || event.status === "cancelled") return false;
  const end = event.ends_at || event.starts_at;
  return !end || new Date(end).getTime() >= now;
}

export default function DiscoverPage() {
  const [events, setEvents] = useState<EventCard[] | null>(null);
  const [input, setInput] = useState("");
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("");
  const [openOnly, setOpenOnly] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => setQ(input.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [input]);

  useEffect(() => {
    const params = new URLSearchParams({ limit: "48" });
    if (q) params.set("q", q);
    if (category) params.set("category", category);
    if (openOnly) params.set("registration", "open");
    let stale = false;
    setEvents(null);
    api
      .events(`?${params}`)
      .then((data) => !stale && setEvents(data.events || []))
      .catch((err: Error) => !stale && (setError(err.message), setEvents([])));
    return () => {
      stale = true;
    };
  }, [q, category, openOnly]);

  const now = Date.now();
  const filtered = Boolean(q || category || openOnly);
  const upcoming = useMemo(
    () => (events || []).filter((event) => isUpcoming(event, now)).sort((a, b) => time(a) - time(b)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [events],
  );
  const past = useMemo(
    () => (events || []).filter((event) => !isUpcoming(event, now)).sort((a, b) => time(b) - time(a)).slice(0, 6),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [events],
  );
  const months = groupByMonth(upcoming);
  // The flip board walks through the next events that have a date, soonest first.
  const flips = upcoming.filter((event) => event.starts_at).slice(0, 6);
  // The poster rail shows what is coming up first; open registrations lead.
  const rail = [...upcoming].sort((a, b) => Number(registrationWindow(b) === "open") - Number(registrationWindow(a) === "open") || time(a) - time(b)).slice(0, 10);

  function reset() {
    setInput("");
    setCategory("");
    setOpenOnly(false);
  }

  return (
    <main className="home-bg pb-0">
      <section className="px-4 pt-16 pb-10 sm:pt-24">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="serif text-[2.5rem] leading-[1.15] text-[var(--ink)] sm:text-6xl sm:leading-[1.12]">
            আপনার পরের
            <RotatingWord words={HEADLINE_WORDS} />
            এখানেই শুরু
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed muted">
            সেগমেন্ট বেছে রেজিস্ট্রেশন করুন, বিকাশ বা নগদে ফি দিন। টিকিটের কিউআর থাকবে আপনার ফোনে।
          </p>

          <form className="mx-auto mt-9 flex max-w-xl items-center gap-2 rounded-[1rem] border border-[var(--line-strong)] bg-white/85 p-1.5 pl-4 text-left shadow-[var(--shadow)] backdrop-blur focus-within:border-[var(--pine)]" onSubmit={(event) => { event.preventDefault(); setQ(input.trim()); document.getElementById("programmes")?.scrollIntoView({ behavior: "smooth" }); }}>
            <SearchIcon className="h-5 w-5 shrink-0 muted" />
            <input
              className="min-w-0 flex-1 bg-transparent py-2.5 text-base outline-none placeholder:text-[#9a948a]"
              placeholder="ইভেন্ট, বিষয় বা প্রতিষ্ঠানের নাম"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              aria-label="ইভেন্ট খুঁজুন"
            />
            <button className="btn btn-primary shrink-0">খুঁজুন</button>
          </form>

          <div className="mt-5 flex flex-wrap justify-center gap-2" role="group" aria-label="ক্যাটাগরি">
            {CATEGORIES.slice(0, 8).map((item) => (
              <button
                key={item.value}
                type="button"
                aria-pressed={category === item.value}
                onClick={() => setCategory(category === item.value ? "" : item.value)}
                className={`rounded-full border px-3.5 py-1 text-sm font-semibold transition ${category === item.value ? "border-[var(--pine)] bg-[var(--pine)] text-white" : "border-[var(--line-strong)] bg-white/60 text-[var(--ink-2)] hover:border-[var(--pine)] hover:text-[var(--pine-deep)]"}`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {!filtered && flips.length > 0 && <FlipBoard events={flips} />}
      </section>

      {rail.length > 0 && (
        <section className="pb-4" aria-label="প্রোগ্রাম">
          <div className="mx-auto max-w-6xl px-4">
            <div className="mb-4 flex items-end justify-between">
              <h2 className="serif text-2xl sm:text-3xl">প্রোগ্রাম</h2>
              <a href="#programmes" className="text-sm font-semibold text-[var(--pine)]">পুরো সূচি ↓</a>
            </div>
          </div>
          <div className="rail mx-auto flex max-w-6xl gap-4 overflow-x-auto px-4 pb-4">
            {rail.map((event, index) => <Poster key={event.id} event={event} index={index} />)}
          </div>
        </section>
      )}

      <section id="programmes" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-12">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[var(--line)] pb-4">
          <div>
            <h2 className="serif text-3xl">{filtered ? "খোঁজের ফল" : "সামনের ইভেন্ট"}</h2>
            <p className="mt-1 text-sm muted">
              {events === null ? "খোঁজা হচ্ছে…" : `${num(upcoming.length)}টি ইভেন্ট`}
              {category && ` · ${categoryLabel(category)}`}
              {q && ` · “${q}”`}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {filtered && <button type="button" className="text-sm font-semibold text-[var(--pine)]" onClick={reset}>সব দেখুন</button>}
            <div className="segmented" role="group" aria-label="রেজিস্ট্রেশন">
              <button type="button" aria-pressed={!openOnly} onClick={() => setOpenOnly(false)}>সব</button>
              <button type="button" aria-pressed={openOnly} onClick={() => setOpenOnly(true)}>রেজিস্ট্রেশন চলছে</button>
            </div>
          </div>
        </div>

        {error && <p className="notice notice-error mt-6">{error}</p>}

        {events === null ? (
          <div className="mt-6 space-y-3">{[0, 1, 2].map((n) => <div key={n} className="skeleton h-28" />)}</div>
        ) : upcoming.length === 0 ? (
          <div className="py-16 text-center">
            <p className="serif text-2xl">{filtered ? "এই খোঁজে কোনো ইভেন্ট নেই" : "এই মুহূর্তে সামনে কোনো ইভেন্ট নেই"}</p>
            <p className="mt-2 muted">{filtered ? "অন্য শব্দ বা ক্যাটাগরি দিয়ে দেখুন।" : "নতুন ইভেন্ট এলে এখানে দেখাবে।"}</p>
            {filtered && <button type="button" className="btn btn-ghost mt-5" onClick={reset}>সব ইভেন্ট দেখুন</button>}
          </div>
        ) : (
          months.map(([label, rows]) => (
            <div key={label} className="mt-10 first:mt-8">
              <h3 className="mb-3 text-sm font-bold text-[var(--pine)]">{label}</h3>
              <ul className="divide-y divide-[var(--line)] border-y border-[var(--line)]">
                {rows.map((event) => <EventRow key={event.id} event={event} />)}
              </ul>
            </div>
          ))
        )}

        {past.length > 0 && !openOnly && (
          <div className="mt-16">
            <h2 className="serif text-2xl">শেষ হওয়া ইভেন্ট</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {past.map((event) => (
                <Link key={event.id} href={`/events/${event.slug}`} className="group flex items-center gap-3 rounded-[var(--radius)] p-2 hover:bg-white">
                  <Thumb event={event} className="h-14 w-20 opacity-80 grayscale-[40%] group-hover:opacity-100 group-hover:grayscale-0" />
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{event.title}</p>
                    <p className="text-sm muted">{event.starts_at ? fmt({ day: "numeric", month: "short", year: "numeric" }).format(new Date(event.starts_at)) : statusLabel(event.status)}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </section>

    </main>
  );
}

function time(event: EventCard) {
  return event.starts_at ? new Date(event.starts_at).getTime() : Number.MAX_SAFE_INTEGER;
}

function groupByMonth(rows: EventCard[]): [string, EventCard[]][] {
  const groups = new Map<string, EventCard[]>();
  for (const event of rows) {
    const label = event.starts_at ? monthYear.format(new Date(event.starts_at)) : "তারিখ শিগগির জানানো হবে";
    groups.set(label, [...(groups.get(label) || []), event]);
  }
  return [...groups.entries()];
}

function RegistrationLine({ event }: { event: EventCard }) {
  const state = registrationWindow(event);
  if (state === "open") {
    const left = timeLeft(event.registration_closes_at);
    return <span className="font-semibold text-[var(--pine)]">রেজিস্ট্রেশন চলছে{left ? ` · ${left}` : ""}</span>;
  }
  if (state === "not_yet") return <span className="font-semibold text-[var(--info)]">রেজিস্ট্রেশন শিগগির খুলবে</span>;
  if (state === "ended") return <span className="muted">রেজিস্ট্রেশন শেষ</span>;
  return <span className="muted">{statusLabel(event.status)}</span>;
}

function EventRow({ event }: { event: EventCard }) {
  const start = event.starts_at ? new Date(event.starts_at) : null;
  return (
    <li>
      <Link href={`/events/${event.slug}`} className="group grid grid-cols-[3.5rem_minmax(0,1fr)] items-center gap-4 py-5 sm:grid-cols-[4.5rem_minmax(0,1fr)_9rem] sm:gap-6">
        <div className="text-center">
          {start ? (
            <>
              <p className="text-xs font-semibold muted">{weekday.format(start)}</p>
              <p className="serif text-3xl leading-none sm:text-4xl">{dayNum.format(start)}</p>
              <p className="mt-1 text-xs font-semibold text-[var(--pine)]">{monthShort.format(start)}</p>
            </>
          ) : <p className="text-xs font-semibold muted">শিগগির</p>}
        </div>
        <div className="min-w-0">
          <p className="text-xs font-semibold muted">{[categoryLabel(event.category), event.organization_name].filter(Boolean).join(" · ")}</p>
          <h4 className="mt-0.5 text-lg font-bold leading-snug break-words group-hover:text-[var(--pine)] sm:text-xl">{event.title}</h4>
          {event.summary && <p className="mt-1 line-clamp-1 text-sm muted">{event.summary}</p>}
          <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
            {start && <span>{timeOfDay.format(start)}</span>}
            <span className="inline-flex items-center gap-1 muted"><MapPinIcon className="h-3.5 w-3.5" />{place(event)}</span>
            <RegistrationLine event={event} />
          </p>
        </div>
        <Thumb event={event} className="hidden aspect-[4/3] w-full sm:block" />
      </Link>
    </li>
  );
}

function Thumb({ event, className = "" }: { event: EventCard; className?: string }) {
  const [failed, setFailed] = useState(false);
  if (event.cover_image_url && !failed) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={mediaURL(event.cover_image_url)} alt="" loading="lazy" onError={() => setFailed(true)} className={`shrink-0 rounded-[var(--radius-sm)] object-cover transition ${className}`} />;
  }
  return (
    <div className={`grid shrink-0 place-items-center rounded-[var(--radius-sm)] bg-[var(--paper-2)] text-[var(--pine)] ${className}`}>
      <TicketIcon className="h-6 w-6 opacity-50" />
    </div>
  );
}

/** Deep tones for posters and the flip board: [base, darker edge, light accent]. */
const TONES: [string, string, string][] = [
  ["#0e6b56", "#063d31", "#7fe0bf"],
  ["#a3620a", "#5c3604", "#ffd27a"],
  ["#1f4f8c", "#0f2a4f", "#9cc4ff"],
  ["#7a2e66", "#431637", "#f5a6dc"],
  ["#4f6420", "#2a370f", "#cfe68a"],
  ["#0f6e7a", "#073d45", "#8fe3ec"],
];

const HEADLINE_WORDS = ["অলিম্পিয়াড", "বিজ্ঞান উৎসব", "বিতর্ক", "কর্মশালা", "হ্যাকাথন", "কুইজ"];

/** One word of the headline that slides to the next every few seconds. */
function RotatingWord({ words }: { words: string[] }) {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    const timer = window.setInterval(() => setIndex((value) => (value + 1) % words.length), 2600);
    return () => window.clearInterval(timer);
  }, [words.length]);
  return (
    <span className="relative mx-auto my-1 block h-[1.3em] overflow-hidden" aria-live="polite">
      <span key={index} className="word-in block text-[var(--pine)]">{words[index]}</span>
    </span>
  );
}

/**
 * A board that flips to the next upcoming event every few seconds, with a live countdown.
 * Hovering or focusing it holds the current event; the dots jump to one.
 */
function FlipBoard({ events }: { events: EventCard[] }) {
  const [index, setIndex] = useState(0);
  const [held, setHeld] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const tick = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(tick);
  }, []);
  useEffect(() => {
    if (held || events.length < 2) return;
    const timer = window.setInterval(() => setIndex((value) => (value + 1) % events.length), 4500);
    return () => window.clearInterval(timer);
  }, [held, events.length]);

  const event = events[index % events.length];
  const [base, edge, accent] = TONES[index % TONES.length];
  const state = registrationWindow(event);
  const closes = timeLeft(event.registration_closes_at);
  const start = event.starts_at ? new Date(event.starts_at) : null;
  const left = start ? Math.max(0, start.getTime() - now) : 0;
  const parts = [
    [Math.floor(left / 86400000), "দিন"],
    [Math.floor(left / 3600000) % 24, "ঘণ্টা"],
    [Math.floor(left / 60000) % 60, "মিনিট"],
    [Math.floor(left / 1000) % 60, "সেকেন্ড"],
  ] as const;

  return (
    <div className="mx-auto mt-12 max-w-2xl" onMouseEnter={() => setHeld(true)} onMouseLeave={() => setHeld(false)} onFocus={() => setHeld(true)} onBlur={() => setHeld(false)}>
      <div className="[perspective:1200px]">
        <Link
          key={event.id}
          href={`/events/${event.slug}`}
          className="flip-in relative block overflow-hidden rounded-[1.25rem] p-5 text-left text-white shadow-[0_24px_48px_-24px_rgba(0,0,0,0.55)] sm:p-6"
          style={{ background: `radial-gradient(26rem 14rem at 100% 0%, ${accent}40, transparent 70%), linear-gradient(135deg, ${base} 0%, ${edge} 100%)` }}
        >
          <div className="grid items-center gap-5 sm:grid-cols-[minmax(0,1fr)_auto]">
            <div className="min-w-0">
              <p className="text-sm font-semibold" style={{ color: accent }}>{[categoryLabel(event.category), event.organization_name].filter(Boolean).join(" · ")}</p>
              <h2 className="serif mt-1 text-2xl leading-snug break-words sm:text-3xl">{event.title}</h2>
              <p className="mt-1 text-sm text-white/70">{[when(event.starts_at, event.timezone), place(event)].join(" · ")}</p>
              {state === "open" && <p className="mt-3 inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold text-[var(--ink)]" style={{ background: accent }}>রেজিস্ট্রেশন চলছে{closes ? ` · ${closes}` : ""}</p>}
              {state === "not_yet" && <p className="mt-3 text-sm font-semibold text-white/85">রেজিস্ট্রেশন শিগগির খুলবে</p>}
            </div>
            {left > 0 ? (
              <div className="grid grid-cols-4 gap-1.5" aria-label="শুরু হতে বাকি">
                {parts.map(([value, label]) => (
                  <div key={label} className="min-w-[3.6rem] rounded-[0.7rem] bg-black/25 px-1 py-2.5 text-center ring-1 ring-white/10">
                    <p className="text-2xl font-bold leading-none tabular-nums">{num(value).padStart(2, "০")}</p>
                    <p className="mt-1 text-[0.68rem] text-white/65">{label}</p>
                  </div>
                ))}
              </div>
            ) : <p className="rounded-[0.7rem] bg-black/25 px-4 py-3 text-center font-bold">এখন চলছে</p>}
          </div>
        </Link>
      </div>
      {events.length > 1 && (
        <div className="mt-4 flex justify-center gap-1.5" role="tablist" aria-label="ইভেন্ট">
          {events.map((item, i) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={i === index}
              aria-label={item.title}
              onClick={() => setIndex(i)}
              className={`h-1.5 rounded-full transition-all ${i === index ? "w-6" : "w-1.5 bg-[var(--ink)]/20 hover:bg-[var(--ink)]/40"}`}
              style={i === index ? { background: TONES[i % TONES.length][0] } : undefined}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/** A programme as a tall poster: cover with a dark fade, date on top, title and status at the bottom. */
function Poster({ event, index }: { event: EventCard; index: number }) {
  const [failed, setFailed] = useState(false);
  const start = event.starts_at ? new Date(event.starts_at) : null;
  const state = registrationWindow(event);
  const left = timeLeft(event.registration_closes_at);
  // Posters without a cover get a deep tone from the palette, so the rail never looks empty.
  return (
    <Link
      href={`/events/${event.slug}`}
      className="group relative flex aspect-[3/4] w-[15.5rem] shrink-0 flex-col justify-between overflow-hidden rounded-[1.25rem] p-4 text-white shadow-[0_14px_24px_-14px_rgba(0,0,0,0.55)] ring-1 ring-white/10 sm:w-[17rem]"
      style={{ background: TONES[index % TONES.length][0] }}
    >
      {event.cover_image_url && !failed && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={mediaURL(event.cover_image_url)} alt="" onError={() => setFailed(true)} className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/10" aria-hidden="true" />
      <div className="relative flex items-start justify-between gap-2">
        {start ? (
          <div className="rounded-[0.8rem] bg-white px-3 py-1.5 text-center text-[var(--ink)]">
            <p className="serif text-2xl leading-none">{dayNum.format(start)}</p>
            <p className="text-[0.7rem] font-bold text-[var(--pine)]">{monthShort.format(start)}</p>
          </div>
        ) : <span />}
        <span className="rounded-full bg-black/40 px-2.5 py-1 text-xs font-semibold backdrop-blur">{categoryLabel(event.category)}</span>
      </div>
      <div className="relative">
        {state === "open" && <p className="mb-2 inline-flex rounded-full bg-[var(--gold)] px-2.5 py-0.5 text-xs font-bold text-[var(--ink)]">রেজিস্ট্রেশন চলছে{left ? ` · ${left}` : ""}</p>}
        <h3 className="serif text-xl leading-snug break-words">{event.title}</h3>
        <p className="mt-1 line-clamp-1 text-sm text-white/70">{event.organization_name || place(event)}</p>
      </div>
    </Link>
  );
}
