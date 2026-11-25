"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { CalendarIcon, MapPinIcon, SearchIcon, UsersIcon } from "@/components/icons";
import { api, mediaURL } from "@/lib/api";
import { CATEGORIES, categoryLabel, money, num, place, registrationWindow, statusLabel, timeLeft, when } from "@/lib/format";
import type { EventCard } from "@/lib/types";

const TZ = "Asia/Dhaka";
const fmt = (options: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat("bn-BD", { timeZone: TZ, ...options });
const dayNum = fmt({ day: "numeric" });
const monthShort = fmt({ month: "short" });
const shortDate = fmt({ weekday: "short", day: "numeric", month: "short" });
const timeOfDay = fmt({ hour: "numeric", minute: "2-digit" });

/** One colour per slide: [base, darker edge, light accent for the status box and category]. */
const TONES: [string, string, string][] = [
  ["#0e6b56", "#073f33", "#9be8cc"],
  ["#a3620a", "#5f3905", "#ffd98a"],
  ["#1f4f8c", "#102c52", "#b3d2ff"],
  ["#7a2e66", "#45173a", "#f7b8e2"],
  ["#4f6420", "#2c3911", "#d8ec9a"],
  ["#0f6e7a", "#083f46", "#a3ebf2"],
];

const HEADLINE_WORDS = ["অলিম্পিয়াড", "বিজ্ঞান উৎসব", "বিতর্ক", "কর্মশালা", "হ্যাকাথন", "কুইজ"];

/** Upcoming means it has not ended yet (or has no date); everything else is past. */
function isUpcoming(event: EventCard, now: number) {
  if (event.status === "completed" || event.status === "cancelled") return false;
  const end = event.ends_at || event.starts_at;
  return !end || new Date(end).getTime() >= now;
}

function time(event: EventCard) {
  return event.starts_at ? new Date(event.starts_at).getTime() : Number.MAX_SAFE_INTEGER;
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

  const filtered = Boolean(q || category || openOnly);
  const { upcoming, past } = useMemo(() => {
    const now = Date.now();
    const rows = events || [];
    return {
      upcoming: rows.filter((event) => isUpcoming(event, now)).sort((a, b) => time(a) - time(b)),
      past: rows.filter((event) => !isUpcoming(event, now)).sort((a, b) => time(b) - time(a)).slice(0, 6),
    };
  }, [events]);
  // The slider walks through the next dated events, soonest first.
  const slides = upcoming.filter((event) => event.starts_at).slice(0, 6);

  function reset() {
    setInput("");
    setCategory("");
    setOpenOnly(false);
  }

  return (
    <main className="home-bg">
      <section className="px-4 pt-14 pb-6 sm:pt-20">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="serif text-[2.4rem] leading-[1.15] sm:text-[3.6rem] sm:leading-[1.12]">
            আপনার পরের
            <RotatingWord words={HEADLINE_WORDS} />
            এখানেই শুরু
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed muted">
            স্কুল, কলেজ আর ক্লাবের ইভেন্ট খুঁজুন। সেগমেন্ট বেছে রেজিস্ট্রেশন করুন, বিকাশ বা নগদে ফি দিন, টিকিট থাকবে ফোনে।
          </p>

          <form
            className="mx-auto mt-8 flex max-w-xl items-center gap-2 rounded-[0.9rem] border border-[var(--line-strong)] bg-white p-1.5 pl-4 text-left shadow-sm focus-within:border-[var(--pine)]"
            onSubmit={(event) => { event.preventDefault(); setQ(input.trim()); document.getElementById("events")?.scrollIntoView({ behavior: "smooth" }); }}
          >
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

          <div className="mt-4 flex flex-wrap justify-center gap-2" role="group" aria-label="ক্যাটাগরি">
            {CATEGORIES.slice(0, 8).map((item) => (
              <button
                key={item.value}
                type="button"
                aria-pressed={category === item.value}
                onClick={() => setCategory(category === item.value ? "" : item.value)}
                className={`rounded-full border px-3.5 py-1 text-sm font-semibold transition ${category === item.value ? "border-[var(--ink)] bg-[var(--ink)] text-white" : "border-[var(--line-strong)] bg-white text-[var(--ink-2)] hover:border-[var(--ink-2)]"}`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {!filtered && slides.length > 0 && <EventSlider events={slides} />}
      </section>

      <section id="events" className="mx-auto max-w-6xl scroll-mt-20 px-4 pt-10 pb-16">
        <div className="flex flex-wrap items-end justify-between gap-4">
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
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{[0, 1, 2].map((n) => <div key={n} className="skeleton h-80" />)}</div>
        ) : upcoming.length === 0 ? (
          <div className="py-16 text-center">
            <p className="serif text-2xl">{filtered ? "এই খোঁজে কোনো ইভেন্ট নেই" : "এই মুহূর্তে সামনে কোনো ইভেন্ট নেই"}</p>
            <p className="mt-2 muted">{filtered ? "অন্য শব্দ বা ক্যাটাগরি দিয়ে দেখুন।" : "নতুন ইভেন্ট এলে এখানে দেখাবে।"}</p>
            {filtered && <button type="button" className="btn btn-ghost mt-5" onClick={reset}>সব ইভেন্ট দেখুন</button>}
          </div>
        ) : (
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {upcoming.map((event) => <EventTile key={event.id} event={event} />)}
          </div>
        )}

        {past.length > 0 && !openOnly && (
          <div className="mt-16 border-t border-[var(--line)] pt-10">
            <h2 className="serif text-2xl">শেষ হওয়া ইভেন্ট</h2>
            <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {past.map((event) => (
                <Link key={event.id} href={`/events/${event.slug}`} className="group flex items-center gap-3 rounded-[var(--radius)] p-2 hover:bg-white">
                  <Banner event={event} className="aspect-[16/9] w-24 shrink-0 rounded-[var(--radius-sm)] opacity-85 group-hover:opacity-100" />
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

/** One word of the headline that slides to the next every few seconds. */
function RotatingWord({ words }: { words: string[] }) {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    const timer = window.setInterval(() => setIndex((value) => (value + 1) % words.length), 2600);
    return () => window.clearInterval(timer);
  }, [words.length]);
  return (
    <span className="relative my-1 block h-[1.3em] overflow-hidden" aria-live="polite">
      <span key={index} className="word-in block text-[var(--pine)]">{words[index]}</span>
    </span>
  );
}

/**
 * The event's own banner, shown whole: banners often carry their own text, so it is never cropped.
 * A banner of another shape sits on a soft neutral frame. With no banner (or one that fails to
 * load) a quiet placeholder shows the category.
 */
function Banner({ event, className = "", cover = false }: { event: EventCard; className?: string; cover?: boolean }) {
  const [failed, setFailed] = useState(false);
  if (event.cover_image_url && !failed) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={mediaURL(event.cover_image_url)} alt="" loading="lazy" onError={() => setFailed(true)} className={`${cover ? "object-cover" : "bg-[#efede7] object-contain"} ${className}`} />;
  }
  return (
    <div className={`grid place-items-center bg-[var(--pine-soft)] ${className}`}>
      <span className="serif px-3 text-center text-lg text-[var(--pine-deep)]/70">{categoryLabel(event.category) || "ইভেন্ট"}</span>
    </div>
  );
}

/** Registration state in a small box. On a coloured slide it takes that slide's accent colour. */
function StatusBox({ event, accent }: { event: EventCard; accent?: string }) {
  const state = registrationWindow(event);
  const left = timeLeft(event.registration_closes_at);
  const text = state === "open" ? `রেজিস্ট্রেশন চলছে${left ? ` · ${left}` : ""}` : state === "not_yet" ? "রেজিস্ট্রেশন শিগগির খুলবে" : state === "ended" ? "রেজিস্ট্রেশন শেষ" : statusLabel(event.status);
  const box = "inline-flex rounded-[0.45rem] px-2.5 py-1 text-[0.8rem] font-bold leading-tight";
  if (accent) {
    return state === "open"
      ? <span className={`${box} text-[var(--ink)]`} style={{ background: accent }}>{text}</span>
      : <span className={`${box} bg-white/15 text-white`}>{text}</span>;
  }
  const tone = state === "open" ? "bg-[var(--pine-soft)] text-[var(--pine-deep)]" : state === "not_yet" ? "bg-[var(--info-soft)] text-[var(--info)]" : state === "ended" ? "bg-[var(--warn-soft)] text-[var(--warn)]" : "bg-[var(--paper-2)] text-[var(--muted)]";
  return <span className={`${box} ${tone}`}>{text}</span>;
}

/** Event card: the full banner on top, the details underneath it. */
function EventTile({ event }: { event: EventCard }) {
  const start = event.starts_at ? new Date(event.starts_at) : null;
  return (
    <Link href={`/events/${event.slug}`} className="group flex flex-col overflow-hidden rounded-[var(--radius)] border border-[var(--line)] bg-white transition hover:-translate-y-0.5 hover:border-[var(--pine)]/40 hover:shadow-[var(--shadow)]">
      <div className="relative">
        <Banner event={event} className="aspect-[16/9] w-full" />
        {start && (
          <div className="absolute top-3 left-3 rounded-[0.6rem] bg-white px-2.5 py-1 text-center shadow-sm">
            <p className="text-lg font-bold leading-none">{dayNum.format(start)}</p>
            <p className="text-[0.7rem] font-semibold text-[var(--pine)]">{monthShort.format(start)}</p>
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col p-4">
        <div><StatusBox event={event} /></div>
        <h3 className="mt-2 line-clamp-2 text-lg font-bold leading-snug group-hover:text-[var(--pine-deep)]">{event.title}</h3>
        <p className="mt-0.5 text-sm muted">{[categoryLabel(event.category), event.organization_name].filter(Boolean).join(" · ")}</p>
        {event.summary && <p className="mt-2 line-clamp-2 text-sm text-[var(--ink-2)]">{event.summary}</p>}
        <div className="mt-auto pt-4">
          <ul className="space-y-1.5 border-t border-[var(--line)] pt-3 text-sm">
            <li className="flex items-center gap-2"><CalendarIcon className="h-4 w-4 shrink-0 muted" />{start ? `${shortDate.format(start)} · ${timeOfDay.format(start)}` : "তারিখ শিগগির"}</li>
            <li className="flex min-w-0 items-center gap-2"><MapPinIcon className="h-4 w-4 shrink-0 muted" /><span className="truncate">{place(event)}</span></li>
            <li className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-2"><UsersIcon className="h-4 w-4 shrink-0 muted" />{num(event.registration_count || 0)} জন{event.capacity ? ` / ${num(event.capacity)}` : ""}</span>
              <span className="font-semibold">{money(event.fee_amount, event.currency)}</span>
            </li>
          </ul>
        </div>
      </div>
    </Link>
  );
}

/**
 * The next few events, one at a time, sliding to the next every few seconds.
 * Hovering holds it; the dots jump to an event and the slide follows the direction.
 */
function EventSlider({ events }: { events: EventCard[] }) {
  // prev is the card sliding out while index slides in; back reverses the direction.
  const [slide, setSlide] = useState<{ index: number; prev: number | null; back: boolean; step: number }>({ index: 0, prev: null, back: false, step: 0 });
  const go = (next: number | ((value: number) => number)) =>
    setSlide((current) => {
      const target = typeof next === "function" ? next(current.index) : next;
      if (target === current.index) return current;
      // A lower index slides in from the left, except wrapping from the last back to the first.
      const back = target < current.index && !(current.index === events.length - 1 && target === 0);
      return { index: target, prev: current.index, back, step: current.step + 1 };
    });
  const [held, setHeld] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const tick = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(tick);
  }, []);
  useEffect(() => {
    if (held || events.length < 2) return;
    const timer = window.setInterval(() => go((value) => (value + 1) % events.length), 5000);
    return () => window.clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [held, events.length]);

  const { index, prev, back, step } = slide;

  return (
    <div className="mx-auto mt-12 max-w-4xl" onMouseEnter={() => setHeld(true)} onMouseLeave={() => setHeld(false)} onFocus={() => setHeld(true)} onBlur={() => setHeld(false)}>
      <div className="relative overflow-hidden rounded-[1.1rem] shadow-[0_22px_44px_-22px_rgba(0,0,0,0.5)]">
        {prev !== null && (
          <div key={`out-${step}`} className={`pointer-events-none absolute inset-0 ${back ? "slide-out-back" : "slide-out"}`} aria-hidden="true">
            <Slide event={events[prev % events.length]} tone={TONES[prev % TONES.length]} now={now} />
          </div>
        )}
        <div key={`in-${step}`} className={step === 0 ? "" : back ? "slide-in-back" : "slide-in"}>
          <Slide event={events[index % events.length]} tone={TONES[index % TONES.length]} now={now} link />
        </div>
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
              onClick={() => go(i)}
              className={`h-1.5 rounded-full transition-all ${i === index ? "w-6" : "w-1.5 bg-[var(--ink)]/20 hover:bg-[var(--ink)]/40"}`}
              style={i === index ? { background: TONES[i % TONES.length][0] } : undefined}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/** One slide: the banner on the left, the details and a countdown in the event's colour on the right. */
function Slide({ event, tone, now, link = false }: { event: EventCard; tone: [string, string, string]; now: number; link?: boolean }) {
  const [base, edge, accent] = tone;
  const start = event.starts_at ? new Date(event.starts_at) : null;
  const left = start ? Math.max(0, start.getTime() - now) : 0;
  const parts = [
    [Math.floor(left / 86400000), "দিন"],
    [Math.floor(left / 3600000) % 24, "ঘণ্টা"],
    [Math.floor(left / 60000) % 60, "মিনিট"],
    [Math.floor(left / 1000) % 60, "সেকেন্ড"],
  ] as const;
  const body = (
    <div className="grid h-full text-left text-white md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]" style={{ background: `linear-gradient(135deg, ${base} 0%, ${edge} 100%)` }}>
      <Banner event={event} cover className="aspect-[16/9] h-full w-full md:aspect-auto md:min-h-[16rem]" />
      <div className="flex flex-col p-5 sm:p-6">
        <p className="text-sm font-semibold" style={{ color: accent }}>{[categoryLabel(event.category), event.organization_name].filter(Boolean).join(" · ")}</p>
        <h2 className="serif mt-1 text-2xl leading-snug break-words">{event.title}</h2>
        <p className="mt-1 text-sm text-white/75">{[when(event.starts_at, event.timezone), place(event)].join(" · ")}</p>
        <div className="mt-3"><StatusBox event={event} accent={accent} /></div>
        <div className="mt-auto pt-5">
          <div className="border-t border-white/20 pt-4">
          {left > 0 ? (
            <>
              <p className="text-xs text-white/65">শুরু হতে বাকি</p>
              <p className="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-1" aria-live="off">
                {parts.map(([value, label], i) => (
                  // Days always show; the smaller units drop once there is a day or more to go on small screens.
                  <span key={label} className={`whitespace-nowrap ${i === 3 ? "hidden sm:inline" : ""}`}>
                    <span className="serif text-3xl tabular-nums">{i === 0 ? num(value) : num(value).padStart(2, "০")}</span>
                    <span className="ml-1 text-sm text-white/70">{label}</span>
                  </span>
                ))}
              </p>
            </>
          ) : <p className="serif text-2xl">এখন চলছে</p>}
          </div>
        </div>
      </div>
    </div>
  );
  return link ? <Link href={`/events/${event.slug}`} className="block h-full">{body}</Link> : body;
}
