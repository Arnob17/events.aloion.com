"use client";

import { useEffect } from "react";

const CLICK_THRESHOLD_MS = 600;

function controlFrom(target: EventTarget | null) {
  if (!(target instanceof Element)) return null;
  const control = target.closest("button, input[type='submit'], input[type='button']");
  if (!(control instanceof HTMLElement)) return null;
  if (control.closest("[data-allow-repeat]")) return null;
  return control;
}

function tooSoon(el: HTMLElement, now: number) {
  const last = Number(el.dataset.guardedAt || "0");
  if (now - last < CLICK_THRESHOLD_MS) return true;
  el.dataset.guardedAt = String(now);
  return false;
}

export default function ClickGuard() {
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const control = controlFrom(event.target);
      if (!control) return;
      if (!tooSoon(control, performance.now())) return;
      event.preventDefault();
      event.stopPropagation();
    };

    const onSubmit = (event: SubmitEvent) => {
      const form = event.target;
      if (!(form instanceof HTMLFormElement)) return;
      if (form.closest("[data-allow-repeat]")) return;
      if (!tooSoon(form, performance.now())) return;
      event.preventDefault();
      event.stopPropagation();
    };

    document.addEventListener("click", onClick, true);
    document.addEventListener("submit", onSubmit, true);
    return () => {
      document.removeEventListener("click", onClick, true);
      document.removeEventListener("submit", onSubmit, true);
    };
  }, []);

  return null;
}
