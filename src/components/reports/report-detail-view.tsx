"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  ArrowLeft,
  Check,
  Download,
  Eye,
  FileText,
  Send,
  ThumbsDown,
  ThumbsUp,
} from "lucide-react";
import { Link } from "@/i18n/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import {
  canAccessReports,
  canApproveReports,
  canGenerateReportPdf,
  canSubmitReports,
} from "@/lib/auth/permissions";
import { isApiError } from "@/lib/api/client";
import { fetchReportPdfBlob } from "@/lib/api/reports";
import type { PdfLanguage, Report, ReportStatus } from "@/lib/api/types";
import {
  useReportMutations,
  useReportPdfStatusQuery,
  useReportQuery,
} from "@/hooks/use-reports";
import {
  PdfStatusBadge,
  ReportStatusBadge,
} from "@/components/reports/report-status-badge";
import { ReportSignaturesPanel } from "@/components/reports/report-signatures-panel";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Tabs, TabPanel } from "@/components/ui/tabs";
import { EmptyState, ErrorState, PageLoader } from "@/components/ui/states";
import { Card, CardContent } from "@/components/ui/card";

type DetailTab = "preview" | "workflow" | "signatures" | "pdf";

export function ReportDetailView({ reportId }: { reportId: string }) {
  const t = useTranslations("reports");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const { user } = useAuth();

  const canAccess = canAccessReports(user?.roles);
  const canSubmit = canSubmitReports(user?.roles);
  const canApprove = canApproveReports(user?.roles);
  const canPdf = canGenerateReportPdf(user?.roles);

  const query = useReportQuery(reportId);
  const mutations = useReportMutations(reportId);

  const [tab, setTab] = useState<DetailTab>("preview");
  const [notes, setNotes] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [pdfLanguage, setPdfLanguage] = useState<PdfLanguage>("bilingual");
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionOk, setActionOk] = useState<string | null>(null);
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);

  const pdfPolling =
    query.data?.pdf_status === "queued" ||
    query.data?.pdf_status === "generating";

  const pdfStatus = useReportPdfStatusQuery(reportId, {
    enabled: Boolean(query.data),
    refetchInterval: pdfPolling ? 2500 : false,
  });

  const currentPdfStatus =
    pdfStatus.data?.pdf_status ?? query.data?.pdf_status ?? "none";

  useEffect(() => {
    return () => {
      if (pdfBlobUrl) URL.revokeObjectURL(pdfBlobUrl);
    };
  }, [pdfBlobUrl]);

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

  const report = query.data;
  const transitions = new Set(report.allowed_transitions);

  async function run(
    label: string,
    action: () => Promise<unknown>,
  ) {
    setActionError(null);
    setActionOk(null);
    try {
      await action();
      setActionOk(label);
      setNotes("");
      setRejectReason("");
    } catch (error) {
      setActionError(
        isApiError(error)
          ? error.status === 403
            ? t("errors.forbiddenAction")
            : error.message || t("errors.saveFailed")
          : t("errors.saveFailed"),
      );
    }
  }

  async function loadPdfPreview() {
    setPdfLoading(true);
    setActionError(null);
    try {
      const blob = await fetchReportPdfBlob(reportId);
      if (pdfBlobUrl) URL.revokeObjectURL(pdfBlobUrl);
      setPdfBlobUrl(URL.createObjectURL(blob));
      setTab("pdf");
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : t("errors.pdfNotReady"),
      );
    } finally {
      setPdfLoading(false);
    }
  }

  async function downloadPdf() {
    setPdfLoading(true);
    setActionError(null);
    try {
      const blob = await fetchReportPdfBlob(reportId);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download =
        pdfStatus.data?.pdf_file_name ||
        report.pdf_file_name ||
        `report-${reportId}.pdf`;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : t("errors.pdfNotReady"),
      );
    } finally {
      setPdfLoading(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <Link
            href="/reports"
            className="inline-flex items-center gap-1.5 text-sm text-[var(--muted)] hover:text-[var(--ink)]"
          >
            <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
            {t("backToList")}
          </Link>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <ReportStatusBadge status={report.status} />
            <PdfStatusBadge status={currentPdfStatus} />
          </div>
          <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl text-[var(--ink)] sm:text-4xl">
            {report.title}
          </h1>
          <p className="mt-2 text-sm text-[var(--muted)]">
            {[report.project_name, report.site_visit_title, report.author_email]
              .filter(Boolean)
              .join(" · ")}
          </p>
        </div>
      </div>

      {actionError ? <Alert tone="danger">{actionError}</Alert> : null}
      {actionOk ? <Alert tone="success">{actionOk}</Alert> : null}

      <Card>
        <CardContent className="pt-4">
          <Tabs
            items={[
              { id: "preview", label: t("tabs.preview") },
              { id: "workflow", label: t("tabs.workflow") },
              { id: "signatures", label: t("tabs.signatures") },
              { id: "pdf", label: t("tabs.pdf") },
            ]}
            value={tab}
            onChange={setTab}
          />

          <TabPanel>
            {tab === "preview" ? (
              <ReportPreview report={report} locale={locale} />
            ) : null}

            {tab === "workflow" ? (
              <WorkflowPanel
                report={report}
                locale={locale}
                notes={notes}
                rejectReason={rejectReason}
                onNotes={setNotes}
                onRejectReason={setRejectReason}
                canSubmit={canSubmit}
                canApprove={canApprove}
                transitions={transitions}
                loading={{
                  submit: mutations.submit.isPending,
                  review: mutations.review.isPending,
                  approve: mutations.approve.isPending,
                  reject: mutations.reject.isPending,
                  send: mutations.send.isPending,
                }}
                onSubmit={() =>
                  void run(t("actions.success.submit"), () =>
                    mutations.submit.mutateAsync({
                      id: report.id,
                      notes,
                    }),
                  )
                }
                onReview={() =>
                  void run(t("actions.success.review"), () =>
                    mutations.review.mutateAsync({
                      id: report.id,
                      notes,
                    }),
                  )
                }
                onApprove={() =>
                  void run(t("actions.success.approve"), () =>
                    mutations.approve.mutateAsync({
                      id: report.id,
                      notes,
                    }),
                  )
                }
                onReject={() => {
                  if (!rejectReason.trim()) {
                    setActionError(t("validation.reasonRequired"));
                    return;
                  }
                  void run(t("actions.success.reject"), () =>
                    mutations.reject.mutateAsync({
                      id: report.id,
                      reason: rejectReason.trim(),
                    }),
                  );
                }}
                onSend={() =>
                  void run(t("actions.success.send"), () =>
                    mutations.send.mutateAsync({
                      id: report.id,
                      notes,
                    }),
                  )
                }
              />
            ) : null}

            {tab === "signatures" ? (
              <ReportSignaturesPanel report={report} />
            ) : null}

            {tab === "pdf" ? (
              <PdfPanel
                report={report}
                currentPdfStatus={currentPdfStatus}
                pdfLanguage={pdfLanguage}
                onLanguage={setPdfLanguage}
                pdfBlobUrl={pdfBlobUrl}
                canPdf={canPdf}
                loading={
                  mutations.generatePdf.isPending ||
                  pdfLoading ||
                  pdfStatus.isFetching
                }
                onGenerate={() =>
                  void run(t("actions.success.generatePdf"), () =>
                    mutations.generatePdf.mutateAsync({
                      id: report.id,
                      language: pdfLanguage,
                    }),
                  )
                }
                onPreview={() => void loadPdfPreview()}
                onDownload={() => void downloadPdf()}
              />
            ) : null}
          </TabPanel>
        </CardContent>
      </Card>
    </div>
  );
}

