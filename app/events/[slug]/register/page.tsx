"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { AccountGate } from "@/components/account-gate";
import { FieldInput, hasAnswer, type Answer } from "@/components/field-input";
import { FieldLabel } from "@/components/field-label";
import { GiftIcon, UtensilsIcon } from "@/components/icons";
import { PAY_METHODS, payNumber, type PayMethod } from "@/components/pay-method";
import { RegistrationCard } from "@/components/registration-card";
import { PageLoading } from "@/components/ui";
import { api } from "@/lib/api";
import { money, personName, registrationWindow, timeLeft, when } from "@/lib/format";
import { useSession } from "@/lib/session";
import type { PublicEvent, Registration } from "@/lib/types";

type Step = "segments" | "details" | "food" | "payment" | "review";

const STEP_LABEL: Record<Step, string> = { segments: "সেগমেন্ট", details: "তথ্য", food: "খাবার", payment: "পেমেন্ট", review: "রিভিউ" };

export default function RegisterPage() {
  const { slug } = useParams<{ slug: string }>();
  const { user, loading, logout } = useSession();
  const [event, setEvent] = useState<PublicEvent | null>(null);
  const [step, setStep] = useState(0);
  const [segments, setSegments] = useState<number[]>([]);
  const [answers, setAnswers] = useState<Record<number, Answer>>({});
  const [mealId, setMealId] = useState<number | null>(null);
  const [method, setMethod] = useState<PayMethod | "">("");
  const [trx, setTrx] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState<Registration | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (loading) return;
    api.event(slug).then(setEvent).catch((err: Error) => setError(err.message));
  }, [slug, loading, user]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    setError("");
  }, [step]);

  if (error && !event) return <main className="mx-auto max-w-xl px-4 py-16"><p className="notice notice-error">{error}</p></main>;
  if (loading || !event) return <PageLoading label="ইভেন্ট লোড হচ্ছে…" />;
  if (!user) {
    return (
      <main className="mx-auto max-w-lg px-4 py-14">
        <p className="mb-3 text-sm font-semibold text-[var(--pine)]">{event.title}</p>
        <AccountGate title="আলোআয়ন দিয়ে রেজিস্ট্রেশন" body="আলোআয়ন অ্যাকাউন্ট ব্যবহার করুন, যাতে কনফার্মেশনের চিঠি আর এই রেজিস্ট্রেশন একসঙ্গে থাকে।" />
      </main>
    );
  }
  if (done || event.my_registration) {
    const registration = done || event.my_registration!;
    return (
      <main className="mx-auto max-w-lg px-4 py-10">
        {done && (
          <div className="mb-5 text-center">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-[var(--pine-soft)] text-2xl text-[var(--pine)]">✓</div>
            <h1 className="serif mt-3 text-3xl">রেজিস্ট্রেশন হয়েছে</h1>
            <p className="mt-1 text-sm muted">{user.email}-এ কনফার্মেশনের চিঠি পাঠানো হয়েছে।</p>
          </div>
        )}
        <RegistrationCard
          registration={{ ...registration, event_slug: slug, event_title: registration.event_title || event.title, event_starts_at: registration.event_starts_at || event.starts_at, venue: registration.venue || event.venue }}
          gifts={event.gifts}
        />
      </main>
    );
  }

  const windowState = registrationWindow(event);
  if (windowState !== "open") {
    return (
      <main className="mx-auto max-w-lg px-4 py-14 text-center">
        <h1 className="serif text-3xl">{event.title}</h1>
        <p className="notice notice-warn mt-5 justify-center">
          {windowState === "not_yet" ? `রেজিস্ট্রেশন খুলবে ${when(event.registration_opens_at, event.timezone)}` : windowState === "ended" ? `রেজিস্ট্রেশনের শেষ তারিখ পার হয়ে গেছে (${when(event.registration_closes_at, event.timezone)})` : "এই মুহূর্তে রেজিস্ট্রেশন খোলা নেই।"}
        </p>
        <Link href={`/events/${event.slug}`} className="btn btn-ghost mt-5">ইভেন্টের পাতায় ফিরুন</Link>
      </main>
    );
  }

  const needsSegments = event.allow_segment_registration && event.segments.length > 0;
  const mustPickSegment = needsSegments && event.segments.some((segment) => segment.registration_required);
  const needsFood = event.food_enabled && event.meals.length > 0;
  const total = registrationTotal(event, segments);
  const needsPay = total > 0;
  const steps: Step[] = [
    ...(needsSegments ? (["segments"] as const) : []),
    ...(event.fields.length > 0 ? (["details"] as const) : []),
    ...(needsFood ? (["food"] as const) : []),
    ...(needsPay ? (["payment"] as const) : []),
    "review",
  ];
  const current = steps[Math.min(step, steps.length - 1)];
  const missingField = event.fields.find((field) => field.required && !hasAnswer(field, answers[field.id]));

  function blocker(): string {
    if (current === "segments" && mustPickSegment && segments.length === 0) return "অন্তত একটি সেগমেন্ট বেছে নিন";
    if (current === "details" && missingField) return `"${missingField.label}" পূরণ করুন`;
    if (current === "food" && !mealId) return "একটি খাবার বেছে নিন";
    if (current === "payment" && !method) return "বিকাশ বা নগদ বেছে নিন";
    if (current === "payment" && !trx.trim()) return "ট্রানজাকশন আইডি দিন";
    return "";
  }

  function next() {
    const reason = blocker();
    if (reason) {
      setError(reason);
      return;
    }
    setStep((value) => value + 1);
  }

  async function submit() {
    if (!event) return;
    setSaving(true);
    setError("");
    try {
      const registration = await api.register(event.id, {
        segment_ids: segments,
        meal_id: mealId,
        payment_method: needsPay ? method : "",
        transaction_id: needsPay ? trx.trim() : "",
        answers: event.fields.map((field) => ({ field_id: field.id, value: answers[field.id]?.value || "", values: answers[field.id]?.values || [] })),
      });
      setDone(registration);
      window.scrollTo({ top: 0 });
    } catch (err) {
      setError(err instanceof Error ? err.message : "রেজিস্ট্রেশন হয়নি");
    } finally {
      setSaving(false);
    }
  }

  const meal = event.meals.find((item) => item.id === mealId);

  return (
    <main className="mx-auto max-w-2xl px-4 py-8 sm:py-10">
      <Link href={`/events/${event.slug}`} className="text-sm font-semibold text-[var(--pine)]">← {event.title}</Link>
      <h1 className="serif mt-2 text-3xl sm:text-4xl">রেজিস্ট্রেশন</h1>
      {event.registration_closes_at && <p className="mt-1 text-sm muted">শেষ তারিখ {when(event.registration_closes_at, event.timezone)} · {timeLeft(event.registration_closes_at)}</p>}

      <ol className="mt-6 flex items-center gap-1" aria-label="ধাপ">
        {steps.map((label, index) => (
          <li key={label} className="flex min-w-0 flex-1 flex-col gap-1.5" aria-current={index === step ? "step" : undefined}>
            <span className={`h-1.5 rounded-full ${index <= step ? "bg-[var(--pine)]" : "bg-[var(--paper-2)]"}`} />
            <span className={`truncate text-xs font-semibold ${index === step ? "text-[var(--pine-deep)]" : "muted"}`}>{index + 1}. {STEP_LABEL[label]}</span>
          </li>
        ))}
      </ol>

      <div className="card mt-5 p-5 sm:p-6">
        {current === "segments" && (
          <div className="space-y-3">
            <StepTitle title="কোন সেগমেন্টে অংশ নেবেন?" note={mustPickSegment ? "অন্তত একটি বেছে নিন। একাধিকও নেওয়া যায়।" : "যেগুলোতে অংশ নেবেন বেছে নিন। না নিলে শুধু মূল ইভেন্ট।"} />
            {event.segments.map((segment) => {
              const full = segment.capacity != null && (segment.registration_count || 0) >= segment.capacity;
              return (
                <label key={segment.id} className={`option ${full ? "cursor-not-allowed opacity-60" : ""}`}>
                  <input type="checkbox" disabled={full} checked={segments.includes(segment.id)} onChange={() => setSegments((ids) => (ids.includes(segment.id) ? ids.filter((id) => id !== segment.id) : [...ids, segment.id]))} />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-start justify-between gap-3">
                      <strong className="break-words">{segment.name}</strong>
                      <span className="shrink-0 text-sm font-semibold">{money(segment.fee_amount, event.currency)}</span>
                    </span>
                    {segment.description && <span className="mt-0.5 block text-sm muted">{segment.description}</span>}
                    <span className="mt-1 block text-xs muted">{[segment.starts_at ? when(segment.starts_at, event.timezone) : "", segment.location, full ? "সিট পূর্ণ" : ""].filter(Boolean).join(" · ")}</span>
                  </span>
                </label>
              );
            })}
          </div>
        )}

        {current === "details" && (
          <div className="space-y-4">
            <StepTitle title="আপনার তথ্য" note="অর্গানাইজার এই তথ্যগুলো চেয়েছেন। * চিহ্নিত ঘর বাধ্যতামূলক।" />
            {event.fields.map((field) => <FieldInput key={field.id} field={field} value={answers[field.id]} onChange={(value) => setAnswers({ ...answers, [field.id]: value })} />)}
          </div>
        )}

        {current === "food" && (
          <div className="space-y-3">
            <StepTitle title="খাবার বেছে নিন" note="ইভেন্টের দিন কাউন্টারে টিকিটের কিউআর দেখালে এই খাবারটি পাবেন। একবারই নেওয়া যাবে।" />
            <div className="grid gap-2 sm:grid-cols-2">
              {event.meals.map((item) => (
                <label key={item.id} className="option">
                  <input type="radio" name="meal" checked={mealId === item.id} onChange={() => setMealId(item.id)} />
                  <span className="min-w-0">
                    <strong className="flex items-center gap-2"><UtensilsIcon className="h-4 w-4 text-[var(--pine)]" />{item.name}</strong>
                    {item.description && <span className="block text-sm muted">{item.description}</span>}
                  </span>
                </label>
              ))}
            </div>
          </div>
        )}

        {current === "payment" && <PaymentStep event={event} total={total} method={method} trx={trx} onMethod={setMethod} onTrx={setTrx} />}

        {current === "review" && (
          <div className="space-y-4">
            <StepTitle title="সব ঠিক আছে কি না দেখে নিন" />
            <div className="flex flex-col gap-3 rounded-[var(--radius-sm)] bg-[var(--paper)] p-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="font-semibold break-words">{personName(user)}</p>
                <p className="text-sm break-all muted">{user.email}</p>
              </div>
              <button className="btn btn-quiet btn-sm" onClick={logout}>অন্য অ্যাকাউন্ট</button>
            </div>
            <dl className="divide-y divide-[var(--line)] rounded-[var(--radius-sm)] border border-[var(--line)] text-sm">
              <ReviewRow label="সেগমেন্ট" onEdit={needsSegments ? () => setStep(steps.indexOf("segments")) : undefined}>
                {segments.length === 0 ? "শুধু মূল ইভেন্ট" : event.segments.filter((segment) => segments.includes(segment.id)).map((segment) => segment.name).join(", ")}
              </ReviewRow>
              {event.fields.map((field) => (
                <ReviewRow key={field.id} label={field.label} onEdit={() => setStep(steps.indexOf("details"))}>
                  {answers[field.id]?.values?.join(", ") || (field.field_type === "checkbox" ? (answers[field.id]?.value === "true" ? "হ্যাঁ" : "না") : answers[field.id]?.value) || "—"}
                </ReviewRow>
              ))}
              {needsFood && <ReviewRow label="খাবার" onEdit={() => setStep(steps.indexOf("food"))}>{meal?.name || "—"}</ReviewRow>}
              {needsPay && <ReviewRow label="পেমেন্ট" onEdit={() => setStep(steps.indexOf("payment"))}>{PAY_METHODS.find((item) => item.id === method)?.label} · <span className="font-mono">{trx.trim()}</span></ReviewRow>}
            </dl>
            {event.gifts?.length > 0 && (
              <div className="rounded-[var(--radius-sm)] border border-[var(--gold)]/40 bg-[var(--gold-soft)] p-3 text-sm">
                <p className="flex items-center gap-2 font-semibold text-[#7a5206]"><GiftIcon className="h-4 w-4" />রেজিস্ট্রেশনের সঙ্গে পাবেন</p>
                <p className="mt-1 text-[#7a5206]">{event.gifts.map((gift) => gift.name).join(", ")}</p>
              </div>
            )}
          </div>
        )}

        <FeeSummary event={event} segmentIds={segments} />
        {error && <p className="notice notice-error mt-4" role="alert">{error}</p>}
        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
          <button className="btn btn-ghost" disabled={step === 0} onClick={() => setStep((value) => value - 1)}>পেছনে</button>
          {current === "review" ? (
            <button className="btn btn-primary btn-lg" disabled={saving} onClick={submit}>{saving ? "সাবমিট হচ্ছে…" : "রেজিস্ট্রেশন কনফার্ম করুন"}</button>
          ) : (
            <button className="btn btn-primary btn-lg" onClick={next}>পরের ধাপ →</button>
          )}
        </div>
      </div>
    </main>
  );
}

