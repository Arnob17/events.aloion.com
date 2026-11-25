"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { payMethodLabel } from "@/components/pay-method";
import { api } from "@/lib/api";
import { money, num, personName, statusLabel, when } from "@/lib/format";
import { useSession } from "@/lib/session";
import type { Registration, Workspace } from "@/lib/types";

const FILTER_LABEL: Record<string, string> = {
  active: "সক্রিয় রেজিস্ট্রেশন",
  pending: "যাচাই বাকি",
  confirmed: "কনফার্মড",
  checked_in: "হাজির",
  waitlisted: "ওয়েটলিস্ট",
  inactive: "ক্যান্সেল ও রিজেক্ট",
  "": "সব রেজিস্ট্রেশন",
};

/**
 * All registrants of an event on one page, laid out for A4 landscape. "Save as PDF" in the
 * browser's print dialog gives the PDF; the browser renders Bangla text correctly.
 */
export default function PrintRegistrations() {
  const { id } = useParams<{ id: string }>();
  const { user, loading } = useSession();
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [rows, setRows] = useState<Registration[] | null>(null);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("active");
  const [withAnswers, setWithAnswers] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setStatus(params.get("status") ?? "active");
  }, []);

  useEffect(() => {
    if (loading || !user) return;
    let stale = false;
    setRows(null);
    Promise.all([api.workspace(Number(id)), api.allRegistrations(Number(id), status ? `status=${status}` : "")])
      .then(([space, list]) => {
        if (stale) return;
        setWorkspace(space);
        setRows([...list].sort((a, b) => personName(a.participant).localeCompare(personName(b.participant), "bn")));
      })
      .catch((err: Error) => !stale && setError(err.message));
    return () => {
      stale = true;
    };
  }, [id, status, loading, user]);

  if (!loading && !user) return <main className="p-10">লগইন করুন।</main>;
  if (error) return <main className="p-10"><p className="notice notice-error">{error}</p></main>;

  const event = workspace?.event;
  const fields = event?.fields || [];

  return (
    <main className="mx-auto max-w-[80rem] px-4 py-6 print:max-w-none print:p-0">
      <div className="no-print mb-5 flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius)] border border-[var(--line)] bg-white p-3">
        <div className="flex flex-wrap items-center gap-3">
          <Link href={`/organizer/events/${id}/registrations`} className="btn btn-ghost btn-sm">← ডেস্ক</Link>
          <select className="field !min-h-0 w-auto !py-1.5 text-sm" value={status} onChange={(e) => setStatus(e.target.value)} aria-label="কাদের তালিকা">
            {Object.entries(FILTER_LABEL).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
          </select>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={withAnswers} onChange={(e) => setWithAnswers(e.target.checked)} />প্রশ্নের উত্তরসহ</label>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm muted">প্রিন্ট উইন্ডোতে “Save as PDF” বেছে নিলে পিডিএফ হবে</span>
          <button className="btn btn-primary" disabled={!rows} onClick={() => window.print()}>প্রিন্ট / পিডিএফ</button>
        </div>
      </div>

      {!rows || !event ? (
        <div className="skeleton h-96" />
      ) : (
        <>
          <header className="mb-4 flex flex-wrap items-end justify-between gap-3 border-b-2 border-[var(--ink)] pb-3">
            <div>
              <h1 className="serif text-2xl">{event.title}</h1>
              <p className="text-sm">{[when(event.starts_at, event.timezone), event.venue].filter(Boolean).join(" · ")}</p>
            </div>
            <div className="text-right text-sm">
              <p className="font-bold">{FILTER_LABEL[status] || status}: {num(rows.length)} জন</p>
              <p className="muted">প্রিন্ট: {when(new Date().toISOString())}</p>
            </div>
          </header>
          {rows.length === 0 ? (
            <p className="py-10 text-center muted">এই তালিকায় কেউ নেই।</p>
          ) : (
            <table className="table print-table border border-[var(--line)]">
              <thead>
                <tr>
                  <th>#</th>
                  <th>নাম ও যোগাযোগ</th>
                  <th>নম্বর</th>
                  {event.segments.length > 0 && <th>সেগমেন্ট</th>}
                  <th>ফি ও পেমেন্ট</th>
                  {event.food_enabled && <th>খাবার</th>}
                  {workspace.items.length > 0 && <th>গিফট</th>}
                  <th>স্ট্যাটাস</th>
                  {withAnswers && fields.length > 0 && <th>অতিরিক্ত তথ্য</th>}
                  <th className="w-20">স্বাক্ষর</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => (
                  <tr key={row.public_code}>
                    <td className="tabular-nums">{num(index + 1)}</td>
                    <td>
                      <p className="font-semibold">{personName(row.participant)}</p>
                      <p className="text-xs">{row.participant.phone}</p>
                      <p className="text-xs break-all muted">{row.participant.email}</p>
                    </td>
                    <td className="font-mono text-xs whitespace-nowrap">{row.public_code}</td>
                    {event.segments.length > 0 && <td className="text-xs">{row.segments.map((segment) => segment.name).join(", ") || "—"}</td>}
                    <td className="text-xs whitespace-nowrap">
                      {row.amount_due > 0 ? <>{money(row.amount_due, row.currency)} · {statusLabel(row.payment_status)}<br />{payMethodLabel(row.payment_method)} <span className="font-mono">{row.transaction_id}</span></> : "ফ্রি"}
                    </td>
                    {event.food_enabled && <td className="text-xs">{row.meal?.name || "—"}{row.meal_served_at ? " ✓" : ""}</td>}
                    {workspace.items.length > 0 && <td className="text-xs">{row.items.map((item) => `${item.name} ✓`).join(", ") || "—"}</td>}
                    <td className="text-xs whitespace-nowrap">{statusLabel(row.status)}</td>
                    {withAnswers && fields.length > 0 && (
                      <td className="text-xs">
                        {fields.map((field) => {
                          const value = row.answers.find((answer) => answer.field_id === field.id)?.value;
                          return value ? <p key={field.id}><span className="muted">{field.label}:</span> {value}</p> : null;
                        })}
                      </td>
                    )}
                    <td />
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </>
      )}
    </main>
  );
}
