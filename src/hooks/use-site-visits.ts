"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  checkInSiteVisit,
  checkOutSiteVisit,
  completeSiteVisit,
  createSiteVisit,
  getSiteVisit,
  listSiteVisits,
  scheduleSiteVisit,
} from "@/lib/api/site-visits";
import {
  attachChecklistFromTemplate,
  listChecklistTemplates,
  listVisitChecklists,
  saveChecklistResults,
  submitChecklist,
} from "@/lib/api/inspections";
import {
  createIssue,
  listVisitIssues,
  uploadIssuePhoto,
} from "@/lib/api/issues";
import { listProjects } from "@/lib/api/projects";
import type {
  ChecklistResultValue,
  IssueWritePayload,
  SiteVisitListParams,
  SiteVisitWritePayload,
} from "@/lib/api/types";

export const siteVisitKeys = {
  all: ["site-visits"] as const,
  lists: () => [...siteVisitKeys.all, "list"] as const,
  list: (params: SiteVisitListParams) =>
    [...siteVisitKeys.lists(), params] as const,
  details: () => [...siteVisitKeys.all, "detail"] as const,
  detail: (id: string) => [...siteVisitKeys.details(), id] as const,
  checklists: (id: string) =>
    [...siteVisitKeys.detail(id), "checklists"] as const,
  issues: (id: string) => [...siteVisitKeys.detail(id), "issues"] as const,
  templates: ["inspection-checklists", "templates"] as const,
};

export function useSiteVisitsQuery(params: SiteVisitListParams) {
  return useQuery({
    queryKey: siteVisitKeys.list(params),
    queryFn: () => listSiteVisits(params),
  });
}

export function useSiteVisitQuery(id: string) {
  return useQuery({
    queryKey: siteVisitKeys.detail(id),
    queryFn: () => getSiteVisit(id),
    enabled: Boolean(id),
  });
}

export function useVisitChecklistsQuery(visitId: string) {
  return useQuery({
    queryKey: siteVisitKeys.checklists(visitId),
    queryFn: () => listVisitChecklists(visitId),
    enabled: Boolean(visitId),
  });
}

export function useVisitIssuesQuery(visitId: string) {
  return useQuery({
    queryKey: siteVisitKeys.issues(visitId),
    queryFn: () => listVisitIssues(visitId),
    enabled: Boolean(visitId),
  });
}

export function useChecklistTemplatesQuery(enabled = true) {
  return useQuery({
    queryKey: siteVisitKeys.templates,
    queryFn: () => listChecklistTemplates(),
    enabled,
  });
}

export function useProjectsForVisitsQuery(enabled = true) {
  return useQuery({
    queryKey: ["projects", "for-visits"],
    queryFn: () => listProjects({ page: 1, ordering: "name" }),
    enabled,
  });
}

export function useSiteVisitMutations(visitId?: string) {
  const queryClient = useQueryClient();

  const invalidateVisit = async (id?: string) => {
    await queryClient.invalidateQueries({ queryKey: siteVisitKeys.all });
    const target = id || visitId;
    if (target) {
      await queryClient.invalidateQueries({
        queryKey: siteVisitKeys.detail(target),
      });
    }
  };

  const create = useMutation({
    mutationFn: (payload: SiteVisitWritePayload) => createSiteVisit(payload),
    onSuccess: () => invalidateVisit(),
  });

  const schedule = useMutation({
    mutationFn: ({ id, scheduled_date }: { id: string; scheduled_date: string }) =>
      scheduleSiteVisit(id, scheduled_date),
    onSuccess: (_data, vars) => invalidateVisit(vars.id),
  });

  const checkIn = useMutation({
    mutationFn: ({
      id,
      latitude,
      longitude,
    }: {
      id: string;
      latitude: string;
      longitude: string;
    }) => checkInSiteVisit(id, { latitude, longitude }),
    onSuccess: (_data, vars) => invalidateVisit(vars.id),
  });

  const checkOut = useMutation({
    mutationFn: ({
      id,
      latitude,
      longitude,
      notes,
    }: {
      id: string;
      latitude?: string;
      longitude?: string;
      notes?: string;
    }) => checkOutSiteVisit(id, { latitude, longitude, notes }),
    onSuccess: (_data, vars) => invalidateVisit(vars.id),
  });

  const complete = useMutation({
    mutationFn: ({ id, notes }: { id: string; notes?: string }) =>
      completeSiteVisit(id, notes),
    onSuccess: (_data, vars) => invalidateVisit(vars.id),
  });

  const attachChecklist = useMutation({
    mutationFn: ({
      id,
      templateId,
    }: {
      id: string;
      templateId: string;
    }) => attachChecklistFromTemplate(id, templateId),
    onSuccess: async (_data, vars) => {
      await queryClient.invalidateQueries({
        queryKey: siteVisitKeys.checklists(vars.id),
      });
    },
  });

  const saveResults = useMutation({
    mutationFn: ({
      checklistId,
      results,
    }: {
      checklistId: string;
      results: Array<{
        item: string;
        result: ChecklistResultValue;
        notes?: string;
      }>;
      visitId: string;
    }) => saveChecklistResults(checklistId, results),
    onSuccess: async (_data, vars) => {
      await queryClient.invalidateQueries({
        queryKey: siteVisitKeys.checklists(vars.visitId),
      });
    },
  });

  const submitResults = useMutation({
    mutationFn: ({
      checklistId,
      notes,
    }: {
      checklistId: string;
      notes?: string;
      visitId: string;
    }) => submitChecklist(checklistId, notes),
    onSuccess: async (_data, vars) => {
      await queryClient.invalidateQueries({
        queryKey: siteVisitKeys.checklists(vars.visitId),
      });
    },
  });

  const createVisitIssue = useMutation({
    mutationFn: async (input: {
      payload: IssueWritePayload;
      photo?: {
        file: File;
        caption?: string;
        latitude?: string | null;
        longitude?: string | null;
        client_generated_id: string;
      };
    }) => {
      const issue = await createIssue(input.payload);
      if (input.photo) {
        await uploadIssuePhoto(issue.id, {
          file: input.photo.file,
          caption: input.photo.caption,
          latitude: input.photo.latitude,
          longitude: input.photo.longitude,
          taken_at: new Date().toISOString(),
          client_generated_id: input.photo.client_generated_id,
        });
      }
      return issue;
    },
    onSuccess: async (_data, vars) => {
      await queryClient.invalidateQueries({
        queryKey: siteVisitKeys.issues(vars.payload.site_visit),
      });
    },
  });

  return {
    create,
    schedule,
    checkIn,
    checkOut,
    complete,
    attachChecklist,
    saveResults,
    submitResults,
    createVisitIssue,
  };
}
