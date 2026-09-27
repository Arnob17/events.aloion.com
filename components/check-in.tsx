"use client";

import { Html5Qrcode, Html5QrcodeScannerState } from "html5-qrcode";
import { useEffect, useRef, useState } from "react";
import { FieldLabel } from "@/components/field-label";
import { api } from "@/lib/api";
import type { ScanResult } from "@/lib/types";

export function CheckIn({ eventId }: { eventId: number }) {
  const [result, setResult] = useState<ScanResult | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");
  const scanner = useRef<Html5Qrcode | null>(null);
  const paused = useRef(false);

  useEffect(() => {
    let node: Html5Qrcode | null = null;
    let cancelled = false;
    const timer = window.setTimeout(() => {
      node = new Html5Qrcode("qr-reader", false);
      scanner.current = node;
      node.start(
        { facingMode: "environment" },
        { fps: 8, qrbox: { width: 240, height: 240 } },
        async (decoded) => {
          if (paused.current || cancelled) return;
          paused.current = true;
          try {
            setResult(await api.validate(eventId, { token: decoded, device_label: navigator.userAgent }));
          } catch (err) {
            setError(err instanceof Error ? err.message : "স্ক্যান হয়নি");
          }
        },
        () => undefined,
      ).then(() => {
        if (cancelled && node) return stopScanner(node);
      }).catch(() => {
        if (!cancelled) setError("ক্যামেরার অনুমতি লাগবে। নিবন্ধন নম্বর দিয়েও খোঁজা যায়।");
      });
    }, 0);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      if (node) stopScanner(node);
      scanner.current = null;
    };
  }, [eventId]);

  async function lookup(body: object) {
    setError("");
    try {
      setResult(await api.validate(eventId, body));
      paused.current = true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "খোঁজা যায়নি");
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

  const canAttend = result?.result === "valid" || result?.result === "checked_in" || result?.result === "already_checked_in";
  const tone = result?.result === "valid" || result?.result === "checked_in"
    ? "bg-emerald-50"
    : result?.result === "already_checked_in"
      ? "bg-amber-50"
      : result ? "bg-red-50" : "bg-white";

  return (
    <div className="mx-auto max-w-md">
      <div id="qr-reader" className="overflow-hidden rounded-[1.1rem] bg-black" />
      <form className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-end" onSubmit={(event) => { event.preventDefault(); lookup({ code }); }}>
        <FieldLabel label="নিবন্ধন নম্বর" className="sm:min-w-0 sm:flex-1">
          <input className="field" value={code} onChange={(event) => setCode(event.target.value)} />
        </FieldLabel>
        <button className="btn btn-primary shrink-0">খুঁজুন</button>
      </form>
      {error && <p className="mt-3 text-sm text-red-700">{error}</p>}
      {result && (
        <section className={`mt-4 rounded-[1.1rem] p-5 ${tone}`}>
          <p className="text-sm font-medium text-[var(--pine)]">{labelFor(result.result)}</p>
          <h2 className="serif mt-1 text-3xl">{result.participant_name || "অজানা"}</h2>
          <p className="font-mono">{result.registration_code}</p>
          {result.checked_in_at && <p className="mt-2 text-sm">হাজির হয়েছেন {new Date(result.checked_in_at).toLocaleTimeString("bn-BD")}</p>}
          {result.segments && result.segments.length > 0 && (
            <ul className="mt-4 grid gap-2">
              {result.segments.map((segment) => (
                <li key={segment.id} className="flex flex-col gap-3 rounded-[0.7rem] bg-white px-3 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-medium">{segment.name}</p>
                    <p className="text-sm text-[var(--muted)]">
                      {segment.done ? `হয়ে গেছে${segment.checked_in_at ? ` · ${new Date(segment.checked_in_at).toLocaleTimeString("bn-BD")}` : ""}` : "এখনো হয়নি"}
                      {segment.location ? ` · ${segment.location}` : ""}
                    </p>
                  </div>
                  {canAttend && result.registration_code && (
                    segment.done ? (
                      <button className="btn btn-ghost !py-2" disabled={busy === `s${segment.id}`} onClick={() => run(`s${segment.id}`, () => api.undo(eventId, result.registration_code!, segment.id))}>ফেরান</button>
                    ) : (
                      <button className="btn btn-primary !py-2" disabled={busy === `s${segment.id}`} onClick={() => run(`s${segment.id}`, () => api.checkIn(eventId, { code: result.registration_code, segment_id: segment.id }))}>হয়ে গেছে</button>
                    )
                  )}
                </li>
              ))}
            </ul>
          )}
          <div className="mt-4 flex flex-wrap gap-2">
            {result.result === "valid" && result.registration_code && (
              <button className="btn btn-primary" disabled={busy === "arrive"} onClick={() => run("arrive", () => api.checkIn(eventId, { code: result.registration_code }))}>হাজির</button>
            )}
            {result.result === "already_checked_in" && result.registration_code && (
              <button className="btn btn-ghost" disabled={busy === "arrive"} onClick={() => run("arrive", () => api.undo(eventId, result.registration_code!))}>হাজিরা ফেরান</button>
            )}
            <button className="btn btn-ghost" onClick={() => { setResult(null); paused.current = false; }}>পরের জন</button>
          </div>
        </section>
      )}
    </div>
  );
}

function stopScanner(node: Html5Qrcode) {
  try {
    const state = node.getState();
    if (state !== Html5QrcodeScannerState.SCANNING && state !== Html5QrcodeScannerState.PAUSED) return;
    node.stop().catch(() => undefined);
  } catch {
    // stop() throws when the camera never started.
  }
}

function labelFor(result: string) {
  switch (result) {
    case "valid": return "টিকিট ঠিক আছে";
    case "checked_in": return "চেক-ইন হয়েছে";
    case "already_checked_in": return "আগেই হাজির";
    case "cancelled": return "নিবন্ধন বাতিল";
    case "rejected": return "নিবন্ধন প্রত্যাখ্যাত";
    case "pending": return "পেমেন্ট এখনো বাকি";
    case "waitlisted": return "অপেক্ষমাণ তালিকা";
    default: return "নিবন্ধন পাওয়া যায়নি";
  }
}
