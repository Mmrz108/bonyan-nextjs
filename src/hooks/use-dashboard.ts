"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchDashboardData } from "@/lib/api/dashboard";

export const dashboardQueryKey = ["dashboard", "summary"] as const;

export function useDashboardQuery() {
  return useQuery({
    queryKey: dashboardQueryKey,
    queryFn: () => fetchDashboardData(),
  });
}
