"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { ArrowLeft, CheckCircle2, LogIn, LogOut, Calendar } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import {
  canAccessSiteVisits,
  canPerformSiteVisits,
} from "@/lib/auth/permissions";
import { isApiError } from "@/lib/api/client";
import type { SiteVisit } from "@/lib/api/types";
import {
  useSiteVisitMutations,
  useSiteVisitQuery,
} from "@/hooks/use-site-visits";
import { useOnlineStatus } from "@/hooks/use-online-status";
import { enqueueOfflineAction } from "@/lib/site-visits/offline-queue";
import type { GeoCoordinates } from "@/lib/site-visits/geo";
import { OfflineBanner } from "@/components/site-visits/offline-banner";
import { VisitStatusBadge } from "@/components/site-visits/visit-status-badge";
import { GpsCapture } from "@/components/site-visits/gps-capture";
import { VisitChecklistPanel } from "@/components/site-visits/visit-checklist-panel";
import { VisitIssuePanel } from "@/components/site-visits/visit-issue-panel";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabPanel } from "@/components/ui/tabs";
import { ErrorState, PageLoader } from "@/components/ui/states";

type DetailTab = "workflow" | "checklist" | "issues";

export function VisitDetailView({ visitId }: { visitId: string }) {
  const t = useTranslations("siteVisits");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const { user } = useAuth();
  const online = useOnlineStatus();
  const canAccess = canAccessSiteVisits(user?.roles);
  const canPerform = canPerformSiteVisits(user?.roles);

  const query = useSiteVisitQuery(visitId);
  const { schedule, checkIn, checkOut, complete } = useSiteVisitMutations(visitId);

  const [tab, setTab] = useState<DetailTab>("workflow");
  const [coords, setCoords] = useState<GeoCoordinates | null>(null);
  const [scheduleDate, setScheduleDate] = useState("");
  const [notes, setNotes] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionOk, setActionOk] = useState<string | null>(null);

  if (!canAccess) {
    return (
      <ErrorState
        title={t("errors.forbidden")}
        description={t("errors.forbiddenHint")}
      />
    );
  }

  if (query.isPending) return <PageLoader label={tCommon("loading")} />;

  if (query.isError) {
    return (
      <ErrorState
        title={t("errors.loadDetail")}
        description={
          isApiError(query.error) && query.error.status === 404
            ? t("errors.notFound")
            : t("errors.loadDetailHint")
        }
        onRetry={() => void query.refetch()}
        retryLabel={tCommon("retry")}
      />
    );
  }

  const visit = query.data;

  async function runAction(
    kind: "schedule" | "check_in" | "check_out" | "complete",
    runner: () => Promise<unknown>,
    offlineLabel: string,
    offlinePayload: Record<string, unknown>,
  ) {
    setActionError(null);
    setActionOk(null);

    if (!online) {
      enqueueOfflineAction({
        kind,
        label: offlineLabel,
        payload: offlinePayload,
      });
      setActionError(t("offline.queuedAction"));
      return;
    }

    try {
      await runner();
      setActionOk(t(`actions.success.${kind}`));
    } catch (error) {
      setActionError(
        isApiError(error)
          ? error.status === 403
            ? t("errors.forbidden")
            : error.message || t("errors.saveFailed")
          : t("errors.saveFailed"),
      );
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 pb-28">
      <OfflineBanner />

      <div className="px-1">
        <Link
          href="/site-visits"
          className="inline-flex items-center gap-1.5 text-sm text-[var(--muted)] hover:text-[var(--ink)]"
        >
          <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
          {t("backToList")}
        </Link>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <VisitStatusBadge status={visit.status} />
          {visit.check_in_time && !visit.check_out_time ? (
            <span className="text-xs font-medium text-[var(--success)]">
              {t("onSite")}
            </span>
          ) : null}
        </div>
        <h1 className="mt-1 font-[family-name:var(--font-display)] text-2xl text-[var(--ink)] sm:text-3xl">
          {visit.title}
        </h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          {visit.project_name}
          {visit.stage_name ? ` · ${visit.stage_name}` : ""}
        </p>
      </div>

      {actionError ? <Alert tone="danger">{actionError}</Alert> : null}
      {actionOk ? <Alert tone="success">{actionOk}</Alert> : null}

      <div className="rounded-xl border border-[var(--line)] bg-[var(--surface-elevated)] px-4 py-3">
        <Tabs
          items={[
            { id: "workflow", label: t("tabs.workflow") },
            { id: "checklist", label: t("tabs.checklist") },
            { id: "issues", label: t("tabs.issues") },
          ]}
          value={tab}
          onChange={setTab}
        />
        <TabPanel>
          {tab === "workflow" ? (
            <WorkflowPanel
              visit={visit}
              locale={locale}
              canPerform={canPerform}
              coords={coords}
              onCoords={setCoords}
              scheduleDate={scheduleDate}
              onScheduleDate={setScheduleDate}
              notes={notes}
              onNotes={setNotes}
              loading={{
                schedule: schedule.isPending,
                checkIn: checkIn.isPending,
                checkOut: checkOut.isPending,
                complete: complete.isPending,
              }}
              onSchedule={() =>
                void runAction(
                  "schedule",
                  () =>
                    schedule.mutateAsync({
                      id: visit.id,
                      scheduled_date: scheduleDate || visit.scheduled_date || "",
                    }),
                  t("actions.schedule"),
                  { visitId: visit.id, scheduled_date: scheduleDate },
                )
              }
              onCheckIn={() => {
                if (!coords) {
                  setActionError(t("gps.required"));
                  return;
                }
                void runAction(
                  "check_in",
                  () =>
                    checkIn.mutateAsync({
                      id: visit.id,
                      latitude: coords.latitude,
                      longitude: coords.longitude,
                    }),
                  t("actions.checkIn"),
                  {
                    visitId: visit.id,
                    latitude: coords.latitude,
                    longitude: coords.longitude,
                  },
                );
              }}
              onCheckOut={() =>
                void runAction(
                  "check_out",
                  () =>
                    checkOut.mutateAsync({
                      id: visit.id,
                      latitude: coords?.latitude,
                      longitude: coords?.longitude,
                      notes,
                    }),
                  t("actions.checkOut"),
                  {
                    visitId: visit.id,
                    latitude: coords?.latitude,
                    longitude: coords?.longitude,
                    notes,
                  },
                )
              }
              onComplete={() =>
                void runAction(
                  "complete",
                  () => complete.mutateAsync({ id: visit.id, notes }),
                  t("actions.complete"),
                  { visitId: visit.id, notes },
                )
              }
              onOpenChecklist={() => setTab("checklist")}
              onOpenIssues={() => setTab("issues")}
            />
          ) : null}

          {tab === "checklist" ? (
            <VisitChecklistPanel visitId={visit.id} canPerform={canPerform} />
          ) : null}

          {tab === "issues" ? (
            <VisitIssuePanel visitId={visit.id} canPerform={canPerform} />
          ) : null}
        </TabPanel>
      </div>
    </div>
  );
}

