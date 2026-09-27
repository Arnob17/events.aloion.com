"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { AccountGate } from "@/components/account-gate";
import { RegistrationCard } from "@/components/registration-card";
import { TicketQR } from "@/components/ticket-qr";
import { api } from "@/lib/api";
import { money, personName } from "@/lib/format";
import { useSession } from "@/lib/session";
import type { CustomField, PublicEvent, Registration } from "@/lib/types";

type RegistrationStep = "segments" | "questions" | "review";

export default function RegisterPage() {
  const { slug } = useParams<{ slug: string }>();
  const { user, loading, logout } = useSession();
  const [event, setEvent] = useState<PublicEvent | null>(null);
  const [step, setStep] = useState(0);
  const [segments, setSegments] = useState<number[]>([]);
  const [answers, setAnswers] = useState<Record<number, { value?: string; values?: string[] }>>({});
  const [mealId, setMealId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [done, setDone] = useState<Registration | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (loading) return;
    api.event(slug).then(setEvent).catch((err: Error) => setError(err.message));
  }, [slug, loading, user]);

  if (loading || !event) return <main className="mx-auto max-w-xl px-4 py-16">{error || "ইভেন্ট লোড হচ্ছে…"}</main>;
  if (!user) {
    return (
      <main className="mx-auto max-w-lg px-4 py-16">
        <p className="mb-4 text-sm text-[var(--muted)]">{event.title}</p>
        <AccountGate title="আলোআয়ন দিয়ে নাম লিখুন" body="আলোআয়ন অ্যাকাউন্ট ব্যবহার করুন, যাতে নিশ্চিতকরণের চিঠি আর এই নিবন্ধন একসঙ্গে থাকে।" />
      </main>
    );
  }
  if (event.my_registration && !done) {
    return (
      <main className="mx-auto max-w-lg px-4 py-12">
        <RegistrationCard registration={{ ...event.my_registration, event_slug: slug, event_title: event.title, event_starts_at: event.my_registration.event_starts_at || event.starts_at, venue: event.my_registration.venue || event.venue }} />
      </main>
    );
  }
  if (done) {
    return (
      <main className="mx-auto max-w-lg px-4 py-12 text-center">
        <p className="text-sm font-semibold text-[var(--pine)]">নাম লেখা হয়েছে</p>
        <h1 className="serif mt-2 break-words text-3xl sm:text-4xl">{event.title}</h1>
        <p className="mt-3 text-sm text-[var(--muted)]">{user.email}-এ নিশ্চিতকরণের চিঠি পাঠানো হয়েছে</p>
        <p className="mt-4 text-sm text-[var(--muted)]">নিবন্ধন নম্বর</p>
        <p className="font-mono text-2xl">{done.public_code}</p>
        {done.amount_due > 0 && <p className="mt-3 text-lg font-semibold">মোট {money(done.amount_due, done.currency || event.currency)}</p>}
        {done.qr_token && <TicketQR token={done.qr_token} />}
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Link href={`/events/${event.slug}`} className="btn btn-ghost">ইভেন্টের পাতা</Link>
          <Link href={`/tickets/${done.public_code}`} className="btn btn-primary">টিকিট খুলুন</Link>
        </div>
      </main>
    );
  }

  const needsSegments = event.allow_segment_registration && event.segments.length > 0;
  const mustPickSegment = needsSegments && event.segments.some((segment) => segment.registration_required);
  const needsQuestions = event.fields.length > 0 || (event.food_enabled && event.meals.length > 0);
  const steps: RegistrationStep[] = [
    ...(needsSegments ? (["segments"] as const) : []),
    ...(needsQuestions ? (["questions"] as const) : []),
    "review",
  ];
  const stepLabel: Record<RegistrationStep, string> = { segments: "অংশ", questions: "প্রশ্ন", review: "যাচাই" };
  const current = steps[step] || "review";

  async function submit() {
    if (!event) return;
    setSaving(true);
    setError("");
    try {
      const registration = await api.register(event.id, {
        segment_ids: segments,
        meal_id: mealId,
        answers: event.fields.map((field) => ({
          field_id: field.id,
          value: answers[field.id]?.value || "",
          values: answers[field.id]?.values || [],
        })),
      });
      setDone(registration);
    } catch (err) {
      setError(err instanceof Error ? err.message : "নিবন্ধন হয়নি");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="mx-auto max-w-xl px-4 py-10">
      <p className="text-sm text-[var(--muted)]">{event.title}</p>
      <h1 className="serif text-3xl sm:text-4xl">নাম লিখুন</h1>
      <div className="card mt-4 flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="font-semibold break-words">{personName(user)}</p>
          <p className="text-sm break-all text-[var(--muted)]">{user.email}</p>
        </div>
        <button className="btn btn-ghost !py-2 w-full sm:w-auto" onClick={logout}>আপনি নন</button>
      </div>
      <ol className="mt-4 flex flex-wrap gap-x-3 gap-y-1 text-sm">
        {steps.map((label, index) => (
          <li key={label} className={index === step ? "font-semibold text-[var(--pine)]" : "text-[var(--muted)]"}>{index + 1}. {stepLabel[label]}</li>
        ))}
      </ol>
      <div className="card mt-6 p-5">
        {current === "segments" && (
          <div className="space-y-3">
            {event.segments.map((segment) => (
              <label key={segment.id} className="flex gap-3 rounded-xl border border-[var(--line)] p-3">
                <input type="checkbox" checked={segments.includes(segment.id)} onChange={() => {
                  setSegments((currentIds) => currentIds.includes(segment.id) ? currentIds.filter((id) => id !== segment.id) : [...currentIds, segment.id]);
                }} />
                <span className="min-w-0 flex-1">
                  <span className="flex items-start justify-between gap-3">
                    <strong className="break-words">{segment.name}</strong>
                    <span className="shrink-0 text-sm font-semibold">{money(segment.fee_amount, event.currency)}</span>
                  </span>
                  <span className="block text-sm text-[var(--muted)]">{segment.description}</span>
                </span>
              </label>
            ))}
          </div>
        )}
        {current === "questions" && (
          <div className="space-y-4">
            {event.food_enabled && event.meals.map((meal) => (
              <label key={meal.id} className="flex gap-2 text-sm"><input type="radio" name="meal" checked={mealId === meal.id} onChange={() => setMealId(meal.id)} />{meal.name}</label>
            ))}
            {event.fields.map((field) => <FieldInput key={field.id} field={field} value={answers[field.id]} onChange={(next) => setAnswers({ ...answers, [field.id]: next })} />)}
          </div>
        )}
        {current === "review" && (
          <div className="space-y-2 text-sm">
            <p><strong>{personName(user)}</strong> · {user.email}</p>
            {segments.length === 0 && <p>অংশ: পুরো ইভেন্ট</p>}
            <FeeSummary event={event} segmentIds={segments} />
            {event.food_enabled && <p>খাবার: {event.meals.find((meal) => meal.id === mealId)?.name || "—"}</p>}
            {event.fields.map((field) => <p key={field.id}>{field.label}: {answers[field.id]?.values?.join(", ") || answers[field.id]?.value || "—"}</p>)}
          </div>
        )}
        {current !== "review" && <FeeSummary event={event} segmentIds={segments} />}
        {error && <p className="mt-3 text-sm text-red-700">{error}</p>}
        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
          <button className="btn btn-ghost w-full sm:w-auto" disabled={step === 0} onClick={() => setStep((value) => value - 1)}>পেছনে</button>
          {current === "review" ? (
            <button className="btn btn-primary w-full sm:w-auto" disabled={saving} onClick={submit}>{saving ? "জমা হচ্ছে…" : "নিবন্ধন নিশ্চিত করুন"}</button>
          ) : (
            <button className="btn btn-primary w-full sm:w-auto" disabled={(current === "questions" && event.food_enabled && event.meals.length > 0 && !mealId) || (current === "segments" && mustPickSegment && segments.length === 0)} onClick={() => setStep((value) => value + 1)}>এগোন</button>
          )}
        </div>
      </div>
    </main>
  );
}

