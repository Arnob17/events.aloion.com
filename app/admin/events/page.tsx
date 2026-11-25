"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AloionMark } from "@/components/aloion-mark";
import { FieldLabel } from "@/components/field-label";
import { ShieldCheckIcon } from "@/components/icons";
import { EmptyState, PageLoading, Section, StatusBadge, useAction, useConfirm } from "@/components/ui";
import { api, mediaURL } from "@/lib/api";
import { num, place, statusLabel, whenDay } from "@/lib/format";
import { useSession } from "@/lib/session";
import type { AdminEvent } from "@/lib/types";

const DELETABLE = new Set(["draft", "submitted", "rejected"]);
const TABS = ["submitted", "draft", "approved", "registration_open", "published", "registration_closed", "ongoing", "completed", "rejected", "cancelled"];

export default function AdminEventsPage() {
  const { user, loading, login } = useSession();
  const confirm = useConfirm();
  const act = useAction();
  const [events, setEvents] = useState<AdminEvent[] | null>(null);
  const [status, setStatus] = useState("submitted");
  const [identifier, setIdentifier] = useState("");

  useEffect(() => {
    if (user?.role !== "admin") return;
    setEvents(null);
    api.adminEvents(`?status=${status}`).then((data) => setEvents(data.events || [])).catch(() => setEvents([]));
  }, [user, status]);

  const drop = (id: number) => setEvents((rows) => (rows || []).filter((row) => row.id !== id));

  async function approve(event: AdminEvent) {
    if (!(await confirm({ title: `"${event.title}" অ্যাপ্রুভ করবেন?`, body: "অর্গানাইজার ইমেইল পাবেন এবং ইভেন্ট পাবলিশ করতে পারবেন।", confirmLabel: "অ্যাপ্রুভ" }))) return;
    if (await act(() => api.approve(event.id), "অ্যাপ্রুভ হয়েছে")) drop(event.id);
  }

  async function reject(event: AdminEvent) {
    const note = await confirm({ title: `"${event.title}" রিজেক্ট করবেন?`, body: "কারণটি অর্গানাইজার ইমেইলে ও ডেস্কে দেখবেন।", confirmLabel: "রিজেক্ট", danger: true, input: { label: "রিজেক্টের কারণ", placeholder: "কী ঠিক করতে হবে লিখুন", required: true } });
    if (!note) return;
    if (await act(() => api.reject(event.id, note), "রিজেক্ট হয়েছে")) drop(event.id);
  }

  async function remove(event: AdminEvent) {
    if (!(await confirm({ title: `"${event.title}" মুছে ফেলবেন?`, body: "এটি আর ফেরানো যাবে না।", confirmLabel: "মুছে ফেলুন", danger: true }))) return;
    if (await act(() => api.removeEvent(event.id), "মুছে ফেলা হয়েছে")) drop(event.id);
  }

  if (loading) return <PageLoading />;
  if (!user) return <main className="mx-auto max-w-lg px-4 py-14 text-center"><button className="btn btn-primary" onClick={() => login()}><AloionMark />আলোআয়ন দিয়ে চালিয়ে যান</button></main>;
  if (user.role !== "admin") return <main className="mx-auto max-w-lg px-4 py-14"><p className="notice notice-warn">ইভেন্ট রিভিউ শুধু আলোআয়ন অ্যাডমিন করতে পারেন।</p></main>;

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <p className="text-sm font-semibold text-[var(--pine)]">অ্যাডমিন</p>
      <h1 className="serif text-3xl sm:text-4xl">ইভেন্ট রিভিউ</h1>
      <p className="mt-1 text-sm muted">সাবমিট করা ইভেন্ট দেখে অ্যাপ্রুভ বা রিজেক্ট করুন। অর্গানাইজার ইমেইল পাবেন। অ্যাডমিন হিসেবে যেকোনো ইভেন্টের ডেস্ক খুলে রেজিস্ট্রেশন দেখতে ও এডিট করতে পারবেন।</p>

      <div className="tabs mt-6" role="tablist">
        {TABS.map((item) => (
          <button key={item} role="tab" className="tab" aria-selected={status === item} onClick={() => setStatus(item)}>{item === "submitted" ? "রিভিউ বাকি" : statusLabel(item)}</button>
        ))}
      </div>

      <div className="mt-5 space-y-3">
        {events === null && [0, 1].map((n) => <div key={n} className="skeleton h-36" />)}
        {events?.length === 0 && <EmptyState icon={<ShieldCheckIcon />} title={status === "submitted" ? "রিভিউয়ের জন্য কোনো ইভেন্ট নেই" : "এই অবস্থায় কোনো ইভেন্ট নেই"} />}
        {events?.map((event) => (
          <article key={event.id} className="card overflow-hidden">
            <div className="flex flex-col gap-4 p-4 sm:flex-row">
              {event.cover_image_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={mediaURL(event.cover_image_url)} alt="" className="h-28 w-full shrink-0 rounded-[var(--radius-sm)] object-cover sm:w-44" />
              )}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2"><StatusBadge status={event.status} />{event.featured && <span className="badge badge-plain badge-gold">ফিচার্ড</span>}</div>
                <h2 className="mt-1 text-lg font-bold break-words">{event.title}</h2>
                <p className="text-sm muted">{[event.organization_name || "প্রতিষ্ঠানের নাম নেই", whenDay(event.starts_at, event.timezone), place(event), `${num(event.registration_count)} জন`].join(" · ")}</p>
                <dl className="mt-3 grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
                  <div><dt className="inline muted">অ্যাকাউন্ট: </dt><dd className="inline">{organizerLine(event) || "—"}</dd></div>
                  <div><dt className="inline muted">ইমেইল: </dt><dd className="inline break-all">{event.contact_email || "—"}</dd></div>
                  <div><dt className="inline muted">ফোন: </dt><dd className="inline">{event.contact_phone || "—"}</dd></div>
                </dl>
                {event.review_note && <p className="notice notice-warn mt-3">কারণ: {event.review_note}</p>}
              </div>
            </div>
            <div className="flex flex-wrap gap-2 border-t border-[var(--line)] bg-[#faf9f6] px-4 py-3">
              {event.status === "submitted" && <button className="btn btn-primary" onClick={() => approve(event)}>অ্যাপ্রুভ</button>}
              {event.status === "submitted" && <button className="btn btn-danger-ghost" onClick={() => reject(event)}>রিজেক্ট</button>}
              <Link className="btn btn-ghost" href={`/organizer/events/${event.id}`}>ডেস্ক খুলুন</Link>
              <Link className="btn btn-quiet" href={`/events/${event.slug}`} target="_blank">পাবলিক পাতা ↗</Link>
              {DELETABLE.has(event.status) && <button className="btn btn-quiet ml-auto text-[var(--danger)]" onClick={() => remove(event)}>মুছে ফেলুন</button>}
            </div>
          </article>
        ))}
      </div>

      <div className="mt-10">
        <Section title="সরাসরি পাবলিশের অনুমতি" description="বিশ্বস্ত অর্গানাইজাররা অ্যাডমিন রিভিউ ছাড়াই ইভেন্ট পাবলিশ করতে পারবেন।">
          <form className="flex flex-col gap-2 sm:flex-row sm:items-end" onSubmit={(event) => {
            event.preventDefault();
            act(() => api.grant(identifier.trim()).then(() => setIdentifier("")), "অনুমতি দেওয়া হয়েছে");
          }}>
            <FieldLabel label="অর্গানাইজারের ইমেইল বা ইউজারনেম" className="sm:min-w-0 sm:flex-1">
              <input className="field" value={identifier} onChange={(event) => setIdentifier(event.target.value)} />
            </FieldLabel>
            <button className="btn btn-primary shrink-0" disabled={!identifier.trim()}>অনুমতি দিন</button>
          </form>
        </Section>
      </div>
    </main>
  );
}

function organizerLine(event: AdminEvent) {
  const person = event.organizer;
  if (!person?.id) return "";
  const name = [person.first_name, person.last_name].filter(Boolean).join(" ");
  return [name, person.username ? `@${person.username}` : ""].filter(Boolean).join(" ");
}
