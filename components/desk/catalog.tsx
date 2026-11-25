"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { FieldLabel } from "@/components/field-label";
import { GiftIcon, HelpCircleIcon, LayersIcon, PlusIcon, UtensilsIcon } from "@/components/icons";
import { Badge, Drawer, EmptyState, Section, useAction, useConfirm } from "@/components/ui";
import { api } from "@/lib/api";
import { FIELD_TYPES, ITEM_KINDS, fieldNeedsOptions, fieldTypeLabel, fromLocalInput, itemKindLabel, money, num, toLocalInput, when } from "@/lib/format";
import type { CustomField, EventItem, Meal, Segment, Workspace } from "@/lib/types";

type Props = { workspace: Workspace; reload: () => Promise<void> };

/* A list of things with an add button; editing happens in a drawer. */
function CatalogList<T extends { id: number }>({ title, description, empty, rows, render, onAdd, addLabel }: {
  title: string;
  description: string;
  empty: { icon: ReactNode; title: string; body: string };
  rows: T[];
  render: (row: T) => ReactNode;
  onAdd: () => void;
  addLabel: string;
}) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-xl font-bold">{title}</h2>
          <p className="text-sm muted">{description}</p>
        </div>
        <button className="btn btn-primary" onClick={onAdd}><PlusIcon className="h-4 w-4" />{addLabel}</button>
      </div>
      {rows.length === 0 ? (
        <EmptyState icon={empty.icon} title={empty.title} body={empty.body} action={<button className="btn btn-primary" onClick={onAdd}><PlusIcon className="h-4 w-4" />{addLabel}</button>} />
      ) : (
        <div className="card divide-y divide-[var(--line)]">{rows.map((row) => <div key={row.id} className="px-4 py-3.5">{render(row)}</div>)}</div>
      )}
    </div>
  );
}

function RowShell({ title, meta, badges, onEdit, onDelete }: { title: string; meta?: ReactNode; badges?: ReactNode; onEdit: () => void; onDelete: () => void }) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2"><strong className="break-words">{title}</strong>{badges}</div>
        {meta && <p className="mt-0.5 text-sm muted">{meta}</p>}
      </div>
      <div className="flex shrink-0 gap-1">
        <button className="btn btn-quiet btn-sm" onClick={onEdit}>এডিট</button>
        <button className="btn btn-quiet btn-sm text-[var(--danger)]" onClick={onDelete}>মুছুন</button>
      </div>
    </div>
  );
}

function FormDrawer({ title, onClose, onSubmit, saving, children }: { title: string; onClose: () => void; onSubmit: () => void; saving: boolean; children: ReactNode }) {
  return (
    <Drawer title={title} onClose={onClose}>
      <form className="space-y-4" onSubmit={(event) => { event.preventDefault(); onSubmit(); }}>
        {children}
        <div className="sticky bottom-0 -mx-5 flex gap-2 border-t border-[var(--line)] bg-white px-5 py-3">
          <button className="btn btn-primary" disabled={saving}>{saving ? "সেভ হচ্ছে…" : "সেভ করুন"}</button>
          <button type="button" className="btn btn-ghost" onClick={onClose}>বাতিল</button>
        </div>
      </form>
    </Drawer>
  );
}

function useEditor<T>() {
  const [editing, setEditing] = useState<T | "new" | null>(null);
  const [saving, setSaving] = useState(false);
  return { editing, setEditing, saving, setSaving };
}

/* ---------- Segments ---------- */

