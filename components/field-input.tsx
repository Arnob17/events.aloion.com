"use client";

import type { CustomField } from "@/lib/types";

export type Answer = { value?: string; values?: string[] };

export function hasAnswer(field: CustomField, answer?: Answer) {
  if (field.field_type === "multi_select") return Boolean(answer?.values?.length);
  if (field.field_type === "checkbox") return answer?.value === "true";
  return Boolean(answer?.value?.trim());
}

/** One organizer-defined question, as a form control. Used by registration and by the organizer edit form. */
export function FieldInput({ field, value, onChange }: { field: CustomField; value?: Answer; onChange: (next: Answer) => void }) {
  const common = { className: "field", required: field.required };
  const label = `${field.label}${field.required ? " *" : ""}`;
  if (field.field_type === "checkbox") {
    return (
      <label className="option">
        <input type="checkbox" checked={value?.value === "true"} onChange={(event) => onChange({ value: event.target.checked ? "true" : "false" })} />
        <span><strong>{label}</strong>{field.description && <span className="block text-sm muted">{field.description}</span>}</span>
      </label>
    );
  }
  if (field.field_type === "multi_select" || field.field_type === "radio") {
    const multi = field.field_type === "multi_select";
    return (
      <fieldset>
        <legend className="mb-1 text-sm font-semibold">{label}</legend>
        {field.description && <p className="mb-2 text-sm muted">{field.description}</p>}
        <div className="grid gap-2 sm:grid-cols-2">
          {field.options.map((option) => {
            const checked = multi ? Boolean(value?.values?.includes(option)) : value?.value === option;
            return (
              <label key={option} className="option !py-2.5">
                <input
                  type={multi ? "checkbox" : "radio"}
                  name={`field-${field.id}`}
                  checked={checked}
                  onChange={() => {
                    if (!multi) return onChange({ value: option });
                    const current = value?.values || [];
                    onChange({ values: current.includes(option) ? current.filter((item) => item !== option) : [...current, option] });
                  }}
                />
                <span>{option}</span>
              </label>
            );
          })}
        </div>
      </fieldset>
    );
  }
  return (
    <label className="field-label">
      <span>{label}</span>
      {field.field_type === "long_text" ? (
        <textarea {...common} value={value?.value || ""} onChange={(event) => onChange({ value: event.target.value })} />
      ) : field.field_type === "dropdown" ? (
        <select {...common} value={value?.value || ""} onChange={(event) => onChange({ value: event.target.value })}>
          <option value="">বেছে নিন</option>
          {field.options.map((option) => <option key={option}>{option}</option>)}
        </select>
      ) : (
        <input
          {...common}
          type={field.field_type === "number" ? "number" : field.field_type === "date" ? "date" : field.field_type === "email" ? "email" : field.field_type === "phone" ? "tel" : "text"}
          value={value?.value || ""}
          onChange={(event) => onChange({ value: event.target.value })}
        />
      )}
      {field.description && <span className="field-hint">{field.description}</span>}
    </label>
  );
}
