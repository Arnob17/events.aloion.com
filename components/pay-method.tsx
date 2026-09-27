export const PAY_METHODS = [
  { id: "bkash", label: "বিকাশ", logo: "/bkash.png" },
  { id: "nagad", label: "নগদ", logo: "/nagad.png" },
] as const;

export type PayMethod = (typeof PAY_METHODS)[number]["id"];

export function payMethodLabel(method?: string) {
  return PAY_METHODS.find((item) => item.id === method)?.label || "";
}

export function payNumber(event: { bkash_number?: string; nagad_number?: string }, method: string) {
  if (method === "bkash") return (event.bkash_number || "").trim();
  if (method === "nagad") return (event.nagad_number || "").trim();
  return "";
}
