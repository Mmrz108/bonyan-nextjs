"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { createLoginSchema, type LoginFormValues } from "@/lib/validations/auth";
import {
  isAuthApiError,
  useAuth,
} from "@/components/providers/auth-provider";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LoginForm() {
  const t = useTranslations("auth");
  const router = useRouter();
  const { login } = useAuth();
  const [formError, setFormError] = useState<string | null>(null);

  const schema = createLoginSchema({
    emailRequired: t("emailRequired"),
    emailInvalid: t("emailInvalid"),
    passwordRequired: t("passwordRequired"),
    passwordMin: t("passwordMin"),
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: true,
    },
  });

  async function onSubmit(values: LoginFormValues) {
    setFormError(null);
    try {
      await login({
        email: values.email,
        password: values.password,
        rememberMe: values.rememberMe,
      });
      router.replace("/dashboard");
    } catch (error) {
      if (isAuthApiError(error) && (error.status === 401 || error.status === 400)) {
        setFormError(t("invalidCredentials"));
        return;
      }
      setFormError(t("serviceUnavailable"));
    }
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
      {formError ? <Alert tone="danger">{formError}</Alert> : null}

      <div>
        <Label htmlFor="email">{t("email")}</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          placeholder={t("emailPlaceholder")}
          invalid={Boolean(errors.email)}
          {...register("email")}
        />
        {errors.email ? (
          <p className="mt-1 text-xs text-[var(--danger)]">{errors.email.message}</p>
        ) : null}
      </div>

      <div>
        <div className="mb-1.5 flex items-center justify-between gap-3">
          <Label htmlFor="password" className="mb-0">
            {t("password")}
          </Label>
          <span className="text-xs text-[var(--muted)]">{t("forgotPassword")}</span>
        </div>
        <Input
          id="password"
          type="password"
          autoComplete="current-password"
          placeholder={t("passwordPlaceholder")}
          invalid={Boolean(errors.password)}
          {...register("password")}
        />
        {errors.password ? (
          <p className="mt-1 text-xs text-[var(--danger)]">{errors.password.message}</p>
        ) : null}
      </div>

      <label className="flex items-center gap-2 text-sm text-[var(--ink-soft)]">
        <input
          type="checkbox"
          className="h-4 w-4 rounded border-[var(--line)] text-[var(--brand)] focus:ring-[var(--brand)]"
          {...register("rememberMe")}
        />
        {t("rememberMe")}
      </label>

      <Button type="submit" className="w-full" loading={isSubmitting}>
        {isSubmitting ? t("submitting") : t("submit")}
      </Button>
    </form>
  );
}