export function Segments({ workspace, reload }: Props) {
  const event = workspace.event;
  const { editing, setEditing, saving, setSaving } = useEditor<Segment>();
  const act = useAction();
  const confirm = useConfirm();

  async function remove(segment: Segment) {
    if (!(await confirm({ title: `"${segment.name}" মুছবেন?`, body: "যাঁরা এই সেগমেন্ট বেছে নিয়েছেন তাঁদের থাকলে মোছা যাবে না।", confirmLabel: "মুছুন", danger: true }))) return;
    await act(() => api.deleteSegment(event.id, segment.id).then(reload), "সেগমেন্ট মুছে ফেলা হয়েছে");
  }

  return (
    <>
      <CatalogList
        title="সেগমেন্ট"
        description="একই ইভেন্টে আলাদা প্রতিযোগিতা বা রাউন্ড। প্রতিটির নিজস্ব ফি, সময় আর সিট থাকতে পারে।"
        empty={{ icon: <LayersIcon />, title: "কোনো সেগমেন্ট নেই", body: "অলিম্পিয়াড, কুইজ, প্রজেক্ট প্রদর্শনীর মতো আলাদা অংশ থাকলে যোগ করুন।" }}
        rows={event.segments}
        addLabel="সেগমেন্ট যোগ"
        onAdd={() => setEditing("new")}
        render={(segment) => (
          <RowShell
            title={segment.name}
            badges={<Badge tone="green" plain>{money(segment.fee_amount, event.currency)}</Badge>}
            meta={[segment.starts_at ? when(segment.starts_at, event.timezone) : "", segment.location, `${num(segment.registration_count || 0)} জন${segment.capacity ? ` / ${num(segment.capacity)}` : ""}`].filter(Boolean).join(" · ")}
            onEdit={() => setEditing(segment)}
            onDelete={() => remove(segment)}
          />
        )}
      />
      {editing && <SegmentForm workspace={workspace} segment={editing === "new" ? null : editing} saving={saving} onClose={() => setEditing(null)} onSave={async (body, id) => {
        setSaving(true);
        const ok = await act(() => api.saveSegment(event.id, body, id).then(reload), id ? "সেগমেন্ট আপডেট হয়েছে" : "সেগমেন্ট যোগ হয়েছে");
        setSaving(false);
        if (ok) setEditing(null);
      }} />}
    </>
  );
}

function SegmentForm({ segment, saving, onClose, onSave }: { workspace: Workspace; segment: Segment | null; saving: boolean; onClose: () => void; onSave: (body: object, id?: number) => void }) {
  const [form, setForm] = useState({
    name: segment?.name || "",
    description: segment?.description || "",
    location: segment?.location || "",
    eligibility: segment?.eligibility || "",
    starts: toLocalInput(segment?.starts_at),
    ends: toLocalInput(segment?.ends_at),
    capacity: segment?.capacity ? String(segment.capacity) : "",
    fee: segment?.fee_amount ? String(segment.fee_amount) : "",
  });
  const set = (key: keyof typeof form) => (event: { target: { value: string } }) => setForm({ ...form, [key]: event.target.value });
  return (
    <FormDrawer title={segment ? "সেগমেন্ট এডিট" : "নতুন সেগমেন্ট"} saving={saving} onClose={onClose} onSubmit={() => onSave({
      name: form.name,
      description: form.description,
      location: form.location,
      eligibility: form.eligibility,
      officials: segment?.officials || "",
      has_capacity: form.capacity !== "",
      capacity: Number(form.capacity) || undefined,
      starts_at: fromLocalInput(form.starts),
      ends_at: fromLocalInput(form.ends),
      fee_amount: Number(form.fee) || 0,
    }, segment?.id)}>
      <FieldLabel label="নাম"><input className="field" required placeholder="যেমন গণিত অলিম্পিয়াড" value={form.name} onChange={set("name")} /></FieldLabel>
      <FieldLabel label="বিবরণ"><textarea className="field" value={form.description} onChange={set("description")} /></FieldLabel>
      <div className="grid gap-3 sm:grid-cols-2">
        <FieldLabel label="শুরু"><input className="field" type="datetime-local" value={form.starts} onChange={set("starts")} /></FieldLabel>
        <FieldLabel label="শেষ"><input className="field" type="datetime-local" value={form.ends} onChange={set("ends")} /></FieldLabel>
        <FieldLabel label="কোথায়"><input className="field" placeholder="কক্ষ বা মঞ্চ" value={form.location} onChange={set("location")} /></FieldLabel>
        <FieldLabel label="যোগ্যতা"><input className="field" placeholder="যেমন ষষ্ঠ–দশম শ্রেণি" value={form.eligibility} onChange={set("eligibility")} /></FieldLabel>
        <FieldLabel label="এন্ট্রি ফি (টাকা)"><input className="field" inputMode="decimal" placeholder="০ = ফ্রি" value={form.fee} onChange={set("fee")} /></FieldLabel>
        <FieldLabel label="সিট সংখ্যা"><input className="field" inputMode="numeric" placeholder="খালি = সীমা নেই" value={form.capacity} onChange={set("capacity")} /></FieldLabel>
      </div>
    </FormDrawer>
  );
}

/* ---------- Registration questions ---------- */

