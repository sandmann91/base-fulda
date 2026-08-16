import type { EventRecord } from "@/types/event";
import { apiRequest } from "./client";

export function listEvents(params?: { upcoming?: boolean }): Promise<{ ok: true; events: EventRecord[] }> {
  const query = params?.upcoming ? "?upcoming=1" : "";
  return apiRequest(`events.php${query}`);
}

export function getEvent(slug: string): Promise<{ ok: true; event: EventRecord }> {
  return apiRequest(`events.php?slug=${encodeURIComponent(slug)}`);
}

export function createEvent(formData: FormData): Promise<{ ok: true; event: EventRecord }> {
  return apiRequest("events.php", { method: "POST", body: formData, auth: true });
}

export function updateEvent(id: string, formData: FormData): Promise<{ ok: true; event: EventRecord }> {
  formData.set("id", id);
  return apiRequest("events.php", { method: "POST", body: formData, auth: true });
}

export function deleteEvent(id: string): Promise<{ ok: true }> {
  return apiRequest(`events.php?id=${encodeURIComponent(id)}`, { method: "DELETE", auth: true });
}
