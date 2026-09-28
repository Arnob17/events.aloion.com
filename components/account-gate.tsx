"use client";

import { useEffect, useState } from "react";
import { AloionMark } from "@/components/aloion-mark";
import { aloionRegisterURL } from "@/lib/api";
import { useSession } from "@/lib/session";

export function AccountGate({ title, body }: { title: string; body: string }) {
  const { login } = useSession();
  const [dest, setDest] = useState("");

  useEffect(() => {
    setDest(window.location.href);
  }, []);

  return (
    <div className="card p-6">
      <p className="text-sm font-medium text-[var(--pine)]">আলোআয়ন অ্যাকাউন্ট</p>
      <h2 className="serif mt-2 text-3xl">{title}</h2>
      <p className="mt-2 text-[var(--muted)]">{body}</p>
      <div className="mt-5 flex flex-col gap-2">
        <button className="btn btn-primary" onClick={() => login(dest || undefined)}><AloionMark />আলোআয়ন দিয়ে চালিয়ে যান</button>
        <a className="btn btn-ghost" href={dest ? aloionRegisterURL(dest) : "#"}><AloionMark />আলোআয়ন অ্যাকাউন্ট খুলুন</a>
      </div>
      <p className="mt-4 text-sm text-[var(--muted)]">লগইন বা অ্যাকাউন্ট খোলার পর আপনি এই পাতায় ফিরে আসবেন। কনফার্মেশনের চিঠি সেই ইমেইলে যাবে।</p>
    </div>
  );
}
