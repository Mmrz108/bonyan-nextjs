import { apiSend, apiUpload, fetchPaginated } from "@/lib/api/client";
import type {
  Issue,
  IssuePhoto,
  IssueWritePayload,
} from "@/lib/api/types";

export function listVisitIssues(siteVisitId: string) {
  return fetchPaginated<Issue>("/issues/", {
    site_visit: siteVisitId,
    ordering: "-created_at",
    page: 1,
  });
}

export function createIssue(payload: IssueWritePayload) {
  return apiSend<Issue>("/issues/", "POST", payload);
}

export function listIssuePhotos(issueId: string) {
  return fetchPaginated<IssuePhoto>(`/issues/${issueId}/photos/`, {
    page: 1,
  });
}

export function uploadIssuePhoto(
  issueId: string,
  input: {
    file: File;
    caption?: string;
    latitude?: string | null;
    longitude?: string | null;
    taken_at?: string;
    client_generated_id: string;
  },
) {
  const form = new FormData();
  form.append("file", input.file);
  if (input.caption) form.append("caption", input.caption);
  if (input.latitude) form.append("latitude", input.latitude);
  if (input.longitude) form.append("longitude", input.longitude);
  if (input.taken_at) form.append("taken_at", input.taken_at);
  form.append("client_generated_id", input.client_generated_id);
  return apiUpload<IssuePhoto>(`/issues/${issueId}/photos/`, form);
}

/** Proxy-friendly download path for authenticated image preview. */
export function issuePhotoProxyPath(issueId: string, photoId: string) {
  return `/api/backend/issues/${issueId}/photos/${photoId}/download/`;
}
