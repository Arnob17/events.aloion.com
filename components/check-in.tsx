"use client";

import { useState } from "react";
import { QrScanner } from "@/components/qr-scanner";
import { api } from "@/lib/api";
import { timeOnly } from "@/lib/format";
import type { ScanResult } from "@/lib/types";

const RESULT: Record<string, { label: string; tone: string }> = {
  valid: { label: "টিকিট ঠিক আছে", tone: "border-[var(--pine)] bg-[var(--pine-soft)]" },
  checked_in: { label: "চেক-ইন হয়েছে ✓", tone: "border-[var(--pine)] bg-[var(--pine-soft)]" },
  already_checked_in: { label: "আগেই হাজির হয়েছেন", tone: "border-[var(--warn)] bg-[var(--warn-soft)]" },
  cancelled: { label: "রেজিস্ট্রেশন ক্যান্সেল", tone: "border-[var(--danger)] bg-[var(--danger-soft)]" },
  rejected: { label: "রেজিস্ট্রেশন রিজেক্টেড", tone: "border-[var(--danger)] bg-[var(--danger-soft)]" },
  pending: { label: "পেমেন্ট এখনো কনফার্ম হয়নি", tone: "border-[var(--warn)] bg-[var(--warn-soft)]" },
  waitlisted: { label: "ওয়েটলিস্টে আছেন", tone: "border-[var(--warn)] bg-[var(--warn-soft)]" },
  invalid: { label: "রেজিস্ট্রেশন পাওয়া যায়নি", tone: "border-[var(--danger)] bg-[var(--danger-soft)]" },
};

export function CheckIn({ eventId }: { eventId: number }) {
  const [result, setResult] = useState<ScanResult | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");

  async function lookup(body: object) {
    setError("");
    try {
      setResult(await api.validate(eventId, body));
    } catch (err) {
      setError(err instanceof Error ? err.message : "সার্চ হয়নি");
    }
  }

  async function run(key: string, action: () => Promise<ScanResult>) {
    setError("");
    setBusy(key);
    try {
      setResult(await action());
    } catch (err) {
      setError(err instanceof Error ? err.message : "চেক-ইন হয়নি");
    } finally {
      setBusy("");
    }
  }

  function nextPerson() {
    setResult(null);
    setCode("");
    setError("");
  }

  const canAttend = result?.result === "valid" || result?.result === "checked_in" || result?.result === "already_checked_in";
  const look = RESULT[result?.result || "invalid"] || RESULT.invalid;

  return (
    <div className="mx-auto grid max-w-4xl gap-5 lg:grid-cols-2">
      <div>
        <QrScanner paused={Boolean(result)} onScan={(token) => lookup({ token, device_label: navigator.userAgent })} />
        <form className="mt-3 flex gap-2" onSubmit={(event) => { event.preventDefault(); if (code.trim()) lookup({ code: code.trim() }); }}>
          <input className="field font-mono" placeholder="রেজিস্ট্রেশন নম্বর লিখুন" value={code} onChange={(event) => setCode(event.target.value)} aria-label="রেজিস্ট্রেশন নম্বর" />
          <button className="btn btn-primary shrink-0">খুঁজুন</button>
        </form>
        {error && <p className="notice notice-error mt-3">{error}</p>}
      </div>

      <div>
        {!result ? (
          <div className="card grid h-full min-h-[14rem] place-items-center p-6 text-center">
            <div>
              <p className="text-lg font-bold">টিকিটের কিউআর ক্যামেরার সামনে ধরুন</p>
              <p className="mt-1 text-sm muted">স্ক্যান হলে এখানে নাম আর স্ট্যাটাস দেখাবে। তারপর “হাজির” চাপুন।</p>
            </div>
          </div>
        ) : (
          <section className={`rounded-[var(--radius)] border-2 bg-white p-5 ${look.tone}`} aria-live="polite">
            <p className="text-sm font-bold">{look.label}</p>
            <h2 className="serif mt-1 text-3xl break-words">{result.participant_name || "অজানা"}</h2>
            <p className="font-mono">{result.registration_code}</p>
            {result.checked_in_at && <p className="mt-1 text-sm">হাজির হয়েছেন {timeOnly(result.checked_in_at)}</p>}

            {result.segments && result.segments.length > 0 && (
              <ul className="mt-4 grid gap-2">
                {result.segments.map((segment) => (
                  <li key={segment.id} className="flex items-center justify-between gap-3 rounded-[var(--radius-sm)] bg-white px-3 py-2.5 shadow-sm">
                    <div className="min-w-0">
                      <p className="font-semibold break-words">{segment.name}</p>
                      <p className="text-xs muted">{segment.done ? `✓ হয়ে গেছে${segment.checked_in_at ? ` · ${timeOnly(segment.checked_in_at)}` : ""}` : "এখনো হয়নি"}{segment.location ? ` · ${segment.location}` : ""}</p>
                    </div>
                    {canAttend && result.registration_code && (segment.done ? (
                      <button className="btn btn-ghost btn-sm" disabled={busy === `s${segment.id}`} onClick={() => run(`s${segment.id}`, () => api.undo(eventId, result.registration_code!, segment.id))}>আনডু</button>
                    ) : (
                      <button className="btn btn-primary btn-sm" disabled={busy === `s${segment.id}`} onClick={() => run(`s${segment.id}`, () => api.checkIn(eventId, { code: result.registration_code, segment_id: segment.id }))}>হাজির</button>
                    ))}
                  </li>
                ))}
              </ul>
            )}

            <div className="mt-5 flex flex-wrap gap-2">
              {result.result === "valid" && result.registration_code && (
                <button className="btn btn-primary btn-lg flex-1" disabled={busy === "arrive"} onClick={() => run("arrive", () => api.checkIn(eventId, { code: result.registration_code }))}>হাজির</button>
              )}
              {result.result === "already_checked_in" && result.registration_code && (
                <button className="btn btn-ghost" disabled={busy === "arrive"} onClick={() => run("arrive", () => api.undo(eventId, result.registration_code!))}>চেক-ইন আনডু</button>
              )}
              <button className="btn btn-ghost btn-lg flex-1" onClick={nextPerson}>পরের জন →</button>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
