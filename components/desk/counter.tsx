"use client";

import Link from "next/link";
import { useState } from "react";
import { GiftIcon, UtensilsIcon } from "@/components/icons";
import { QrScanner } from "@/components/qr-scanner";
import { EmptyState, StatusBadge } from "@/components/ui";
import { api } from "@/lib/api";
import { num, personName, timeOnly } from "@/lib/format";
import type { Registration, Workspace } from "@/lib/types";

type Who = { code?: string; token?: string };

/**
 * The food and gift counter. A volunteer scans the ticket (or types the number), sees what this
 * person chose and has already collected, and marks each thing given. Each is recorded once.
 */
export function Counter({ workspace, reload }: { workspace: Workspace; reload: () => Promise<void> }) {
  const eventId = workspace.event.id;
  const [person, setPerson] = useState<Registration | null>(null);
  const [who, setWho] = useState<Who>({});
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");
  const [camera, setCamera] = useState(false);
  const food = workspace.event.food_enabled && workspace.event.meals.length > 0;
  const items = workspace.items;

  if (!food && items.length === 0) {
    return (
      <EmptyState
        icon={<GiftIcon />}
        title="কাউন্টারে দেওয়ার কিছু নেই"
        body="খাবার চালু করুন বা গিফট আইটেম যোগ করুন। তারপর এখান থেকে কিউআর স্ক্যান করে বিতরণ করা যাবে।"
        action={<div className="flex gap-2"><Link className="btn btn-ghost" href={`/organizer/events/${eventId}/food`}>খাবার</Link><Link className="btn btn-primary" href={`/organizer/events/${eventId}/gifts`}>গিফট যোগ করুন</Link></div>}
      />
    );
  }

  async function find(next: Who) {
    setError("");
    setBusy("find");
    try {
      setPerson(await api.deskLookup(eventId, next));
      setWho(next);
    } catch (err) {
      setPerson(null);
      setError(err instanceof Error ? err.message : "পাওয়া যায়নি");
    } finally {
      setBusy("");
    }
  }

  async function run(key: string, work: () => Promise<Registration>) {
    setError("");
    setBusy(key);
    try {
      setPerson(await work());
      reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "হয়নি");
    } finally {
      setBusy("");
    }
  }

  function next() {
    setPerson(null);
    setWho({});
    setCode("");
    setError("");
  }

  const eligible = person && (person.status === "confirmed" || person.status === "checked_in");
  const received = new Map((person?.items || []).map((item) => [item.item_id, item]));

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold">খাবার ও গিফট কাউন্টার</h2>
        <p className="text-sm muted">টিকিটের কিউআর স্ক্যান করুন বা রেজিস্ট্রেশন নম্বর লিখুন। প্রত্যেকে প্রতিটি জিনিস একবারই নিতে পারবেন, আর নেওয়া হলে তাঁর টিকিটেও দেখাবে।</p>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
        <div className="space-y-3">
          {camera ? (
            <>
              <QrScanner id="counter-reader" paused={Boolean(person) || busy === "find"} onScan={(token) => find({ token })} />
              <button className="btn btn-quiet btn-sm" onClick={() => setCamera(false)}>ক্যামেরা বন্ধ</button>
            </>
          ) : (
            <button className="btn btn-ghost w-full" onClick={() => setCamera(true)}>ক্যামেরা দিয়ে স্ক্যান</button>
          )}
          <form className="flex gap-2" onSubmit={(event) => { event.preventDefault(); if (code.trim()) find({ code: code.trim() }); }}>
            <input className="field font-mono" placeholder="রেজিস্ট্রেশন নম্বর" value={code} onChange={(event) => setCode(event.target.value)} aria-label="রেজিস্ট্রেশন নম্বর" autoFocus />
            <button className="btn btn-primary shrink-0" disabled={busy === "find"}>খুঁজুন</button>
          </form>
          <div className="card divide-y divide-[var(--line)] text-sm">
            {food && <p className="flex justify-between px-4 py-2.5"><span>খাবার দেওয়া হয়েছে</span><strong>{num(workspace.counts.meals_served)}</strong></p>}
            {items.map((item) => (
              <p key={item.id} className="flex justify-between gap-3 px-4 py-2.5"><span className="min-w-0 truncate">{item.name}</span><strong className="shrink-0">{num(item.distributed)}{item.quantity != null ? ` / ${num(item.quantity)}` : ""}</strong></p>
            ))}
          </div>
        </div>

        <div>
          {error && <p className="notice notice-error mb-3" role="alert">{error}</p>}
          {!person ? (
            <div className="card grid min-h-[16rem] place-items-center p-6 text-center">
              <div>
                <p className="text-lg font-bold">পরের জনের টিকিট স্ক্যান করুন</p>
                <p className="mt-1 text-sm muted">নাম, খাবারের বাছাই আর গিফটের অবস্থা এখানে দেখাবে।</p>
              </div>
            </div>
          ) : (
            <section className="card overflow-hidden" aria-live="polite">
              <div className={`px-5 py-4 ${eligible ? "bg-[var(--pine-soft)]" : "bg-[var(--danger-soft)]"}`}>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="serif text-2xl break-words">{personName(person.participant)}</h3>
                    <p className="font-mono text-sm">{person.public_code}</p>
                  </div>
                  <StatusBadge status={person.status} />
                </div>
                {!eligible && <p className="mt-2 text-sm font-semibold text-[var(--danger)]">এই রেজিস্ট্রেশন কনফার্ম না হওয়া পর্যন্ত কিছু দেওয়া যাবে না।</p>}
                {person.segments.length > 0 && <p className="mt-1 text-sm">{person.segments.map((segment) => segment.name).join(", ")}</p>}
              </div>
              <ul className="divide-y divide-[var(--line)]">
                {food && (
                  <li className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[var(--pine-soft)] text-[var(--pine)]"><UtensilsIcon className="h-5 w-5" /></span>
                      <div className="min-w-0">
                        <p className="font-bold">{person.meal ? person.meal.name : "খাবার বাছাই করা নেই"}</p>
                        <p className="text-sm">{person.meal_served_at ? <span className="font-semibold text-[var(--warn)]">আগেই নিয়েছেন · {timeOnly(person.meal_served_at)}</span> : <span className="muted">এখনো নেননি</span>}</p>
                      </div>
                    </div>
                    {person.meal_served_at ? (
                      <button className="btn btn-ghost btn-sm" disabled={busy === "meal"} onClick={() => run("meal", () => api.serveMeal(eventId, who, true))}>আনডু</button>
                    ) : (
                      <button className="btn btn-primary" disabled={!eligible || !person.meal || busy === "meal"} onClick={() => run("meal", () => api.serveMeal(eventId, who))}>খাবার দেওয়া হলো</button>
                    )}
                  </li>
                )}
                {items.map((item) => {
                  const got = received.get(item.id);
                  const out = item.quantity != null && item.distributed >= item.quantity;
                  return (
                    <li key={item.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[var(--gold-soft)] text-[#7a5206]"><GiftIcon className="h-5 w-5" /></span>
                        <div className="min-w-0">
                          <p className="font-bold break-words">{item.name}</p>
                          <p className="text-sm">{got ? <span className="font-semibold text-[var(--warn)]">আগেই নিয়েছেন · {timeOnly(got.given_at)}</span> : out ? <span className="text-[var(--danger)]">স্টক শেষ</span> : <span className="muted">এখনো নেননি</span>}</p>
                        </div>
                      </div>
                      {got ? (
                        <button className="btn btn-ghost btn-sm" disabled={busy === `i${item.id}`} onClick={() => run(`i${item.id}`, () => api.distribute(eventId, item.id, who, true))}>আনডু</button>
                      ) : (
                        <button className="btn btn-primary" disabled={!eligible || out || busy === `i${item.id}`} onClick={() => run(`i${item.id}`, () => api.distribute(eventId, item.id, who))}>দেওয়া হলো</button>
                      )}
                    </li>
                  );
                })}
              </ul>
              <div className="border-t border-[var(--line)] p-4">
                <button className="btn btn-ghost btn-lg w-full" onClick={next}>পরের জন →</button>
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
