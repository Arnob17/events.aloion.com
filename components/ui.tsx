"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { statusLabel } from "@/lib/format";

/* ---------- Toasts: short feedback after an action, instead of alert(). ---------- */

type Toast = { id: number; text: string; tone: "ok" | "error" };
type ToastFn = (text: string, tone?: "ok" | "error") => void;

const ToastContext = createContext<ToastFn>(() => undefined);

/* ---------- Confirm: a real dialog, instead of window.confirm/prompt. ---------- */

type ConfirmOptions = {
  title: string;
  body?: string;
  confirmLabel?: string;
  danger?: boolean;
  /** When set, the dialog asks for text (for example a reject reason) and resolves with it. */
  input?: { label: string; placeholder?: string; required?: boolean };
};
type ConfirmFn = (options: ConfirmOptions) => Promise<string | false>;

const ConfirmContext = createContext<ConfirmFn>(async () => false);

export function UIProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [ask, setAsk] = useState<(ConfirmOptions & { resolve: (value: string | false) => void }) | null>(null);
  const nextId = useRef(1);

  const toast = useCallback<ToastFn>((text, tone = "ok") => {
    const id = nextId.current++;
    setToasts((rows) => [...rows.slice(-2), { id, text, tone }]);
    window.setTimeout(() => setToasts((rows) => rows.filter((row) => row.id !== id)), tone === "error" ? 6000 : 3500);
  }, []);

  const confirm = useCallback<ConfirmFn>((options) => new Promise((resolve) => setAsk({ ...options, resolve })), []);

  return (
    <ToastContext.Provider value={toast}>
      <ConfirmContext.Provider value={confirm}>
        {children}
        {ask && (
          <ConfirmDialog
            options={ask}
            onClose={(value) => {
              ask.resolve(value);
              setAsk(null);
            }}
          />
        )}
        <div className="toast-stack no-print" role="status" aria-live="polite">
          {toasts.map((row) => (
            <div key={row.id} className={`toast ${row.tone === "error" ? "toast-error" : ""}`}>
              <span aria-hidden="true">{row.tone === "error" ? "!" : "✓"}</span>
              <span className="min-w-0 flex-1 break-words">{row.text}</span>
            </div>
          ))}
        </div>
      </ConfirmContext.Provider>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}

export function useConfirm() {
  return useContext(ConfirmContext);
}

/** Runs an action and reports the result as a toast. Returns true when it worked. */
export function useAction() {
  const toast = useToast();
  return useCallback(
    async (work: () => Promise<unknown>, success?: string) => {
      try {
        await work();
        if (success) toast(success);
        return true;
      } catch (err) {
        toast(err instanceof Error ? err.message : "কাজটি হয়নি", "error");
        return false;
      }
    },
    [toast],
  );
}

function ConfirmDialog({ options, onClose }: { options: ConfirmOptions; onClose: (value: string | false) => void }) {
  const [text, setText] = useState("");
  const needsText = options.input?.required && !text.trim();
  useEscape(() => onClose(false));
  return (
    <>
      <div className="overlay" onClick={() => onClose(false)} />
      <div className="dialog p-5" role="alertdialog" aria-modal="true" aria-labelledby="confirm-title">
        <h2 id="confirm-title" className="text-lg font-bold">{options.title}</h2>
        {options.body && <p className="mt-1.5 text-sm muted">{options.body}</p>}
        <form
          className="mt-4"
          onSubmit={(event) => {
            event.preventDefault();
            if (needsText) return;
            onClose(options.input ? text.trim() : "ok");
          }}
        >
          {options.input && (
            <label className="field-label">
              <span>{options.input.label}</span>
              <textarea autoFocus className="field" placeholder={options.input.placeholder} value={text} onChange={(event) => setText(event.target.value)} />
            </label>
          )}
          <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button type="button" className="btn btn-ghost" onClick={() => onClose(false)}>বাতিল</button>
            <button autoFocus={!options.input} className={`btn ${options.danger ? "btn-danger" : "btn-primary"}`} disabled={Boolean(needsText)}>
              {options.confirmLabel || "নিশ্চিত"}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}

function useEscape(onEscape: () => void) {
  const ref = useRef(onEscape);
  ref.current = onEscape;
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape") ref.current();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);
}

/* ---------- Drawer: side panel for details and edit forms. ---------- */

export function Drawer({ title, subtitle, onClose, children, footer }: { title: string; subtitle?: ReactNode; onClose: () => void; children: ReactNode; footer?: ReactNode }) {
  useEscape(onClose);
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);
  return (
    <>
      <div className="overlay" onClick={onClose} />
      <aside className="drawer" role="dialog" aria-modal="true" aria-labelledby="drawer-title">
        <header className="flex items-start justify-between gap-3 border-b border-[var(--line)] px-5 py-4">
          <div className="min-w-0">
            <h2 id="drawer-title" className="text-lg font-bold break-words">{title}</h2>
            {subtitle && <div className="mt-0.5 text-sm muted">{subtitle}</div>}
          </div>
          <button className="btn btn-quiet btn-sm shrink-0" onClick={onClose} aria-label="বন্ধ করুন">✕</button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer && <footer className="border-t border-[var(--line)] px-5 py-3">{footer}</footer>}
      </aside>
    </>
  );
}

