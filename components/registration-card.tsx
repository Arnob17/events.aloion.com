"use client";

import Link from "next/link";
import { TicketQR } from "@/components/ticket-qr";
import { personName, place, statusLabel, when } from "@/lib/format";
import type { Registration } from "@/lib/types";

export function RegistrationCard({ registration, compact = false, showTicketLink = true }: { registration: Registration; compact?: boolean; showTicketLink?: boolean }) {
  return (
    <article className="card overflow-hidden">
      <div className="bg-[var(--ink)] px-5 py-5 text-[var(--paper)]">
        <p className="text-sm text-[var(--gold)]">আপনার নিবন্ধন</p>
        <h2 className="serif mt-1 text-3xl">{registration.event_title || "ইভেন্ট"}</h2>
        <p className="mt-2 text-sm text-white/75">{when(registration.event_starts_at)}{registration.event_ends_at ? ` – ${when(registration.event_ends_at)}` : ""}</p>
        <p className="text-sm text-white/75">{place({ venue: registration.venue, address: registration.address })}</p>
      </div>
      <div className="space-y-3 p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-semibold">{personName(registration.participant)}</p>
            <p className="text-sm text-[var(--muted)]">{registration.participant.email}</p>
          </div>
          <span className="rounded-md bg-[var(--paper)] px-3 py-1 text-sm font-medium">{statusLabel(registration.status)}</span>
        </div>
        <p className="font-mono text-lg">{registration.public_code}</p>
        {registration.segments.length > 0 && (
          <ul className="space-y-2 text-sm">
            {registration.segments.map((segment) => (
              <li key={segment.id} className="rounded-xl bg-[var(--paper)] px-3 py-2">
                <strong>{segment.name}</strong>
                <span className="mt-0.5 block text-[var(--muted)]">{[when(segment.starts_at), segment.location].filter(Boolean).join(" · ")}</span>
              </li>
            ))}
          </ul>
        )}
        {registration.meal && <p className="text-sm">খাবার: {registration.meal.name}</p>}
        {registration.answers.length > 0 && (
          <dl className="grid gap-1 text-sm">
            {registration.answers.filter((answer) => answer.value).map((answer) => (
              <div key={answer.field_id} className="flex justify-between gap-3">
                <dt className="text-[var(--muted)]">{answer.label}</dt>
                <dd className="text-right font-medium">{answer.value}</dd>
              </div>
            ))}
          </dl>
        )}
        {!compact && registration.qr_token && registration.status !== "cancelled" && <TicketQR token={registration.qr_token} />}
        <div className="flex flex-wrap gap-2 pt-1">
          {registration.event_slug && <Link className="btn btn-ghost" href={`/events/${registration.event_slug}`}>ইভেন্টের পাতা</Link>}
          {showTicketLink && <Link className="btn btn-primary" href={`/tickets/${registration.public_code}`}>টিকিট খুলুন</Link>}
        </div>
      </div>
    </article>
  );
}
