import { apiGet, fetchPaginated } from "@/lib/api/client";
import type { Contract } from "@/lib/api/types";

export function listContracts(params: { search?: string; page?: number } = {}) {
  return fetchPaginated<Contract>("/contracts/", {
    search: params.search,
    ordering: "-created_at",
    page: params.page ?? 1,
  });
}

export function getContract(id: string) {
  return apiGet<Contract>(`/contracts/${id}/`);
}
