"use client";

import Link from "next/link";
import { TicketQR } from "@/components/ticket-qr";
import { payMethodLabel } from "@/components/pay-method";
import { money, personName, place, statusLabel, when } from "@/lib/format";
import type { Registration } from "@/lib/types";

export function RegistrationCard({
  registration,
  compact = false,
  showTicketLink = true,
  showDownload = true,
}: {
  registration: Registration;
  compact?: boolean;
  showTicketLink?: boolean;
  showDownload?: boolean;
}) {
  return (
    <article className="card overflow-hidden">
      <div className="bg-[var(--ink)] px-5 py-5 text-[var(--paper)]">
        <p className="text-sm text-[var(--gold)]">আপনার রেজিস্ট্রেশন</p>
        <h2 className="serif mt-1 break-words text-2xl sm:text-3xl">{registration.event_title || "ইভেন্ট"}</h2>
        <p className="mt-2 text-sm text-white/75">{when(registration.event_starts_at)}{registration.event_ends_at ? ` – ${when(registration.event_ends_at)}` : ""}</p>
        <p className="text-sm text-white/75">{place({ venue: registration.venue, address: registration.address })}</p>
      </div>
      <div className="space-y-3 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-semibold break-words">{personName(registration.participant)}</p>
            <p className="text-sm break-all text-[var(--muted)]">{registration.participant.email}</p>
          </div>
          <span className="shrink-0 rounded-md bg-[var(--paper)] px-3 py-1 text-sm font-medium">{statusLabel(registration.status)}</span>
        </div>
        <p className="font-mono text-lg break-all">{registration.public_code}</p>
        <p className="flex justify-between gap-3 text-sm font-semibold">
          <span>মোট</span>
          <span>{money(registration.amount_due || 0, registration.currency)}{registration.amount_due > 0 ? ` · ${statusLabel(registration.payment_status)}` : ""}</span>
        </p>
        {registration.transaction_id && (
          <p className="text-sm">
            {payMethodLabel(registration.payment_method) ? `${payMethodLabel(registration.payment_method)} · ` : ""}
            ট্রানজাকশন আইডি <span className="font-mono">{registration.transaction_id}</span>
          </p>
        )}
        {registration.status === "pending" && (
          <p className="rounded-lg bg-[var(--paper)] px-3 py-2 text-xs text-[var(--muted)]">
            অর্গানাইজার তথ্য ও পেমেন্ট যাচাই করে অ্যাকসেপ্ট করলে আপনার ইমেইলে কনফার্মেশন পাঠানো হবে।
          </p>
        )}
        {registration.segments.length > 0 && (
          <ul className="space-y-2 text-sm">
            {registration.segments.map((segment) => (
              <li key={segment.id} className="rounded-xl bg-[var(--paper)] px-3 py-2">
                <span className="flex items-start justify-between gap-3">
                  <strong className="break-words">{segment.name}</strong>
                  <span className="shrink-0">{money(segment.fee_amount, registration.currency)}</span>
                </span>
                <span className="mt-0.5 block text-[var(--muted)]">{[when(segment.starts_at), segment.location].filter(Boolean).join(" · ")}</span>
              </li>
            ))}
          </ul>
        )}
        {registration.meal && <p className="text-sm">খাবার: {registration.meal.name}</p>}
        {registration.answers.length > 0 && (
          <dl className="grid gap-1 text-sm">
            {registration.answers.filter((answer) => answer.value).map((answer) => (
              <div key={answer.field_id} className="grid gap-0.5 sm:grid-cols-[minmax(0,1fr)_auto] sm:gap-3">
                <dt className="text-[var(--muted)]">{answer.label}</dt>
                <dd className="font-medium break-words sm:text-right">{answer.value}</dd>
              </div>
            ))}
          </dl>
        )}
        {!compact && registration.qr_token && registration.status !== "cancelled" && <TicketQR token={registration.qr_token} />}
        <div className="flex flex-wrap items-center gap-2 pt-1 no-print">
          {registration.event_slug && <Link className="btn btn-ghost" href={`/events/${registration.event_slug}`}>ইভেন্টের পাতা</Link>}
          {showDownload && !compact && (
            <button
              type="button"
              className="btn btn-primary inline-flex items-center gap-1.5"
              onClick={() => {
                if (typeof window !== "undefined") {
                  window.print();
                }
              }}
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              <span>পিডিএফ ডাউনলোড</span>
            </button>
          )}
          {showTicketLink && <Link className="btn btn-ghost" href={`/tickets/${registration.public_code}`}>টিকিট খুলুন</Link>}
        </div>
      </div>
    </article>
  );
}
