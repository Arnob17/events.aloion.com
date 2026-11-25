import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EventGate } from "@/components/event-gate";
import { CalendarIcon, GiftIcon, LayersIcon, MapPinIcon, TicketIcon, UsersIcon, UtensilsIcon } from "@/components/icons";
import { mediaURL } from "@/lib/api";
import { categoryLabel, itemKindLabel, money, num, place, when } from "@/lib/format";
import type { PublicEvent } from "@/lib/types";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

function feeSummary(event: PublicEvent) {
  const priced = event.segments?.some((segment) => segment.fee_amount > 0);
  if (priced && event.fee_amount > 0) return `${money(event.fee_amount, event.currency)} + সেগমেন্টের ফি`;
  if (priced) return "সেগমেন্ট অনুযায়ী";
  return money(event.fee_amount, event.currency);
}

async function loadEvent(slug: string): Promise<PublicEvent | null> {
  try {
    const response = await fetch(`${API}/events/${slug}`, { cache: "no-store" });
    if (!response.ok) return null;
    return response.json();
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const event = await loadEvent(slug);
  if (!event) return { title: "ইভেন্ট" };
  const site = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3001";
  return {
    title: event.title,
    description: event.summary || event.description?.slice(0, 160),
    alternates: { canonical: `${site}/events/${event.slug}` },
    openGraph: {
      title: event.title,
      description: event.summary,
      images: event.cover_image_url ? [mediaURL(event.cover_image_url)] : undefined,
    },
    robots: { index: event.visibility === "public", follow: event.visibility === "public" },
  };
}

export default async function EventPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const event = await loadEvent(slug);
  if (!event) notFound();
  const hero = event.background_image_url || event.cover_image_url;
  const gifts = event.gifts || [];
  const meals = event.food_enabled ? event.meals || [] : [];

  return (
    <main className="pb-16">
      <section className="relative overflow-hidden border-b border-[var(--line)] bg-[var(--pine-deep)] text-white">
        {hero && (
          <div className="absolute inset-0 bg-cover bg-center opacity-35" style={{ backgroundImage: `url(${mediaURL(hero)})` }} aria-hidden="true" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--pine-deep)] via-[var(--pine-deep)]/80 to-transparent" aria-hidden="true" />
        <div className="relative mx-auto max-w-6xl px-4 pt-14 pb-10 sm:pt-20">
          <p className="text-sm font-semibold text-[var(--gold)]">{[categoryLabel(event.category), event.organization_name].filter(Boolean).join(" · ")}</p>
          <h1 className="serif mt-2 max-w-3xl text-4xl break-words sm:text-5xl">{event.title}</h1>
          {event.summary && <p className="mt-3 max-w-2xl text-lg text-white/85">{event.summary}</p>}
          <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm text-white/90">
            <span className="inline-flex items-center gap-2"><CalendarIcon className="h-4 w-4 text-[var(--gold)]" />{when(event.starts_at, event.timezone)}</span>
            <span className="inline-flex items-center gap-2"><MapPinIcon className="h-4 w-4 text-[var(--gold)]" />{place(event)}</span>
            <span className="inline-flex items-center gap-2"><TicketIcon className="h-4 w-4 text-[var(--gold)]" />{feeSummary(event)}</span>
          </div>
        </div>
      </section>

      <div className="mx-auto mt-8 grid max-w-6xl gap-8 px-4 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="min-w-0 space-y-10">
          {event.cover_image_url && event.background_image_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={mediaURL(event.cover_image_url)} alt="" className="aspect-[16/8] w-full rounded-[var(--radius)] object-cover" />
          )}
          {event.description && (
            <section>
              <h2 className="serif text-2xl">ইভেন্ট সম্পর্কে</h2>
              <div className="prose-text mt-3 text-[1.05rem]">{event.description}</div>
            </section>
          )}

          {event.segments?.length > 0 && (
            <section>
              <SectionTitle icon={<LayersIcon className="h-5 w-5" />} title="সেগমেন্ট" note={event.allow_segment_registration ? "রেজিস্ট্রেশনের সময় যেগুলোতে অংশ নেবেন সেগুলো বেছে নিন" : undefined} />
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {event.segments.map((segment) => (
                  <article key={segment.id} className="card p-4">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="font-bold break-words">{segment.name}</h3>
                      <span className="badge badge-plain badge-green shrink-0">{money(segment.fee_amount, event.currency)}</span>
                    </div>
                    {segment.description && <p className="mt-1 text-sm muted">{segment.description}</p>}
                    <div className="mt-3 space-y-1 text-sm">
                      {segment.starts_at && <p className="flex items-center gap-2"><CalendarIcon className="h-4 w-4 text-[var(--pine)]" />{when(segment.starts_at, event.timezone)}</p>}
                      {segment.location && <p className="flex items-center gap-2"><MapPinIcon className="h-4 w-4 text-[var(--pine)]" />{segment.location}</p>}
                      {segment.capacity ? <p className="flex items-center gap-2"><UsersIcon className="h-4 w-4 text-[var(--pine)]" />{num(segment.registration_count || 0)} / {num(segment.capacity)} সিট</p> : null}
                      {segment.eligibility && <p className="muted">যোগ্যতা: {segment.eligibility}</p>}
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}

          {(gifts.length > 0 || meals.length > 0) && (
            <section>
              <SectionTitle icon={<GiftIcon className="h-5 w-5" />} title="রেজিস্ট্রেশনে যা পাবেন" note="ইভেন্টের দিন টিকিটের কিউআর দেখিয়ে কাউন্টার থেকে নেবেন। নেওয়া হলে আপনার টিকিটে দেখাবে।" />
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {gifts.map((gift) => (
                  <div key={gift.id} className="card flex gap-3 p-4">
                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[var(--gold-soft)] text-[#7a5206]"><GiftIcon className="h-5 w-5" /></div>
                    <div className="min-w-0">
                      <p className="font-bold break-words">{gift.name}</p>
                      <p className="text-xs font-semibold muted">{itemKindLabel(gift.kind)}</p>
                      {gift.description && <p className="mt-1 text-sm muted">{gift.description}</p>}
                    </div>
                  </div>
                ))}
                {meals.length > 0 && (
                  <div className="card flex gap-3 p-4">
                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[var(--pine-soft)] text-[var(--pine)]"><UtensilsIcon className="h-5 w-5" /></div>
                    <div className="min-w-0">
                      <p className="font-bold">খাবার</p>
                      <p className="text-sm muted">রেজিস্ট্রেশনের সময় একটি বেছে নেবেন: {meals.map((meal) => meal.name).join(", ")}</p>
                    </div>
                  </div>
                )}
              </div>
            </section>
          )}

          {event.gallery && event.gallery.length > 0 && (
            <section>
              <h2 className="serif text-2xl">ছবি</h2>
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {event.gallery.map((url) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={url} src={mediaURL(url)} alt="" className="aspect-[4/3] w-full rounded-[var(--radius-sm)] object-cover" />
                ))}
              </div>
            </section>
          )}

          {event.rules && (
            <section>
              <h2 className="serif text-2xl">নিয়ম</h2>
              <div className="prose-text card mt-3 p-5">{event.rules}</div>
            </section>
          )}

          {event.faq?.length > 0 && (
            <section>
              <h2 className="serif text-2xl">সাধারণ প্রশ্ন</h2>
              <div className="mt-3 space-y-2">
                {event.faq.map((item) => (
                  <details key={item.question} className="card group p-4">
                    <summary className="cursor-pointer list-none font-semibold">
                      <span className="mr-2 inline-block text-[var(--pine)] transition group-open:rotate-90">›</span>{item.question}
                    </summary>
                    <p className="mt-2 pl-5 muted">{item.answer}</p>
                  </details>
                ))}
              </div>
            </section>
          )}
        </div>

        <aside className="order-first lg:order-none lg:sticky lg:top-24 lg:h-fit">
          <div className="card p-5">
            <EventGate event={event} />
            <dl className="mt-5 space-y-3 border-t border-[var(--line)] pt-4 text-sm">
              <Fact label="শুরু">{when(event.starts_at, event.timezone)}</Fact>
              {event.ends_at && <Fact label="শেষ">{when(event.ends_at, event.timezone)}</Fact>}
              <Fact label="লোকেশন">
                {place(event)}
                {event.address && event.address !== event.venue && <span className="block muted">{event.address}</span>}
                {event.map_url && <a className="text-[var(--pine)] underline" href={event.map_url} target="_blank" rel="noreferrer">ম্যাপে দেখুন</a>}
              </Fact>
              <Fact label="ফি">{feeSummary(event)}</Fact>
              <Fact label="রেজিস্টার্ড">{num(event.registration_count)}{event.capacity ? ` / ${num(event.capacity)} সিট` : " জন"}</Fact>
            </dl>
            {(event.contact_email || event.contact_phone) && (
              <div className="mt-4 border-t border-[var(--line)] pt-4 text-sm">
                <p className="font-semibold">অর্গানাইজারের যোগাযোগ</p>
                {event.contact_email && <a className="mt-1 block break-all text-[var(--pine)] underline" href={`mailto:${event.contact_email}`}>{event.contact_email}</a>}
                {event.contact_phone && <a className="mt-1 block text-[var(--pine)] underline" href={`tel:${event.contact_phone}`}>{event.contact_phone}</a>}
              </div>
            )}
          </div>
        </aside>
      </div>
    </main>
  );
}

function SectionTitle({ icon, title, note }: { icon: React.ReactNode; title: string; note?: string }) {
  return (
    <div>
      <h2 className="serif flex items-center gap-2 text-2xl"><span className="text-[var(--pine)]">{icon}</span>{title}</h2>
      {note && <p className="mt-1 text-sm muted">{note}</p>}
    </div>
  );
}

function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[5.5rem_minmax(0,1fr)] gap-2">
      <dt className="muted">{label}</dt>
      <dd className="font-medium break-words">{children}</dd>
    </div>
  );
}