/* ---------- Small display pieces ---------- */

const STATUS_TONE: Record<string, string> = {
  draft: "gray",
  submitted: "blue",
  approved: "green",
  rejected: "red",
  published: "green",
  registration_open: "green",
  registration_closed: "amber",
  ongoing: "gold",
  completed: "gray",
  cancelled: "red",
  pending: "amber",
  confirmed: "green",
  waitlisted: "blue",
  checked_in: "dark",
  unpaid: "amber",
  paid: "green",
  not_required: "gray",
};

export function StatusBadge({ status, label }: { status: string; label?: string }) {
  return <span className={`badge badge-${STATUS_TONE[status] || "gray"}`}>{label || statusLabel(status)}</span>;
}

export function Badge({ tone = "gray", plain = false, children }: { tone?: "green" | "gold" | "red" | "amber" | "blue" | "gray" | "dark"; plain?: boolean; children: ReactNode }) {
  return <span className={`badge badge-${tone} ${plain ? "badge-plain" : ""}`}>{children}</span>;
}

export function EmptyState({ icon, title, body, action }: { icon?: ReactNode; title: string; body?: string; action?: ReactNode }) {
  return (
    <div className="card flex flex-col items-center px-6 py-12 text-center">
      {icon && <div className="grid h-12 w-12 place-items-center rounded-full bg-[var(--pine-soft)] text-[var(--pine)]">{icon}</div>}
      <h3 className="mt-3 text-lg font-bold">{title}</h3>
      {body && <p className="mt-1 max-w-md text-sm muted">{body}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function Stat({ label, value, hint, tone }: { label: string; value: ReactNode; hint?: ReactNode; tone?: "green" | "amber" }) {
  const color = tone === "green" ? "text-[var(--pine)]" : tone === "amber" ? "text-[var(--warn)]" : "";
  return (
    <div className="card p-4">
      <p className="text-sm muted">{label}</p>
      <p className={`mt-1 text-2xl font-bold tabular-nums sm:text-3xl ${color}`}>{value}</p>
      {hint && <p className="mt-1 text-xs muted">{hint}</p>}
    </div>
  );
}

export function PageLoading({ label = "লোড হচ্ছে…" }: { label?: string }) {
  return (
    <main className="mx-auto max-w-5xl px-4 py-10" aria-busy="true">
      <span className="sr-only">{label}</span>
      <div className="skeleton h-8 w-64" />
      <div className="skeleton mt-3 h-4 w-96 max-w-full" />
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <div className="skeleton h-40" />
        <div className="skeleton h-40" />
      </div>
    </main>
  );
}

export function Section({ title, description, action, children }: { title: string; description?: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="card p-5">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="panel-title">{title}</h2>
          {description && <p className="mt-0.5 text-sm muted">{description}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}
