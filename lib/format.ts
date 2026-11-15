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
