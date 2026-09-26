"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AloionMark } from "@/components/aloion-mark";
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
      <h1 className="serif text-5xl">ইভেন্ট পর্যালোচনা</h1>
      <div className="mt-4 flex gap-2">
        <select className="field max-w-[14rem]" value={status} onChange={(event) => setStatus(event.target.value)}>
          {["submitted", "draft", "approved", "published", "registration_open", "rejected", "cancelled"].map((item) => <option key={item} value={item}>{statusLabel(item)}</option>)}
        </select>
      </div>
      <div className="mt-4 space-y-3">
        {events.map((event) => (
          <div key={event.id} className="card flex items-center justify-between p-4">
            <div><strong>{event.title}</strong><p className="text-sm text-[var(--muted)]">{event.organization_name}</p></div>
            <div className="flex gap-2">
              <Link className="btn btn-ghost" href={`/organizer/events/${event.id}`}>খুলুন</Link>
              {event.status === "submitted" && <button className="btn btn-primary" onClick={() => api.approve(event.id).then(() => setEvents((rows) => rows.filter((row) => row.id !== event.id)))}>অনুমোদন</button>}
            </div>
          </div>
        ))}
      </div>
      <form className="mt-8 flex gap-2" onSubmit={(event) => { event.preventDefault(); api.grant(identifier).then(() => setMessage("তিনি অনুমোদন ছাড়াই প্রকাশ করতে পারবেন")).catch((err: Error) => setMessage(err.message)); }}>
        <input className="field" placeholder="আয়োজকের ইমেইল বা ইউজারনেম" value={identifier} onChange={(event) => setIdentifier(event.target.value)} />
        <button className="btn btn-primary">প্রকাশের অনুমতি</button>
      </form>
      {message && <p className="mt-3 text-sm">{message}</p>}
    </main>
  );
}
