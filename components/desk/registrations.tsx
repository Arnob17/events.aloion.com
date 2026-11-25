"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { FieldInput, type Answer } from "@/components/field-input";
import { FieldLabel } from "@/components/field-label";
import { SearchIcon, UsersIcon } from "@/components/icons";
import { PAY_METHODS, payMethodLabel } from "@/components/pay-method";
import { Drawer, EmptyState, StatusBadge, useAction, useConfirm, useToast } from "@/components/ui";
import { api } from "@/lib/api";
import { money, num, personName, timeOnly, when, whenDay } from "@/lib/format";
import type { Registration, Workspace } from "@/lib/types";

const PAGE = 50;

type Tab = { key: string; label: string; count: (w: Workspace) => number };

const TABS: Tab[] = [
  { key: "active", label: "সক্রিয়", count: (w) => w.counts.registrations },
  { key: "pending", label: "যাচাই বাকি", count: (w) => w.counts.pending },
  { key: "confirmed", label: "কনফার্মড", count: (w) => w.counts.confirmed },
  { key: "checked_in", label: "হাজির", count: (w) => w.counts.checked_in },
  { key: "waitlisted", label: "ওয়েটলিস্ট", count: (w) => w.counts.waitlisted },
  { key: "inactive", label: "ক্যান্সেল ও রিজেক্ট", count: (w) => w.counts.cancelled + w.counts.rejected },
];

