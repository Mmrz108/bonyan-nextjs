import { apiGet, apiSend, fetchPaginated } from "@/lib/api/client";
import type {
  SiteVisit,
  SiteVisitListParams,
  SiteVisitWritePayload,
} from "@/lib/api/types";

const BASE = "/site-visits/";

export function listSiteVisits(params: SiteVisitListParams = {}) {
  return fetchPaginated<SiteVisit>(BASE, {
    search: params.search,
    status: params.status || undefined,
    project: params.project,
    scheduled_after: params.scheduled_after,
    scheduled_before: params.scheduled_before,
    assigned_to: params.assigned_to,
    ordering: params.ordering || "-scheduled_date,-created_at",
    page: params.page ?? 1,
  });
}

export function getSiteVisit(id: string) {
  return apiGet<SiteVisit>(`${BASE}${id}/`);
}

export function createSiteVisit(payload: SiteVisitWritePayload) {
  return apiSend<SiteVisit>(BASE, "POST", payload);
}

export function updateSiteVisit(
  id: string,
  payload: Partial<Pick<SiteVisitWritePayload, "title" | "notes" | "project_stage">>,
) {
  return apiSend<SiteVisit>(`${BASE}${id}/`, "PATCH", payload);
}

export function scheduleSiteVisit(id: string, scheduled_date: string) {
  return apiSend<SiteVisit>(`${BASE}${id}/schedule/`, "POST", {
    scheduled_date,
  });
}

export function checkInSiteVisit(
  id: string,
  payload: { latitude: string; longitude: string },
) {
  return apiSend<SiteVisit>(`${BASE}${id}/check-in/`, "POST", payload);
}

export function checkOutSiteVisit(
  id: string,
  payload: {
    latitude?: string;
    longitude?: string;
    notes?: string;
  } = {},
) {
  return apiSend<SiteVisit>(`${BASE}${id}/check-out/`, "POST", payload);
}

export function completeSiteVisit(id: string, notes?: string) {
  return apiSend<SiteVisit>(`${BASE}${id}/complete/`, "POST", {
    notes: notes || "",
  });
}