function StepTitle({ title, note }: { title: string; note?: string }) {
  return (
    <div className="mb-1">
      <h2 className="text-lg font-bold">{title}</h2>
      {note && <p className="text-sm muted">{note}</p>}
    </div>
  );
}

function ReviewRow({ label, onEdit, children }: { label: string; onEdit?: () => void; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 px-3 py-2.5">
      <div className="min-w-0">
        <dt className="text-xs muted">{label}</dt>
        <dd className="font-medium break-words">{children}</dd>
      </div>
      {onEdit && <button className="shrink-0 text-sm font-semibold text-[var(--pine)]" onClick={onEdit}>বদলান</button>}
    </div>
  );
}

function registrationTotal(event: PublicEvent, segmentIds: number[]) {
  const selected = event.segments.filter((segment) => segmentIds.includes(segment.id));
  return (event.fee_amount || 0) + selected.reduce((sum, segment) => sum + (segment.fee_amount || 0), 0);
}

function FeeSummary({ event, segmentIds }: { event: PublicEvent; segmentIds: number[] }) {
  const selected = event.segments.filter((segment) => segmentIds.includes(segment.id));
  const base = event.fee_amount || 0;
  const total = registrationTotal(event, segmentIds);
  if (total === 0 && selected.length === 0) return null;
  return (
    <div className="mt-5 rounded-[var(--radius-sm)] bg-[var(--paper)] p-3 text-sm">
      {base > 0 && (
        <p className="flex justify-between gap-3"><span>মূল রেজিস্ট্রেশন</span><span>{money(base, event.currency)}</span></p>
      )}
      {selected.map((segment) => (
        <p key={segment.id} className="flex justify-between gap-3">
          <span className="min-w-0 break-words">{segment.name}</span>
          <span className="shrink-0">{money(segment.fee_amount, event.currency)}</span>
        </p>
      ))}
      <p className="mt-2 flex justify-between gap-3 border-t border-[var(--line)] pt-2 text-base font-bold">
        <span>মোট</span>
        <span>{money(total, event.currency)}</span>
      </p>
    </div>
  );
}

