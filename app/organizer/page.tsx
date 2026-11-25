"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AloionMark } from "@/components/aloion-mark";
import {
  AwardIcon,
  CheckCircleIcon,
  GiftIcon,
  HelpCircleIcon,
  LayersIcon,
  MapPinIcon,
  PlusIcon,
  QrCodeIcon,
  ShieldCheckIcon,
  SparklesIcon,
  TicketIcon,
  UsersIcon,
  UtensilsIcon,
} from "@/components/icons";
import { api, mediaURL } from "@/lib/api";
import { num, personName, place, registrationWindow, timeLeft, whenDay } from "@/lib/format";
import { EmptyState, PageLoading, Stat, StatusBadge } from "@/components/ui";
import { useSession } from "@/lib/session";
import type { EventCard } from "@/lib/types";

export default function OrganizerHome() {
  const { user, loading, login } = useSession();
  const [events, setEvents] = useState<EventCard[] | null>(null);
  const [filter, setFilter] = useState<"all" | "live" | "draft" | "past">("all");

  useEffect(() => {
    if (!user) return;
    api.managed().then((data) => setEvents(data.events || [])).catch(() => setEvents([]));
  }, [user]);

  if (loading) return <PageLoading />;
  if (!user) return <OrganizerLanding onLogin={() => login(`${window.location.origin}/organizer`)} />;

  const rows = events || [];
  const live = (e: EventCard) => ["published", "registration_open", "registration_closed", "ongoing"].includes(e.status);
  const draft = (e: EventCard) => ["draft", "submitted", "approved", "rejected"].includes(e.status);
  const past = (e: EventCard) => ["completed", "cancelled"].includes(e.status);
  const shown = rows.filter((e) => filter === "all" || (filter === "live" ? live(e) : filter === "draft" ? draft(e) : past(e)));
  const totalRegistrations = rows.reduce((sum, e) => sum + (e.registration_count || 0), 0);
  const openNow = rows.filter((e) => registrationWindow(e) === "open").length;

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-[var(--pine)]">অর্গানাইজার</p>
          <h1 className="serif text-3xl sm:text-4xl">আপনার ইভেন্ট</h1>
          <p className="mt-1 text-sm muted">{personName(user)}{user.school_name ? ` · ${user.school_name}` : ""}</p>
        </div>
        <Link href="/organizer/events/new" className="btn btn-primary btn-lg"><PlusIcon className="h-4 w-4" />নতুন ইভেন্ট</Link>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Stat label="মোট ইভেন্ট" value={num(rows.length)} />
        <Stat label="মোট রেজিস্ট্রেশন" value={num(totalRegistrations)} tone="green" />
        <div className="col-span-2 sm:col-span-1"><Stat label="এখন রেজিস্ট্রেশন চলছে" value={num(openNow)} /></div>
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
        <div className="segmented" role="group" aria-label="ফিল্টার">
          {([["all", "সব"], ["live", "চলমান"], ["draft", "ড্রাফট ও রিভিউ"], ["past", "শেষ"]] as const).map(([key, label]) => (
            <button key={key} aria-pressed={filter === key} onClick={() => setFilter(key)}>{label}</button>
          ))}
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {events === null && [0, 1, 2].map((n) => <div key={n} className="skeleton h-28" />)}
        {events !== null && rows.length === 0 && (
          <EmptyState
            icon={<TicketIcon className="h-6 w-6" />}
            title="এখনো কোনো ইভেন্ট তৈরি করেননি"
            body="আপনার স্কুল, কলেজ, বিশ্ববিদ্যালয় বা ক্লাবের প্রথম ইভেন্টটি যোগ করে রেজিস্ট্রেশন, সেগমেন্ট ও কিউআর চেক-ইন শুরু করুন।"
            action={<Link href="/organizer/events/new" className="btn btn-primary"><PlusIcon className="h-4 w-4" />প্রথম ইভেন্ট তৈরি করুন</Link>}
          />
        )}
        {events !== null && rows.length > 0 && shown.length === 0 && <p className="py-8 text-center text-sm muted">এই ফিল্টারে কোনো ইভেন্ট নেই।</p>}
        {shown.map((event) => {
          const state = registrationWindow(event);
          return (
            <article key={event.id} className="card flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
              <Link href={`/organizer/events/${event.id}`} className="flex min-w-0 flex-1 items-center gap-4">
                {event.cover_image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={mediaURL(event.cover_image_url)} alt="" className="hidden h-20 w-28 shrink-0 rounded-[var(--radius-sm)] object-cover sm:block" />
                ) : (
                  <div className="hidden h-20 w-28 shrink-0 place-items-center rounded-[var(--radius-sm)] bg-[var(--pine-soft)] text-[var(--pine)] sm:grid"><TicketIcon className="h-8 w-8" /></div>
                )}
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge status={event.status} />
                    {state === "open" && event.registration_closes_at && <span className="badge badge-plain badge-gold">শেষ {whenDay(event.registration_closes_at, event.timezone)} · {timeLeft(event.registration_closes_at)}</span>}
                    {state === "ended" && <span className="badge badge-plain badge-amber">শেষ তারিখ পার হয়েছে</span>}
                  </div>
                  <h2 className="mt-1 text-lg font-bold break-words hover:text-[var(--pine)]">{event.title}</h2>
                  <p className="text-sm muted">{[whenDay(event.starts_at, event.timezone), place(event), `${num(event.registration_count || 0)} জন রেজিস্টার্ড`].join(" · ")}</p>
                </div>
              </Link>
              <div className="flex shrink-0 gap-2 border-t border-[var(--line)] pt-3 sm:border-0 sm:pt-0">
                <Link href={`/organizer/events/${event.id}/registrations`} className="btn btn-ghost btn-sm"><UsersIcon className="h-4 w-4" />রেজিস্ট্রেশন</Link>
                <Link href={`/organizer/events/${event.id}/check-in`} className="btn btn-ghost btn-sm"><QrCodeIcon className="h-4 w-4" />চেক-ইন</Link>
                <Link href={`/organizer/events/${event.id}`} className="btn btn-primary btn-sm">ডেস্ক</Link>
              </div>
            </article>
          );
        })}
      </div>
    </main>
  );
}

