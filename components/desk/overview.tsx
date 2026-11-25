"use client";

import Link from "next/link";
import { Section, Stat, useAction, useConfirm } from "@/components/ui";
import { api } from "@/lib/api";
import { money, num, registrationWindow, timeLeft, when } from "@/lib/format";
import type { Workspace } from "@/lib/types";

type Action = { label: string; path?: string; tone: "primary" | "ghost" | "danger"; confirm?: { title: string; body: string } };

const ACTIONS: Record<string, Action> = {
  submit: { label: "অ্যাপ্রুভের জন্য পাঠান", path: "submit", tone: "primary", confirm: { title: "অ্যাডমিনের কাছে পাঠাবেন?", body: "অ্যাডমিন অ্যাপ্রুভ করলে ইমেইল পাবেন, তারপর পাবলিশ করা যাবে।" } },
  publish: { label: "পাবলিশ করুন", path: "publish", tone: "primary", confirm: { title: "ইভেন্ট পাবলিশ করবেন?", body: "পাবলিশ করলে সবাই ইভেন্টের পাতা দেখতে পাবে। রেজিস্ট্রেশন আলাদা করে খুলতে হবে।" } },
  open_registration: { label: "রেজিস্ট্রেশন খুলুন", path: "registration/open", tone: "primary" },
  close_registration: { label: "রেজিস্ট্রেশন বন্ধ করুন", path: "registration/close", tone: "ghost", confirm: { title: "রেজিস্ট্রেশন বন্ধ করবেন?", body: "নতুন কেউ রেজিস্ট্রেশন করতে পারবে না। পরে আবার খোলা যাবে।" } },
  start: { label: "ইভেন্ট শুরু (চলছে)", path: "start", tone: "ghost" },
  complete: { label: "ইভেন্ট শেষ", path: "complete", tone: "ghost", confirm: { title: "ইভেন্ট শেষ হিসেবে চিহ্নিত করবেন?", body: "এরপর সার্টিফিকেট ইস্যু করা যাবে।" } },
  reopen: { label: "আবার ড্রাফটে আনুন", path: "reopen", tone: "ghost" },
  cancel: { label: "ইভেন্ট ক্যান্সেল", path: "cancel", tone: "danger", confirm: { title: "পুরো ইভেন্ট ক্যান্সেল করবেন?", body: "ইভেন্টটি ক্যান্সেল দেখাবে। রেজিস্ট্রেশনকারীদের আলাদা করে জানাতে হবে।" } },
  approve: { label: "অ্যাপ্রুভ", tone: "primary" },
  reject: { label: "রিজেক্ট", tone: "danger" },
  delete: { label: "ইভেন্ট মুছে ফেলুন", tone: "danger" },
};

const STATUS_HINT: Record<string, string> = {
  draft: "ড্রাফট অবস্থায় শুধু আপনার টিম দেখতে পায়। সব তথ্য দিয়ে অ্যাপ্রুভের জন্য পাঠান।",
  submitted: "অ্যাডমিন রিভিউ করছেন। অ্যাপ্রুভ হলে ইমেইল পাবেন।",
  approved: "অ্যাপ্রুভ হয়েছে। এখন পাবলিশ করুন।",
  rejected: "অ্যাডমিন রিজেক্ট করেছেন। নোট দেখে ঠিক করুন, তারপর আবার ড্রাফটে এনে পাঠান।",
  published: "ইভেন্টের পাতা সবাই দেখছে। রেজিস্ট্রেশন খুলুন।",
  registration_open: "রেজিস্ট্রেশন চলছে।",
  registration_closed: "রেজিস্ট্রেশন বন্ধ। দরকার হলে আবার খুলতে পারেন।",
  ongoing: "ইভেন্ট চলছে। গেটে চেক-ইন আর কাউন্টারে খাবার ও গিফট দিন।",
  completed: "ইভেন্ট শেষ। সার্টিফিকেট ইস্যু করুন।",
  cancelled: "ইভেন্ট ক্যান্সেল হয়েছে।",
};