function ReportPreview({
  report,
  locale,
}: {
  report: Report;
  locale: string;
}) {
  const t = useTranslations("reports");

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-5">
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--accent)]">
          Bonyan
        </p>
        <h2 className="mt-2 font-[family-name:var(--font-display)] text-2xl text-[var(--ink)]">
          {report.title}
        </h2>
        <p className="mt-2 whitespace-pre-wrap text-sm text-[var(--ink-soft)]">
          {report.summary || t("preview.noSummary")}
        </p>
      </section>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Meta label={t("fields.project")} value={report.project_name} />
        <Meta label={t("fields.siteVisit")} value={report.site_visit_title} />
        <Meta
          label={t("fields.inspector")}
          value={
            report.inspector
              ? `${report.inspector.first_name} ${report.inspector.last_name}`.trim() ||
                report.inspector.email
              : report.author_email || "—"
          }
        />
        <Meta
          label={t("fields.submitted")}
          value={
            report.submitted_at
              ? formatDateTime(report.submitted_at, locale)
              : "—"
          }
        />
        <Meta
          label={t("fields.approved")}
          value={
            report.approved_at
              ? formatDateTime(report.approved_at, locale)
              : "—"
          }
        />
        <Meta
          label={t("fields.status")}
          value={t(`status.${report.status}`)}
        />
      </div>

      {report.rejection_reason ? (
        <Alert tone="danger" title={t("preview.rejectionReason")}>
          {report.rejection_reason}
        </Alert>
      ) : null}

      {report.review_notes ? (
        <Alert tone="info" title={t("preview.reviewNotes")}>
          {report.review_notes}
        </Alert>
      ) : null}

      <section>
        <h3 className="font-[family-name:var(--font-display)] text-lg text-[var(--ink)]">
          {t("preview.issues")}
        </h3>
        {(report.issues?.length ?? 0) === 0 ? (
          <p className="mt-2 text-sm text-[var(--muted)]">
            {t("preview.noIssues")}
          </p>
        ) : (
          <ul className="mt-3 space-y-2">
            {report.issues!.map((issue) => (
              <li
                key={issue.id}
                className="rounded-lg border border-[var(--line)] bg-[var(--surface-elevated)] px-3 py-2 text-sm"
              >
                <span className="font-medium text-[var(--ink)]">{issue.title}</span>
                <span className="ms-2 text-[var(--muted)]">
                  {issue.severity} · {issue.status}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h3 className="font-[family-name:var(--font-display)] text-lg text-[var(--ink)]">
          {t("preview.checklists")}
        </h3>
        {(report.checklist_results?.length ?? 0) === 0 ? (
          <p className="mt-2 text-sm text-[var(--muted)]">
            {t("preview.noChecklists")}
          </p>
        ) : (
          <ul className="mt-3 space-y-2">
            {report.checklist_results!.map((checklist) => (
              <li
                key={checklist.id}
                className="rounded-lg border border-[var(--line)] bg-[var(--surface-elevated)] px-3 py-2 text-sm"
              >
                <span className="font-medium text-[var(--ink)]">
                  {checklist.title}
                </span>
                <span className="ms-2 text-[var(--muted)]">{checklist.status}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h3 className="font-[family-name:var(--font-display)] text-lg text-[var(--ink)]">
          {t("preview.history")}
        </h3>
        {(report.status_history?.length ?? 0) === 0 ? (
          <p className="mt-2 text-sm text-[var(--muted)]">
            {t("preview.noHistory")}
          </p>
        ) : (
          <ol className="mt-3 space-y-2">
            {[...report.status_history]
              .sort(
                (a, b) =>
                  new Date(b.changed_at).getTime() -
                  new Date(a.changed_at).getTime(),
              )
              .map((item) => (
                <li
                  key={item.id}
                  className="rounded-lg border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-sm"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    {item.from_status ? (
                      <ReportStatusBadge status={item.from_status} />
                    ) : null}
                    <span className="text-[var(--muted)]">→</span>
                    <ReportStatusBadge status={item.to_status} />
                    <span className="text-xs text-[var(--muted)]">
                      {formatDateTime(item.changed_at, locale)}
                    </span>
                  </div>
                  {item.note ? (
                    <p className="mt-1 text-[var(--ink-soft)]">{item.note}</p>
                  ) : null}
                </li>
              ))}
          </ol>
        )}
      </section>
    </div>
  );
}

function WorkflowPanel({
  report,
  locale,
  notes,
  rejectReason,
  onNotes,
  onRejectReason,
  canSubmit,
  canApprove,
  transitions,
  loading,
  onSubmit,
  onReview,
  onApprove,
  onReject,
  onSend,
}: {
  report: Report;
  locale: string;
  notes: string;
  rejectReason: string;
  onNotes: (value: string) => void;
  onRejectReason: (value: string) => void;
  canSubmit: boolean;
  canApprove: boolean;
  transitions: Set<ReportStatus>;
  loading: Record<string, boolean>;
  onSubmit: () => void;
  onReview: () => void;
  onApprove: () => void;
  onReject: () => void;
  onSend: () => void;
}) {
  const t = useTranslations("reports");

  // Backend `allowed_transitions` is the source of truth for next status.
  const showSubmit = canSubmit && transitions.has("submitted");
  const showReview = canApprove && transitions.has("under_review");
  const showApprove = canApprove && transitions.has("approved");
  const showReject = canApprove && transitions.has("rejected");
  const showSend = canApprove && transitions.has("sent");

  const anyAction = showSubmit || showReview || showApprove || showReject || showSend;

  return (
    <div className="space-y-5">
      <div>
        <h3 className="font-[family-name:var(--font-display)] text-lg text-[var(--ink)]">
          {t("workflow.title")}
        </h3>
        <p className="text-sm text-[var(--muted)]">{t("workflow.hint")}</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {(["draft", "submitted", "under_review", "approved", "rejected", "sent"] as ReportStatus[]).map(
          (status) => (
            <span
              key={status}
              className={
                status === report.status
                  ? "rounded-md ring-2 ring-[var(--brand)] ring-offset-2"
                  : "opacity-60"
              }
            >
              <ReportStatusBadge status={status} />
            </span>
          ),
        )}
      </div>

      {!anyAction ? (
        <EmptyState
          title={t("workflow.noActionsTitle")}
          description={
            report.status === "sent"
              ? t("workflow.terminalHint")
              : t("workflow.noActionsHint")
          }
          className="py-8"
        />
      ) : (
        <>
          {(showReview || showApprove || showSubmit || showSend) && (
            <div>
              <Label>{t("fields.notes")}</Label>
              <textarea
                value={notes}
                onChange={(event) => onNotes(event.target.value)}
                className="min-h-20 w-full rounded-md border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-sm"
                placeholder={t("fields.notesPlaceholder")}
              />
            </div>
          )}

          {showReject ? (
            <div>
              <Label>{t("fields.rejectReason")}</Label>
              <textarea
                value={rejectReason}
                onChange={(event) => onRejectReason(event.target.value)}
                className="min-h-20 w-full rounded-md border border-[var(--danger-soft)] bg-[var(--danger-tint)]/40 px-3 py-2 text-sm"
                placeholder={t("fields.rejectReasonPlaceholder")}
              />
            </div>
          ) : null}

          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {showSubmit ? (
              <Button
                type="button"
                className="gap-2"
                loading={loading.submit}
                onClick={onSubmit}
              >
                <Send className="h-4 w-4" />
                {t("actions.submit")}
              </Button>
            ) : null}
            {showReview ? (
              <Button
                type="button"
                variant="secondary"
                className="gap-2"
                loading={loading.review}
                onClick={onReview}
              >
                <Eye className="h-4 w-4" />
                {t("actions.review")}
              </Button>
            ) : null}
            {showApprove ? (
              <Button
                type="button"
                className="gap-2"
                loading={loading.approve}
                onClick={onApprove}
              >
                <ThumbsUp className="h-4 w-4" />
                {t("actions.approve")}
              </Button>
            ) : null}
            {showReject ? (
              <Button
                type="button"
                variant="danger"
                className="gap-2"
                loading={loading.reject}
                onClick={onReject}
              >
                <ThumbsDown className="h-4 w-4" />
                {t("actions.reject")}
              </Button>
            ) : null}
            {showSend ? (
              <Button
                type="button"
                className="gap-2"
                loading={loading.send}
                onClick={onSend}
              >
                <Check className="h-4 w-4" />
                {t("actions.send")}
              </Button>
            ) : null}
          </div>

          {!canApprove && (report.status === "submitted" || report.status === "under_review") ? (
            <Alert tone="info">{t("workflow.approvalRestricted")}</Alert>
          ) : null}
        </>
      )}

      <p className="text-xs text-[var(--muted)]">
        {t("workflow.updatedAt", {
          date: formatDateTime(report.updated_at, locale),
        })}
      </p>
    </div>
  );
}

function PdfPanel({
  report,
  currentPdfStatus,
  pdfLanguage,
  onLanguage,
  pdfBlobUrl,
  canPdf,
  loading,
  onGenerate,
  onPreview,
  onDownload,
}: {
  report: Report;
  currentPdfStatus: Report["pdf_status"];
  pdfLanguage: PdfLanguage;
  onLanguage: (value: PdfLanguage) => void;
  pdfBlobUrl: string | null;
  canPdf: boolean;
  loading: boolean;
  onGenerate: () => void;
  onPreview: () => void;
  onDownload: () => void;
}) {
  const t = useTranslations("reports");
  const ready = currentPdfStatus === "ready";

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-[family-name:var(--font-display)] text-lg text-[var(--ink)]">
          {t("pdf.title")}
        </h3>
        <p className="text-sm text-[var(--muted)]">{t("pdf.hint")}</p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <PdfStatusBadge status={currentPdfStatus} />
        {report.pdf_error ? (
          <span className="text-xs text-[var(--danger)]">{report.pdf_error}</span>
        ) : null}
      </div>

      {canPdf ? (
        <div className="grid gap-3 rounded-xl border border-[var(--line)] bg-[var(--surface)] p-4 sm:grid-cols-[1fr_auto]">
          <div>
            <Label>{t("pdf.language")}</Label>
            <Select
              value={pdfLanguage}
              onChange={(event) =>
                onLanguage(event.target.value as PdfLanguage)
              }
            >
              <option value="bilingual">{t("pdf.languages.bilingual")}</option>
              <option value="en">{t("pdf.languages.en")}</option>
              <option value="ar">{t("pdf.languages.ar")}</option>
            </Select>
          </div>
          <div className="flex items-end">
            <Button
              type="button"
              className="w-full gap-2 sm:w-auto"
              loading={loading}
              onClick={onGenerate}
            >
              <FileText className="h-4 w-4" />
              {t("actions.generatePdf")}
            </Button>
          </div>
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="secondary"
          className="gap-2"
          disabled={!ready}
          loading={loading}
          onClick={onPreview}
        >
          <Eye className="h-4 w-4" />
          {t("actions.previewPdf")}
        </Button>
        <Button
          type="button"
          variant="secondary"
          className="gap-2"
          disabled={!ready}
          loading={loading}
          onClick={onDownload}
        >
          <Download className="h-4 w-4" />
          {t("actions.downloadPdf")}
        </Button>
      </div>

      {pdfBlobUrl ? (
        <div className="overflow-hidden rounded-xl border border-[var(--line)] bg-[var(--surface)]">
          <iframe
            title={t("pdf.previewTitle")}
            src={pdfBlobUrl}
            className="h-[70vh] w-full"
          />
        </div>
      ) : (
        <EmptyState
          title={ready ? t("pdf.readyTitle") : t("pdf.emptyTitle")}
          description={
            ready ? t("pdf.readyHint") : t("pdf.emptyHint")
          }
          className="py-10"
        />
      )}
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-[var(--line)] bg-[var(--surface)] px-3 py-2">
      <dt className="text-xs uppercase tracking-wide text-[var(--muted)]">{label}</dt>
      <dd className="mt-1 text-sm font-medium text-[var(--ink)]">{value}</dd>
    </div>
  );
}

function formatDateTime(value: string, locale: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}
