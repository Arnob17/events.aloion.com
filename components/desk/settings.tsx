"use client";

import { useState } from "react";
import { FieldLabel } from "@/components/field-label";
import { Section, StatusBadge, useAction, useConfirm } from "@/components/ui";
import { api, mediaURL } from "@/lib/api";
import { CATEGORIES, fromLocalInput, personName, statusLabel, toLocalInput } from "@/lib/format";
import type { FAQ, Workspace } from "@/lib/types";

function formFrom(workspace: Workspace) {
  const event = workspace.event;
  return {
    title: event.title,
    summary: event.summary,
    description: event.description,
    category: event.category,
    organization_name: event.organization_name,
    contact_email: event.contact_email,
    contact_phone: event.contact_phone,
    venue: event.venue,
    address: event.address,
    map_url: event.map_url || "",
    online_url: event.online_url,
    location_type: event.location_type,
    timezone: event.timezone || "Asia/Dhaka",
    starts_at: toLocalInput(event.starts_at),
    ends_at: toLocalInput(event.ends_at),
    registration_opens_at: toLocalInput(event.registration_opens_at),
    registration_closes_at: toLocalInput(event.registration_closes_at),
    visibility: event.visibility,
    rules: event.rules,
    faq: (event.faq || []) as FAQ[],
    code_prefix: workspace.code_prefix,
    fee_amount: String(event.fee_amount || 0),
    bkash_number: event.bkash_number || "",
    nagad_number: event.nagad_number || "",
    capacity: event.capacity ? String(event.capacity) : "",
    waitlist_enabled: event.waitlist_enabled,
    allow_multiple_registrations: workspace.allow_multiple_registrations,
    cover_image_url: event.cover_image_url,
    background_image_url: event.background_image_url || "",
    gallery: event.gallery || [],
  };
}

