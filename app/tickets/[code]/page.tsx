"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { AccountGate } from "@/components/account-gate";
import { RegistrationCard } from "@/components/registration-card";
import { api } from "@/lib/api";
import { useSession } from "@/lib/session";
import type { Registration } from "@/lib/types";

export default function TicketPage() {
  const { code } = useParams<{ code: string }>();
  const { user, loading } = useSession();
  const [ticket, setTicket] = useState<Registration | null>(null);
  const [error, setError] = useState("");
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (loading || !user) return;
    api.ticket(code).then((data) => {
      setTicket(data);
      if (data?.public_code) {
        document.title = `Ticket-${data.public_code}`;
      }
    }).catch((err: Error) => setError(err.message));
  }, [code, user, loading]);

  async function cancel() {
    if (!ticket || !confirm("এই রেজিস্ট্রেশন ক্যান্সেল করবেন?")) return;
    setCancelling(true);
    try {
      await api.cancelMine(ticket.public_code);
      setTicket({ ...ticket, status: "cancelled" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "ক্যান্সেল হয়নি");
    } finally {
      setCancelling(false);
    }
  }

  if (loading) return <main className="mx-auto max-w-md px-4 py-16">টিকিট লোড হচ্ছে…</main>;
  if (!user) {
    return (
      <main className="mx-auto max-w-lg px-4 py-16">
        <AccountGate title="আপনার টিকিট" body="যে আলোআয়ন অ্যাকাউন্ট দিয়ে রেজিস্ট্রেশন করেছেন, সেটি দিয়ে লগইন করুন। তারপর এই পাতায় পাস দেখা যাবে।" />
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-md px-4 py-10">
      {error && <p className="mb-4 text-sm text-red-700">{error}</p>}
      {!ticket && !error && <p>টিকিট লোড হচ্ছে…</p>}
      {ticket && (
        <>
          <RegistrationCard registration={ticket} showTicketLink={false} />
          {ticket.status !== "cancelled" && ticket.status !== "checked_in" && (
            <button className="btn btn-ghost mt-4 no-print" disabled={cancelling} onClick={cancel}>রেজিস্ট্রেশন ক্যান্সেল</button>
          )}
          <Link href="/my-events" className="mt-4 block text-center text-sm underline no-print">আমার সব ইভেন্ট</Link>
        </>
      )}
    </main>
  );
}
