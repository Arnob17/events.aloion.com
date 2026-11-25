"use client";

import { Html5Qrcode, Html5QrcodeScannerState } from "html5-qrcode";
import { useEffect, useRef, useState } from "react";

/**
 * Camera QR scanner. Calls onScan once per code; while `paused` is true scans are ignored,
 * so the operator can finish with one person before the next scan counts.
 */
export function QrScanner({ id = "qr-reader", paused, onScan }: { id?: string; paused: boolean; onScan: (text: string) => void }) {
  const [error, setError] = useState("");
  const pausedRef = useRef(paused);
  const onScanRef = useRef(onScan);
  pausedRef.current = paused;
  onScanRef.current = onScan;

  useEffect(() => {
    let node: Html5Qrcode | null = null;
    let cancelled = false;
    const timer = window.setTimeout(() => {
      node = new Html5Qrcode(id, false);
      node
        .start(
          { facingMode: "environment" },
          { fps: 8, qrbox: { width: 230, height: 230 } },
          (decoded) => {
            if (pausedRef.current || cancelled) return;
            pausedRef.current = true;
            onScanRef.current(decoded);
          },
          () => undefined,
        )
        .then(() => {
          if (cancelled && node) stopScanner(node);
        })
        .catch(() => {
          if (!cancelled) setError("ক্যামেরা চালু হয়নি। ব্রাউজারে ক্যামেরার অনুমতি দিন, অথবা নিচে রেজিস্ট্রেশন নম্বর লিখুন।");
        });
    }, 0);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      if (node) stopScanner(node);
    };
  }, [id]);

  return (
    <div>
      <div className="relative overflow-hidden rounded-[var(--radius)] bg-black">
        <div id={id} className="min-h-[14rem]" />
        {paused && !error && (
          <div className="absolute inset-0 grid place-items-center bg-black/60 text-sm font-semibold text-white">স্ক্যান থামানো আছে</div>
        )}
      </div>
      {error && <p className="notice notice-warn mt-2">{error}</p>}
    </div>
  );
}

function stopScanner(node: Html5Qrcode) {
  try {
    const state = node.getState();
    if (state !== Html5QrcodeScannerState.SCANNING && state !== Html5QrcodeScannerState.PAUSED) return;
    node.stop().catch(() => undefined);
  } catch {
    // stop() throws when the camera never started.
  }
}