export function Settings({ workspace, reload }: { workspace: Workspace; reload: () => Promise<void> }) {
  const event = workspace.event;
  const act = useAction();
  const initial = formFrom(workspace);
  const [form, setForm] = useState(initial);
  const [saving, setSaving] = useState(false);
  const dirty = JSON.stringify(form) !== JSON.stringify(initial);

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }
  const text = (key: keyof typeof form) => (change: { target: { value: string } }) => set(key, change.target.value as never);

  async function addImage(file: File | undefined, kind: "cover" | "background" | "gallery") {
    if (!file) return;
    await act(async () => {
      const uploaded = await api.upload(file);
      if (kind === "cover") set("cover_image_url", uploaded.url);
      else if (kind === "background") set("background_image_url", uploaded.url);
      else setForm((current) => ({ ...current, gallery: [...current.gallery, uploaded.url] }));
    }, "ছবি আপলোড হয়েছে, সেভ করতে ভুলবেন না");
  }

  async function save() {
    setSaving(true);
    await act(() => api.update(event.id, {
      ...form,
      fee_amount: Number(form.fee_amount) || 0,
      has_capacity: form.capacity !== "",
      capacity: Number(form.capacity) || undefined,
      starts_at: fromLocalInput(form.starts_at),
      ends_at: fromLocalInput(form.ends_at),
      registration_opens_at: fromLocalInput(form.registration_opens_at),
      registration_closes_at: fromLocalInput(form.registration_closes_at),
      clear_registration_opens_at: !form.registration_opens_at,
      clear_registration_closes_at: !form.registration_closes_at,
      faq: form.faq.filter((item) => item.question.trim()),
    }).then(reload), "সেটিংস সেভ হয়েছে");
    setSaving(false);
  }

  return (
    <form className="space-y-5 pb-20" onSubmit={(submit) => { submit.preventDefault(); save(); }}>
      <Section title="মূল তথ্য">
        <div className="grid gap-4">
          <FieldLabel label="ইভেন্টের নাম"><input className="field" required value={form.title} onChange={text("title")} /></FieldLabel>
          <FieldLabel label="এক লাইনে সারাংশ"><input className="field" value={form.summary} onChange={text("summary")} placeholder="তালিকা ও শেয়ারে দেখাবে" /></FieldLabel>
          <FieldLabel label="বিস্তারিত বিবরণ"><textarea className="field min-h-40" value={form.description} onChange={text("description")} /></FieldLabel>
          <div className="grid gap-4 md:grid-cols-2">
            <FieldLabel label="ক্যাটাগরি">
              <select className="field" value={form.category} onChange={text("category")}>
                <option value="">বেছে নিন</option>
                {CATEGORIES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
              </select>
            </FieldLabel>
            <FieldLabel label="আয়োজক প্রতিষ্ঠান"><input className="field" value={form.organization_name} onChange={text("organization_name")} /></FieldLabel>
            <FieldLabel label="যোগাযোগের ইমেইল"><input className="field" type="email" required value={form.contact_email} onChange={text("contact_email")} /></FieldLabel>
            <FieldLabel label="যোগাযোগের ফোন"><input className="field" inputMode="tel" required value={form.contact_phone} onChange={text("contact_phone")} placeholder="০১XXXXXXXXX" /></FieldLabel>
          </div>
        </div>
      </Section>

      <Section title="তারিখ ও লোকেশন">
        <div className="grid gap-4 md:grid-cols-2">
          <FieldLabel label="শুরু"><input className="field" type="datetime-local" value={form.starts_at} onChange={text("starts_at")} /></FieldLabel>
          <FieldLabel label="শেষ"><input className="field" type="datetime-local" value={form.ends_at} onChange={text("ends_at")} /></FieldLabel>
          <FieldLabel label="ধরন">
            <select className="field" value={form.location_type} onChange={text("location_type")}>
              <option value="physical">সরাসরি (ভেন্যুতে)</option>
              <option value="online">অনলাইন</option>
              <option value="hybrid">হাইব্রিড</option>
            </select>
          </FieldLabel>
          {form.location_type !== "online" && <FieldLabel label="ভেন্যু"><input className="field" value={form.venue} onChange={text("venue")} placeholder="যেমন স্কুল অডিটোরিয়াম" /></FieldLabel>}
          {form.location_type !== "online" && <FieldLabel label="ঠিকানা"><input className="field" value={form.address} onChange={text("address")} /></FieldLabel>}
          {form.location_type !== "online" && <FieldLabel label="গুগল ম্যাপ লিংক"><input className="field" type="url" value={form.map_url} onChange={text("map_url")} placeholder="https://maps.google.com/…" /></FieldLabel>}
          {form.location_type !== "physical" && <FieldLabel label="অনলাইন লিংক"><input className="field" type="url" value={form.online_url} onChange={text("online_url")} /></FieldLabel>}
        </div>
      </Section>

      <div id="registration" className="scroll-mt-24">
        <Section title="রেজিস্ট্রেশন" description="শেষ তারিখ পার হলে রেজিস্ট্রেশন নিজে থেকেই বন্ধ হয়ে যাবে, আলাদা করে বন্ধ করতে হবে না।">
          <div className="grid gap-4 md:grid-cols-2">
            <FieldLabel label="রেজিস্ট্রেশন শুরু">
              <input className="field" type="datetime-local" value={form.registration_opens_at} onChange={text("registration_opens_at")} />
              <span className="field-hint">খালি থাকলে রেজিস্ট্রেশন খোলার সঙ্গে সঙ্গে শুরু।</span>
            </FieldLabel>
            <FieldLabel label="রেজিস্ট্রেশনের শেষ তারিখ">
              <input className="field" type="datetime-local" value={form.registration_closes_at} onChange={text("registration_closes_at")} />
              <span className="field-hint">ইভেন্টের পাতায় কাউন্টডাউনসহ দেখাবে।</span>
            </FieldLabel>
            <FieldLabel label="মোট সিট"><input className="field" inputMode="numeric" value={form.capacity} onChange={text("capacity")} placeholder="খালি = সীমা নেই" /></FieldLabel>
            <FieldLabel label="মূল রেজিস্ট্রেশন ফি (টাকা)">
              <input className="field" inputMode="decimal" value={form.fee_amount} onChange={text("fee_amount")} />
              <span className="field-hint">সেগমেন্টের ফি আলাদা, সেগমেন্ট পাতায় দিন।</span>
            </FieldLabel>
            <FieldLabel label="বিকাশ নম্বর"><input className="field" inputMode="tel" value={form.bkash_number} onChange={text("bkash_number")} placeholder="০১XXXXXXXXX" /></FieldLabel>
            <FieldLabel label="নগদ নম্বর"><input className="field" inputMode="tel" value={form.nagad_number} onChange={text("nagad_number")} placeholder="০১XXXXXXXXX" /></FieldLabel>
          </div>
          <div className="mt-4 grid gap-2 md:grid-cols-2">
            <label className="option"><input type="checkbox" checked={form.waitlist_enabled} onChange={(e) => set("waitlist_enabled", e.target.checked)} /><span><strong>সিট পূর্ণ হলে ওয়েটলিস্ট</strong><span className="block text-sm muted">পরে সিট খালি হলে কনফার্ম করতে পারবেন</span></span></label>
            <label className="option"><input type="checkbox" checked={form.allow_multiple_registrations} onChange={(e) => set("allow_multiple_registrations", e.target.checked)} /><span><strong>একজন একাধিকবার রেজিস্টার করতে পারবেন</strong><span className="block text-sm muted">সাধারণত বন্ধ রাখুন</span></span></label>
          </div>
        </Section>
      </div>

      <Section title="ছবি">
        <div className="grid gap-4 md:grid-cols-2">
          <ImageField label="কভার" hint="তালিকা ও ইভেন্টের মূল ছবি, ১৬:৯" url={form.cover_image_url} onFile={(file) => addImage(file, "cover")} onClear={() => set("cover_image_url", "")} />
          <ImageField label="ব্যানার" hint="ইভেন্ট পাতার উপরের চওড়া ছবি" url={form.background_image_url} onFile={(file) => addImage(file, "background")} onClear={() => set("background_image_url", "")} />
        </div>
        <div className="mt-5">
          <p className="text-sm font-semibold">গ্যালারি</p>
          <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {form.gallery.map((url) => (
              <div key={url} className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={mediaURL(url)} alt="" className="aspect-[4/3] w-full rounded-[var(--radius-sm)] object-cover" />
                <button type="button" className="btn btn-ghost btn-sm absolute top-1.5 right-1.5" onClick={() => set("gallery", form.gallery.filter((item) => item !== url))}>সরান</button>
              </div>
            ))}
            <label className="grid aspect-[4/3] cursor-pointer place-items-center rounded-[var(--radius-sm)] border-2 border-dashed border-[var(--line-strong)] text-sm font-semibold muted hover:border-[var(--pine)]">
              + ছবি যোগ
              <input className="sr-only" type="file" accept="image/*" onChange={(change) => { addImage(change.target.files?.[0], "gallery"); change.target.value = ""; }} />
            </label>
          </div>
        </div>
      </Section>

      <Section title="নিয়ম ও সাধারণ প্রশ্ন">
        <FieldLabel label="নিয়মাবলি"><textarea className="field min-h-32" value={form.rules} onChange={text("rules")} /></FieldLabel>
        <div className="mt-4 space-y-3">
          {form.faq.map((item, index) => (
            <div key={index} className="grid gap-2 rounded-[var(--radius-sm)] border border-[var(--line)] p-3">
              <input className="field" placeholder="প্রশ্ন" value={item.question} onChange={(e) => set("faq", form.faq.map((row, i) => (i === index ? { ...row, question: e.target.value } : row)))} />
              <textarea className="field !min-h-16" placeholder="উত্তর" value={item.answer} onChange={(e) => set("faq", form.faq.map((row, i) => (i === index ? { ...row, answer: e.target.value } : row)))} />
              <button type="button" className="btn btn-quiet btn-sm w-fit text-[var(--danger)]" onClick={() => set("faq", form.faq.filter((_, i) => i !== index))}>এই প্রশ্ন সরান</button>
            </div>
          ))}
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => set("faq", [...form.faq, { question: "", answer: "" }])}>+ প্রশ্ন যোগ</button>
        </div>
      </Section>

      <Section title="দেখা ও কোড">
        <div className="grid gap-4 md:grid-cols-2">
          <FieldLabel label="কে দেখতে পাবে">
            <select className="field" value={form.visibility} onChange={text("visibility")}>
              <option value="public">সবাই (তালিকায় দেখাবে)</option>
              <option value="private">শুধু লিংক যাদের কাছে আছে</option>
            </select>
          </FieldLabel>
          <FieldLabel label="রেজিস্ট্রেশন নম্বরের শুরু">
            <input className="field font-mono uppercase" value={form.code_prefix} onChange={text("code_prefix")} />
            <span className="field-hint">যেমন {form.code_prefix || "SCI26"}-A1B2C3</span>
          </FieldLabel>
        </div>
      </Section>

      <Team workspace={workspace} reload={reload} />

      {dirty && <div className="fixed inset-x-0 bottom-0 z-30 border-t border-[var(--line)] bg-white/95 shadow-[var(--shadow-lg)] backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-end gap-3 px-4 py-3">
          <span className="text-sm muted">সেভ না করা পরিবর্তন আছে</span>
          <button type="button" className="btn btn-ghost" onClick={() => setForm(initial)}>বাতিল</button>
          <button className="btn btn-primary" disabled={saving}>{saving ? "সেভ হচ্ছে…" : "সেটিংস সেভ"}</button>
        </div>
      </div>}
    </form>
  );
}

