import type {
  Analytics,
  Certificate,
  EventCard,
  EventInput,
  PublicEvent,
  Registration,
  ScanResult,
  User,
  Workspace,
} from "./types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export function mediaURL(path?: string | null) {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  const origin = API_BASE.replace(/\/api\/v1\/?$/, "");
  const suffix = path.startsWith("/uploads") ? path : `/uploads/${path.replace(/^\/+/, "")}`;
  return `${origin}/api/v1${suffix}`;
}

export function aloionLoginURL(returnTo: string) {
  const base = process.env.NEXT_PUBLIC_ALOION_URL || "http://localhost:3000";
  const url = new URL("/en/login", base);
  url.searchParams.set("return_to", returnTo);
  return url.toString();
}

export function aloionRegisterURL(returnTo: string) {
  const base = process.env.NEXT_PUBLIC_ALOION_URL || "http://localhost:3000";
  const url = new URL("/en/register", base);
  url.searchParams.set("return_to", returnTo);
  return url.toString();
}

function token() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("events_token");
}

function refreshToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("events_refresh_token");
}

export function storeSession(access: string, refresh?: string) {
  localStorage.setItem("events_token", access);
  if (refresh) localStorage.setItem("events_refresh_token", refresh);
}

export function clearSession() {
  localStorage.removeItem("events_token");
  localStorage.removeItem("events_refresh_token");
}

