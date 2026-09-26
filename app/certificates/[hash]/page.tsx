import type { Metadata } from "next";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

async function load(hash: string) {
  try {
    const response = await fetch(`${API}/event-certificates/verify/${hash}`, { cache: "no-store" });
    if (!response.ok) return null;
    return response.json() as Promise<{ title: string; recipient_name: string; event_title: string; issued_at: string }>;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ hash: string }> }): Promise<Metadata> {
  return { title: "সনদ", robots: { index: false, follow: false } };
}

export default async function CertificatePage({ params }: { params: Promise<{ hash: string }> }) {
  const { hash } = await params;
  const certificate = await load(hash);
  if (!certificate) {
    return <main className="mx-auto max-w-lg px-4 py-16"><h1 className="serif text-4xl">সনদ পাওয়া যায়নি</h1></main>;
  }
  return (
    <main className="mx-auto max-w-lg px-4 py-16 text-center">
      <p className="text-sm font-medium text-[var(--pine)]">যাচাই করা আলোআয়ন সনদ</p>
      <h1 className="serif mt-3 text-4xl">{certificate.title}</h1>
      <p className="mt-4 text-xl">{certificate.recipient_name}</p>
      <p className="text-[var(--muted)]">{certificate.event_title}</p>
      <p className="mt-2 text-sm">ইস্যু {new Date(certificate.issued_at).toLocaleDateString("bn-BD")}</p>
    </main>
  );
}
