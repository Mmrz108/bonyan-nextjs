"use client";

import { useLocale, useTranslations } from "next-intl";
import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/components/ui/states";

type ProjectsChartProps = {
  total: number;
  active: number;
  completed: number;
};

const COLORS = {
  active: "#0b3d3a",
  completed: "#b08d57",
  other: "#9eb9b4",
};

export function ProjectsChart({ total, active, completed }: ProjectsChartProps) {
  const t = useTranslations("dashboard");
  const locale = useLocale();
  const other = Math.max(total - active - completed, 0);

  const data = [
    { key: "active", name: t("chartActive"), value: active, color: COLORS.active },
    {
      key: "completed",
      name: t("chartCompleted"),
      value: completed,
      color: COLORS.completed,
    },
    { key: "other", name: t("chartOther"), value: other, color: COLORS.other },
  ].filter((item) => item.value > 0);

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>{t("projectsBreakdown")}</CardTitle>
        <CardDescription>{t("projectsBreakdownHint")}</CardDescription>
      </CardHeader>
      <CardContent>
        {total === 0 || data.length === 0 ? (
          <EmptyState
            title={t("emptyProjectsTitle")}
            description={t("emptyProjectsDescription")}
            className="border-0 bg-transparent py-8"
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_12rem] sm:items-center">
            <div className="mx-auto h-52 w-full max-w-[16rem]" dir="ltr">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={52}
                    outerRadius={78}
                    paddingAngle={2}
                    stroke="transparent"
                  >
                    {data.map((entry) => (
                      <Cell key={entry.key} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => [
                      Number(value).toLocaleString(locale),
                      "",
                    ]}
                    contentStyle={{
                      borderRadius: 8,
                      border: "1px solid var(--line)",
                      background: "var(--surface-elevated)",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <ul className="space-y-3 text-sm">
              {data.map((entry) => (
                <li key={entry.key} className="flex items-center justify-between gap-3">
                  <span className="inline-flex items-center gap-2 text-[var(--ink-soft)]">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: entry.color }}
                      aria-hidden
                    />
                    {entry.name}
                  </span>
                  <span className="tabular-nums font-medium text-[var(--ink)]">
                    {entry.value.toLocaleString(locale)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
