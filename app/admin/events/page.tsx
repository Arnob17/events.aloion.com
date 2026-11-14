"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AloionMark } from "@/components/aloion-mark";
import { FieldLabel } from "@/components/field-label";
import { api } from "@/lib/api";
import { statusLabel } from "@/lib/format";
import { useSession } from "@/lib/session";
import type { AdminEvent } from "@/lib/types";

const DELETABLE = new Set(["draft", "submitted", "rejected"]);

export default function AdminEventsPage() {
  const { user, loading, login } = useSession();
  const [events, setEvents] = useState<AdminEvent[]>([]);
  const [status, setStatus] = useState("submitted");
  const [identifier, setIdentifier] = useState("");
  const [message, setMessage] = useState("");
  const [rejecting, setRejecting] = useState<number | null>(null);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (user?.role !== "admin") return;
    api.adminEvents(`?status=${status}`).then((data) => setEvents(data.events || [])).catch((err: Error) => setMessage(err.message));
  }, [user, status]);

  async function decide(id: number, action: "approve" | "reject" | "delete") {
    setMessage("");
    if (action === "reject" && !note.trim()) {
      setMessage("রিজেক্টের কারণ দরকার");
      return;
    }
    if (action === "delete" && !window.confirm("এই ইভেন্ট মুছে ফেলা হবে।")) return;
    setBusy(true);
    try {
      if (action === "approve") await api.approve(id);
      if (action === "reject") await api.reject(id, note.trim());
      if (action === "delete") await api.removeEvent(id);
      setEvents((rows) => rows.filter((row) => row.id !== id));
      setRejecting(null);
      setNote("");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "কাজ হয়নি");
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <main className="p-10">লোড হচ্ছে…</main>;
  if (!user) return <main className="p-10"><button className="btn btn-primary" onClick={() => login()}><AloionMark />আলোআয়ন দিয়ে চালিয়ে যান</button></main>;
  if (user.role !== "admin") return <main className="p-10">ইভেন্ট রিভিউ শুধু আলোআয়ন অ্যাডমিন করতে পারেন।</main>;

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="serif text-4xl sm:text-5xl">ইভেন্ট রিভিউ</h1>
      <p className="mt-2 text-sm text-[var(--muted)]">সাবমিট করা ইভেন্ট অ্যাপ্রুভ বা রিজেক্ট করুন। অর্গানাইজারকে ইমেইল যাবে।</p>
      <div className="mt-4 flex gap-2">
        <FieldLabel label="স্ট্যাটাস" className="max-w-[14rem]">
          <select className="field" value={status} onChange={(event) => { setStatus(event.target.value); setRejecting(null); setNote(""); }}>
            {["submitted", "draft", "approved", "published", "registration_open", "registration_closed", "ongoing", "completed", "rejected", "cancelled"].map((item) => <option key={item} value={item}>{statusLabel(item)}</option>)}
          </select>
        </FieldLabel>
      </div>
      <div className="mt-4 space-y-3">
        {events.length === 0 && <p className="text-sm text-[var(--muted)]">এই স্ট্যাটাসে ইভেন্ট নেই।</p>}
        {events.map((event) => (
          <article key={event.id} className="card grid gap-3 p-4">
            <div className="min-w-0">
              <strong className="break-words">{event.title}</strong>
              <p className="mt-1 text-sm text-[var(--muted)]">{statusLabel(event.status)} · {event.organization_name || "অর্গানাইজেশনের নাম নেই"}</p>
              <p className="mt-2 text-sm">ইমেইল {event.contact_email || "-"}</p>
              <p className="text-sm">ফোন {event.contact_phone || "-"}</p>
              <p className="text-sm">অ্যাকাউন্ট {organizerLine(event) || "-"}</p>
              {event.review_note && <p className="mt-2 text-sm">কারণ: {event.review_note}</p>}
            </div>
            <div className="flex flex-wrap gap-2">
              <Link className="btn btn-ghost" href={`/organizer/events/${event.id}`}>খুলুন</Link>
              {event.status === "submitted" && <button className="btn btn-primary" disabled={busy} onClick={() => decide(event.id, "approve")}>অ্যাপ্রুভ</button>}
              {event.status === "submitted" && <button className="btn btn-ghost" disabled={busy} onClick={() => { setRejecting(event.id); setNote(""); setMessage(""); }}>রিজেক্ট</button>}
              {DELETABLE.has(event.status) && <button className="btn btn-ghost" disabled={busy} onClick={() => decide(event.id, "delete")}>মুছে ফেলুন</button>}
            </div>
            {rejecting === event.id && (
              <form className="grid gap-2" onSubmit={(submit) => { submit.preventDefault(); decide(event.id, "reject"); }}>
                <FieldLabel label="রিজেক্টের কারণ">
                  <textarea className="field min-h-24" required value={note} onChange={(change) => setNote(change.target.value)} />
                </FieldLabel>
                <button className="btn btn-primary w-fit" disabled={busy || !note.trim()}>কারণসহ রিজেক্ট</button>
              </form>
            )}
          </article>
        ))}
      </div>
      <form className="mt-8 flex flex-col gap-2 sm:flex-row sm:items-end" onSubmit={(event) => { event.preventDefault(); api.grant(identifier).then(() => setMessage("তিনি অ্যাপ্রুভ ছাড়াই পাবলিশ করতে পারবেন")).catch((err: Error) => setMessage(err.message)); }}>
        <FieldLabel label="অর্গানাইজারের ইমেইল বা ইউজারনেম" className="sm:min-w-0 sm:flex-1">
          <input className="field" value={identifier} onChange={(event) => setIdentifier(event.target.value)} />
        </FieldLabel>
        <button className="btn btn-primary shrink-0">পাবলিশের পারমিশন</button>
      </form>
      {message && <p className="mt-3 text-sm">{message}</p>}
    </main>
  );
}

function organizerLine(event: AdminEvent) {
  const person = event.organizer;
  if (!person?.id) return "";
  const name = [person.first_name, person.last_name].filter(Boolean).join(" ");
  return [name, person.username ? `@${person.username}` : "", person.email].filter(Boolean).join(" · ");
}
