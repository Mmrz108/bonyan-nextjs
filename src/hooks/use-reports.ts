"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  approveReport,
  createReport,
  deleteReport,
  generateReportPdf,
  getReport,
  getReportPdfStatus,
  listReports,
  rejectReport,
  reviewReport,
  sendReport,
  submitReport,
  updateReport,
} from "@/lib/api/reports";
import { listSiteVisits } from "@/lib/api/site-visits";
import type {
  PdfLanguage,
  ReportListParams,
  ReportWritePayload,
} from "@/lib/api/types";

export const reportKeys = {
  all: ["reports"] as const,
  lists: () => [...reportKeys.all, "list"] as const,
  list: (params: ReportListParams) => [...reportKeys.lists(), params] as const,
  details: () => [...reportKeys.all, "detail"] as const,
  detail: (id: string) => [...reportKeys.details(), id] as const,
  pdfStatus: (id: string) => [...reportKeys.detail(id), "pdf-status"] as const,
};

export function useReportsQuery(params: ReportListParams) {
  return useQuery({
    queryKey: reportKeys.list(params),
    queryFn: () => listReports(params),
  });
}

export function useReportQuery(id: string) {
  return useQuery({
    queryKey: reportKeys.detail(id),
    queryFn: () => getReport(id),
    enabled: Boolean(id),
  });
}

export function useReportPdfStatusQuery(
  id: string,
  options?: { enabled?: boolean; refetchInterval?: number | false },
) {
  return useQuery({
    queryKey: reportKeys.pdfStatus(id),
    queryFn: () => getReportPdfStatus(id),
    enabled: Boolean(id) && (options?.enabled ?? true),
    refetchInterval: options?.refetchInterval ?? false,
  });
}

export function useCompletedVisitsForReportsQuery(enabled = true) {
  return useQuery({
    queryKey: ["site-visits", "for-reports"],
    queryFn: () =>
      listSiteVisits({
        status: "completed",
        ordering: "-scheduled_date",
        page: 1,
      }),
    enabled,
  });
}

export function useReportMutations(reportId?: string) {
  const queryClient = useQueryClient();

  const invalidate = async (id?: string) => {
    await queryClient.invalidateQueries({ queryKey: reportKeys.all });
    const target = id || reportId;
    if (target) {
      await queryClient.invalidateQueries({
        queryKey: reportKeys.detail(target),
      });
      await queryClient.invalidateQueries({
        queryKey: reportKeys.pdfStatus(target),
      });
    }
  };

  return {
    create: useMutation({
      mutationFn: (payload: ReportWritePayload) => createReport(payload),
      onSuccess: () => invalidate(),
    }),
    update: useMutation({
      mutationFn: ({
        id,
        payload,
      }: {
        id: string;
        payload: Pick<ReportWritePayload, "title" | "summary">;
      }) => updateReport(id, payload),
      onSuccess: (_d, vars) => invalidate(vars.id),
    }),
    remove: useMutation({
      mutationFn: (id: string) => deleteReport(id),
      onSuccess: () => invalidate(),
    }),
    submit: useMutation({
      mutationFn: ({ id, notes }: { id: string; notes?: string }) =>
        submitReport(id, notes),
      onSuccess: (_d, vars) => invalidate(vars.id),
    }),
    review: useMutation({
      mutationFn: ({ id, notes }: { id: string; notes?: string }) =>
        reviewReport(id, notes),
      onSuccess: (_d, vars) => invalidate(vars.id),
    }),
    approve: useMutation({
      mutationFn: ({ id, notes }: { id: string; notes?: string }) =>
        approveReport(id, notes),
      onSuccess: (_d, vars) => invalidate(vars.id),
    }),
    reject: useMutation({
      mutationFn: ({ id, reason }: { id: string; reason: string }) =>
        rejectReport(id, reason),
      onSuccess: (_d, vars) => invalidate(vars.id),
    }),
    send: useMutation({
      mutationFn: ({ id, notes }: { id: string; notes?: string }) =>
        sendReport(id, notes),
      onSuccess: (_d, vars) => invalidate(vars.id),
    }),
    generatePdf: useMutation({
      mutationFn: ({
        id,
        language,
      }: {
        id: string;
        language?: PdfLanguage;
      }) => generateReportPdf(id, language),
      onSuccess: (_d, vars) => invalidate(vars.id),
    }),
  };
}
