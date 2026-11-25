"use client";

import Link from "next/link";
import { TicketQR } from "@/components/ticket-qr";
import { payMethodLabel } from "@/components/pay-method";
import { StatusBadge } from "@/components/ui";
import { money, personName, place, timeOnly, when, whenDay } from "@/lib/format";
import type { Gift, Registration } from "@/lib/types";

const STATUS_NOTE: Record<string, string> = {
  pending: "অর্গানাইজার পেমেন্ট মিলিয়ে কনফার্ম করবেন। কনফার্ম হলে ইমেইল পাবেন।",
  waitlisted: "সিট খালি হলে অর্গানাইজার আপনাকে কনফার্ম করবেন।",
  cancelled: "এই রেজিস্ট্রেশন ক্যান্সেল হয়েছে।",
  rejected: "অর্গানাইজার এই রেজিস্ট্রেশন রিজেক্ট করেছেন।",
  confirmed: "ইভেন্টের দিন গেটে এই কিউআর দেখান।",
  checked_in: "আপনি হাজির হয়েছেন।",
};

/** A registration as its owner sees it: ticket, choices, and what has been collected. */
export function RegistrationCard({ registration, compact = false, showTicketLink = true, showDownload = true, gifts = [] }: { registration: Registration; compact?: boolean; showTicketLink?: boolean; showDownload?: boolean; gifts?: Gift[] }) {
  const items = registration.items || [];
  const received = new Set(items.map((item) => item.item_id));
  const waiting = gifts.filter((gift) => !received.has(gift.id));
  const live = registration.status === "confirmed" || registration.status === "checked_in";

  if (compact) {
    return (
      <Link href={`/tickets/${registration.public_code}`} className="card flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="font-bold break-words">{registration.event_title || "ইভেন্ট"}</p>
          <p className="text-sm muted">{whenDay(registration.event_starts_at)} · {place({ venue: registration.venue, address: registration.address })}</p>
          <p className="mt-1 font-mono text-sm">{registration.public_code}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <StatusBadge status={registration.status} />
          <span className="text-sm font-semibold text-[var(--pine)]">টিকিট →</span>
        </div>
      </Link>
    );
  }

  return (
    <article className="card print-ticket overflow-hidden">
      <div className="relative bg-[var(--pine-deep)] px-5 py-5 text-white">
        <p className="text-sm font-semibold text-[var(--gold)]">আপনার টিকিট</p>
        <h2 className="serif mt-1 break-words text-2xl sm:text-3xl">{registration.event_title || "ইভেন্ট"}</h2>
        <p className="mt-2 text-sm text-white/80">{when(registration.event_starts_at)}{registration.event_ends_at ? ` – ${when(registration.event_ends_at)}` : ""}</p>
        <p className="text-sm text-white/80">{place({ venue: registration.venue, address: registration.address })}</p>
      </div>
      <div className="space-y-4 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-semibold break-words">{personName(registration.participant)}</p>
            <p className="font-mono text-sm muted">{registration.public_code}</p>
          </div>
          <StatusBadge status={registration.status} />
        </div>
        {STATUS_NOTE[registration.status] && <p className={`notice ${live ? "notice-success" : registration.status === "pending" || registration.status === "waitlisted" ? "notice-warn" : "notice-error"}`}>{STATUS_NOTE[registration.status]}</p>}

        {live && registration.qr_token && <TicketQR token={registration.qr_token} />}

        <dl className="divide-y divide-[var(--line)] rounded-[var(--radius)] border border-[var(--line)] text-sm">
          <Row label="মোট ফি">
            {money(registration.amount_due || 0, registration.currency)}
            {registration.amount_due > 0 && <> · <StatusBadge status={registration.payment_status} /></>}
          </Row>
          {registration.transaction_id && (
            <Row label="পেমেন্ট">{payMethodLabel(registration.payment_method)} · <span className="font-mono">{registration.transaction_id}</span></Row>
          )}
          {registration.segments.length > 0 && (
            <Row label="সেগমেন্ট">
              <ul className="space-y-1">
                {registration.segments.map((segment) => (
                  <li key={segment.id}>
                    <span className="font-semibold">{segment.name}</span>
                    {(segment.starts_at || segment.location) && <span className="block text-xs muted">{[segment.starts_at ? when(segment.starts_at) : "", segment.location].filter(Boolean).join(" · ")}</span>}
                  </li>
                ))}
              </ul>
            </Row>
          )}
          {registration.meal && (
            <Row label="খাবার">
              <span className="font-semibold">{registration.meal.name}</span>
              <span className="mt-0.5 block text-xs">
                {registration.meal_served_at
                  ? <span className="text-[var(--pine)]">✓ নেওয়া হয়েছে · {timeOnly(registration.meal_served_at)}</span>
                  : <span className="muted">কাউন্টারে এই টিকিট দেখিয়ে নিন</span>}
              </span>
            </Row>
          )}
          {(items.length > 0 || waiting.length > 0) && (
            <Row label="গিফট">
              <ul className="space-y-1">
                {items.map((item) => (
                  <li key={item.item_id} className="text-[var(--pine)]">✓ {item.name} <span className="text-xs muted">· {whenDay(item.given_at)}</span></li>
                ))}
                {waiting.map((gift) => (
                  <li key={gift.id} className="muted">○ {gift.name} <span className="text-xs">· এখনো নেওয়া হয়নি</span></li>
                ))}
              </ul>
            </Row>
          )}
          {registration.answers.filter((answer) => answer.value).map((answer) => (
            <Row key={answer.field_id} label={answer.label}>{answer.value}</Row>
          ))}
        </dl>

        <div className="no-print flex flex-wrap gap-2">
          {showDownload && (
            // The browser's print dialog saves the ticket as a PDF ("Save as PDF").
            <button type="button" className="btn btn-primary" onClick={() => window.print()}>
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              পিডিএফ ডাউনলোড
            </button>
          )}
          {registration.event_slug && <Link className="btn btn-ghost" href={`/events/${registration.event_slug}`}>ইভেন্টের পাতা</Link>}
          {showTicketLink && <Link className="btn btn-ghost" href={`/tickets/${registration.public_code}`}>পুরো টিকিট</Link>}
        </div>
      </div>
    </article>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1 px-4 py-2.5 sm:grid-cols-[8rem_minmax(0,1fr)] sm:gap-3">
      <dt className="muted">{label}</dt>
      <dd className="min-w-0 break-words">{children}</dd>
    </div>
  );
}