export function Fields({ workspace, reload }: Props) {
  const event = workspace.event;
  const { editing, setEditing, saving, setSaving } = useEditor<CustomField>();
  const act = useAction();
  const confirm = useConfirm();

  async function remove(field: CustomField) {
    if (!(await confirm({ title: `"${field.label}" প্রশ্নটি মুছবেন?`, body: "আগে যাঁরা উত্তর দিয়েছেন, সেই উত্তরও আর দেখাবে না।", confirmLabel: "মুছুন", danger: true }))) return;
    await act(() => api.deleteField(event.id, field.id).then(reload), "প্রশ্ন মুছে ফেলা হয়েছে");
  }

  return (
    <>
      <CatalogList
        title="রেজিস্ট্রেশন প্রশ্ন"
        description="নাম ও ইমেইল আলোআয়ন অ্যাকাউন্ট থেকে আসে। এর বাইরে যা জানতে চান, যেমন প্রতিষ্ঠান, শ্রেণি বা টি-শার্টের সাইজ, এখানে যোগ করুন।"
        empty={{ icon: <HelpCircleIcon />, title: "কোনো প্রশ্ন নেই", body: "রেজিস্ট্রেশনের সময় অংশগ্রহণকারীর কাছ থেকে যা জানতে চান, প্রশ্ন হিসেবে যোগ করুন।" }}
        rows={event.fields}
        addLabel="প্রশ্ন যোগ"
        onAdd={() => setEditing("new")}
        render={(field) => (
          <RowShell
            title={field.label}
            badges={<>{field.required && <Badge tone="amber" plain>বাধ্যতামূলক</Badge>}<Badge plain>{fieldTypeLabel(field.field_type)}</Badge></>}
            meta={field.options.length > 0 ? field.options.join(" · ") : field.description}
            onEdit={() => setEditing(field)}
            onDelete={() => remove(field)}
          />
        )}
      />
      {editing && <FieldForm field={editing === "new" ? null : editing} saving={saving} onClose={() => setEditing(null)} onSave={async (body, id) => {
        setSaving(true);
        const ok = await act(() => api.saveField(event.id, body, id).then(reload), id ? "প্রশ্ন আপডেট হয়েছে" : "প্রশ্ন যোগ হয়েছে");
        setSaving(false);
        if (ok) setEditing(null);
      }} />}
    </>
  );
}

