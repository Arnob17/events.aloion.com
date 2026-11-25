"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AloionMark } from "@/components/aloion-mark";
import { FieldLabel } from "@/components/field-label";
import { api } from "@/lib/api";
import { CATEGORIES, fromLocalInput } from "@/lib/format";
import { PageLoading } from "@/components/ui";
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
    contact_phone: "",
    starts_at: "",
    ends_at: "",
    registration_closes_at: "",
    timezone: "Asia/Dhaka",
    location_type: "physical",
    venue: "",
    address: "",
    online_url: "",
    capacity: "",
    fee_amount: "0",
    bkash_number: "",
    nagad_number: "",
    visibility: "public",
  });

  useEffect(() => {
    if (!user) return;
    setForm((current) => ({
      ...current,
      contact_email: current.contact_email || user.email || "",
      contact_phone: current.contact_phone || user.phone || "",
    }));
  }, [user]);

  if (loading) return <PageLoading />;
  if (!user) return <main className="mx-auto max-w-lg px-4 py-14 text-center"><h1 className="serif text-3xl">ইভেন্ট তৈরি</h1><p className="mt-2 muted">শুরু করতে লগইন করুন।</p><button className="btn btn-primary mt-5" onClick={() => login()}><AloionMark />আলোআয়ন দিয়ে চালিয়ে যান</button></main>;

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function contactReady() {
    const email = form.contact_email.trim();
    const phoneDigits = form.contact_phone.replace(/\D/g, "");
    if (!email.includes("@") || !email.includes(".") || phoneDigits.length < 8) {
      setError("অর্গানাইজারের ইমেইল ও ফোন দিন");
      return false;
    }
    setError("");
    return true;
  }

  async function create() {
    setError("");
    if (!form.title.trim()) {
      setError("ইভেন্টের নাম দিন");
      return;
    }
    if (!contactReady()) return;
    try {
      const workspace = await api.create({
        title: form.title,
        summary: form.summary,
        description: form.description,
        category: form.category,
        organization_name: form.organization_name,
        contact_email: form.contact_email.trim(),
        contact_phone: form.contact_phone.trim(),
        timezone: form.timezone,
        starts_at: fromLocalInput(form.starts_at),
        ends_at: fromLocalInput(form.ends_at),
        registration_closes_at: fromLocalInput(form.registration_closes_at),
        location_type: form.location_type,
        venue: form.venue,
        address: form.address,
        online_url: form.online_url,
        has_capacity: form.capacity !== "",
        capacity: Number(form.capacity) || undefined,
        fee_amount: Number(form.fee_amount) || 0,
        bkash_number: form.bkash_number,
        nagad_number: form.nagad_number,
        visibility: form.visibility,
      });
      router.push(`/organizer/events/${workspace.event.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "ইভেন্ট তৈরি হয়নি");
    }
  }

  return (
    <main className="mx-auto max-w-xl px-4 py-10">
      <h1 className="serif text-3xl sm:text-4xl">নতুন ইভেন্ট</h1>
      <p className="mt-1 text-sm muted">তিনটি ধাপ। পরে ডেস্কের সেটিংসে সব বদলানো যাবে।</p>
      <ol className="mt-6 flex gap-1" aria-label="ধাপ">
        {["মূল তথ্য", "সময় ও জায়গা", "রেজিস্ট্রেশন"].map((label, index) => (
          <li key={label} className="flex min-w-0 flex-1 flex-col gap-1.5" aria-current={index === step ? "step" : undefined}>
            <span className={`h-1.5 rounded-full ${index <= step ? "bg-[var(--pine)]" : "bg-[var(--paper-2)]"}`} />
            <span className={`truncate text-xs font-semibold ${index === step ? "text-[var(--pine-deep)]" : "muted"}`}>{index + 1}. {label}</span>
          </li>
        ))}
      </ol>
      <div className="card mt-5 grid gap-4 p-5 sm:p-6">
        {step === 0 && (
          <>
            <FieldLabel label="ইভেন্টের নাম">
              <input className="field" placeholder="বিজ্ঞান উৎসব ২০২৬" value={form.title} onChange={(event) => set("title", event.target.value)} />
            </FieldLabel>
            <FieldLabel label="এক লাইনে সারাংশ">
              <textarea className="field" value={form.summary} onChange={(event) => set("summary", event.target.value)} />
            </FieldLabel>
            <FieldLabel label="বিস্তারিত বিবরণ">
              <textarea className="field min-h-28" value={form.description} onChange={(event) => set("description", event.target.value)} />
            </FieldLabel>
            <FieldLabel label="ক্যাটাগরি">
              <select className="field" value={form.category} onChange={(event) => set("category", event.target.value)}>{CATEGORIES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select>
            </FieldLabel>
            <FieldLabel label="আয়োজক প্রতিষ্ঠান">
              <input className="field" value={form.organization_name} onChange={(event) => set("organization_name", event.target.value)} />
            </FieldLabel>
            <FieldLabel label="যোগাযোগের ইমেইল">
              <input className="field" type="email" required value={form.contact_email} onChange={(event) => set("contact_email", event.target.value)} />
            </FieldLabel>
            <FieldLabel label="যোগাযোগের ফোন">
              <input className="field" inputMode="tel" required placeholder="০১XXXXXXXXX" value={form.contact_phone} onChange={(event) => set("contact_phone", event.target.value)} />
            </FieldLabel>
          </>
        )}
        {step === 1 && (
          <>
            <FieldLabel label="শুরু">
              <input className="field" type="datetime-local" value={form.starts_at} onChange={(event) => set("starts_at", event.target.value)} />
            </FieldLabel>
            <FieldLabel label="শেষ">
              <input className="field" type="datetime-local" value={form.ends_at} onChange={(event) => set("ends_at", event.target.value)} />
            </FieldLabel>
            <FieldLabel label="ধরন">
              <select className="field" value={form.location_type} onChange={(event) => set("location_type", event.target.value)}>
                <option value="physical">সরাসরি (ভেন্যুতে)</option>
                <option value="online">অনলাইন</option>
                <option value="hybrid">হাইব্রিড</option>
              </select>
            </FieldLabel>
            <FieldLabel label="ভেন্যু">
              <input className="field" value={form.venue} onChange={(event) => set("venue", event.target.value)} />
            </FieldLabel>
            <FieldLabel label="ঠিকানা">
              <input className="field" value={form.address} onChange={(event) => set("address", event.target.value)} />
            </FieldLabel>
            <FieldLabel label="অনলাইন লিংক">
              <input className="field" value={form.online_url} onChange={(event) => set("online_url", event.target.value)} />
            </FieldLabel>
          </>
        )}
        {step === 2 && (
          <>
            <FieldLabel label="রেজিস্ট্রেশনের শেষ তারিখ">
              <input className="field" type="datetime-local" value={form.registration_closes_at} onChange={(event) => set("registration_closes_at", event.target.value)} />
              <span className="field-hint">এই সময়ের পর রেজিস্ট্রেশন নিজে থেকে বন্ধ হবে। পরে বদলানো যাবে।</span>
            </FieldLabel>
            <FieldLabel label="মোট সিট">
              <input className="field" inputMode="numeric" placeholder="খালি থাকলে সীমা নেই" value={form.capacity} onChange={(event) => set("capacity", event.target.value)} />
            </FieldLabel>
            <FieldLabel label="মূল রেজিস্ট্রেশন ফি">
              <input className="field" inputMode="decimal" placeholder="সেগমেন্টের ফি আলাদা" value={form.fee_amount} onChange={(event) => set("fee_amount", event.target.value)} />
            </FieldLabel>
            <FieldLabel label="বিকাশ নম্বর">
              <input className="field" inputMode="tel" placeholder="০১XXXXXXXXX" value={form.bkash_number} onChange={(event) => set("bkash_number", event.target.value)} />
            </FieldLabel>
            <FieldLabel label="নগদ নম্বর">
              <input className="field" inputMode="tel" placeholder="০১XXXXXXXXX" value={form.nagad_number} onChange={(event) => set("nagad_number", event.target.value)} />
            </FieldLabel>
            <FieldLabel label="কে দেখতে পাবে">
              <select className="field" value={form.visibility} onChange={(event) => set("visibility", event.target.value)}>
                <option value="public">পাবলিক</option>
                <option value="private">প্রাইভেট লিংক</option>
              </select>
            </FieldLabel>
            <p className="text-sm text-[var(--muted)]">ইভেন্ট ড্রাফট হিসেবে শুরু হবে। পাবলিক হতে অ্যাডমিন অ্যাপ্রুভ লাগবে। যোগাযোগের ইমেইল ও ফোন ইভেন্টের পাতায় দেখাবে।</p>
          </>
        )}
        {error && <p className="notice notice-error" role="alert">{error}</p>}
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
          <button className="btn btn-ghost w-full sm:w-auto" type="button" disabled={step === 0} onClick={() => setStep((value) => value - 1)}>পেছনে</button>
          {step < 2 ? <button className="btn btn-primary w-full sm:w-auto" type="button" onClick={() => { if (step === 0 && !contactReady()) return; setStep((value) => value + 1); }}>পরের স্টেপ</button> : <button className="btn btn-primary w-full sm:w-auto" type="button" onClick={create}>ড্রাফট তৈরি</button>}
        </div>
      </div>
    </main>
  );
}
