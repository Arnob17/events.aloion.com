"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";

export function TicketQR({ token }: { token: string }) {
  const [src, setSrc] = useState("");
  useEffect(() => {
    QRCode.toDataURL(token, { margin: 1, width: 280 }).then(setSrc).catch(() => setSrc(""));
  }, [token]);
  if (!src) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt="Ticket QR code" className="mx-auto mt-4 rounded-2xl bg-white p-3" />
  );
}
