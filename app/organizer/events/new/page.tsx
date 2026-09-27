"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AloionMark } from "@/components/aloion-mark";
import { api } from "@/lib/api";
import { CATEGORIES } from "@/lib/format";
import { useSession } from "@/lib/session";

export default function NewEventPage() {
  const router = useRouter();
  const { user, loading, login } = useSession();
  const [step, setStep] = useState(0);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    title: "",
    summary: "",
    description: "",
    category: "Science",
    organization_name: "",
    contact_email: "",
    starts_at: "",
    ends_at: "",
    timezone: "Asia/Dhaka",
    location_type: "physical",
    venue: "",
    address: "",
    online_url: "",
    capacity: "",
    fee_amount: "0",
    visibility: "public",
  });

  if (loading) return <main className="p-10">লোড হচ্ছে…</main>;
  if (!user) return <main className="p-10"><button className="btn btn-primary" onClick={() => login()}><AloionMark />আলোআয়ন দিয়ে চালিয়ে যান</button></main>;

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function create() {
    setError("");
    try {
      const workspace = await api.create({
        title: form.title,
        summary: form.summary,
        description: form.description,
        category: form.category,
        organization_name: form.organization_name,
        contact_email: form.contact_email || user?.email,
        timezone: form.timezone,
        starts_at: form.starts_at ? new Date(form.starts_at).toISOString() : undefined,
        ends_at: form.ends_at ? new Date(form.ends_at).toISOString() : undefined,
        location_type: form.location_type,
        venue: form.venue,
        address: form.address,
        online_url: form.online_url,
        has_capacity: form.capacity !== "",
        capacity: Number(form.capacity) || undefined,
        fee_amount: Number(form.fee_amount) || 0,
        visibility: form.visibility,
      });
      router.push(`/organizer/events/${workspace.event.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "ইভেন্ট তৈরি হয়নি");
    }
  }

  return (
    <main className="mx-auto max-w-xl px-4 py-10">
      <h1 className="serif text-4xl sm:text-5xl">ইভেন্ট তৈরি</h1>
      <p className="mt-2 text-sm text-[var(--muted)]">ধাপ {step + 1} / ৩</p>
      <div className="card mt-6 grid gap-3 p-5">
        {step === 0 && (
          <>
            <input className="field" placeholder="বিজ্ঞান উৎসব ২০২৬" value={form.title} onChange={(event) => set("title", event.target.value)} />
            <textarea className="field" placeholder="এক লাইনে" value={form.summary} onChange={(event) => set("summary", event.target.value)} />
            <textarea className="field min-h-28" placeholder="কী হবে" value={form.description} onChange={(event) => set("description", event.target.value)} />
            <select className="field" value={form.category} onChange={(event) => set("category", event.target.value)}>{CATEGORIES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select>
            <input className="field" placeholder="আয়োজক সংগঠন" value={form.organization_name} onChange={(event) => set("organization_name", event.target.value)} />
          </>
        )}
        {step === 1 && (
          <>
            <input className="field" type="datetime-local" value={form.starts_at} onChange={(event) => set("starts_at", event.target.value)} />
            <input className="field" type="datetime-local" value={form.ends_at} onChange={(event) => set("ends_at", event.target.value)} />
            <select className="field" value={form.location_type} onChange={(event) => set("location_type", event.target.value)}>
              <option value="physical">সশরীরে</option>
              <option value="online">অনলাইন</option>
              <option value="hybrid">মিশ্র</option>
            </select>
            <input className="field" placeholder="স্থান" value={form.venue} onChange={(event) => set("venue", event.target.value)} />
            <input className="field" placeholder="ঠিকানা" value={form.address} onChange={(event) => set("address", event.target.value)} />
            <input className="field" placeholder="অনলাইন লিংক" value={form.online_url} onChange={(event) => set("online_url", event.target.value)} />
          </>
        )}
        {step === 2 && (
          <>
            <input className="field" placeholder="ধারণক্ষমতা" value={form.capacity} onChange={(event) => set("capacity", event.target.value)} />
            <input className="field" placeholder="মূল নিবন্ধন ফি, অংশের ফি আলাদা" value={form.fee_amount} onChange={(event) => set("fee_amount", event.target.value)} />
            <select className="field" value={form.visibility} onChange={(event) => set("visibility", event.target.value)}>
              <option value="public">সবার জন্য</option>
              <option value="private">ব্যক্তিগত লিংক</option>
            </select>
            <p className="text-sm text-[var(--muted)]">ইভেন্ট খসড়া হিসেবে শুরু হবে। এরপর অংশ ও প্রশ্ন যোগ করে জমা দিন বা প্রকাশ করুন।</p>
          </>
        )}
        {error && <p className="text-sm text-red-700">{error}</p>}
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
          <button className="btn btn-ghost w-full sm:w-auto" type="button" disabled={step === 0} onClick={() => setStep((value) => value - 1)}>পেছনে</button>
          {step < 2 ? <button className="btn btn-primary w-full sm:w-auto" type="button" onClick={() => setStep((value) => value + 1)}>এগোন</button> : <button className="btn btn-primary w-full sm:w-auto" type="button" onClick={create}>খসড়া তৈরি</button>}
        </div>
      </div>
    </main>
  );
}