function OrganizerLanding({ onLogin }: { onLogin: () => void }) {
  return (
    <main className="pb-16">
      {/* Hero Section */}
      <section className="border-b border-[var(--line)] bg-[var(--paper-2)] py-14 sm:py-20">
        <div className="mx-auto max-w-5xl px-4">
          <div className="max-w-3xl">
            <h1 className="serif text-4xl leading-[1.1] sm:text-5xl md:text-6xl">
              স্কুল, কলেজ ও ক্লাবের ইভেন্ট হোস্ট করুন পেশাদারদের মতো
            </h1>
            <p className="mt-4 text-base leading-relaxed text-[var(--muted)] sm:text-lg">
              বিজ্ঞান উৎসব, অলিম্পিয়াড, আইটি কার্নিভাল, বিতর্ক কিংবা কর্মশালা: অংশগ্রহণকারীদের রেজিস্ট্রেশন ফর্ম, সেগমেন্ট নির্বাচন, বিকাশ ও নগদ ফি গ্রহণ, গেট কিউআর চেক-ইন ও ডিজিটাল সার্টিফিকেট, সব এক প্ল্যাটফর্মে।
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <button onClick={onLogin} className="btn btn-primary !px-6 !py-3 text-base">
                <AloionMark className="h-5 w-5" />
                আলোআয়ন অ্যাকাউন্ট দিয়ে শুরু করুন
              </button>
              <a href="#features" className="btn btn-ghost !px-5 !py-3 text-sm">
                ফিচারসমূহ দেখুন
              </a>
            </div>
          </div>

          {/* Desk Preview */}
          <div className="mt-12 overflow-hidden rounded-2xl border border-[var(--line)] bg-white shadow-sm">
            {/*<div className="border-b border-[var(--line)] bg-[var(--paper)] px-5 py-3 text-xs font-semibold text-[var(--muted)]">
              ইভেন্ট ম্যানেজমেন্ট ডেস্ক ওভারভিউ
            </div>*/}
            <div className="grid gap-6 p-6 md:grid-cols-3">
              <div className="rounded-xl border border-[var(--line)] bg-[var(--paper)]/50 p-4">
                <p className="text-xs text-[var(--muted)]">মোট অংশগ্রহণকারী</p>
                <p className="serif mt-1 text-3xl font-bold">৪৮৬ জন</p>
                <div className="mt-3 flex items-center justify-between text-xs text-[var(--muted)]">
                  <span>চেক-ইন সম্পন্ন: ৪১২ জন</span>
                  <span className="font-semibold text-emerald-700">৮৫%</span>
                </div>
                <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-black/10">
                  <div className="h-full w-[85%] bg-[var(--pine)]"></div>
                </div>
              </div>
              <div className="rounded-xl border border-[var(--line)] bg-[var(--paper)]/50 p-4">
                <p className="text-xs text-[var(--muted)]">সেগমেন্ট ও রাউন্ড</p>
                <p className="serif mt-1 text-3xl font-bold">৬টি সেগমেন্ট</p>
                <p className="mt-3 text-xs text-[var(--muted)]">
                  গণিত অলিম্পিয়াড, প্রজেক্ট ডিসপ্লে, রোবটিক্স, কুইজ
                </p>
              </div>
              <div className="rounded-xl border border-[var(--line)] bg-[var(--paper)]/50 p-4">
                <p className="text-xs text-[var(--muted)]">গেট কিউআর স্ক্যানার</p>
                <div className="mt-2 flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--pine)] text-white">
                    <QrCodeIcon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold">মোবাইল ক্যামেরা রেডি</p>
                    <p className="text-xs text-[var(--muted)]">এক সেকেন্ডে ভেরিফিকেশন</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Features Grid */}
      <section id="features" className="mx-auto max-w-5xl px-4 py-16">
        <div className="text-center">
          <h2 className="serif text-3xl sm:text-4xl">ইভেন্ট আয়োজকদের প্রয়োজনীয় সবকিছু</h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-[var(--muted)]">
            খাতা-কলমে নাম তোলা বা এক্সেল শিটের ঝামেলা দূর করে আধুনিক অনলাইন সমাধান।
          </p>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <div className="card p-6">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--pine)]/10 text-[var(--pine)]">
              <TicketIcon className="h-6 w-6" />
            </div>
            <h3 className="serif mt-4 text-xl font-bold">কাস্টম ফর্ম ও টিকিট</h3>
            <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
              অংশগ্রহণকারীদের নাম, শ্রেণি, প্রতিষ্ঠান বা টি-শার্টের সাইজ সংগ্রহের জন্য নিজস্ব প্রশ্নমালা ও ফর্ম সেট করুন।
            </p>
          </div>

          <div className="card p-6">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--pine)]/10 text-[var(--pine)]">
              <LayersIcon className="h-6 w-6" />
            </div>
            <h3 className="serif mt-4 text-xl font-bold">মাল্টি-সেগমেন্ট ও অলিম্পিয়াড</h3>
            <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
              একই উৎসবে একাধিক প্রতিযোগিতা পরিচালনা করুন: প্রতিটি সেগমেন্টের জন্য আলাদা ফি, ধারণক্ষমতা ও সময়সূচি।
            </p>
          </div>

          <div className="card p-6">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--pine)]/10 text-[var(--pine)]">
              <QrCodeIcon className="h-6 w-6" />
            </div>
            <h3 className="serif mt-4 text-xl font-bold">লাইভ কিউআর চেক-ইন</h3>
            <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
              মোবাইলের ক্যামেরা বা বারকোড স্ক্যানার দিয়ে প্রবেশমুখে ডিজিটাল টিকিট স্ক্যান করে চোখের পলকে চেক-ইন করুন।
            </p>
          </div>

          <div className="card p-6">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--pine)]/10 text-[var(--pine)]">
              <UtensilsIcon className="h-6 w-6" />
            </div>
            <h3 className="serif mt-4 text-xl font-bold">খাবার ও লাঞ্চ ট্র্যাকিং</h3>
            <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
              একই ব্যক্তি একাধিকবার খাবার বা গিফট নিচ্ছে কি না, তা কিউআর স্ক্যানের মাধ্যমে তাত্ক্ষণিকভাবে যাচাই করুন।
            </p>
          </div>

          <div className="card p-6">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--pine)]/10 text-[var(--pine)]">
              <AwardIcon className="h-6 w-6" />
            </div>
            <h3 className="serif mt-4 text-xl font-bold">ভেরিফাইড ডিজিটাল সার্টিফিকেট</h3>
            <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
              অংশগ্রহণকারী ও বিজয়ীদের জন্য পাবলিক কিউআর কোড সংবলিত ডিজিটাল সার্টিফিকেট ইস্যু করুন, যা অনলাইনে যাচাইযোগ্য।
            </p>
          </div>

          <div className="card p-6">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--pine)]/10 text-[var(--pine)]">
              <ShieldCheckIcon className="h-6 w-6" />
            </div>
            <h3 className="serif mt-4 text-xl font-bold">টিম ও ভলান্টিয়ার রোলস</h3>
            <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
              ক্লাবের সদস্যদের দায়িত্ব দিন: গেট ভলান্টিয়ারদের শুধু স্ক্যানার অনুমতি আর কোর টিমকে অ্যাডমিন ক্ষমতা দিন।
            </p>
          </div>
        </div>
      </section>

      {/* Step by Step Workflow */}
      <section className="border-y border-[var(--line)] bg-[var(--paper-2)] py-16">
        <div className="mx-auto max-w-5xl px-4">
          <div className="text-center">
            <h2 className="serif text-3xl sm:text-4xl">৩টি পদক্ষেপে আপনার সম্পূর্ণ ইভেন্ট পরিচালনা</h2>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            <div className="rounded-2xl border border-[var(--line)] bg-white p-6">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--pine)] text-sm font-bold text-white">
                ১
              </div>
              <h3 className="serif mt-4 text-xl font-bold">ইভেন্ট ও সেগমেন্ট সাজান</h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
                ইভেন্টের তারিখ, ভেন্যু, ব্যানার এবং অলিম্পিয়াড বা প্রতিযোগিতার সেগমেন্টগুলো বিস্তারিত লিখে যুক্ত করুন।
              </p>
            </div>

            <div className="rounded-2xl border border-[var(--line)] bg-white p-6">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--pine)] text-sm font-bold text-white">
                ২
              </div>
              <h3 className="serif mt-4 text-xl font-bold">রেজিস্ট্রেশন ও পেমেন্ট চালু</h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
                বিকাশ বা নগদ নম্বর সেট করে পাবলিক লিংক শেয়ার করুন। অংশগ্রহণকারীরা ফর্ম পূরণ করে টিকিট সংগ্রহ করবে।
              </p>
            </div>

            <div className="rounded-2xl border border-[var(--line)] bg-white p-6">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--pine)] text-sm font-bold text-white">
                ৩
              </div>
              <h3 className="serif mt-4 text-xl font-bold">গেট স্ক্যান ও সার্টিফিকেট</h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
                ইভেন্টের দিন প্রবেশমুখে টিকিট স্ক্যান করে কিট ও খাবার দিন। অনুষ্ঠান শেষে অনলাইন সার্টিফিকেট বিতরণ করুন।
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="mx-auto max-w-4xl px-4 py-16">
        <div className="text-center">
          <h2 className="serif text-3xl">অর্গানাইজারদের সাধারণ জিজ্ঞাসা ও উত্তর</h2>
        </div>

        <div className="mt-10 space-y-4">
          <div className="card p-5">
            <h3 className="flex items-center gap-2 font-semibold">
              <HelpCircleIcon className="h-5 w-5 text-[var(--pine)] shrink-0" />
              রেজিস্ট্রেশন ফি কীভাবে জমা হয়?
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-[var(--muted)] pl-7">
              আপনার ইভেন্টের জন্য নির্ধারিত বিকাশ বা নগদ নম্বর প্রদান করতে পারবেন। অংশগ্রহণকারীরা সরাসরি আপনার নম্বরে ফি পাঠিয়ে ট্রানজাকশন আইডি দিয়ে আবেদন করবে এবং আপনি যাচাই করে অনুমোদন দিতে পারবেন।
            </p>
          </div>

          <div className="card p-5">
            <h3 className="flex items-center gap-2 font-semibold">
              <HelpCircleIcon className="h-5 w-5 text-[var(--pine)] shrink-0" />
              ভলান্টিয়াররা কি শুধু কিউআর কোড স্ক্যান করতে পারবে?
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-[var(--muted)] pl-7">
              হ্যাঁ, সিস্টেমে স্ক্যানার রোল রয়েছে। ক্লাবের ভলান্টিয়ারদের এই পারমিশন দিলে তারা অ্যাডমিন সেটিংস দেখা বা পরিবর্তনের সুযোগ ছাড়াই কেবল গেটে টিকিট স্ক্যান করতে পারবে।
            </p>
          </div>

          <div className="card p-5">
            <h3 className="flex items-center gap-2 font-semibold">
              <HelpCircleIcon className="h-5 w-5 text-[var(--pine)] shrink-0" />
              সার্টিফিকেট কীভাবে তৈরি এবং যাচাই করা যায়?
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-[var(--muted)] pl-7">
              অর্গানাইজার ডেস্ক থেকে অংশগ্রহণকারী বা বিজয়ীদের নাম নির্ধারণ করে সার্টিফিকেট ইস্যু করা যায়। প্রতিটি সার্টিফিকেটে একটি স্বতন্ত্র লিংক থাকে, যা যেকোনো স্থান থেকে যাচাই করা সম্ভব।
            </p>
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="mx-auto max-w-5xl px-4 pb-12">
        <div className="rounded-2xl border border-[var(--line)] bg-[#1c1915] p-8 text-center text-[#f4f1ea] sm:p-12">
          <h2 className="serif text-3xl sm:text-4xl">আপনার পরবর্তী ইভেন্টটি শুরু করতে প্রস্তুত?</h2>
          <p className="mx-auto mt-3 max-w-lg text-sm text-white/80">
            আলোআয়ন প্ল্যাটফর্মে আপনার স্কুল, কলেজ বা ক্লাবের ইভেন্ট যুক্ত করুন এবং শত শত অংশগ্রহণকারী পরিচালনা করুন সহজে।
          </p>
          <button onClick={onLogin} className="btn btn-primary mt-6 !px-6 !py-3">
            <AloionMark className="h-5 w-5" />
            আলোআয়ন অ্যাকাউন্ট দিয়ে শুরু করুন
          </button>
        </div>
      </section>
    </main>
  );
}
