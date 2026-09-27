const STATUS: Record<string, string> = {
  draft: "খসড়া",
  submitted: "জমা দেওয়া",
  approved: "অনুমোদিত",
  rejected: "প্রত্যাখ্যাত",
  published: "প্রকাশিত",
  registration_open: "নিবন্ধন চলছে",
  registration_closed: "নিবন্ধন বন্ধ",
  ongoing: "চলছে",
  completed: "শেষ",
  cancelled: "বাতিল",
  pending: "অপেক্ষমাণ",
  confirmed: "নিশ্চিত",
  waitlisted: "অপেক্ষমাণ তালিকা",
  checked_in: "হাজির",
  unpaid: "বকেয়া",
  paid: "পরিশোধিত",
  not_required: "বিনামূল্যে",
  owner: "মালিক",
  manager: "ব্যবস্থাপক",
  scanner: "চেক-ইন",
  admin: "অ্যাডমিন",
};

export function personName(person?: { first_name?: string; last_name?: string } | null) {
  return `${person?.first_name || ""} ${person?.last_name || ""}`.trim() || "অতিথি";
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
  return event.venue || event.address || (event.location_type === "hybrid" ? "মিশ্র" : "স্থান পরে জানানো হবে");
}

export function statusLabel(status?: string) {
  if (!status) return "";
  return STATUS[status] || status.replaceAll("_", " ");
}

export function money(amount: number, currency = "BDT") {
  if (!amount) return "বিনামূল্যে";
  const unit = currency === "BDT" ? "টাকা" : currency;
  return `${amount.toLocaleString("bn-BD")} ${unit}`;
}

export const CATEGORIES = [
  { value: "Science", label: "বিজ্ঞান" },
  { value: "Olympiad", label: "অলিম্পিয়াড" },
  { value: "Competition", label: "প্রতিযোগিতা" },
  { value: "Workshop", label: "কর্মশালা" },
  { value: "Seminar", label: "সেমিনার" },
  { value: "Cultural", label: "সাংস্কৃতিক" },
  { value: "Club", label: "ক্লাব" },
  { value: "Hackathon", label: "হ্যাকাথন" },
  { value: "Conference", label: "সম্মেলন" },
  { value: "Camp", label: "ক্যাম্প" },
  { value: "Awards", label: "পুরস্কার" },
  { value: "Community", label: "কমিউনিটি" },
];

export function categoryLabel(value?: string) {
  return CATEGORIES.find((item) => item.value === value)?.label || value || "";
}
