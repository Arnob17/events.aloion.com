"use client";

import { useParams } from "next/navigation";
import { EventDesk } from "@/components/event-desk";

export default function OrganizerEventPage() {
  const params = useParams<{ id: string }>();
  return <EventDesk id={params.id} section="" />;
}
