import { apiGet, apiSend, fetchPaginated } from "@/lib/api/client";
import type {
  IssueListItem,
  Project,
  ProjectListParams,
  ProjectStage,
  ProjectWritePayload,
  ReportListItem,
  SiteVisitListItem,
  StageWritePayload,
} from "@/lib/api/types";

const PROJECTS = "/projects/";

export function listProjects(params: ProjectListParams = {}) {
  return fetchPaginated<Project>(PROJECTS, {
    search: params.search,
    status: params.status || undefined,
    project_type: params.project_type || undefined,
    ordering: params.ordering || "-created_at",
    page: params.page ?? 1,
  });
}

export function getProject(id: string) {
  return apiGet<Project>(`${PROJECTS}${id}/`);
}

export function createProject(payload: ProjectWritePayload) {
  return apiSend<Project>(PROJECTS, "POST", payload);
}

export function updateProject(id: string, payload: Partial<ProjectWritePayload>) {
  return apiSend<Project>(`${PROJECTS}${id}/`, "PATCH", payload);
}

export function deleteProject(id: string) {
  return apiSend<void>(`${PROJECTS}${id}/`, "DELETE");
}

export function listProjectStages(projectId: string) {
  return fetchPaginated<ProjectStage>(`${PROJECTS}${projectId}/stages/`, {
    ordering: "order",
    page: 1,
  });
}

export function createProjectStage(projectId: string, payload: StageWritePayload) {
  return apiSend<ProjectStage>(`${PROJECTS}${projectId}/stages/`, "POST", payload);
}

export function updateProjectStage(
  projectId: string,
  stageId: string,
  payload: Partial<StageWritePayload>,
) {
  return apiSend<ProjectStage>(
    `${PROJECTS}${projectId}/stages/${stageId}/`,
    "PATCH",
    payload,
  );
}

export function deleteProjectStage(projectId: string, stageId: string) {
  return apiSend<void>(`${PROJECTS}${projectId}/stages/${stageId}/`, "DELETE");
}

export function listProjectSiteVisits(projectId: string) {
  return fetchPaginated<SiteVisitListItem>("/site-visits/", {
    project: projectId,
    ordering: "-scheduled_date",
    page: 1,
  });
}

export function listProjectIssues(projectId: string) {
  return fetchPaginated<IssueListItem>("/issues/", {
    project: projectId,
    ordering: "-created_at",
    page: 1,
  });
}

export function listProjectReports(projectId: string) {
  return fetchPaginated<ReportListItem>("/reports/", {
    project: projectId,
    ordering: "-created_at",
    page: 1,
  });
}