function Team({ workspace, reload }: { workspace: Workspace; reload: () => Promise<void> }) {
  const event = workspace.event;
  const act = useAction();
  const confirm = useConfirm();
  const [identifier, setIdentifier] = useState("");
  const [role, setRole] = useState("manager");
  const canManage = workspace.actions.includes("manage_organizers");

  return (
    <Section title="টিম" description="ম্যানেজার রেজিস্ট্রেশন ও সেটআপ সামলাতে পারেন। ভলান্টিয়ার শুধু গেট চেক-ইন আর কাউন্টার চালাতে পারেন।">
      <ul className="divide-y divide-[var(--line)] rounded-[var(--radius-sm)] border border-[var(--line)]">
        {workspace.organizers.map((member) => (
          <li key={member.user_id} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2.5 text-sm">
            <span className="min-w-0">
              <span className="font-semibold">{personName(member.person)}</span>
              <span className="block truncate muted">{member.person.email}</span>
            </span>
            <span className="flex items-center gap-2">
              <StatusBadge status={member.role === "owner" ? "confirmed" : "not_required"} label={statusLabel(member.role)} />
              {canManage && (
                <button type="button" className="btn btn-quiet btn-sm text-[var(--danger)]" onClick={async () => {
                  if (!(await confirm({ title: `${personName(member.person)}-কে টিম থেকে সরাবেন?`, confirmLabel: "সরান", danger: true }))) return;
                  act(() => api.removeOrganizer(event.id, member.user_id).then(reload), "টিম থেকে সরানো হয়েছে");
                }}>সরান</button>
              )}
            </span>
          </li>
        ))}
      </ul>
      {canManage && (
        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-end">
          <FieldLabel label="আলোআয়ন ইমেইল বা ইউজারনেম" className="flex-1">
            <input className="field" value={identifier} onChange={(e) => setIdentifier(e.target.value)} />
          </FieldLabel>
          <FieldLabel label="রোল" className="sm:w-40">
            <select className="field" value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="manager">ম্যানেজার</option>
              <option value="scanner">ভলান্টিয়ার</option>
              <option value="owner">ওনার</option>
            </select>
          </FieldLabel>
          <button type="button" className="btn btn-primary" disabled={!identifier.trim()} onClick={() => act(() => api.addOrganizer(event.id, identifier.trim(), role).then(() => { setIdentifier(""); return reload(); }), "টিমে যোগ হয়েছে, এখনই কাজ করতে পারবেন")}>যোগ করুন</button>
        </div>
      )}
    </Section>
  );
}

function ImageField({ label, hint, url, onFile, onClear }: { label: string; hint: string; url?: string; onFile: (file?: File) => void; onClear: () => void }) {
  return (
    <div>
      <p className="text-sm font-semibold">{label}</p>
      <p className="text-xs muted">{hint}</p>
      {url ? (
        <div className="relative mt-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={mediaURL(url)} alt="" className="h-36 w-full rounded-[var(--radius-sm)] object-cover" />
          <button type="button" className="btn btn-ghost btn-sm absolute top-1.5 right-1.5" onClick={onClear}>সরান</button>
        </div>
      ) : (
        <label className="mt-2 grid h-36 cursor-pointer place-items-center rounded-[var(--radius-sm)] border-2 border-dashed border-[var(--line-strong)] text-sm font-semibold muted hover:border-[var(--pine)]">
          + ছবি আপলোড
          <input className="sr-only" type="file" accept="image/*" onChange={(change) => { onFile(change.target.files?.[0]); change.target.value = ""; }} />
        </label>
      )}
    </div>
  );
}
