"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CheckIn } from "@/components/check-in";
import { FieldLabel } from "@/components/field-label";
import { PAY_METHODS, payMethodLabel } from "@/components/pay-method";
import { api, mediaURL } from "@/lib/api";
import { CATEGORIES, money, statusLabel, when } from "@/lib/format";
import type { Registration, Segment, Workspace } from "@/lib/types";

const NAV = [
  ["", "সামারি"],
  ["registrations", "রেজিস্ট্রেশন"],
  ["check-in", "চেক-ইন"],
  ["segments", "সেগমেন্ট"],
  ["fields", "প্রশ্ন"],
  ["food", "খাবার"],
  ["gifts", "গিফট"],
  ["certificates", "সার্টিফিকেট"],
  ["settings", "সেটিংস"],
] as const;

const ACTION_LABELS: Record<string, [string, string]> = {
  submit: ["অ্যাপ্রুভের জন্য সাবমিট", "submit"],
  publish: ["পাবলিশ", "publish"],
  open_registration: ["রেজিস্ট্রেশন খুলুন", "registration/open"],
  close_registration: ["রেজিস্ট্রেশন বন্ধ", "registration/close"],
  start: ["চলছে", "start"],
  complete: ["শেষ", "complete"],
  cancel: ["ইভেন্ট ক্যান্সেল", "cancel"],
  reopen: ["ড্রাফটে ফেরান", "reopen"],
};

export function EventDesk({ id, section }: { id: string; section: string }) {
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [error, setError] = useState("");

  async function reload() {
    try {
      setWorkspace(await api.workspace(Number(id)));
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "ইভেন্ট লোড হয়নি");
    }
  }

  useEffect(() => { reload(); }, [id]);

  if (!workspace) return <main className="p-8">{error || "ইভেন্ট লোড হচ্ছে…"}</main>;
  const base = `/organizer/events/${id}`;

  return (
    <main className={section === "check-in" ? "px-4 py-4" : "mx-auto max-w-6xl px-4 py-6"}>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-[var(--pine)]">{statusLabel(workspace.event.status)} · {workspace.role}</p>
          <h1 className="serif break-words text-3xl sm:text-4xl">{workspace.event.title}</h1>
        </div>
        <Link href={`/events/${workspace.event.slug}`} className="text-sm underline">সবার পাতা</Link>
      </div>
      <nav className="mt-4 flex gap-2 overflow-x-auto pb-2 text-sm">
        {NAV.map(([key, label]) => (
          <Link key={key} href={key ? `${base}/${key}` : base} className={`shrink-0 rounded-[0.7rem] px-3 py-2 ${section === key ? "bg-[var(--ink)] text-[var(--paper)] shadow-[0_8px_16px_-10px_rgba(28,25,21,0.7)]" : "bg-white"}`}>{label}</Link>
        ))}
      </nav>
      {error && <p className="mt-3 text-red-700">{error}</p>}
      {workspace.review_note && <p className="mt-3 rounded-[0.7rem] bg-amber-50 p-3 text-sm">রিভিউ: {workspace.review_note}</p>}
      <div className="mt-4">
        {section === "" && <Overview workspace={workspace} reload={reload} />}
        {section === "registrations" && <Registrations workspace={workspace} reload={reload} />}
        {section === "check-in" && <CheckIn eventId={workspace.event.id} />}
        {section === "segments" && <Segments workspace={workspace} reload={reload} />}
        {section === "fields" && <Fields workspace={workspace} reload={reload} />}
        {section === "food" && <Food workspace={workspace} reload={reload} />}
        {section === "gifts" && <Gifts workspace={workspace} reload={reload} />}
        {section === "certificates" && <Certificates workspace={workspace} />}
        {section === "settings" && <Settings workspace={workspace} reload={reload} />}
      </div>
    </main>
  );
}