function FieldForm({ field, saving, onClose, onSave }: { field: CustomField | null; saving: boolean; onClose: () => void; onSave: (body: object, id?: number) => void }) {
  const [label, setLabel] = useState(field?.label || "");
  const [description, setDescription] = useState(field?.description || "");
  const [type, setType] = useState(field?.field_type || "text");
  const [options, setOptions] = useState((field?.options || []).join("\n"));
  const [required, setRequired] = useState(field?.required || false);
  return (
    <FormDrawer title={field ? "প্রশ্ন এডিট" : "নতুন প্রশ্ন"} saving={saving} onClose={onClose} onSubmit={() => onSave({
      label,
      description,
      field_type: type,
      required,
      options: fieldNeedsOptions(type) ? options.split(/[\n,]/).map((item) => item.trim()).filter(Boolean) : [],
    }, field?.id)}>
      <FieldLabel label="প্রশ্ন"><input className="field" required placeholder="যেমন শিক্ষাপ্রতিষ্ঠানের নাম" value={label} onChange={(e) => setLabel(e.target.value)} /></FieldLabel>
      <FieldLabel label="উত্তরের ধরন">
        <select className="field" value={type} onChange={(e) => setType(e.target.value)}>
          {FIELD_TYPES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
        </select>
      </FieldLabel>
      {fieldNeedsOptions(type) && (
        <FieldLabel label="অপশনগুলো">
          <textarea className="field" required placeholder={"প্রতি লাইনে একটি\nS\nM\nL"} value={options} onChange={(e) => setOptions(e.target.value)} />
          <span className="field-hint">প্রতি লাইনে একটি অপশন লিখুন।</span>
        </FieldLabel>
      )}
      <FieldLabel label="সাহায্যকারী লেখা (ঐচ্ছিক)"><input className="field" placeholder="প্রশ্নের নিচে ছোট করে দেখাবে" value={description} onChange={(e) => setDescription(e.target.value)} /></FieldLabel>
      <label className="option"><input type="checkbox" checked={required} onChange={(e) => setRequired(e.target.checked)} /><span><strong>বাধ্যতামূলক</strong><span className="block text-sm muted">উত্তর না দিলে রেজিস্ট্রেশন এগোবে না</span></span></label>
    </FormDrawer>
  );
}

/* ---------- Food ---------- */

export function Food({ workspace, reload }: Props) {
  const event = workspace.event;
  const { editing, setEditing, saving, setSaving } = useEditor<Meal>();
  const act = useAction();
  const confirm = useConfirm();

  async function remove(meal: Meal) {
    if (!(await confirm({ title: `"${meal.name}" মুছবেন?`, body: "কেউ এটি বেছে নিয়ে থাকলে মোছা যাবে না।", confirmLabel: "মুছুন", danger: true }))) return;
    await act(() => api.deleteMeal(event.id, meal.id).then(reload), "খাবার মুছে ফেলা হয়েছে");
  }

  return (
    <div className="space-y-5">
      <Section title="খাবার চালু" description="চালু থাকলে রেজিস্ট্রেশনের সময় প্রত্যেককে একটি খাবার বেছে নিতে হবে। ইভেন্টের দিন কাউন্টারে টিকিট স্ক্যান করে খাবার দেবেন, একজন একবারই পাবেন।">
        <label className="option max-w-md">
          <input type="checkbox" checked={event.food_enabled} onChange={(e) => act(() => api.update(event.id, { food_enabled: e.target.checked }).then(reload), e.target.checked ? "খাবার চালু হয়েছে" : "খাবার বন্ধ হয়েছে")} />
          <span><strong>এই ইভেন্টে খাবার থাকবে</strong><span className="block text-sm muted">{event.food_enabled ? `${num(workspace.counts.meals_served)} জনকে দেওয়া হয়েছে` : "বন্ধ"}</span></span>
        </label>
        {event.food_enabled && <Link href={`/organizer/events/${event.id}/counter`} className="btn btn-ghost mt-3">কাউন্টার খুলুন →</Link>}
      </Section>
      {event.food_enabled && (
        <CatalogList
          title="খাবারের অপশন"
          description="যেমন মুরগি বিরিয়ানি, নিরামিষ থালি। অংশগ্রহণকারী এগুলোর একটি বেছে নেবেন।"
          empty={{ icon: <UtensilsIcon />, title: "কোনো খাবার যোগ হয়নি", body: "অন্তত একটি অপশন যোগ করুন, নইলে রেজিস্ট্রেশনে খাবার বাছাই দেখাবে না।" }}
          rows={event.meals}
          addLabel="খাবার যোগ"
          onAdd={() => setEditing("new")}
          render={(meal) => <RowShell title={meal.name} badges={<Badge plain tone="green">{num(meal.count || 0)} জন বেছেছেন</Badge>} meta={meal.description} onEdit={() => setEditing(meal)} onDelete={() => remove(meal)} />}
        />
      )}
      {editing && <SimpleForm
        title={editing === "new" ? "নতুন খাবার" : "খাবার এডিট"}
        nameLabel="খাবারের নাম"
        namePlaceholder="যেমন নিরামিষ দুপুরের খাবার"
        initial={editing === "new" ? { name: "", description: "" } : { name: editing.name, description: editing.description }}
        saving={saving}
        onClose={() => setEditing(null)}
        onSave={async (body) => {
          setSaving(true);
          const id = editing === "new" ? undefined : editing.id;
          const ok = await act(() => api.saveMeal(event.id, { ...body, category: "meal" }, id).then(reload), id ? "খাবার আপডেট হয়েছে" : "খাবার যোগ হয়েছে");
          setSaving(false);
          if (ok) setEditing(null);
        }}
      />}
    </div>
  );
}

function SimpleForm({ title, nameLabel, namePlaceholder, initial, saving, onClose, onSave, children }: { title: string; nameLabel: string; namePlaceholder: string; initial: { name: string; description: string }; saving: boolean; onClose: () => void; onSave: (body: { name: string; description: string }) => void; children?: ReactNode }) {
  const [name, setName] = useState(initial.name);
  const [description, setDescription] = useState(initial.description);
  return (
    <FormDrawer title={title} saving={saving} onClose={onClose} onSubmit={() => onSave({ name, description })}>
      <FieldLabel label={nameLabel}><input className="field" required placeholder={namePlaceholder} value={name} onChange={(e) => setName(e.target.value)} /></FieldLabel>
      <FieldLabel label="বিবরণ (ঐচ্ছিক)"><textarea className="field" value={description} onChange={(e) => setDescription(e.target.value)} /></FieldLabel>
      {children}
    </FormDrawer>
  );
}

/* ---------- Gifts ---------- */

export function Gifts({ workspace, reload }: Props) {
  const event = workspace.event;
  const { editing, setEditing, saving, setSaving } = useEditor<EventItem>();
  const act = useAction();
  const confirm = useConfirm();

  async function remove(item: EventItem) {
    if (!(await confirm({ title: `"${item.name}" মুছবেন?`, body: "কাউকে দেওয়া হয়ে গেলে মোছা যাবে না।", confirmLabel: "মুছুন", danger: true }))) return;
    await act(() => api.deleteItem(event.id, item.id).then(reload), "আইটেম মুছে ফেলা হয়েছে");
  }

  return (
    <>
      <CatalogList
        title="গিফট ও কিট"
        description="রেজিস্ট্রেশনকারীরা যা পাবেন: টি-শার্ট, কিট ব্যাগ, পুরস্কার। এগুলো ইভেন্টের পাতা আর টিকিটে দেখাবে; কাউন্টারে স্ক্যান করে দিলে টিকিটে “পেয়েছেন” দেখাবে।"
        empty={{ icon: <GiftIcon />, title: "কোনো গিফট নেই", body: "যা দেবেন তা যোগ করুন, যাতে অংশগ্রহণকারীরা আগে থেকেই দেখতে পান।" }}
        rows={workspace.items}
        addLabel="গিফট যোগ"
        onAdd={() => setEditing("new")}
        render={(item) => (
          <RowShell
            title={item.name}
            badges={<><Badge plain>{itemKindLabel(item.kind)}</Badge><Badge plain tone="green">{num(item.distributed)}{item.quantity != null ? ` / ${num(item.quantity)}` : ""} দেওয়া</Badge></>}
            meta={item.description}
            onEdit={() => setEditing(item)}
            onDelete={() => remove(item)}
          />
        )}
      />
      {workspace.items.length > 0 && <Link href={`/organizer/events/${event.id}/counter`} className="btn btn-ghost mt-4">কাউন্টার খুলে বিতরণ করুন →</Link>}
      {editing && <GiftForm item={editing === "new" ? null : editing} saving={saving} onClose={() => setEditing(null)} onSave={async (body, id) => {
        setSaving(true);
        const ok = await act(() => api.saveItem(event.id, body, id).then(reload), id ? "আইটেম আপডেট হয়েছে" : "আইটেম যোগ হয়েছে");
        setSaving(false);
        if (ok) setEditing(null);
      }} />}
    </>
  );
}

function GiftForm({ item, saving, onClose, onSave }: { item: EventItem | null; saving: boolean; onClose: () => void; onSave: (body: object, id?: number) => void }) {
  const [name, setName] = useState(item?.name || "");
  const [kind, setKind] = useState(item?.kind || "gift");
  const [description, setDescription] = useState(item?.description || "");
  const [quantity, setQuantity] = useState(item?.quantity != null ? String(item.quantity) : "");
  return (
    <FormDrawer title={item ? "গিফট এডিট" : "নতুন গিফট"} saving={saving} onClose={onClose} onSubmit={() => onSave({
      name, kind, description, has_quantity: quantity !== "", quantity: quantity === "" ? undefined : Number(quantity),
    }, item?.id)}>
      <FieldLabel label="নাম"><input className="field" required placeholder="যেমন ইভেন্ট টি-শার্ট" value={name} onChange={(e) => setName(e.target.value)} /></FieldLabel>
      <FieldLabel label="ধরন">
        <select className="field" value={kind} onChange={(e) => setKind(e.target.value)}>
          {ITEM_KINDS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
      </FieldLabel>
      <FieldLabel label="বিবরণ (ঐচ্ছিক)"><textarea className="field" placeholder="অংশগ্রহণকারীরা ইভেন্টের পাতায় দেখবেন" value={description} onChange={(e) => setDescription(e.target.value)} /></FieldLabel>
      <FieldLabel label="মোট স্টক">
        <input className="field" inputMode="numeric" placeholder="খালি = সবার জন্য" value={quantity} onChange={(e) => setQuantity(e.target.value.replace(/\D/g, ""))} />
        <span className="field-hint">স্টক শেষ হলে কাউন্টার আর দিতে দেবে না।</span>
      </FieldLabel>
    </FormDrawer>
  );
}