function PaymentStep({ event, total, method, trx, onMethod, onTrx }: { event: PublicEvent; total: number; method: PayMethod | ""; trx: string; onMethod: (method: PayMethod) => void; onTrx: (value: string) => void }) {
  const number = method ? payNumber(event, method) : "";
  const wallet = PAY_METHODS.find((item) => item.id === method);
  return (
    <div className="space-y-4">
      <StepTitle title={`${money(total, event.currency)} পাঠান`} note="যে ওয়ালেট থেকে টাকা পাঠাবেন সেটি বেছে নিন, তারপর ট্রানজাকশন আইডি দিন। অর্গানাইজার মিলিয়ে কনফার্ম করবেন।" />
      <div className="grid grid-cols-2 gap-2">
        {PAY_METHODS.map((item) => (
          <button key={item.id} type="button" aria-pressed={method === item.id} className="option justify-center" onClick={() => onMethod(item.id)}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={item.logo} alt={item.label} className="h-9 w-auto max-w-full object-contain" />
          </button>
        ))}
      </div>
      {method && (
        <div className="rounded-[var(--radius-sm)] bg-[var(--paper)] p-4">
          <p className="text-sm muted">{wallet?.label}-এ “সেন্ড মানি” করুন এই নম্বরে</p>
          {number ? (
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <p className="font-mono text-2xl">{number}</p>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => navigator.clipboard?.writeText(number)}>কপি</button>
            </div>
          ) : <p className="mt-1 text-sm">অর্গানাইজার এখনও {wallet?.label} নম্বর দেননি। অন্য ওয়ালেট বেছে নিন বা অর্গানাইজারের সঙ্গে যোগাযোগ করুন।</p>}
        </div>
      )}
      <FieldLabel label="ট্রানজাকশন আইডি">
        <input className="field font-mono uppercase" value={trx} onChange={(change) => onTrx(change.target.value)} placeholder="যেমন 8N7A2K3P" autoComplete="off" />
      </FieldLabel>
    </div>
  );
}