async function refresh(): Promise<boolean> {
  const current = refreshToken();
  if (!current) return false;
  const response = await fetch(`${API_BASE}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token: current }),
  });
  const data = await response.json().catch(() => null);
  if (!response.ok || !data?.token) {
    clearSession();
    return false;
  }
  storeSession(data.token, data.refresh_token);
  return true;
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, options: RequestInit = {}, attempt = 0): Promise<T> {
  const headers = new Headers(options.headers);
  if (!(options.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  const access = token();
  if (access) headers.set("Authorization", `Bearer ${access}`);
  const response = await fetch(`${API_BASE}${path}`, { ...options, headers });
  if (response.status === 401 && attempt === 0 && refreshToken() && !path.startsWith("/auth/")) {
    if (await refresh()) return request<T>(path, options, 1);
  }
  if (response.status === 204) return undefined as T;
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new ApiError(data?.error || "Something went wrong", response.status);
  }
  return data as T;
}

export const api = {
  exchange: (code: string) =>
    request<{ token: string; refresh_token: string; user: User }>("/auth/exchange", {
      method: "POST",
      body: JSON.stringify({ code }),
    }),
  me: () => request<User>("/users/me"),
  events: (query = "") => request<{ events: EventCard[]; total: number }>(`/events${query}`),
  event: (slug: string) => request<PublicEvent>(`/events/${slug}`),
  managed: () => request<{ events: EventCard[] }>("/me/events"),
  mine: () => request<{ registrations: Registration[]; certificates: Certificate[] }>("/me/registrations"),
  create: (body: EventInput) => request<Workspace>("/events", { method: "POST", body: JSON.stringify(body) }),
  update: (id: number, body: EventInput) =>
    request<Workspace>(`/events/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  workspace: (id: number) => request<Workspace>(`/events/${id}/workspace`),
  act: (id: number, action: string, body?: object) =>
    request<Workspace>(`/events/${id}/${action}`, { method: "POST", body: JSON.stringify(body || {}) }),
  register: (id: number, body: object) =>
    request<Registration>(`/events/${id}/register`, { method: "POST", body: JSON.stringify(body) }),
  ticket: (code: string) => request<Registration>(`/registrations/${encodeURIComponent(code)}`),
  cancelMine: (code: string) =>
    request(`/registrations/${encodeURIComponent(code)}/cancel`, { method: "POST", body: "{}" }),
  registrations: (id: number, query = "") =>
    request<{ registrations: Registration[]; total: number }>(`/events/${id}/registrations${query}`),
  setRegistration: (id: number, code: string, action: "confirm" | "reject" | "cancel") =>
    request<Registration>(`/events/${id}/registrations/${encodeURIComponent(code)}/${action}`, {
      method: "POST",
      body: "{}",
    }),
  validate: (id: number, body: object) =>
    request<ScanResult>(`/events/${id}/check-ins/validate`, { method: "POST", body: JSON.stringify(body) }),
  checkIn: (id: number, body: object) =>
    request<ScanResult>(`/events/${id}/check-ins`, { method: "POST", body: JSON.stringify(body) }),
  undo: (id: number, code: string, segmentId?: number) =>
    request<ScanResult>(`/events/${id}/check-ins/${encodeURIComponent(code)}/undo`, {
      method: "POST",
      body: JSON.stringify(segmentId ? { segment_id: segmentId } : {}),
    }),
  analytics: (id: number) => request<Analytics>(`/events/${id}/analytics`),
  saveSegment: (id: number, body: object, segmentId?: number) =>
    request(segmentId ? `/events/${id}/segments/${segmentId}` : `/events/${id}/segments`, {
      method: segmentId ? "PATCH" : "POST",
      body: JSON.stringify(body),
    }),
  deleteSegment: (id: number, segmentId: number) =>
    request(`/events/${id}/segments/${segmentId}`, { method: "DELETE" }),
  saveField: (id: number, body: object, fieldId?: number) =>
    request(fieldId ? `/events/${id}/fields/${fieldId}` : `/events/${id}/fields`, {
      method: fieldId ? "PATCH" : "POST",
      body: JSON.stringify(body),
    }),
  deleteField: (id: number, fieldId: number) => request(`/events/${id}/fields/${fieldId}`, { method: "DELETE" }),
  saveMeal: (id: number, body: object, mealId?: number) =>
    request(mealId ? `/events/${id}/meals/${mealId}` : `/events/${id}/meals`, {
      method: mealId ? "PATCH" : "POST",
      body: JSON.stringify(body),
    }),
  deleteMeal: (id: number, mealId: number) => request(`/events/${id}/meals/${mealId}`, { method: "DELETE" }),
  saveItem: (id: number, body: object, itemId?: number) =>
    request(itemId ? `/events/${id}/items/${itemId}` : `/events/${id}/items`, {
      method: itemId ? "PATCH" : "POST",
      body: JSON.stringify(body),
    }),
  deleteItem: (id: number, itemId: number) => request(`/events/${id}/items/${itemId}`, { method: "DELETE" }),
  distribute: (id: number, itemId: number, code: string) =>
    request(`/events/${id}/items/${itemId}/distribute`, { method: "POST", body: JSON.stringify({ code }) }),
  addOrganizer: (id: number, identifier: string, role: string) =>
    request(`/events/${id}/organizers`, { method: "POST", body: JSON.stringify({ identifier, role }) }),
  removeOrganizer: (id: number, userId: number) =>
    request(`/events/${id}/organizers/${userId}`, { method: "DELETE" }),
  certificates: (id: number) => request<{ certificates: Certificate[] }>(`/events/${id}/certificates`),
  issueCertificate: (id: number, code: string) =>
    request<Certificate>(`/events/${id}/certificates`, { method: "POST", body: JSON.stringify({ code }) }),
  verifyCertificate: (hash: string) => request<Certificate>(`/event-certificates/verify/${hash}`),
  adminEvents: (query = "") => request<{ events: EventCard[]; total: number }>(`/admin/events${query}`),
  approve: (id: number) => request<Workspace>(`/admin/events/${id}/approve`, { method: "POST", body: "{}" }),
  reject: (id: number, note: string) =>
    request<Workspace>(`/admin/events/${id}/reject`, { method: "POST", body: JSON.stringify({ note }) }),
  grant: (identifier: string) =>
    request(`/admin/events/publish-grants`, { method: "POST", body: JSON.stringify({ identifier }) }),
  upload: async (file: File) => {
    const body = new FormData();
    body.append("file", file);
    return request<{ url: string }>("/events/media", { method: "POST", body });
  },
  exportRegistrations: async (id: number, query = "") => {
    const headers = new Headers();
    const access = token();
    if (access) headers.set("Authorization", `Bearer ${access}`);
    const response = await fetch(`${API_BASE}/events/${id}/registrations/export${query}`, { headers });
    if (!response.ok) {
      const data = await response.json().catch(() => null);
      throw new ApiError(data?.error || "Could not export", response.status);
    }
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "registrations.csv";
    link.click();
    URL.revokeObjectURL(url);
  },
};