function Overview({ workspace, reload }: { workspace: Workspace; reload: () => Promise<void> }) {
  const { counts, event } = workspace;
  const attendance = counts.attendance_rate.toFixed(2);
  async function run(action: string) {
    if (action === "approve") await api.approve(event.id);
    else if (action === "reject") {
      const note = window.prompt("অর্গানাইজার কী বদলাবেন?") || "";
      await api.reject(event.id, note);
    } else {
      const path = ACTION_LABELS[action]?.[1];
      if (path) await api.act(event.id, path);
    }
    await reload();
  }
  return (
    <div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="রেজিস্ট্রেশন" value={counts.registrations} />
        <Stat label="কনফার্মড" value={counts.confirmed} />
        <Stat label="চেক-ইন" value={counts.checked_in} />
        <Stat label="অ্যাটেনডেন্স" value={`${attendance}%`} />
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {workspace.actions.filter((action) => ACTION_LABELS[action] || action === "approve" || action === "reject").map((action) => (
          <button key={action} className="btn btn-primary" onClick={() => run(action).catch((err: Error) => alert(err.message))}>
            {ACTION_LABELS[action]?.[0] || action}
          </button>
        ))}
      </div>
      <ul className="mt-6 space-y-2 text-sm">
        <li>{workspace.checklist.has_description ? "ডিসক্রিপশন আছে" : "সেটিংসে ডিসক্রিপশন যোগ করুন"}</li>
        <li>{workspace.checklist.has_schedule ? when(event.starts_at, event.timezone) : "পাবলিশের আগে শুরুর তারিখ দিন"}</li>
        <li>{workspace.checklist.has_location ? "ভেন্যু আছে" : "ভেন্যু বা অনলাইন লিংক দিন"}</li>
        <li>ক্যাপাসিটি {counts.capacity ?? "আনলিমিটেড"} · ফি {money(event.fee_amount, event.currency)}</li>
      </ul>
      <div className="mt-6 space-y-2">
        {event.segments.map((segment) => (
          <div key={segment.id} className="flex justify-between gap-3 text-sm"><span className="min-w-0 break-words">{segment.name}</span><span className="shrink-0">{money(segment.fee_amount, event.currency)} · {segment.registration_count || 0}</span></div>
        ))}
      </div>
    </div>
  );
}

function RegistrationActions({ workspace, row, reload }: { workspace: Workspace; row: Registration; reload: () => Promise<void> }) {
  if (!workspace.actions.includes("manage_registrations")) return null;
  const canAccept = row.status === "pending" || row.status === "waitlisted" || row.status === "cancelled";
  const canCancel = row.status === "pending" || row.status === "confirmed" || row.status === "waitlisted";
  const acceptLabel = row.status === "cancelled" ? "আবার অ্যাকসেপ্ট" : row.transaction_id ? "মিলিয়ে অ্যাকসেপ্ট" : "কনফার্ম";
  return (
    <div className="flex flex-col items-start gap-2 pt-1">
      <div className="flex flex-wrap gap-2">
        {canAccept && (
          <button className="btn btn-ghost !py-2" onClick={() => api.setRegistration(workspace.event.id, row.public_code, "confirm").then(reload).catch((err: Error) => alert(err.message))}>
            {acceptLabel}
          </button>
        )}
        {canCancel && (
          <button className="btn btn-ghost !py-2" onClick={() => api.setRegistration(workspace.event.id, row.public_code, "cancel").then(reload).catch((err: Error) => alert(err.message))}>
            ক্যান্সেল
          </button>
        )}
      </div>
      {workspace.event.segments.length > 0 && <SegmentEditor workspace={workspace} row={row} reload={reload} />}
    </div>
  );
}

