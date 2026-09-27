"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AloionMark } from "@/components/aloion-mark";
import { FieldLabel } from "@/components/field-label";
import { api } from "@/lib/api";
import { statusLabel } from "@/lib/format";
import { useSession } from "@/lib/session";
import type { EventCard } from "@/lib/types";

export default function AdminEventsPage() {
  const { user, loading, login } = useSession();
  const [events, setEvents] = useState<EventCard[]>([]);
  const [status, setStatus] = useState("submitted");
  const [identifier, setIdentifier] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (user?.role !== "admin") return;
    api.adminEvents(`?status=${status}`).then((data) => setEvents(data.events || [])).catch((err: Error) => setMessage(err.message));
  }, [user, status]);

  if (loading) return <main className="p-10">লোড হচ্ছে…</main>;
  if (!user) return <main className="p-10"><button className="btn btn-primary" onClick={() => login()}><AloionMark />আলোআয়ন দিয়ে চালিয়ে যান</button></main>;
  if (user.role !== "admin") return <main className="p-10">ইভেন্ট পর্যালোচনা শুধু আলোআয়ন অ্যাডমিন করতে পারেন।</main>;

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="serif text-4xl sm:text-5xl">ইভেন্ট পর্যালোচনা</h1>
      <div className="mt-4 flex gap-2">
        <FieldLabel label="অবস্থা" className="max-w-[14rem]">
          <select className="field" value={status} onChange={(event) => setStatus(event.target.value)}>
            {["submitted", "draft", "approved", "published", "registration_open", "rejected", "cancelled"].map((item) => <option key={item} value={item}>{statusLabel(item)}</option>)}
          </select>
        </FieldLabel>
      </div>
      <div className="mt-4 space-y-3">
        {events.map((event) => (
          <div key={event.id} className="card flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0"><strong className="break-words">{event.title}</strong><p className="text-sm text-[var(--muted)]">{event.organization_name}</p></div>
            <div className="flex flex-wrap gap-2">
              <Link className="btn btn-ghost" href={`/organizer/events/${event.id}`}>খুলুন</Link>
              {event.status === "submitted" && <button className="btn btn-primary" onClick={() => api.approve(event.id).then(() => setEvents((rows) => rows.filter((row) => row.id !== event.id)))}>অনুমোদন</button>}
            </div>
          </div>
        ))}
      </div>
      <form className="mt-8 flex flex-col gap-2 sm:flex-row sm:items-end" onSubmit={(event) => { event.preventDefault(); api.grant(identifier).then(() => setMessage("তিনি অনুমোদন ছাড়াই প্রকাশ করতে পারবেন")).catch((err: Error) => setMessage(err.message)); }}>
        <FieldLabel label="আয়োজকের ইমেইল বা ইউজারনেম" className="sm:min-w-0 sm:flex-1">
          <input className="field" value={identifier} onChange={(event) => setIdentifier(event.target.value)} />
        </FieldLabel>
        <button className="btn btn-primary shrink-0">প্রকাশের অনুমতি</button>
      </form>
      {message && <p className="mt-3 text-sm">{message}</p>}
    </main>
  );
}
