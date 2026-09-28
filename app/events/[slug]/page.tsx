import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EventGate } from "@/components/event-gate";
import { mediaURL } from "@/lib/api";
import { categoryLabel, money, place, statusLabel, when } from "@/lib/format";
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
  const open = event.status === "registration_open";

  return (
    <main>
      {event.background_image_url && (
        <div className="h-56 w-full bg-cover bg-center" style={{ backgroundImage: `url(${mediaURL(event.background_image_url)})` }} />
      )}
      <div className="mx-auto max-w-6xl px-4 py-8">
      <section className="grid gap-8 md:grid-cols-[1.4fr_0.8fr]">
        <div>
          <p className="text-sm font-semibold text-[var(--pine)]">
            {[categoryLabel(event.category), event.organization_name].filter(Boolean).join(" · ")}
          </p>
          <h1 className="serif mt-2 text-4xl leading-[1.05] break-words sm:text-5xl md:text-6xl md:leading-[0.95]">{event.title}</h1>
          <p className="mt-4 text-lg text-[var(--muted)]">{event.summary}</p>
          {event.cover_image_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={mediaURL(event.cover_image_url)} alt="" className="mt-6 aspect-[16/8] w-full rounded-[0.7rem] object-cover" />
          )}
          <article className="mt-8 max-w-none whitespace-pre-wrap break-words text-[1.05rem] leading-relaxed">{event.description}</article>
          {event.gallery && event.gallery.length > 0 && (
            <div className="mt-6 grid grid-cols-1 gap-3 min-[420px]:grid-cols-2">
              {event.gallery.map((url) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={url} src={mediaURL(url)} alt="" className="aspect-[4/3] w-full rounded-[0.7rem] object-cover" />
              ))}
            </div>
          )}
        </div>
        <aside className="card h-fit p-5 md:sticky md:top-24">
          <p className="text-sm font-semibold text-[var(--pine)]">{statusLabel(event.status)}</p>
          <dl className="mt-4 space-y-3 text-sm">
            <div><dt className="text-[var(--muted)]">সময়</dt><dd className="font-medium">{when(event.starts_at, event.timezone)}</dd></div>
            <div><dt className="text-[var(--muted)]">লোকেশন</dt><dd className="font-medium">{place(event)}</dd>{event.address && <dd>{event.address}</dd>}</div>
            <div><dt className="text-[var(--muted)]">ফি</dt><dd className="font-medium">{feeSummary(event)}</dd></div>
            <div><dt className="text-[var(--muted)]">রেজিস্টার্ড</dt><dd className="font-medium">{event.registration_count.toLocaleString("bn-BD")}{event.capacity ? ` / ${event.capacity.toLocaleString("bn-BD")}` : ""}</dd></div>
          </dl>
          <EventGate slug={event.slug} open={open} />
          {(event.contact_email || event.contact_phone) && (
            <p className="mt-4 text-sm text-[var(--muted)]">যোগাযোগ {event.contact_email || event.contact_phone}</p>
          )}
        </aside>
      </section>

      {event.segments?.length > 0 && (
        <section className="mt-12">
          <h2 className="serif text-3xl">সেগমেন্ট</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {event.segments.map((segment) => (
              <article key={segment.id} className="card p-4">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-lg font-semibold">{segment.name}</h3>
                  <p className="shrink-0 text-sm font-semibold">{money(segment.fee_amount, event.currency)}</p>
                </div>
                <p className="mt-1 text-sm text-[var(--muted)]">{segment.description}</p>
                <p className="mt-2 text-sm">{[when(segment.starts_at), segment.location, segment.eligibility].filter((part) => part && part !== "তারিখ পরে জানানো হবে").join(" · ")}</p>
              </article>
            ))}
          </div>
        </section>
      )}

      {event.rules && <section className="mt-12"><h2 className="serif text-3xl">রুলস</h2><p className="mt-3 whitespace-pre-wrap">{event.rules}</p></section>}
      {event.faq?.length > 0 && (
        <section className="mt-12">
          <h2 className="serif text-3xl">এফএকিউ</h2>
          <div className="mt-4 space-y-4">
            {event.faq.map((item) => (
              <div key={item.question}><h3 className="font-semibold">{item.question}</h3><p className="text-[var(--muted)]">{item.answer}</p></div>
            ))}
          </div>
        </section>
      )}
      </div>
    </main>
  );
}
