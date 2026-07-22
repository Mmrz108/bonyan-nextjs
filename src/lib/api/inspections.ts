import { apiGet, apiSend, fetchPaginated } from "@/lib/api/client";
import type {
  ChecklistResultValue,
  InspectionChecklist,
} from "@/lib/api/types";

export function listChecklistTemplates() {
  return fetchPaginated<InspectionChecklist>("/inspection-checklists/", {
    is_template: "true",
    is_active: "true",
    page: 1,
  });
}

export function listVisitChecklists(siteVisitId: string) {
  return fetchPaginated<InspectionChecklist>(
    `/site-visits/${siteVisitId}/checklists/`,
    { page: 1 },
  );
}

export function getChecklist(id: string) {
  return apiGet<InspectionChecklist>(`/inspection-checklists/${id}/`);
}

export function attachChecklistFromTemplate(
  siteVisitId: string,
  templateId: string,
  title?: string,
) {
  return apiSend<InspectionChecklist>(
    `/site-visits/${siteVisitId}/checklists/`,
    "POST",
    { template: templateId, title: title || undefined },
  );
}

export function saveChecklistResults(
  checklistId: string,
  results: Array<{
    item: string;
    result: ChecklistResultValue;
    notes?: string;
  }>,
) {
  return apiSend<InspectionChecklist>(
    `/inspection-checklists/${checklistId}/results/`,
    "POST",
    { results },
  );
}

export function submitChecklist(checklistId: string, notes?: string) {
  return apiSend<InspectionChecklist>(
    `/inspection-checklists/${checklistId}/submit/`,
    "POST",
    { notes: notes || "" },
  );
}
