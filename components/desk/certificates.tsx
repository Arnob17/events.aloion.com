"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AwardIcon } from "@/components/icons";
import { EmptyState, Section, useAction } from "@/components/ui";
import { api } from "@/lib/api";
import { num, whenDay } from "@/lib/format";
import type { Certificate, Workspace } from "@/lib/types";

export function Certificates({ workspace }: { workspace: Workspace }) {
  const eventId = workspace.event.id;
  const act = useAction();
  const [code, setCode] = useState("");
  const [rows, setRows] = useState<Certificate[] | null>(null);

  const load = () => api.certificates(eventId).then((data) => setRows(data.certificates || [])).catch(() => setRows([]));
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId]);

  return (
    <div className="space-y-5">
      <Section title="সার্টিফিকেট ইস্যু" description="গেটে চেক-ইন হওয়া অংশগ্রহণকারীদের সার্টিফিকেট দেওয়া যায়। প্রতিটিতে যাচাইয়ের আলাদা লিংক থাকে, আর অংশগ্রহণকারী তাঁর “আমার টিকিট” পাতায় পান।">
        <form className="flex flex-col gap-2 sm:flex-row" onSubmit={(event) => {
          event.preventDefault();
          if (!code.trim()) return;
          act(() => api.issueCertificate(eventId, code.trim()).then(() => { setCode(""); return load(); }), "সার্টিফিকেট ইস্যু হয়েছে");
        }}>
          <input className="field font-mono sm:max-w-xs" placeholder="রেজিস্ট্রেশন নম্বর" value={code} onChange={(event) => setCode(event.target.value)} aria-label="রেজিস্ট্রেশন নম্বর" />
          <button className="btn btn-primary">ইস্যু করুন</button>
        </form>
      </Section>
      <div>
        <h2 className="mb-3 font-bold">ইস্যু করা সার্টিফিকেট {rows && <span className="muted">({num(rows.length)})</span>}</h2>
        {rows === null ? <div className="skeleton h-24" /> : rows.length === 0 ? (
          <EmptyState icon={<AwardIcon />} title="এখনো কোনো সার্টিফিকেট নেই" />
        ) : (
          <div className="card divide-y divide-[var(--line)]">
            {rows.map((row) => (
              <div key={row.hash} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm">
                <div className="min-w-0">
                  <p className="font-semibold">{row.recipient_name}</p>
                  <p className="muted">{row.title} · <span className="font-mono">{row.public_code}</span> · {whenDay(row.issued_at)}</p>
                </div>
                <Link href={`/certificates/${row.hash}`} target="_blank" className="btn btn-quiet btn-sm">যাচাই লিংক ↗</Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
