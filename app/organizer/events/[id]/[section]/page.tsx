"use client";

import { useParams } from "next/navigation";
import { EventDesk } from "@/components/event-desk";

export default function OrganizerSectionPage() {
  const params = useParams<{ id: string; section: string }>();
  return <EventDesk id={params.id} section={params.section} />;
}