function FeeSummary({ event, segmentIds }: { event: PublicEvent; segmentIds: number[] }) {
  const selected = event.segments.filter((segment) => segmentIds.includes(segment.id));
  const base = event.fee_amount || 0;
  const total = base + selected.reduce((sum, segment) => sum + (segment.fee_amount || 0), 0);
  return (
    <div className="mt-4 rounded-xl bg-[var(--paper)] p-3 text-sm">
      {selected.map((segment) => (
        <p key={segment.id} className="flex justify-between gap-3">
          <span className="min-w-0 break-words">{segment.name}</span>
          <span className="shrink-0">{money(segment.fee_amount, event.currency)}</span>
        </p>
      ))}
      {base > 0 && (
        <p className="flex justify-between gap-3">
          <span>মূল নিবন্ধন</span>
          <span>{money(base, event.currency)}</span>
        </p>
      )}
      <p className="mt-2 flex justify-between gap-3 border-t border-[var(--line)] pt-2 text-base font-semibold">
        <span>মোট</span>
        <span>{money(total, event.currency)}</span>
      </p>
    </div>
  );
}

function FieldInput({ field, value, onChange }: { field: CustomField; value?: { value?: string; values?: string[] }; onChange: (next: { value?: string; values?: string[] }) => void }) {
  const common = { className: "field mt-1", required: field.required };
  return (
    <label className="block text-sm">
      <span className="font-medium">{field.label}{field.required ? " *" : ""}</span>
      {field.description && <span className="block text-[var(--muted)]">{field.description}</span>}
      {field.field_type === "long_text" ? (
        <textarea {...common} value={value?.value || ""} onChange={(event) => onChange({ value: event.target.value })} />
      ) : field.field_type === "dropdown" || field.field_type === "radio" ? (
        <select {...common} value={value?.value || ""} onChange={(event) => onChange({ value: event.target.value })}>
          <option value="">বেছে নিন</option>
          {field.options.map((option) => <option key={option}>{option}</option>)}
        </select>
      ) : field.field_type === "multi_select" ? (
        <span className="mt-1 block space-y-1">
          {field.options.map((option) => (
            <label key={option} className="flex gap-2">
              <input type="checkbox" checked={value?.values?.includes(option) || false} onChange={() => {
                const current = value?.values || [];
                onChange({ values: current.includes(option) ? current.filter((item) => item !== option) : [...current, option] });
              }} />
              {option}
            </label>
          ))}
        </span>
      ) : field.field_type === "checkbox" ? (
        <input className="ml-2" type="checkbox" checked={value?.value === "true"} onChange={(event) => onChange({ value: event.target.checked ? "true" : "false" })} />
      ) : (
        <input {...common} type={field.field_type === "number" ? "number" : field.field_type === "date" ? "date" : field.field_type === "email" ? "email" : "text"} value={value?.value || ""} onChange={(event) => onChange({ value: event.target.value })} />
      )}
    </label>
  );
}
