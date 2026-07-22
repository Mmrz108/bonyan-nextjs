import { z } from "zod";

export const REPORT_STATUSES = [
  "draft",
  "submitted",
  "under_review",
  "approved",
  "rejected",
  "sent",
] as const;

export const PDF_LANGUAGES = ["en", "ar", "bilingual"] as const;

export function createReportSchema(messages: {
  visitRequired: string;
  titleRequired: string;
}) {
  return z.object({
    site_visit: z.string().uuid(messages.visitRequired),
    title: z.string().trim().min(1, messages.titleRequired),
    summary: z.string().optional().default(""),
  });
}

export type ReportFormValues = z.infer<ReturnType<typeof createReportSchema>>;

export function createRejectSchema(messages: { reasonRequired: string }) {
  return z.object({
    reason: z.string().trim().min(1, messages.reasonRequired),
  });
}

export type RejectFormValues = z.infer<ReturnType<typeof createRejectSchema>>;
