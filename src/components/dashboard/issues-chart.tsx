"use client";

import { useLocale, useTranslations } from "next-intl";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/components/ui/states";

type IssuesChartProps = {
  open: number;
  overdue: number;
};

export function IssuesChart({ open, overdue }: IssuesChartProps) {
  const t = useTranslations("dashboard");
  const locale = useLocale();

  const data = [
    { key: "open", name: t("openIssues"), value: open, color: "#0b3d3a" },
    {
      key: "overdue",
      name: t("overdueIssues"),
      value: overdue,
      color: "#9b2c2c",
    },
  ];

  const empty = open === 0 && overdue === 0;

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>{t("issuesOverview")}</CardTitle>
        <CardDescription>{t("issuesOverviewHint")}</CardDescription>
      </CardHeader>
      <CardContent>
        {empty ? (
          <EmptyState
            title={t("emptyIssuesTitle")}
            description={t("emptyIssuesDescription")}
            className="border-0 bg-transparent py-8"
          />
        ) : (
          <div className="h-52 w-full" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} barCategoryGap="28%">
                <CartesianGrid stroke="var(--line)" vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fill: "var(--muted)", fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fill: "var(--muted)", fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                  width={32}
                />
                <Tooltip
                  formatter={(value) => [
                    Number(value).toLocaleString(locale),
                    t("openIssues"),
                  ]}
                  contentStyle={{
                    borderRadius: 8,
                    border: "1px solid var(--line)",
                    background: "var(--surface-elevated)",
                  }}
                  labelFormatter={(label) => String(label)}
                />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {data.map((entry) => (
                    <Cell key={entry.key} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
