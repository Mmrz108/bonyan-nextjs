import { apiGet, apiSend, apiUpload, fetchPaginated } from "@/lib/api/client";
import { apiFetch } from "@/lib/auth/client";
import type {
  PdfLanguage,
  Report,
  ReportListItem,
  ReportListParams,
  ReportPdfStatus,
  ReportSignature,
  ReportSignatureKind,
  ReportWritePayload,
} from "@/lib/api/types";

const BASE = "/reports/";

export function listReports(params: ReportListParams = {}) {
  return fetchPaginated<ReportListItem>(BASE, {
    search: params.search,
    status: params.status || undefined,
    project: params.project,
    site_visit: params.site_visit,
    ordering: params.ordering || "-created_at",
    page: params.page ?? 1,
  });
}

export function getReport(id: string) {
  return apiGet<Report>(`${BASE}${id}/`);
}

export function createReport(payload: ReportWritePayload) {
  return apiSend<Report>(BASE, "POST", payload);
}

export function updateReport(
  id: string,
  payload: Pick<ReportWritePayload, "title" | "summary">,
) {
  return apiSend<Report>(`${BASE}${id}/`, "PATCH", payload);
}

export function deleteReport(id: string) {
  return apiSend<void>(`${BASE}${id}/`, "DELETE");
}

export function submitReport(id: string, notes?: string) {
  return apiSend<Report>(`${BASE}${id}/submit/`, "POST", { notes: notes || "" });
}

export function reviewReport(id: string, notes?: string) {
  return apiSend<Report>(`${BASE}${id}/review/`, "POST", { notes: notes || "" });
}

export function approveReport(id: string, notes?: string) {
  return apiSend<Report>(`${BASE}${id}/approve/`, "POST", { notes: notes || "" });
}

export function rejectReport(id: string, reason: string) {
  return apiSend<Report>(`${BASE}${id}/reject/`, "POST", { reason });
}

export function sendReport(id: string, notes?: string) {
  return apiSend<Report>(`${BASE}${id}/send/`, "POST", { notes: notes || "" });
}

export function listReportSignatures(reportId: string) {
  return apiGet<ReportSignature[] | { results: ReportSignature[] }>(
    `${BASE}${reportId}/signatures/`,
  ).then((data) => (Array.isArray(data) ? data : data.results));
}

export function uploadReportSignature(
  reportId: string,
  input: {
    kind: ReportSignatureKind;
    file: Blob;
    fileName?: string;
    signer_name?: string;
    signer_email?: string;
    signer_title?: string;
    statement?: string;
  },
) {
  const form = new FormData();
  form.append(
    "image",
    input.file,
    input.fileName || `signature-${input.kind}.png`,
  );
  form.append("kind", input.kind);
  if (input.signer_name) form.append("signer_name", input.signer_name);
  if (input.signer_email) form.append("signer_email", input.signer_email);
  if (input.signer_title) form.append("signer_title", input.signer_title);
  if (input.statement) form.append("statement", input.statement);
  return apiUpload<ReportSignature>(`${BASE}${reportId}/signatures/`, form);
}

export function deleteReportSignature(reportId: string, signatureId: string) {
  return apiSend<void>(`${BASE}${reportId}/signatures/${signatureId}/`, "DELETE");
}

export function generateReportPdf(
  id: string,
  language: PdfLanguage = "bilingual",
) {
  return apiSend<ReportPdfStatus>(`${BASE}${id}/generate-pdf/`, "POST", {
    language,
  });
}

export function getReportPdfStatus(id: string) {
  return apiGet<ReportPdfStatus>(`${BASE}${id}/pdf/status/`);
}

/** Fetch PDF bytes through the BFF for in-app preview/download. */
export async function fetchReportPdfBlob(id: string): Promise<Blob> {
  const response = await apiFetch(`${BASE}${id}/pdf/`);
  if (!response.ok) {
    let detail = response.statusText;
    try {
      const body = (await response.json()) as { detail?: string };
      if (body.detail) detail = body.detail;
    } catch {
      // ignore
    }
    throw new Error(detail || "PDF is not ready.");
  }
  return response.blob();
}
