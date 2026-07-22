"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/components/providers/auth-provider";
import { canApproveReports, canSubmitReports } from "@/lib/auth/permissions";
import { isApiError } from "@/lib/api/client";
import { deleteReportSignature, uploadReportSignature } from "@/lib/api/reports";
import type { Report, ReportSignature, ReportSignatureKind } from "@/lib/api/types";
import { reportKeys } from "@/hooks/use-reports";
import { SignaturePad } from "@/components/reports/signature-pad";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

type Props = {
  report: Report;
};

export function ReportSignaturesPanel({ report }: Props) {
  const t = useTranslations("reports.signatures");
  const locale = useLocale();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const canSubmit = canSubmitReports(user?.roles);
  const canApprove = canApproveReports(user?.roles);
  const isClient = (user?.roles ?? []).includes("CLIENT");

  const availableKinds = useMemo(() => {
    const kinds: ReportSignatureKind[] = [];
    if (canSubmit) kinds.push("supervisor");
    if (
      canApprove &&
      (report.status === "under_review" ||
        report.status === "approved" ||
        report.status === "sent")
    ) {
      kinds.push("approval");
    }
    if (
      (isClient || canApprove) &&
      (report.status === "under_review" ||
        report.status === "approved" ||
        report.status === "sent")
    ) {
      kinds.push("client");
    }
    return kinds;
  }, [canApprove, canSubmit, isClient, report.status]);

  const [kind, setKind] = useState<ReportSignatureKind>(
    availableKinds[0] ?? "supervisor",
  );
  const [title, setTitle] = useState("");
  const [statement, setStatement] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  const upload = useMutation({
    mutationFn: (blob: Blob) =>
      uploadReportSignature(report.id, {
        kind,
        file: blob,
        signer_name: user?.full_name || user?.email || "",
        signer_email: user?.email || "",
        signer_title: title,
        statement,
      }),
    onSuccess: async () => {
      setOk(t("success"));
      setError(null);
      await queryClient.invalidateQueries({
        queryKey: reportKeys.detail(report.id),
      });
    },
    onError: (err) => {
      setOk(null);
      setError(isApiError(err) ? err.message : t("uploadFailed"));
    },
  });

  const remove = useMutation({
    mutationFn: (signatureId: string) =>
      deleteReportSignature(report.id, signatureId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: reportKeys.detail(report.id),
      });
    },
  });

  const signatures = report.signatures ?? [];

  return (
    <div className="space-y-5">
      <div>
        <h3 className="font-[family-name:var(--font-display)] text-lg text-[var(--ink)]">
          {t("title")}
        </h3>
        <p className="text-sm text-[var(--muted)]">{t("hint")}</p>
      </div>

      {error ? <Alert tone="danger">{error}</Alert> : null}
      {ok ? <Alert tone="success">{ok}</Alert> : null}

      <div className="space-y-3 rounded-md border border-[var(--line)] p-4">
        {signatures.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">{t("empty")}</p>
        ) : (
          signatures.map((signature) => (
            <SignatureRow
              key={signature.id}
              signature={signature}
              locale={locale}
              onDelete={() => void remove.mutateAsync(signature.id)}
              deleting={remove.isPending}
            />
          ))
        )}
      </div>

      {availableKinds.length === 0 ? (
        <Alert tone="info">{t("noPermission")}</Alert>
      ) : (
        <div className="space-y-3 rounded-md border border-[var(--line)] p-4">
          <div>
            <Label>{t("kind")}</Label>
            <Select
              value={kind}
              onChange={(event) =>
                setKind(event.target.value as ReportSignatureKind)
              }
            >
              {availableKinds.map((value) => (
                <option key={value} value={value}>
                  {t(`kinds.${value}`)}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label>{t("signerTitle")}</Label>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className="w-full rounded-md border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-sm"
              placeholder={t("signerTitlePlaceholder")}
            />
          </div>
          <div>
            <Label>{t("statement")}</Label>
            <textarea
              value={statement}
              onChange={(event) => setStatement(event.target.value)}
              className="min-h-16 w-full rounded-md border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-sm"
              placeholder={t("statementPlaceholder")}
            />
          </div>
          <SignaturePad
            disabled={upload.isPending}
            onCapture={(blob) => void upload.mutateAsync(blob)}
          />
        </div>
      )}
    </div>
  );
}

function SignatureRow({
  signature,
  locale,
  onDelete,
  deleting,
}: {
  signature: ReportSignature;
  locale: string;
  onDelete: () => void;
  deleting: boolean;
}) {
  const t = useTranslations("reports.signatures");
  const signedAt = new Date(signature.signed_at).toLocaleString(locale);

  return (
    <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[var(--line)] pb-3 last:border-0 last:pb-0">
      <div className="space-y-1">
        <p className="text-sm font-semibold text-[var(--ink)]">
          {t(`kinds.${signature.kind}`)} — {signature.signer_name}
        </p>
        <p className="text-xs text-[var(--muted)]">
          {[signature.signer_email, signature.signer_title, signedAt]
            .filter(Boolean)
            .join(" · ")}
        </p>
        {signature.statement ? (
          <p className="text-xs text-[var(--muted)]">{signature.statement}</p>
        ) : null}
        <p className="font-mono text-[10px] text-[var(--muted)]">
          SHA-256 {signature.content_sha256.slice(0, 16)}…
        </p>
      </div>
      <Button
        type="button"
        variant="secondary"
        loading={deleting}
        onClick={onDelete}
      >
        {t("remove")}
      </Button>
    </div>
  );
}
