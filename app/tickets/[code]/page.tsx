"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { AccountGate } from "@/components/account-gate";
import { RegistrationCard } from "@/components/registration-card";
import { PageLoading, useConfirm, useToast } from "@/components/ui";
import { api } from "@/lib/api";
import { useSession } from "@/lib/session";
import type { Gift, Registration } from "@/lib/types";

export default function TicketPage() {
  const { code } = useParams<{ code: string }>();
  const { user, loading } = useSession();
  const confirm = useConfirm();
  const toast = useToast();
  const [ticket, setTicket] = useState<Registration | null>(null);
  const [gifts, setGifts] = useState<Gift[]>([]);
  const [error, setError] = useState("");
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (loading || !user) return;
    api.ticket(code).then((row) => {
      setTicket(row);
      if (row.event_slug) api.event(row.event_slug).then((event) => setGifts(event.gifts || [])).catch(() => undefined);
    }).catch((err: Error) => setError(err.message));
  }, [code, user, loading]);

  async function cancel() {
    if (!ticket) return;
    const ok = await confirm({ title: "রেজিস্ট্রেশন ক্যান্সেল করবেন?", body: "ক্যান্সেল করলে এই টিকিট আর কাজ করবে না। পেমেন্ট ফেরতের জন্য অর্গানাইজারের সঙ্গে যোগাযোগ করুন।", confirmLabel: "ক্যান্সেল করুন", danger: true });
    if (!ok) return;
    setCancelling(true);
    try {
      await api.cancelMine(ticket.public_code);
      setTicket({ ...ticket, status: "cancelled" });
      toast("রেজিস্ট্রেশন ক্যান্সেল হয়েছে");
    } catch (err) {
      toast(err instanceof Error ? err.message : "ক্যান্সেল হয়নি", "error");
    } finally {
      setCancelling(false);
    }
  }

  if (loading) return <PageLoading label="টিকিট লোড হচ্ছে…" />;
  if (!user) {
    return (
      <main className="mx-auto max-w-lg px-4 py-14">
        <AccountGate title="আপনার টিকিট" body="যে আলোআয়ন অ্যাকাউন্ট দিয়ে রেজিস্ট্রেশন করেছেন, সেটি দিয়ে লগইন করুন। তারপর এই পাতায় পাস দেখা যাবে।" />
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-lg px-4 py-8">
      <Link href="/my-events" className="text-sm font-semibold text-[var(--pine)]">← আমার সব টিকিট</Link>
      <div className="mt-3">
        {error && <p className="notice notice-error">{error}</p>}
        {!ticket && !error && <div className="skeleton h-96" />}
        {ticket && <RegistrationCard registration={ticket} showTicketLink={false} gifts={gifts} />}
      </div>
      {ticket && !["cancelled", "checked_in", "rejected"].includes(ticket.status) && (
        <button className="btn btn-danger-ghost mt-4 w-full" disabled={cancelling} onClick={cancel}>রেজিস্ট্রেশন ক্যান্সেল</button>
      )}
    </main>
  );
}
