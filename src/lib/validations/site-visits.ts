import { z } from "zod";

const visitStatuses = [
  "scheduled",
  "in_progress",
  "completed",
  "cancelled",
] as const;

const severities = ["low", "medium", "high", "critical"] as const;
const resultValues = ["pass", "fail", "not_applicable"] as const;

export function createSiteVisitSchema(messages: {
  projectRequired: string;
  assigneeRequired: string;
  dateInvalid: string;
}) {
  return z.object({
    project: z.string().uuid(messages.projectRequired),
    project_stage: z
      .string()
      .optional()
      .transform((value) => (value && value.trim() ? value : null)),
    assigned_to: z.string().uuid(messages.assigneeRequired),
    title: z.string().optional().default(""),
    scheduled_date: z
      .string()
      .optional()
      .transform((value) => (value && value.trim() ? value : null))
      .refine((value) => value === null || /^\d{4}-\d{2}-\d{2}$/.test(value), {
        message: messages.dateInvalid,
      }),
    notes: z.string().optional().default(""),
  });
}

export type SiteVisitFormValues = z.infer<
  ReturnType<typeof createSiteVisitSchema>
>;

export function createScheduleSchema(messages: { dateRequired: string }) {
  return z.object({
    scheduled_date: z.string().min(1, messages.dateRequired),
  });
}

export type ScheduleFormValues = z.infer<
  ReturnType<typeof createScheduleSchema>
>;

export function createIssueSchema(messages: {
  titleRequired: string;
  dateInvalid: string;
}) {
  return z.object({
    title: z.string().trim().min(1, messages.titleRequired),
    description: z.string().optional().default(""),
    severity: z.enum(severities),
    due_date: z
      .string()
      .optional()
      .transform((value) => (value && value.trim() ? value : null))
      .refine((value) => value === null || /^\d{4}-\d{2}-\d{2}$/.test(value), {
        message: messages.dateInvalid,
      }),
    caption: z.string().optional().default(""),
  });
}

export type IssueFormValues = z.infer<ReturnType<typeof createIssueSchema>>;

export const SITE_VISIT_STATUSES = visitStatuses;
export const ISSUE_SEVERITIES = severities;
export const CHECKLIST_RESULTS = resultValues;