export function Registrations({ workspace, reload }: { workspace: Workspace; reload: () => Promise<void> }) {
  const eventId = workspace.event.id;
  const confirm = useConfirm();
  const act = useAction();
  const toast = useToast();
  const [tab, setTab] = useState("active");
  const [q, setQ] = useState("");
  const [query, setQuery] = useState("");
  const [rows, setRows] = useState<Registration[] | null>(null);
  const [total, setTotal] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [open, setOpen] = useState<Registration | null>(null);
  const [tick, setTick] = useState(0);
  const canManage = workspace.actions.includes("manage_registrations");

  useEffect(() => {
    const wanted = new URLSearchParams(window.location.search).get("tab");
    if (wanted && TABS.some((item) => item.key === wanted)) setTab(wanted);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => setQuery(q.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [q]);

  const params = useMemo(() => {
    const out = new URLSearchParams();
    out.set("status", tab);
    if (query) out.set("q", query);
    return out;
  }, [tab, query]);

  useEffect(() => {
    let stale = false;
    setRows(null);
    const page = new URLSearchParams(params);
    page.set("limit", String(PAGE));
    api.registrations(eventId, `?${page}`).then((data) => {
      if (stale) return;
      setRows(data.registrations || []);
      setTotal(data.total || 0);
    }).catch((err: Error) => !stale && (setRows([]), toast(err.message, "error")));
    return () => {
      stale = true;
    };
  }, [eventId, params, tick, toast]);

  async function loadMore() {
    if (!rows) return;
    setLoadingMore(true);
    const page = new URLSearchParams(params);
    page.set("limit", String(PAGE));
    page.set("offset", String(rows.length));
    try {
      const data = await api.registrations(eventId, `?${page}`);
      setRows([...rows, ...(data.registrations || [])]);
    } finally {
      setLoadingMore(false);
    }
  }

  function changed(next?: Registration | null) {
    setTick((value) => value + 1);
    if (next !== undefined) setOpen(next);
    return reload();
  }

  async function quickConfirm(row: Registration) {
    await act(() => api.setRegistration(eventId, row.public_code, "confirm").then(() => changed()), `${personName(row.participant)} কনফার্ম হয়েছেন`);
  }

  async function clearInactive() {
    const ok = await confirm({ title: "ক্যান্সেল ও রিজেক্ট করা সব রেজিস্ট্রেশন মুছবেন?", body: `${num(total)}টি রেজিস্ট্রেশন তালিকা থেকে চিরতরে মুছে যাবে। সার্টিফিকেট থাকলে সেগুলো থেকে যাবে।`, confirmLabel: "সব মুছুন", danger: true });
    if (!ok) return;
    const all = await api.allRegistrations(eventId, "status=inactive");
    let removed = 0;
    for (const row of all) {
      try {
        await api.deleteRegistration(eventId, row.public_code);
        removed++;
      } catch {
        // Kept: it has a certificate.
      }
    }
    toast(`${num(removed)}টি রেজিস্ট্রেশন মুছে ফেলা হয়েছে`);
    changed();
  }

  const printHref = `/organizer/events/${eventId}/print?${params}`;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold">রেজিস্ট্রেশন</h2>
          <p className="text-sm muted">সারিতে ক্লিক করলে পুরো তথ্য দেখবেন ও এডিট করতে পারবেন।</p>
        </div>
        {workspace.actions.includes("export") && (
          <div className="flex flex-wrap gap-2">
            <Link href={printHref} target="_blank" className="btn btn-ghost">পিডিএফ / প্রিন্ট</Link>
            <button className="btn btn-ghost" onClick={() => act(() => api.exportRegistrations(eventId, `?${params}`, `${workspace.event.slug}-registrations.csv`))}>এক্সেল (CSV)</button>
          </div>
        )}
      </div>

      <div className="tabs" role="tablist">
        {TABS.map((item) => (
          <button key={item.key} role="tab" className="tab" aria-selected={tab === item.key} onClick={() => setTab(item.key)}>
            {item.label} <span className="tab-count">{num(item.count(workspace))}</span>
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-0 flex-1 sm:max-w-sm">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 muted" />
          <input className="field !pl-9" placeholder="নাম, ইমেইল, ফোন, নম্বর বা ট্রানজাকশন আইডি" value={q} onChange={(event) => setQ(event.target.value)} aria-label="রেজিস্ট্রেশন খুঁজুন" />
        </div>
        <span className="text-sm muted">{rows ? `${num(total)} জন` : ""}</span>
        {tab === "inactive" && canManage && total > 0 && <button className="btn btn-danger-ghost btn-sm ml-auto" onClick={clearInactive}>সব মুছে তালিকা পরিষ্কার করুন</button>}
      </div>
      {tab === "inactive" && <p className="notice notice-info">ক্যান্সেল বা রিজেক্ট করা রেজিস্ট্রেশন সক্রিয় তালিকায় দেখায় না। এখান থেকে আলাদাভাবে বা একসঙ্গে মুছে ফেলতে পারেন।</p>}

      {rows === null ? (
        <div className="space-y-2">{[0, 1, 2, 3].map((n) => <div key={n} className="skeleton h-14" />)}</div>
      ) : rows.length === 0 ? (
        <EmptyState icon={<UsersIcon />} title={query ? "কিছু পাওয়া যায়নি" : "এখানে কোনো রেজিস্ট্রেশন নেই"} body={query ? "অন্য নাম বা নম্বর দিয়ে খুঁজুন।" : undefined} />
      ) : (
        <>
          <div className="space-y-2 md:hidden">
            {rows.map((row) => (
              <button key={row.public_code} className="card block w-full p-4 text-left" onClick={() => setOpen(row)}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold break-words">{personName(row.participant)}</p>
                    <p className="font-mono text-xs muted">{row.public_code}</p>
                  </div>
                  <StatusBadge status={row.status} />
                </div>
                <p className="mt-2 text-sm muted">{[row.segments.map((segment) => segment.name).join(", "), row.amount_due > 0 ? money(row.amount_due, row.currency) : "", row.transaction_id].filter(Boolean).join(" · ")}</p>
              </button>
            ))}
          </div>
          <div className="card hidden overflow-x-auto md:block">
            <table className="table min-w-[56rem]">
              <thead>
                <tr><th>নাম</th><th>নম্বর</th><th>সেগমেন্ট</th><th>পেমেন্ট</th><th>খাবার</th><th>স্ট্যাটাস</th><th aria-label="কাজ" /></tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.public_code} className="row-link" onClick={() => setOpen(row)}>
                    <td>
                      <p className="font-semibold">{personName(row.participant)}</p>
                      <p className="text-xs muted">{row.participant.email}{row.participant.phone ? ` · ${row.participant.phone}` : ""}</p>
                    </td>
                    <td className="font-mono text-xs whitespace-nowrap">{row.public_code}<span className="block font-sans muted">{whenDay(row.registered_at)}</span></td>
                    <td className="max-w-[12rem]">{row.segments.map((segment) => segment.name).join(", ") || <span className="muted">—</span>}</td>
                    <td className="whitespace-nowrap">
                      {row.amount_due > 0 ? (
                        <>
                          <span className="font-semibold">{money(row.amount_due, row.currency)}</span>
                          <span className="block text-xs muted">{payMethodLabel(row.payment_method)} <span className="font-mono">{row.transaction_id}</span></span>
                        </>
                      ) : <span className="muted">ফ্রি</span>}
                    </td>
                    <td>{row.meal ? <>{row.meal.name}{row.meal_served_at && <span className="block text-xs text-[var(--pine)]">✓ নেওয়া হয়েছে</span>}</> : <span className="muted">—</span>}</td>
                    <td><StatusBadge status={row.status} /></td>
                    <td className="text-right" onClick={(event) => event.stopPropagation()}>
                      {canManage && row.status === "pending" && <button className="btn btn-primary btn-sm" onClick={() => quickConfirm(row)}>কনফার্ম</button>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {rows.length < total && (
            <div className="text-center">
              <button className="btn btn-ghost" disabled={loadingMore} onClick={loadMore}>{loadingMore ? "লোড হচ্ছে…" : `আরও দেখুন (${num(total - rows.length)} জন বাকি)`}</button>
            </div>
          )}
        </>
      )}

      {open && <RegistrationDrawer key={open.public_code} workspace={workspace} row={open} onClose={() => setOpen(null)} onChanged={changed} />}
    </div>
  );
}

function RegistrationDrawer({ workspace, row, onClose, onChanged }: { workspace: Workspace; row: Registration; onClose: () => void; onChanged: (next?: Registration | null) => Promise<void> }) {
  const [editing, setEditing] = useState(false);
  const canManage = workspace.actions.includes("manage_registrations");
  const confirm = useConfirm();
  const act = useAction();
  const eventId = workspace.event.id;

  async function setStatus(action: "confirm" | "reject" | "cancel") {
    if (action !== "confirm") {
      const ok = await confirm({
        title: action === "cancel" ? "রেজিস্ট্রেশন ক্যান্সেল করবেন?" : "রেজিস্ট্রেশন রিজেক্ট করবেন?",
        body: "এটি সক্রিয় তালিকা থেকে সরে যাবে। দরকার হলে পরে আবার কনফার্ম করা যাবে।",
        confirmLabel: action === "cancel" ? "ক্যান্সেল" : "রিজেক্ট",
        danger: true,
      });
      if (!ok) return;
    }
    let next: Registration | null = null;
    const done = await act(async () => { next = await api.setRegistration(eventId, row.public_code, action); }, action === "confirm" ? "কনফার্ম হয়েছে, ইমেইল গেছে" : action === "cancel" ? "ক্যান্সেল হয়েছে" : "রিজেক্ট হয়েছে");
    if (done) await onChanged(next);
  }

  async function remove() {
    const ok = await confirm({ title: "রেজিস্ট্রেশন মুছে ফেলবেন?", body: "এটি চিরতরে মুছে যাবে এবং আর ফেরানো যাবে না।", confirmLabel: "মুছে ফেলুন", danger: true });
    if (!ok) return;
    const done = await act(() => api.deleteRegistration(eventId, row.public_code), "রেজিস্ট্রেশন মুছে ফেলা হয়েছে");
    if (done) await onChanged(null);
  }

  const canConfirm = ["pending", "waitlisted", "cancelled", "rejected"].includes(row.status) && row.status !== "rejected";
  const canCancel = ["pending", "confirmed", "waitlisted"].includes(row.status);
  const inactive = row.status === "cancelled" || row.status === "rejected";

  return (
    <Drawer
      title={personName(row.participant)}
      subtitle={<span className="flex flex-wrap items-center gap-2"><span className="font-mono">{row.public_code}</span><StatusBadge status={row.status} /></span>}
      onClose={onClose}
      footer={canManage && !editing ? (
        <div className="flex flex-wrap gap-2">
          {canConfirm && <button className="btn btn-primary" onClick={() => setStatus("confirm")}>{row.status === "cancelled" ? "আবার কনফার্ম" : row.transaction_id ? "পেমেন্ট মিলেছে, কনফার্ম" : "কনফার্ম"}</button>}
          <button className="btn btn-ghost" onClick={() => setEditing(true)}>এডিট</button>
          {row.status === "pending" && <button className="btn btn-danger-ghost" onClick={() => setStatus("reject")}>রিজেক্ট</button>}
          {canCancel && <button className="btn btn-danger-ghost" onClick={() => setStatus("cancel")}>ক্যান্সেল</button>}
          {inactive && <button className="btn btn-danger" onClick={remove}>মুছে ফেলুন</button>}
        </div>
      ) : undefined}
    >
      {editing ? (
        <EditForm workspace={workspace} row={row} onCancel={() => setEditing(false)} onSaved={async (next) => { setEditing(false); await onChanged(next); }} />
      ) : (
        <Details workspace={workspace} row={row} />
      )}
    </Drawer>
  );
}

function Details({ workspace, row }: { workspace: Workspace; row: Registration }) {
  const received = new Set(row.items.map((item) => item.item_id));
  return (
    <div className="space-y-5 text-sm">
      <Group title="যোগাযোগ">
        <Line label="ইমেইল">{row.participant.email || "—"}</Line>
        <Line label="ফোন">{row.participant.phone || "—"}</Line>
        <Line label="রেজিস্ট্রেশন">{when(row.registered_at)}</Line>
        {row.checked_in_at && <Line label="গেটে হাজির">{when(row.checked_in_at)}</Line>}
      </Group>
      <Group title="সেগমেন্ট ও পেমেন্ট">
        <Line label="সেগমেন্ট">{row.segments.map((segment) => segment.name).join(", ") || "শুধু মূল ইভেন্ট"}</Line>
        <Line label="মোট ফি">{money(row.amount_due || 0, row.currency)} {row.amount_due > 0 && <StatusBadge status={row.payment_status} />}</Line>
        {row.amount_due > 0 && <Line label="পেমেন্ট">{payMethodLabel(row.payment_method) || "—"} <span className="font-mono">{row.transaction_id}</span></Line>}
      </Group>
      {(workspace.event.food_enabled || workspace.items.length > 0) && (
        <Group title="খাবার ও গিফট">
          {workspace.event.food_enabled && <Line label="খাবার">{row.meal?.name || "বাছাই নেই"}{row.meal && <span className={`ml-2 text-xs ${row.meal_served_at ? "text-[var(--pine)]" : "muted"}`}>{row.meal_served_at ? `✓ নেওয়া হয়েছে ${timeOnly(row.meal_served_at)}` : "এখনো নেননি"}</span>}</Line>}
          {workspace.items.map((item) => (
            <Line key={item.id} label={item.name}>{received.has(item.id) ? <span className="text-[var(--pine)]">✓ দেওয়া হয়েছে {whenDay(row.items.find((got) => got.item_id === item.id)?.given_at)}</span> : <span className="muted">এখনো দেওয়া হয়নি</span>}</Line>
          ))}
        </Group>
      )}
      {workspace.event.fields.length > 0 && (
        <Group title="রেজিস্ট্রেশন প্রশ্নের উত্তর">
          {workspace.event.fields.map((field) => (
            <Line key={field.id} label={field.label}>{row.answers.find((answer) => answer.field_id === field.id)?.value || <span className="muted">—</span>}</Line>
          ))}
        </Group>
      )}
    </div>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="mb-1.5 text-xs font-bold tracking-wide muted">{title}</h3>
      <dl className="divide-y divide-[var(--line)] rounded-[var(--radius-sm)] border border-[var(--line)]">{children}</dl>
    </section>
  );
}

function Line({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-0.5 px-3 py-2 sm:grid-cols-[8rem_minmax(0,1fr)] sm:gap-3">
      <dt className="muted">{label}</dt>
      <dd className="min-w-0 break-words">{children}</dd>
    </div>
  );
}

function answerState(row: Registration, workspace: Workspace) {
  const out: Record<number, Answer> = {};
  for (const field of workspace.event.fields) {
    const value = row.answers.find((answer) => answer.field_id === field.id)?.value || "";
    if (field.field_type === "multi_select") out[field.id] = { values: value ? value.split(", ") : [] };
    else if (field.field_type === "checkbox") out[field.id] = { value: value === "Yes" ? "true" : "false" };
    else out[field.id] = { value };
  }
  return out;
}

function EditForm({ workspace, row, onCancel, onSaved }: { workspace: Workspace; row: Registration; onCancel: () => void; onSaved: (next: Registration) => Promise<void> }) {
  const event = workspace.event;
  const [name, setName] = useState(personName(row.participant));
  const [email, setEmail] = useState(row.participant.email || "");
  const [phone, setPhone] = useState(row.participant.phone || "");
  const [method, setMethod] = useState(row.payment_method || "");
  const [trx, setTrx] = useState(row.transaction_id || "");
  const [mealId, setMealId] = useState(row.meal?.id || 0);
  const [segmentIds, setSegmentIds] = useState(row.segments.map((segment) => segment.id));
  const [answers, setAnswers] = useState(() => answerState(row, workspace));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function save(submit: React.FormEvent) {
    submit.preventDefault();
    setSaving(true);
    setError("");
    try {
      let next = await api.editRegistration(event.id, row.public_code, {
        name,
        email,
        phone,
        payment_method: method,
        transaction_id: trx,
        ...(event.food_enabled ? { meal_id: mealId } : {}),
        answers: event.fields.map((field) => ({ field_id: field.id, value: answers[field.id]?.value || "", values: answers[field.id]?.values || [] })),
      });
      const before = row.segments.map((segment) => segment.id).sort().join(",");
      if ([...segmentIds].sort().join(",") !== before) next = await api.setRegistrationSegments(event.id, row.public_code, segmentIds);
      await onSaved(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : "সেভ হয়নি");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="space-y-4" onSubmit={save}>
      <p className="notice notice-info">এখানে বদলালে শুধু এই রেজিস্ট্রেশনের তথ্য বদলাবে, অংশগ্রহণকারীর আলোআয়ন প্রোফাইল নয়।</p>
      <FieldLabel label="নাম"><input className="field" value={name} onChange={(e) => setName(e.target.value)} required /></FieldLabel>
      <div className="grid gap-3 sm:grid-cols-2">
        <FieldLabel label="ইমেইল"><input className="field" type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></FieldLabel>
        <FieldLabel label="ফোন"><input className="field" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} /></FieldLabel>
      </div>
      {event.segments.length > 0 && (
        <fieldset>
          <legend className="mb-1.5 text-sm font-semibold">সেগমেন্ট <span className="font-normal muted">(বদলালে ফি সেই অনুযায়ী হিসাব হবে)</span></legend>
          <div className="grid gap-2">
            {event.segments.map((segment) => (
              <label key={segment.id} className="option !py-2">
                <input type="checkbox" checked={segmentIds.includes(segment.id)} onChange={() => setSegmentIds((ids) => (ids.includes(segment.id) ? ids.filter((id) => id !== segment.id) : [...ids, segment.id]))} />
                <span className="flex-1">{segment.name}</span>
                <span className="text-sm muted">{money(segment.fee_amount, event.currency)}</span>
              </label>
            ))}
          </div>
        </fieldset>
      )}
      {(row.amount_due > 0 || row.transaction_id) && (
        <div className="grid gap-3 sm:grid-cols-2">
          <FieldLabel label="পেমেন্ট মাধ্যম">
            <select className="field" value={method} onChange={(e) => setMethod(e.target.value)}>
              <option value="">—</option>
              {PAY_METHODS.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
            </select>
          </FieldLabel>
          <FieldLabel label="ট্রানজাকশন আইডি"><input className="field font-mono" value={trx} onChange={(e) => setTrx(e.target.value)} /></FieldLabel>
        </div>
      )}
      {event.food_enabled && event.meals.length > 0 && (
        <FieldLabel label="খাবার">
          <select className="field" value={mealId} onChange={(e) => setMealId(Number(e.target.value))}>
            <option value={0}>বাছাই নেই</option>
            {event.meals.map((meal) => <option key={meal.id} value={meal.id}>{meal.name}</option>)}
          </select>
        </FieldLabel>
      )}
      {event.fields.map((field) => (
        <FieldInput key={field.id} field={field} value={answers[field.id]} onChange={(value) => setAnswers({ ...answers, [field.id]: value })} />
      ))}
      {error && <p className="notice notice-error" role="alert">{error}</p>}
      <div className="sticky bottom-0 -mx-5 flex gap-2 border-t border-[var(--line)] bg-white px-5 py-3">
        <button className="btn btn-primary" disabled={saving}>{saving ? "সেভ হচ্ছে…" : "পরিবর্তন সেভ"}</button>
        <button type="button" className="btn btn-ghost" onClick={onCancel}>বাতিল</button>
      </div>
    </form>
  );
}