export function Overview({ workspace, reload }: { workspace: Workspace; reload: () => Promise<void> }) {
  const { counts, event } = workspace;
  const confirm = useConfirm();
  const act = useAction();
  const base = `/organizer/events/${event.id}`;
  const actions = workspace.actions.filter((action) => ACTIONS[action]);
  const windowState = registrationWindow(event);
  const fee = event.fee_amount > 0 || event.segments.some((segment) => segment.fee_amount > 0);

  async function run(action: string) {
    const spec = ACTIONS[action];
    if (action === "reject") {
      const note = await confirm({ title: "রিজেক্টের কারণ", body: "অর্গানাইজার এই নোট দেখবেন।", confirmLabel: "রিজেক্ট করুন", danger: true, input: { label: "কারণ", required: true } });
      if (!note) return;
      return act(() => api.reject(event.id, note).then(reload), "রিজেক্ট হয়েছে");
    }
    if (action === "delete") {
      const ok = await confirm({ title: "ইভেন্ট মুছে ফেলবেন?", body: "এটি আর ফেরানো যাবে না।", confirmLabel: "মুছে ফেলুন", danger: true });
      if (!ok) return;
      const done = await act(() => api.removeEvent(event.id), "ইভেন্ট মুছে ফেলা হয়েছে");
      if (done) window.location.href = "/organizer";
      return;
    }
    if (spec.confirm) {
      const ok = await confirm({ ...spec.confirm, confirmLabel: spec.label, danger: spec.tone === "danger" });
      if (!ok) return;
    }
    if (action === "approve") return act(() => api.approve(event.id).then(reload), "অ্যাপ্রুভ হয়েছে");
    return act(() => api.act(event.id, spec.path!).then(reload), "স্ট্যাটাস বদলানো হয়েছে");
  }

  const checklist = [
    { done: workspace.checklist.has_description, label: "ইভেন্টের বিবরণ", href: `${base}/settings` },
    { done: workspace.checklist.has_schedule, label: "শুরুর তারিখ ও সময়", href: `${base}/settings` },
    { done: workspace.checklist.has_location, label: "ভেন্যু বা অনলাইন লিংক", href: `${base}/settings` },
    { done: Boolean(event.registration_closes_at), label: "রেজিস্ট্রেশনের শেষ তারিখ", href: `${base}/settings` },
    ...(fee ? [{ done: Boolean(event.bkash_number || event.nagad_number), label: "বিকাশ বা নগদ নম্বর", href: `${base}/settings` }] : []),
    { done: Boolean(event.cover_image_url), label: "কভার ছবি", href: `${base}/settings` },
  ];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <Stat label="সক্রিয় রেজিস্ট্রেশন" value={num(counts.registrations)} hint={counts.capacity ? `${num(counts.capacity)} সিটের মধ্যে` : "সিট সীমা নেই"} />
        <Stat label="যাচাই বাকি" value={num(counts.pending)} tone={counts.pending > 0 ? "amber" : undefined} hint={counts.pending > 0 ? <Link className="font-semibold text-[var(--pine)]" href={`${base}/registrations?tab=pending`}>মিলিয়ে কনফার্ম করুন →</Link> : "সব কনফার্ম"} />
        <Stat label="গেটে হাজির" value={num(counts.checked_in)} tone="green" hint={`কনফার্মডদের ${counts.attendance_rate.toFixed(0)}%`} />
        <Stat label="খাবার দেওয়া হয়েছে" value={num(counts.meals_served)} hint={event.food_enabled ? "কাউন্টার থেকে" : "খাবার চালু নেই"} />
      </div>

      <Section title="ইভেন্টের অবস্থা" description={STATUS_HINT[event.status]}>
        {actions.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {actions.map((action) => {
              const spec = ACTIONS[action];
              const cls = spec.tone === "primary" ? "btn-primary" : spec.tone === "danger" ? "btn-danger-ghost" : "btn-ghost";
              return <button key={action} className={`btn ${cls}`} onClick={() => run(action)}>{spec.label}</button>;
            })}
          </div>
        ) : <p className="text-sm muted">এই অবস্থায় আপনার কিছু করার নেই।</p>}
      </Section>

      <div className="grid gap-5 xl:grid-cols-2">
        <Section title="রেজিস্ট্রেশনের সময়" action={workspace.actions.includes("edit") ? <Link href={`${base}/settings#registration`} className="btn btn-ghost btn-sm">বদলান</Link> : undefined}>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between gap-3"><dt className="muted">খুলবে</dt><dd className="text-right font-medium">{event.registration_opens_at ? when(event.registration_opens_at, event.timezone) : "খোলার সঙ্গে সঙ্গে"}</dd></div>
            <div className="flex justify-between gap-3"><dt className="muted">শেষ তারিখ</dt><dd className="text-right font-medium">{event.registration_closes_at ? when(event.registration_closes_at, event.timezone) : <span className="text-[var(--warn)]">দেওয়া হয়নি</span>}</dd></div>
            <div className="flex justify-between gap-3"><dt className="muted">এখন</dt><dd className="text-right font-medium">
              {windowState === "open" ? `চলছে${event.registration_closes_at ? ` · ${timeLeft(event.registration_closes_at)}` : ""}` : windowState === "ended" ? "শেষ তারিখ পার হয়েছে" : windowState === "not_yet" ? "এখনো খোলেনি" : "বন্ধ"}
            </dd></div>
            <div className="flex justify-between gap-3"><dt className="muted">মূল ফি</dt><dd className="text-right font-medium">{money(event.fee_amount, event.currency)}</dd></div>
          </dl>
        </Section>

        <Section title="প্রস্তুতি" description="অংশগ্রহণকারীরা যা দেখবেন তা সম্পূর্ণ কি না">
          <ul className="space-y-1.5 text-sm">
            {checklist.map((item) => (
              <li key={item.label} className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-2">
                  <span className={`grid h-5 w-5 place-items-center rounded-full text-xs ${item.done ? "bg-[var(--pine)] text-white" : "border border-[var(--line-strong)]"}`}>{item.done ? "✓" : ""}</span>
                  <span className={item.done ? "" : "font-semibold"}>{item.label}</span>
                </span>
                {!item.done && workspace.actions.includes("edit") && <Link href={item.href} className="text-xs font-semibold text-[var(--pine)]">যোগ করুন</Link>}
              </li>
            ))}
          </ul>
        </Section>
      </div>

      {(event.segments.length > 0 || event.meals.length > 0 || workspace.items.length > 0) && (
        <div className="grid gap-5 xl:grid-cols-3">
          {event.segments.length > 0 && (
            <Section title="সেগমেন্ট">
              <Bars rows={event.segments.map((segment) => ({ label: segment.name, value: segment.registration_count || 0, max: segment.capacity || undefined }))} />
            </Section>
          )}
          {event.food_enabled && event.meals.length > 0 && (
            <Section title="খাবারের বাছাই">
              <Bars rows={event.meals.map((meal) => ({ label: meal.name, value: meal.count || 0 }))} />
            </Section>
          )}
          {workspace.items.length > 0 && (
            <Section title="গিফট বিতরণ">
              <Bars rows={workspace.items.map((item) => ({ label: item.name, value: item.distributed, max: item.quantity ?? (counts.confirmed + counts.checked_in || undefined) }))} />
            </Section>
          )}
        </div>
      )}
    </div>
  );
}

function Bars({ rows }: { rows: { label: string; value: number; max?: number }[] }) {
  const top = Math.max(1, ...rows.map((row) => row.max || row.value));
  return (
    <ul className="space-y-3 text-sm">
      {rows.map((row) => (
        <li key={row.label}>
          <div className="flex justify-between gap-3">
            <span className="min-w-0 truncate">{row.label}</span>
            <span className="shrink-0 font-semibold tabular-nums">{num(row.value)}{row.max ? ` / ${num(row.max)}` : ""}</span>
          </div>
          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-[var(--paper-2)]">
            <div className="h-full rounded-full bg-[var(--pine)]" style={{ width: `${Math.min(100, (row.value / (row.max || top)) * 100)}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}
