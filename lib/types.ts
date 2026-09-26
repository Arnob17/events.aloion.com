export type EventStatus =
  | "draft"
  | "submitted"
  | "approved"
  | "rejected"
  | "published"
  | "registration_open"
  | "registration_closed"
  | "ongoing"
  | "completed"
  | "cancelled";

export interface User {
  id: number;
  first_name: string;
  last_name: string;
  username?: string;
  email: string;
  phone?: string;
  role: string;
  school_name?: string;
  profile_picture?: string;
}

export interface Person {
  id: number;
  first_name: string;
  last_name: string;
  username?: string;
  profile_picture?: string;
  email?: string;
  phone?: string;
  school_name?: string;
}

export interface Segment {
  id: number;
  name: string;
  description: string;
  starts_at?: string | null;
  ends_at?: string | null;
  location: string;
  capacity?: number | null;
  registration_required: boolean;
  eligibility: string;
  fee_amount: number;
  officials: string;
  sort_order: number;
  registration_count?: number;
}

export interface CustomField {
  id: number;
  key: string;
  label: string;
  description: string;
  field_type: string;
  required: boolean;
  options: string[];
  validation: { min?: number; max?: number; max_length?: number };
  sort_order: number;
}

export interface Meal {
  id: number;
  name: string;
  category: string;
  description: string;
  sort_order: number;
  count?: number;
}

export interface EventItem {
  id: number;
  name: string;
  kind: string;
  description: string;
  quantity?: number | null;
  distributed: number;
  sort_order: number;
}

export interface EventCard {
  id: number;
  slug: string;
  title: string;
  summary: string;
  category: string;
  cover_image_url: string;
  background_image_url?: string;
  gallery?: string[];
  organization_name: string;
  starts_at?: string | null;
  ends_at?: string | null;
  timezone: string;
  location_type: string;
  venue: string;
  address: string;
  status: EventStatus;
  visibility: string;
  featured: boolean;
  fee_amount: number;
  currency: string;
  capacity?: number | null;
  registration_count: number;
}

export interface FAQ {
  question: string;
  answer: string;
}

export interface PublicEvent extends EventCard {
  description: string;
  contact_email: string;
  contact_phone: string;
  map_url: string;
  online_url: string;
  registration_required: boolean;
  registration_opens_at?: string | null;
  registration_closes_at?: string | null;
  waitlist_enabled: boolean;
  allow_segment_registration: boolean;
  rules: string;
  faq: FAQ[];
  food_enabled: boolean;
  segments: Segment[];
  fields: CustomField[];
  meals: Meal[];
  my_registration?: Registration | null;
}

export interface Registration {
  public_code: string;
  status: string;
  payment_status: string;
  registered_at: string;
  checked_in_at?: string | null;
  participant: Person;
  segments: Segment[];
  answers: { field_id: number; key: string; label: string; field_type: string; value: string }[];
  meal?: Meal | null;
  event_slug?: string;
  event_title?: string;
  event_starts_at?: string | null;
  event_ends_at?: string | null;
  venue?: string;
  address?: string;
  qr_token?: string;
}

export interface Organizer {
  user_id: number;
  role: string;
  person: Person;
}

export interface Counts {
  registrations: number;
  confirmed: number;
  pending: number;
  waitlisted: number;
  cancelled: number;
  checked_in: number;
  capacity?: number | null;
  attendance_rate: number;
}

export interface Workspace {
  event: PublicEvent;
  review_note: string;
  code_prefix: string;
  actions: string[];
  role: string;
  organizers: Organizer[];
  items: EventItem[];
  counts: Counts;
  checklist: { has_schedule: boolean; has_location: boolean; has_description: boolean };
  allow_multiple_registrations: boolean;
}

export interface Analytics extends Counts {
  segments: Segment[];
  meals: Meal[];
  registrations_by_day: { date: string; count: number }[];
}

export interface SegmentScan {
  id: number;
  name: string;
  location?: string;
  done: boolean;
  checked_in_at?: string | null;
}

export interface ScanResult {
  result: string;
  participant_name?: string;
  registration_code?: string;
  segments?: SegmentScan[];
  status?: string;
  checked_in_at?: string | null;
}

export interface Certificate {
  hash: string;
  title: string;
  recipient_name: string;
  event_title: string;
  event_slug?: string;
  public_code?: string;
  issued_at: string;
  verify_url: string;
}

export interface EventInput {
  title?: string;
  summary?: string;
  description?: string;
  category?: string;
  cover_image_url?: string;
  background_image_url?: string;
  gallery?: string[];
  organization_name?: string;
  contact_email?: string;
  contact_phone?: string;
  timezone?: string;
  starts_at?: string | null;
  ends_at?: string | null;
  registration_opens_at?: string | null;
  registration_closes_at?: string | null;
  location_type?: string;
  venue?: string;
  address?: string;
  map_url?: string;
  online_url?: string;
  registration_required?: boolean;
  fee_amount?: number;
  has_capacity?: boolean;
  capacity?: number;
  waitlist_enabled?: boolean;
  allow_segment_registration?: boolean;
  allow_multiple_registrations?: boolean;
  visibility?: string;
  featured?: boolean;
  rules?: string;
  faq?: FAQ[];
  food_enabled?: boolean;
  code_prefix?: string;
}
