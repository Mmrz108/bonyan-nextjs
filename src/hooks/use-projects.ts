"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createProject,
  createProjectStage,
  deleteProject,
  deleteProjectStage,
  getProject,
  listProjectIssues,
  listProjectReports,
  listProjectSiteVisits,
  listProjectStages,
  listProjects,
  updateProject,
  updateProjectStage,
} from "@/lib/api/projects";
import { getContract, listContracts } from "@/lib/api/contracts";
import type {
  ProjectListParams,
  ProjectWritePayload,
  StageWritePayload,
} from "@/lib/api/types";

export const projectKeys = {
  all: ["projects"] as const,
  lists: () => [...projectKeys.all, "list"] as const,
  list: (params: ProjectListParams) => [...projectKeys.lists(), params] as const,
  details: () => [...projectKeys.all, "detail"] as const,
  detail: (id: string) => [...projectKeys.details(), id] as const,
  stages: (id: string) => [...projectKeys.detail(id), "stages"] as const,
  visits: (id: string) => [...projectKeys.detail(id), "visits"] as const,
  issues: (id: string) => [...projectKeys.detail(id), "issues"] as const,
  reports: (id: string) => [...projectKeys.detail(id), "reports"] as const,
};

export function useProjectsQuery(params: ProjectListParams) {
  return useQuery({
    queryKey: projectKeys.list(params),
    queryFn: () => listProjects(params),
  });
}

export function useProjectQuery(id: string) {
  return useQuery({
    queryKey: projectKeys.detail(id),
    queryFn: () => getProject(id),
    enabled: Boolean(id),
  });
}

export function useProjectStagesQuery(projectId: string) {
  return useQuery({
    queryKey: projectKeys.stages(projectId),
    queryFn: () => listProjectStages(projectId),
    enabled: Boolean(projectId),
  });
}

export function useProjectVisitsQuery(projectId: string, enabled = true) {
  return useQuery({
    queryKey: projectKeys.visits(projectId),
    queryFn: () => listProjectSiteVisits(projectId),
    enabled: Boolean(projectId) && enabled,
  });
}

export function useProjectIssuesQuery(projectId: string, enabled = true) {
  return useQuery({
    queryKey: projectKeys.issues(projectId),
    queryFn: () => listProjectIssues(projectId),
    enabled: Boolean(projectId) && enabled,
  });
}

export function useProjectReportsQuery(projectId: string, enabled = true) {
  return useQuery({
    queryKey: projectKeys.reports(projectId),
    queryFn: () => listProjectReports(projectId),
    enabled: Boolean(projectId) && enabled,
  });
}

export function useContractsQuery(enabled = true) {
  return useQuery({
    queryKey: ["contracts", "list"],
    queryFn: () => listContracts({ page: 1 }),
    enabled,
  });
}

export function useContractQuery(id: string | null | undefined) {
  return useQuery({
    queryKey: ["contracts", "detail", id],
    queryFn: () => getContract(id!),
    enabled: Boolean(id),
  });
}

export function useProjectMutations(projectId?: string) {
  const queryClient = useQueryClient();

  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: projectKeys.all });
    if (projectId) {
      await queryClient.invalidateQueries({
        queryKey: projectKeys.detail(projectId),
      });
    }
  };

  const create = useMutation({
    mutationFn: (payload: ProjectWritePayload) => createProject(payload),
    onSuccess: invalidate,
  });

  const update = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: Partial<ProjectWritePayload>;
    }) => updateProject(id, payload),
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteProject(id),
    onSuccess: invalidate,
  });

  const createStage = useMutation({
    mutationFn: (payload: StageWritePayload) =>
      createProjectStage(projectId!, payload),
    onSuccess: async () => {
      if (projectId) {
        await queryClient.invalidateQueries({
          queryKey: projectKeys.stages(projectId),
        });
      }
    },
  });

  const updateStage = useMutation({
    mutationFn: ({
      stageId,
      payload,
    }: {
      stageId: string;
      payload: Partial<StageWritePayload>;
    }) => updateProjectStage(projectId!, stageId, payload),
    onSuccess: async () => {
      if (projectId) {
        await queryClient.invalidateQueries({
          queryKey: projectKeys.stages(projectId),
        });
      }
    },
  });

  const removeStage = useMutation({
    mutationFn: (stageId: string) => deleteProjectStage(projectId!, stageId),
    onSuccess: async () => {
      if (projectId) {
        await queryClient.invalidateQueries({
          queryKey: projectKeys.stages(projectId),
        });
      }
    },
  });

  return {
    create,
    update,
    remove,
    createStage,
    updateStage,
    removeStage,
  };
}