function WorkflowPanel({
  visit,
  locale,
  canPerform,
  coords,
  onCoords,
  scheduleDate,
  onScheduleDate,
  notes,
  onNotes,
  loading,
  onSchedule,
  onCheckIn,
  onCheckOut,
  onComplete,
  onOpenChecklist,
  onOpenIssues,
}: {
  visit: SiteVisit;
  locale: string;
  canPerform: boolean;
  coords: GeoCoordinates | null;
  onCoords: (value: GeoCoordinates | null) => void;
  scheduleDate: string;
  onScheduleDate: (value: string) => void;
  notes: string;
  onNotes: (value: string) => void;
  loading: {
    schedule: boolean;
    checkIn: boolean;
    checkOut: boolean;
    complete: boolean;
  };
  onSchedule: () => void;
  onCheckIn: () => void;
  onCheckOut: () => void;
  onComplete: () => void;
  onOpenChecklist: () => void;
  onOpenIssues: () => void;
}) {
  const t = useTranslations("siteVisits");

  const needsSchedule =
    visit.status === "scheduled" && !visit.scheduled_date;
  const canCheckIn =
    visit.status === "scheduled" && !visit.check_in_time;
  const canCheckOut =
    visit.status === "in_progress" && visit.check_in_time && !visit.check_out_time;
  const canComplete =
    visit.status === "in_progress" && Boolean(visit.check_in_time);
  const done = visit.status === "completed";

  return (
    <div className="space-y-4">
      <dl className="grid grid-cols-2 gap-2 text-sm">
        <Meta
          label={t("fields.scheduledDate")}
          value={
            visit.scheduled_date
              ? formatDate(visit.scheduled_date, locale)
              : t("unscheduled")
          }
        />
        <Meta
          label={t("fields.assignee")}
          value={visit.assigned_to_email || "—"}
        />
        <Meta
          label={t("fields.checkIn")}
          value={
            visit.check_in_time
              ? formatDateTime(visit.check_in_time, locale)
              : "—"
          }
        />
        <Meta
          label={t("fields.checkOut")}
          value={
            visit.check_out_time
              ? formatDateTime(visit.check_out_time, locale)
              : "—"
          }
        />
      </dl>

      {visit.latitude && visit.longitude ? (
        <p className="font-mono text-xs text-[var(--muted)]" dir="ltr">
          GPS: {visit.latitude}, {visit.longitude}
        </p>
      ) : null}

      {visit.notes ? (
        <p className="rounded-lg bg-[var(--surface)] px-3 py-2 text-sm text-[var(--ink-soft)]">
          {visit.notes}
        </p>
      ) : null}

      {done ? (
        <div className="rounded-xl border border-[var(--success-soft)] bg-[var(--success-tint)] px-4 py-3 text-sm text-[var(--success)]">
          {t("completedBanner")}
        </div>
      ) : null}

      {canPerform && !done ? (
        <div className="space-y-3">
          {(canCheckIn || canCheckOut) && (
            <GpsCapture
              value={coords}
              onChange={onCoords}
              required={canCheckIn}
            />
          )}

          {(needsSchedule || (visit.status === "scheduled" && canPerform)) && (
            <div className="space-y-2 rounded-xl border border-[var(--line)] bg-[var(--surface)] p-3">
              <Label>{t("fields.scheduledDate")}</Label>
              <Input
                type="date"
                value={scheduleDate || visit.scheduled_date || ""}
                onChange={(event) => onScheduleDate(event.target.value)}
              />
              <Button
                type="button"
                variant="secondary"
                className="w-full gap-2"
                loading={loading.schedule}
                disabled={!(scheduleDate || visit.scheduled_date)}
                onClick={onSchedule}
              >
                <Calendar className="h-4 w-4" />
                {t("actions.schedule")}
              </Button>
            </div>
          )}

          {(canCheckOut || canComplete) && (
            <div>
              <Label>{t("fields.notes")}</Label>
              <textarea
                value={notes}
                onChange={(event) => onNotes(event.target.value)}
                className="min-h-16 w-full rounded-md border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-sm"
                placeholder={t("fields.notesPlaceholder")}
              />
            </div>
          )}

          <div className="grid gap-2 sm:grid-cols-2">
            <Button
              type="button"
              variant="secondary"
              className="w-full"
              onClick={onOpenChecklist}
            >
              {t("actions.openChecklist")}
            </Button>
            <Button
              type="button"
              variant="secondary"
              className="w-full"
              onClick={onOpenIssues}
            >
              {t("actions.openIssues")}
            </Button>
          </div>
        </div>
      ) : null}

      {/* Sticky primary actions for fast field use */}
      {canPerform && !done ? (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-[var(--line)] bg-[var(--surface-elevated)]/95 p-3 backdrop-blur safe-area-pb">
          <div className="mx-auto flex max-w-3xl gap-2">
            {canCheckIn ? (
              <Button
                type="button"
                className="min-h-12 flex-1 gap-2 text-base"
                loading={loading.checkIn}
                onClick={onCheckIn}
              >
                <LogIn className="h-5 w-5" />
                {t("actions.checkIn")}
              </Button>
            ) : null}
            {canCheckOut ? (
              <Button
                type="button"
                variant="secondary"
                className="min-h-12 flex-1 gap-2 text-base"
                loading={loading.checkOut}
                onClick={onCheckOut}
              >
                <LogOut className="h-5 w-5" />
                {t("actions.checkOut")}
              </Button>
            ) : null}
            {canComplete ? (
              <Button
                type="button"
                className="min-h-12 flex-1 gap-2 text-base"
                loading={loading.complete}
                onClick={onComplete}
              >
                <CheckCircle2 className="h-5 w-5" />
                {t("actions.complete")}
              </Button>
            ) : null}
            {!canCheckIn && !canCheckOut && !canComplete && needsSchedule ? (
              <Button
                type="button"
                className="min-h-12 flex-1 gap-2 text-base"
                loading={loading.schedule}
                onClick={onSchedule}
              >
                <Calendar className="h-5 w-5" />
                {t("actions.schedule")}
              </Button>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-[var(--surface)] px-3 py-2">
      <dt className="text-[10px] uppercase tracking-wide text-[var(--muted)]">
        {label}
      </dt>
      <dd className="mt-0.5 truncate text-sm font-medium text-[var(--ink)]">
        {value}
      </dd>
    </div>
  );
}

function formatDate(value: string, locale: string) {
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatDateTime(value: string, locale: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}
