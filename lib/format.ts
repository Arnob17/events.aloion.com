const STATUS: Record<string, string> = {
  draft: "ড্রাফট",
  submitted: "সাবমিটেড",
  approved: "অ্যাপ্রুভড",
  rejected: "রিজেক্টেড",
  published: "পাবলিশড",
  registration_open: "রেজিস্ট্রেশন চলছে",
  registration_closed: "রেজিস্ট্রেশন বন্ধ",
  ongoing: "চলছে",
  completed: "শেষ",
  cancelled: "ক্যান্সেল",
  pending: "পেন্ডিং",
  confirmed: "কনফার্মড",
  waitlisted: "ওয়েটলিস্ট",
  checked_in: "চেক-ইন",
  unpaid: "আনপেইড",
  paid: "পেইড",
  not_required: "ফ্রি",
  owner: "ওনার",
  manager: "ম্যানেজার",
  scanner: "চেক-ইন",
  admin: "অ্যাডমিন",
};

export function personName(person?: { first_name?: string; last_name?: string } | null) {
  return `${person?.first_name || ""} ${person?.last_name || ""}`.trim() || "গেস্ট";
}

export function when(value?: string | null, timeZone = "Asia/Dhaka") {
  if (!value) return "তারিখ পরে জানানো হবে";
  return new Intl.DateTimeFormat("bn-BD", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone,
  }).format(new Date(value));
}

export function whenDay(value?: string | null, timeZone = "Asia/Dhaka") {
  if (!value) return "তারিখ শিগগির";
  return new Intl.DateTimeFormat("bn-BD", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone,
  }).format(new Date(value));
}

export function place(event: { location_type?: string; venue?: string; address?: string }) {
  if (event.location_type === "online") return "অনলাইন";
  return event.venue || event.address || (event.location_type === "hybrid" ? "হাইব্রিড" : "লোকেশন পরে জানানো হবে");
}

export function statusLabel(status?: string) {
  if (!status) return "";
  return STATUS[status] || status.replaceAll("_", " ");
}

export function money(amount: number, currency = "BDT") {
  if (!amount) return "ফ্রি";
  const unit = currency === "BDT" ? "টাকা" : currency;
  return `${amount.toLocaleString("bn-BD")} ${unit}`;
}

export const CATEGORIES = [
  { value: "Science", label: "বিজ্ঞান" },
  { value: "Olympiad", label: "অলিম্পিয়াড" },
  { value: "Competition", label: "প্রতিযোগিতা" },
  { value: "Workshop", label: "ওয়ার্কশপ" },
  { value: "Seminar", label: "সেমিনার" },
  { value: "Cultural", label: "সাংস্কৃতিক" },
  { value: "Club", label: "ক্লাব" },
  { value: "Hackathon", label: "হ্যাকাথন" },
  { value: "Conference", label: "কনফারেন্স" },
  { value: "Camp", label: "ক্যাম্প" },
  { value: "Awards", label: "পুরস্কার" },
  { value: "Community", label: "কমিউনিটি" },
];

export function categoryLabel(value?: string) {
  return CATEGORIES.find((item) => item.value === value)?.label || value || "";
}

export function timeOnly(value?: string | null, timeZone = "Asia/Dhaka") {
  if (!value) return "";
  return new Intl.DateTimeFormat("bn-BD", { hour: "numeric", minute: "2-digit", timeZone }).format(new Date(value));
}

export function num(value: number) {
  return (value || 0).toLocaleString("bn-BD");
}

/** Value for <input type="datetime-local"> in the browser's own time, from an ISO time. */
export function toLocalInput(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (isNaN(date.getTime())) return "";
  const pad = (part: number) => String(part).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/** ISO time from a datetime-local value, or undefined when empty. */
export function fromLocalInput(value: string) {
  if (!value) return undefined;
  const date = new Date(value);
  return isNaN(date.getTime()) ? undefined : date.toISOString();
}

export type RegistrationWindow = "open" | "not_yet" | "ended" | "closed";

/** Whether someone could register right now: the status and the opening/closing dates both count. */
export function registrationWindow(event: { status: string; registration_opens_at?: string | null; registration_closes_at?: string | null }, now = Date.now()): RegistrationWindow {
  if (event.status !== "registration_open") return "closed";
  if (event.registration_opens_at && new Date(event.registration_opens_at).getTime() > now) return "not_yet";
  if (event.registration_closes_at && new Date(event.registration_closes_at).getTime() <= now) return "ended";
  return "open";
}

/** "৩ দিন বাকি", "৫ ঘণ্টা বাকি" until a time; empty when it has passed. */
export function timeLeft(value?: string | null, now = Date.now()) {
  if (!value) return "";
  const ms = new Date(value).getTime() - now;
  if (ms <= 0) return "";
  const hours = Math.floor(ms / 3600000);
  if (hours >= 48) return `${num(Math.floor(hours / 24))} দিন বাকি`;
  if (hours >= 1) return `${num(hours)} ঘণ্টা বাকি`;
  return `${num(Math.max(1, Math.floor(ms / 60000)))} মিনিট বাকি`;
}

export const ITEM_KINDS = [
  { value: "tshirt", label: "টি-শার্ট" },
  { value: "gift", label: "গিফট" },
  { value: "goodie", label: "গুডি ব্যাগ" },
  { value: "certificate", label: "সার্টিফিকেট" },
  { value: "prize", label: "পুরস্কার" },
  { value: "other", label: "অন্যান্য" },
];

export function itemKindLabel(value?: string) {
  return ITEM_KINDS.find((item) => item.value === value)?.label || value || "";
}

export const FIELD_TYPES = [
  { value: "text", label: "ছোট লেখা" },
  { value: "long_text", label: "বড় লেখা" },
  { value: "number", label: "সংখ্যা" },
  { value: "email", label: "ইমেইল" },
  { value: "phone", label: "ফোন" },
  { value: "date", label: "তারিখ" },
  { value: "dropdown", label: "ড্রপডাউন (একটি)" },
  { value: "radio", label: "একটি বেছে নিন" },
  { value: "multi_select", label: "একাধিক বেছে নিন" },
  { value: "checkbox", label: "হ্যাঁ/না" },
];

export function fieldTypeLabel(value?: string) {
  return FIELD_TYPES.find((item) => item.value === value)?.label || value || "";
}

export function fieldNeedsOptions(type: string) {
  return type === "dropdown" || type === "radio" || type === "multi_select";
}
