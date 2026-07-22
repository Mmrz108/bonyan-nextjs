import { z } from "zod";

const projectStatuses = [
  "planning",
  "active",
  "on_hold",
  "completed",
  "cancelled",
] as const;

const projectTypes = [
  "residential",
  "commercial",
  "infrastructure",
  "industrial",
  "mixed_use",
  "other",
] as const;

const stageStatuses = ["not_started", "in_progress", "completed"] as const;

const memberRoles = [
  "project_manager",
  "supervisor",
  "inspector",
  "reviewer",
  "viewer",
  "contractor",
] as const;

function optionalDate(messages: { invalid: string }) {
  return z
    .string()
    .optional()
    .transform((value) => (value && value.trim() ? value : null))
    .refine((value) => value === null || /^\d{4}-\d{2}-\d{2}$/.test(value), {
      message: messages.invalid,
    });
}

function optionalCoord(messages: { invalid: string }) {
  return z
    .string()
    .optional()
    .transform((value) => (value && value.trim() ? value.trim() : null))
    .refine(
      (value) => value === null || (!Number.isNaN(Number(value)) && value !== ""),
      { message: messages.invalid },
    );
}

export function createProjectSchema(messages: {
  codeRequired: string;
  nameRequired: string;
  contractRequired: string;
  dateInvalid: string;
  coordInvalid: string;
  coordPair: string;
}) {
  return z
    .object({
      code: z.string().trim().min(1, messages.codeRequired),
      name: z.string().trim().min(1, messages.nameRequired),
      name_ar: z.string().optional().default(""),
      description: z.string().optional().default(""),
      contract: z.string().uuid(messages.contractRequired),
      status: z.enum(projectStatuses),
      project_type: z.enum(projectTypes),
      location: z.string().optional().default(""),
      address: z.string().optional().default(""),
      latitude: optionalCoord({ invalid: messages.coordInvalid }),
      longitude: optionalCoord({ invalid: messages.coordInvalid }),
      start_date: optionalDate({ invalid: messages.dateInvalid }),
      expected_completion_date: optionalDate({ invalid: messages.dateInvalid }),
    })
    .superRefine((values, ctx) => {
      const hasLat = values.latitude !== null;
      const hasLng = values.longitude !== null;
      if (hasLat !== hasLng) {
        ctx.addIssue({
          code: "custom",
          message: messages.coordPair,
          path: ["latitude"],
        });
      }
    });
}

export type ProjectFormValues = z.infer<ReturnType<typeof createProjectSchema>>;

export function createStageSchema(messages: {
  nameRequired: string;
  orderRequired: string;
  dateInvalid: string;
}) {
  return z.object({
    name: z.string().trim().min(1, messages.nameRequired),
    name_ar: z.string().optional().default(""),
    description: z.string().optional().default(""),
    order: z.coerce.number().int().min(1, messages.orderRequired),
    status: z.enum(stageStatuses),
    start_date: optionalDate({ invalid: messages.dateInvalid }),
    completion_date: optionalDate({ invalid: messages.dateInvalid }),
  });
}

export type StageFormValues = z.infer<ReturnType<typeof createStageSchema>>;

export function createMemberSchema(messages: {
  userRequired: string;
  userInvalid: string;
}) {
  return z.object({
    user: z.string().uuid(messages.userInvalid).min(1, messages.userRequired),
    member_role: z.enum(memberRoles),
    is_active: z.boolean().default(true),
  });
}

export type MemberFormValues = z.infer<ReturnType<typeof createMemberSchema>>;

export const PROJECT_STATUSES = projectStatuses;
export const PROJECT_TYPES = projectTypes;
export const STAGE_STATUSES = stageStatuses;
export const MEMBER_ROLES = memberRoles;
