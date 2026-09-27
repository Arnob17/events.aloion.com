import type { ReactNode } from "react";

export function FieldLabel({ label, className = "", children }: { label: string; className?: string; children: ReactNode }) {
  return (
    <label className={`field-label ${className}`}>
      <span>{label}</span>
      {children}
    </label>
  );
}