function SegmentEditor({ workspace, row, reload }: { workspace: Workspace; row: Registration; reload: () => Promise<void> }) {
  const segments = workspace.event.segments;
  const [open, setOpen] = useState(false);
  const [picked, setPicked] = useState<number[]>(() => row.segments.map((segment) => segment.id));
  const [saving, setSaving] = useState(false);

  function toggle(id: number) {
    setPicked((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  }

  async function save() {
    setSaving(true);
    try {
      await api.setRegistrationSegments(workspace.event.id, row.public_code, picked);
      setOpen(false);
      await reload();
    } catch (err) {
      alert(err instanceof Error ? err.message : "সেগমেন্ট বদলানো যায়নি");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <button type="button" className="btn btn-ghost !py-2" onClick={() => {
        setPicked(row.segments.map((segment) => segment.id));
        setOpen((value) => !value);
      }}>সেগমেন্ট বদলান</button>
      {open && (
        <div className="mt-2 min-w-52 space-y-2 rounded-[0.7rem] bg-[var(--paper)] p-3">
          <p className="text-xs text-[var(--muted)]">যে সেগমেন্টগুলো রাখতে চান সেগুলোতে টিক দিন। ফি সেই অনুযায়ী বদলাবে।</p>
          {segments.map((segment) => (
            <label key={segment.id} className="flex items-start gap-2 text-sm">
              <input type="checkbox" className="mt-1" checked={picked.includes(segment.id)} onChange={() => toggle(segment.id)} />
              <span className="min-w-0 break-words">{segment.name}{segment.fee_amount > 0 ? ` · ${money(segment.fee_amount, workspace.event.currency)}` : ""}</span>
            </label>
          ))}
          <button type="button" className="btn btn-primary !py-2" disabled={saving} onClick={save}>{saving ? "সেভ হচ্ছে…" : "সেগমেন্ট সেভ"}</button>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return <div className="card p-4"><p className="text-sm text-[var(--muted)]">{label}</p><p className="serif text-3xl">{value}</p></div>;
}

function Registrations({ workspace, reload }: { workspace: Workspace; reload: () => Promise<void> }) {
  const [rows, setRows] = useState<Registration[]>([]);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (status) params.set("status", status);
    const query = params.toString();
    api.registrations(workspace.event.id, query ? `?${query}` : "").then((data) => setRows(data.registrations || [])).catch(() => undefined);
  }, [workspace.event.id, q, status, tick]);
  function refresh() {
    setTick((value) => value + 1);
    return reload();
  }
  return (
    <div>
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-end">
        <FieldLabel label="সার্চ" className="sm:max-w-xs sm:flex-1">
          <input className="field" placeholder="নাম, ইমেইল, নম্বর, বা ট্রানজাকশন আইডি" value={q} onChange={(event) => setQ(event.target.value)} />
        </FieldLabel>
        <FieldLabel label="স্ট্যাটাস" className="sm:max-w-[12rem]">
          <select className="field" value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="">সব স্ট্যাটাস</option>
            {["pending", "confirmed", "waitlisted", "checked_in", "cancelled", "rejected"].map((item) => <option key={item} value={item}>{statusLabel(item)}</option>)}
          </select>
        </FieldLabel>
        {workspace.actions.includes("export") && <button className="btn btn-ghost" onClick={() => api.exportRegistrations(workspace.event.id)}>সিএসভি</button>}
      </div>
      <div className="mt-4 space-y-3 md:hidden">
        {rows.map((row) => (
          <article key={row.public_code} className="card space-y-1 p-4 text-sm">
            <p className="font-semibold">{row.participant.first_name} {row.participant.last_name}</p>
            <p className="font-mono break-all">{row.public_code}</p>
            <p className="break-all text-[var(--muted)]">{row.participant.email}</p>
            {row.segments.length > 0 && <p>{row.segments.map((segment) => segment.name).join(", ")}</p>}
            <TrxLine row={row} />
            <p>{statusLabel(row.status)}{row.checked_in_at ? " · হাজির" : ""}{row.amount_due > 0 ? ` · ${money(row.amount_due, row.currency || workspace.event.currency)} · ${statusLabel(row.payment_status)}` : ""}</p>
            <RegistrationActions workspace={workspace} row={row} reload={refresh} />
          </article>
        ))}
      </div>
      <div className="mt-4 hidden overflow-x-auto md:block">
        <table className="w-full min-w-[52rem] text-left text-sm">
          <thead><tr className="text-[var(--muted)]"><th className="py-2 pr-3">নাম</th><th className="pr-3">নম্বর</th><th className="pr-3">ইমেইল</th><th className="pr-3">সেগমেন্ট</th><th className="pr-3">ফি</th><th className="pr-3">ট্রানজাকশন আইডি</th><th className="pr-3">স্ট্যাটাস</th><th></th></tr></thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.public_code} className="border-t border-[var(--line)]">
                <td className="py-2 pr-3">{row.participant.first_name} {row.participant.last_name}</td>
                <td className="pr-3 font-mono">{row.public_code}</td>
                <td className="pr-3">{row.participant.email}</td>
                <td className="pr-3">{row.segments.map((segment) => segment.name).join(", ")}</td>
                <td className="pr-3">{money(row.amount_due || 0, row.currency || workspace.event.currency)}</td>
                <td className="pr-3"><TrxLine row={row} /></td>
                <td className="pr-3">{statusLabel(row.status)}{row.checked_in_at ? " · হাজির" : ""}{row.amount_due > 0 ? ` · ${statusLabel(row.payment_status)}` : ""}</td>
                <td><RegistrationActions workspace={workspace} row={row} reload={refresh} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function TrxLine({ row }: { row: Registration }) {
  if (!row.transaction_id && !row.payment_method) return <span className="text-[var(--muted)]">—</span>;
  const method = PAY_METHODS.find((item) => item.id === row.payment_method);
  return (
    <span className="inline-flex items-center gap-2">
      {method && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={method.logo} alt={method.label} className="h-5 w-auto" />
      )}
      <span className="font-mono break-all">{row.transaction_id || payMethodLabel(row.payment_method)}</span>
    </span>
  );
}

function localDateTime(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  const pad = (part: number) => String(part).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function Segments({ workspace, reload }: { workspace: Workspace; reload: () => Promise<void> }) {
  const [editing, setEditing] = useState<Segment | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [capacity, setCapacity] = useState("");
  const [starts, setStarts] = useState("");
  const [fee, setFee] = useState("");

  function reset() {
    setEditing(null);
    setName("");
    setDescription("");
    setLocation("");
    setCapacity("");
    setStarts("");
    setFee("");
  }

  function edit(segment: Segment) {
    setEditing(segment);
    setName(segment.name);
    setDescription(segment.description || "");
    setLocation(segment.location || "");
    setCapacity(segment.capacity ? String(segment.capacity) : "");
    setStarts(localDateTime(segment.starts_at));
    setFee(segment.fee_amount ? String(segment.fee_amount) : "");
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-[var(--muted)]">প্রতিটি সেগমেন্টের নিজস্ব এন্ট্রি ফি দিন। শিক্ষার্থী যে সেগমেন্টগুলো বেছে নেবে, সেগুলোর ফি যোগ হয়ে মোট দেখাবে।</p>
      {workspace.event.segments.map((segment) => (
        <div key={segment.id} className="card flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <strong className="break-words">{segment.name}</strong>
            <p className="text-sm text-[var(--muted)]">{[segment.description, segment.location].filter(Boolean).join(" · ")}</p>
            <p className="text-xs text-[var(--muted)]">{money(segment.fee_amount, workspace.event.currency)} · {segment.registration_count || 0} জন{segment.capacity ? ` / ${segment.capacity}` : ""}</p>
          </div>
          <div className="flex shrink-0 gap-3">
            <button className="text-sm" onClick={() => edit(segment)}>এডিট</button>
            <button className="text-sm" onClick={() => api.deleteSegment(workspace.event.id, segment.id).then(reload)}>সরান</button>
          </div>
        </div>
      ))}
      <form className="card grid gap-3 p-4" onSubmit={(event) => {
        event.preventDefault();
        api.saveSegment(workspace.event.id, {
          name,
          description,
          location,
          eligibility: editing?.eligibility || "",
          officials: editing?.officials || "",
          has_capacity: capacity !== "",
          capacity: Number(capacity) || undefined,
          starts_at: starts ? new Date(starts).toISOString() : undefined,
          fee_amount: Number(fee) || 0,
        }, editing?.id).then(() => { reset(); reload(); });
      }}>
        <FieldLabel label="সেগমেন্টের নাম">
          <input className="field" placeholder="প্রকল্প প্রদর্শনী" value={name} onChange={(event) => setName(event.target.value)} required />
        </FieldLabel>
        <FieldLabel label="ডিসক্রিপশন">
          <input className="field" placeholder="এই সেগমেন্ট কী" value={description} onChange={(event) => setDescription(event.target.value)} />
        </FieldLabel>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          <FieldLabel label="ভেন্যু">
            <input className="field" placeholder="কক্ষ বা মঞ্চ" value={location} onChange={(event) => setLocation(event.target.value)} />
          </FieldLabel>
          <FieldLabel label="শুরু">
            <input className="field" type="datetime-local" value={starts} onChange={(event) => setStarts(event.target.value)} />
          </FieldLabel>
          <FieldLabel label="ক্যাপাসিটি">
            <input className="field" placeholder="খালি থাকলে আনলিমিটেড" value={capacity} onChange={(event) => setCapacity(event.target.value)} />
          </FieldLabel>
          <FieldLabel label="এন্ট্রি ফি, টাকায়">
            <input className="field" inputMode="decimal" placeholder="০" value={fee} onChange={(event) => setFee(event.target.value)} />
          </FieldLabel>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className="btn btn-primary w-fit">{editing ? "সেগমেন্ট আপডেট" : "সেগমেন্ট যোগ"}</button>
          {editing && <button className="btn btn-ghost w-fit" type="button" onClick={reset}>বাতিল</button>}
        </div>
      </form>
    </div>
  );
}

function Fields({ workspace, reload }: { workspace: Workspace; reload: () => Promise<void> }) {
  const [label, setLabel] = useState("");
  const [fieldType, setFieldType] = useState("text");
  const [options, setOptions] = useState("");
  const [required, setRequired] = useState(false);
  return (
    <div className="space-y-3">
      {workspace.event.fields.map((field) => (
        <div key={field.id} className="card flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between"><span className="min-w-0 break-words">{field.label} · {field.field_type}</span><button className="shrink-0 text-sm" onClick={() => api.deleteField(workspace.event.id, field.id).then(reload)}>সরান</button></div>
      ))}
      <form className="card grid gap-3 p-4" onSubmit={(event) => {
        event.preventDefault();
        api.saveField(workspace.event.id, { label, field_type: fieldType, required, options: options.split(",").map((item) => item.trim()).filter(Boolean) }).then(() => { setLabel(""); reload(); });
      }}>
        <FieldLabel label="প্রশ্ন">
          <input className="field" placeholder="শিক্ষাপ্রতিষ্ঠান" value={label} onChange={(event) => setLabel(event.target.value)} />
        </FieldLabel>
        <FieldLabel label="টাইপ">
          <select className="field" value={fieldType} onChange={(event) => setFieldType(event.target.value)}>
            {["text", "long_text", "number", "email", "phone", "date", "dropdown", "multi_select", "radio", "checkbox", "file"].map((type) => <option key={type}>{type}</option>)}
          </select>
        </FieldLabel>
        <FieldLabel label="অপশন">
          <input className="field" placeholder="কমা দিয়ে লিখুন" value={options} onChange={(event) => setOptions(event.target.value)} />
        </FieldLabel>
        <label className="text-sm"><input type="checkbox" checked={required} onChange={(event) => setRequired(event.target.checked)} /> রিকোয়ার্ড</label>
        <button className="btn btn-primary">প্রশ্ন যোগ</button>
      </form>
    </div>
  );
}

function Food({ workspace, reload }: { workspace: Workspace; reload: () => Promise<void> }) {
  const [name, setName] = useState("");
  return (
    <div>
      <label className="text-sm"><input type="checkbox" checked={workspace.event.food_enabled} onChange={(event) => api.update(workspace.event.id, { food_enabled: event.target.checked }).then(reload)} /> খাবার থাকবে</label>
      <div className="mt-4 space-y-2">
        {workspace.event.meals.map((meal) => (
          <div key={meal.id} className="card flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between"><span className="min-w-0 break-words">{meal.name} · {meal.count || 0} জন</span><button className="shrink-0 text-sm" onClick={() => api.deleteMeal(workspace.event.id, meal.id).then(reload)}>সরান</button></div>
        ))}
      </div>
      <form className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-end" onSubmit={(event) => { event.preventDefault(); api.saveMeal(workspace.event.id, { name, category: "meal" }).then(() => { setName(""); reload(); }); }}>
        <FieldLabel label="খাবারের নাম" className="sm:min-w-0 sm:flex-1">
          <input className="field" placeholder="নিরামিষ দুপুর" value={name} onChange={(event) => setName(event.target.value)} />
        </FieldLabel>
        <button className="btn btn-primary shrink-0">খাবার যোগ</button>
      </form>
    </div>
  );
}

function Gifts({ workspace, reload }: { workspace: Workspace; reload: () => Promise<void> }) {
  const [name, setName] = useState("");
  const [kind, setKind] = useState("tshirt");
  const [code, setCode] = useState("");
  return (
    <div className="space-y-3">
      {workspace.items.map((item) => (
        <div key={item.id} className="card p-4">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between"><strong className="break-words">{item.name}</strong><span>{item.distributed}{item.quantity != null ? ` / ${item.quantity}` : ""} দেওয়া</span></div>
          <form className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-end" onSubmit={(event) => { event.preventDefault(); api.distribute(workspace.event.id, item.id, code).then(() => { setCode(""); reload(); }); }}>
            <FieldLabel label="রেজিস্ট্রেশন নম্বর" className="sm:min-w-0 sm:flex-1">
              <input className="field" value={code} onChange={(event) => setCode(event.target.value)} />
            </FieldLabel>
            <button className="btn btn-ghost shrink-0">দেওয়া হয়েছে</button>
          </form>
        </div>
      ))}
      <form className="grid items-end gap-2 sm:grid-cols-[minmax(0,1fr)_10rem_auto]" onSubmit={(event) => { event.preventDefault(); api.saveItem(workspace.event.id, { name, kind }).then(() => { setName(""); reload(); }); }}>
        <FieldLabel label="আইটেমের নাম">
          <input className="field" placeholder="টি-শার্ট" value={name} onChange={(event) => setName(event.target.value)} />
        </FieldLabel>
        <FieldLabel label="টাইপ">
          <select className="field" value={kind} onChange={(event) => setKind(event.target.value)}>
            {["tshirt", "certificate", "gift", "goodie", "prize", "other"].map((item) => <option key={item}>{item}</option>)}
          </select>
        </FieldLabel>
        <button className="btn btn-primary">আইটেম যোগ</button>
      </form>
    </div>
  );
}

function Certificates({ workspace }: { workspace: Workspace }) {
  const [code, setCode] = useState("");
  const [rows, setRows] = useState<{ hash: string; recipient_name: string; title: string }[]>([]);
  useEffect(() => { api.certificates(workspace.event.id).then((data) => setRows(data.certificates || [])).catch(() => undefined); }, [workspace.event.id]);
  return (
    <div>
      <form className="flex flex-col gap-2 sm:flex-row sm:items-end" onSubmit={(event) => { event.preventDefault(); api.issueCertificate(workspace.event.id, code).then(() => api.certificates(workspace.event.id).then((data) => setRows(data.certificates || []))); }}>
        <FieldLabel label="রেজিস্ট্রেশন নম্বর" className="sm:min-w-0 sm:flex-1">
          <input className="field" placeholder="চেক-ইন হওয়া রেজিস্ট্রেশন" value={code} onChange={(event) => setCode(event.target.value)} />
        </FieldLabel>
        <button className="btn btn-primary shrink-0">ইস্যু</button>
      </form>
      <ul className="mt-4 space-y-2">{rows.map((row) => <li key={row.hash} className="card p-3">{row.recipient_name} · {row.title}</li>)}</ul>
    </div>
  );
}

function Settings({ workspace, reload }: { workspace: Workspace; reload: () => Promise<void> }) {
  const event = workspace.event;
  const [form, setForm] = useState({
    title: event.title,
    summary: event.summary,
    description: event.description,
    category: event.category,
    organization_name: event.organization_name,
    contact_email: event.contact_email,
    venue: event.venue,
    address: event.address,
    online_url: event.online_url,
    location_type: event.location_type,
    timezone: event.timezone || "Asia/Dhaka",
    starts_at: event.starts_at ? event.starts_at.slice(0, 16) : "",
    ends_at: event.ends_at ? event.ends_at.slice(0, 16) : "",
    visibility: event.visibility,
    rules: event.rules,
    code_prefix: workspace.code_prefix,
    fee_amount: String(event.fee_amount || 0),
    bkash_number: event.bkash_number || "",
    nagad_number: event.nagad_number || "",
    capacity: event.capacity ? String(event.capacity) : "",
    cover_image_url: event.cover_image_url,
    background_image_url: event.background_image_url || "",
    gallery: event.gallery || [],
  });
  const [identifier, setIdentifier] = useState("");
  const [role, setRole] = useState("manager");
  const [staffNote, setStaffNote] = useState("");

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function addImage(file: File | undefined, kind: "cover" | "background" | "gallery") {
    if (!file) return;
    const uploaded = await api.upload(file);
    if (kind === "cover") set("cover_image_url", uploaded.url);
    else if (kind === "background") set("background_image_url", uploaded.url);
    else set("gallery", [...form.gallery, uploaded.url]);
  }

  return (
    <div className="grid gap-6">
      <form className="grid gap-3" onSubmit={(submitEvent) => {
        submitEvent.preventDefault();
        api.update(event.id, {
          ...form,
          fee_amount: Number(form.fee_amount) || 0,
          has_capacity: form.capacity !== "",
          capacity: Number(form.capacity) || undefined,
          starts_at: form.starts_at ? new Date(form.starts_at).toISOString() : undefined,
          ends_at: form.ends_at ? new Date(form.ends_at).toISOString() : undefined,
        }).then(reload).catch((err: Error) => alert(err.message));
      }}>
        <FieldLabel label="নাম">
          <input className="field" value={form.title} onChange={(event) => set("title", event.target.value)} />
        </FieldLabel>
        <FieldLabel label="সামারি">
          <textarea className="field" value={form.summary} onChange={(event) => set("summary", event.target.value)} />
        </FieldLabel>
        <FieldLabel label="ডিসক্রিপশন">
          <textarea className="field min-h-32" value={form.description} onChange={(event) => set("description", event.target.value)} />
        </FieldLabel>
        <div className="grid gap-3 md:grid-cols-2">
          <FieldLabel label="ক্যাটাগরি">
            <select className="field" value={form.category} onChange={(event) => set("category", event.target.value)}>
              <option value="">ক্যাটাগরি</option>
              {CATEGORIES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
            </select>
          </FieldLabel>
          <FieldLabel label="অর্গানাইজেশন">
            <input className="field" value={form.organization_name} onChange={(event) => set("organization_name", event.target.value)} />
          </FieldLabel>
          <FieldLabel label="শুরু">
            <input className="field" value={form.starts_at} type="datetime-local" onChange={(event) => set("starts_at", event.target.value)} />
          </FieldLabel>
          <FieldLabel label="শেষ">
            <input className="field" value={form.ends_at} type="datetime-local" onChange={(event) => set("ends_at", event.target.value)} />
          </FieldLabel>
          <FieldLabel label="টাইপ">
            <select className="field" value={form.location_type} onChange={(event) => set("location_type", event.target.value)}>
              <option value="physical">ফিজিক্যাল</option>
              <option value="online">অনলাইন</option>
              <option value="hybrid">হাইব্রিড</option>
            </select>
          </FieldLabel>
          <FieldLabel label="টাইমজোন">
            <input className="field" value={form.timezone} onChange={(event) => set("timezone", event.target.value)} />
          </FieldLabel>
          <FieldLabel label="ভেন্যু">
            <input className="field" value={form.venue} onChange={(event) => set("venue", event.target.value)} />
          </FieldLabel>
          <FieldLabel label="অ্যাড্রেস">
            <input className="field" value={form.address} onChange={(event) => set("address", event.target.value)} />
          </FieldLabel>
          <FieldLabel label="অনলাইন লিংক">
            <input className="field" value={form.online_url} onChange={(event) => set("online_url", event.target.value)} />
          </FieldLabel>
          <FieldLabel label="মূল রেজিস্ট্রেশন ফি">
            <input className="field" inputMode="decimal" value={form.fee_amount} onChange={(event) => set("fee_amount", event.target.value)} />
          </FieldLabel>
          <FieldLabel label="বিকাশ নম্বর">
            <input className="field" inputMode="tel" value={form.bkash_number} onChange={(event) => set("bkash_number", event.target.value)} placeholder="০১XXXXXXXXX" />
          </FieldLabel>
          <FieldLabel label="নগদ নম্বর">
            <input className="field" inputMode="tel" value={form.nagad_number} onChange={(event) => set("nagad_number", event.target.value)} placeholder="০১XXXXXXXXX" />
          </FieldLabel>
          <FieldLabel label="ক্যাপাসিটি">
            <input className="field" value={form.capacity} onChange={(event) => set("capacity", event.target.value)} placeholder="খালি থাকলে আনলিমিটেড" />
          </FieldLabel>
          <FieldLabel label="ভিজিবিলিটি">
            <select className="field" value={form.visibility} onChange={(event) => set("visibility", event.target.value)}>
              <option value="public">পাবলিক</option>
              <option value="private">প্রাইভেট</option>
            </select>
          </FieldLabel>
          <FieldLabel label="কোড প্রিফিক্স">
            <input className="field" value={form.code_prefix} onChange={(event) => set("code_prefix", event.target.value)} />
          </FieldLabel>
        </div>
        <FieldLabel label="রুলস">
          <textarea className="field" value={form.rules} onChange={(event) => set("rules", event.target.value)} />
        </FieldLabel>
        <div className="grid gap-4 md:grid-cols-2">
          <ImageField label="কভার" hint="লিস্ট ও ইভেন্টের মূল ছবি" url={form.cover_image_url} onFile={(file) => addImage(file, "cover")} onClear={() => set("cover_image_url", "")} />
          <ImageField label="ব্যাকগ্রাউন্ড" hint="ইভেন্ট পাতার উপরের বড় ছবি" url={form.background_image_url} onFile={(file) => addImage(file, "background")} onClear={() => set("background_image_url", "")} />
        </div>
        <div>
          <p className="text-sm">আরও ছবি</p>
          <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {form.gallery.map((url) => (
              <div key={url} className="relative">
                <img src={mediaURL(url)} alt="" className="aspect-[4/3] w-full rounded-[0.55rem] object-cover" />
                <button type="button" className="absolute top-1 right-1 rounded-[0.4rem] bg-white px-2 py-1 text-xs" onClick={() => set("gallery", form.gallery.filter((item) => item !== url))}>সরান</button>
              </div>
            ))}
          </div>
          <label className="mt-2 block text-sm">
            ছবি যোগ
            <input className="mt-1 block" type="file" accept="image/*" onChange={(change) => { addImage(change.target.files?.[0], "gallery").catch((err: Error) => alert(err.message)); change.target.value = ""; }} />
          </label>
        </div>
        <button className="btn btn-primary w-full sm:w-fit">সেটিংস সেভ</button>
      </form>
      <section className="card p-4">
        <h2 className="serif text-2xl">অর্গানাইজার</h2>
        <p className="mt-1 text-sm text-[var(--muted)]">ইমেইল বা ইউজারনেম দিলেই তিনি এখনই এই ইভেন্ট চালাতে পারবেন। আলাদা করে অ্যাকসেপ্ট করতে হবে না।</p>
        <ul className="mt-3 space-y-2">{workspace.organizers.map((member) => (
          <li key={member.user_id} className="flex flex-col gap-1 text-sm sm:flex-row sm:items-center sm:justify-between">
            <span className="min-w-0 break-words">{member.person.first_name} {member.person.last_name} · {statusLabel(member.role)}</span>
            {workspace.actions.includes("manage_organizers") && <button type="button" onClick={() => api.removeOrganizer(event.id, member.user_id).then(reload).catch((err: Error) => alert(err.message))}>সরান</button>}
          </li>
        ))}</ul>
        {workspace.actions.includes("manage_organizers") && (
          <div className="mt-3 flex flex-wrap items-end gap-2">
            <FieldLabel label="ইমেইল বা ইউজারনেম" className="w-full sm:max-w-xs">
              <input className="field" value={identifier} onChange={(event) => setIdentifier(event.target.value)} />
            </FieldLabel>
            <FieldLabel label="রোল" className="w-full sm:max-w-[10rem]">
            <select className="field" value={role} onChange={(event) => setRole(event.target.value)}>
              <option value="manager">ম্যানেজার</option>
              <option value="scanner">চেক-ইন</option>
              <option value="owner">ওনার</option>
            </select>
            </FieldLabel>
            <button type="button" className="btn btn-primary" onClick={() => {
              api.addOrganizer(event.id, identifier, role).then(() => {
                setIdentifier("");
                setStaffNote("যোগ করা হয়েছে। তিনি এখনই অর্গানাইজ করতে পারবেন।");
                return reload();
              }).catch((err: Error) => setStaffNote(err.message));
            }}>যোগ করুন</button>
          </div>
        )}
        {staffNote && <p className="mt-2 text-sm">{staffNote}</p>}
      </section>
    </div>
  );
}

function ImageField({ label, hint, url, onFile, onClear }: { label: string; hint: string; url?: string; onFile: (file?: File) => Promise<void>; onClear: () => void }) {
  return (
    <div>
      <p className="text-sm">{label}</p>
      <p className="text-sm text-[var(--muted)]">{hint}</p>
      {url && (
        <div className="relative mt-2">
          <img src={mediaURL(url)} alt="" className="h-32 w-full rounded-[0.55rem] object-cover" />
          <button type="button" className="absolute top-1 right-1 rounded-[0.4rem] bg-white px-2 py-1 text-xs" onClick={onClear}>সরান</button>
        </div>
      )}
      <input className="mt-2 block text-sm" type="file" accept="image/*" onChange={(change) => { onFile(change.target.files?.[0]).catch((err: Error) => alert(err.message)); change.target.value = ""; }} />
    </div>
  );
}
