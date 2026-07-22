import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { DM_Sans, Fraunces, Noto_Sans_Arabic } from "next/font/google";
import { routing } from "@/i18n/routing";
import { AppProviders } from "@/components/providers/app-providers";
import { AuthProvider } from "@/components/providers/auth-provider";
import "../globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const notoArabic = Noto_Sans_Arabic({
  subsets: ["arabic"],
  variable: "--font-arabic",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Bonyan",
    template: "%s · Bonyan",
  },
  description:
    "Bonyan construction project supervision and site inspection management platform.",
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

type LocaleLayoutProps = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function LocaleLayout({
  children,
  params,
}: LocaleLayoutProps) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);
  const messages = await getMessages();
  const dir = locale === "ar" ? "rtl" : "ltr";

  return (
    <html lang={locale} dir={dir} suppressHydrationWarning>
      <body
        dir={dir}
        className={`${dmSans.variable} ${fraunces.variable} ${notoArabic.variable} antialiased`}
      >
        <NextIntlClientProvider messages={messages}>
          <QueryAndAuth>{children}</QueryAndAuth>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

function QueryAndAuth({ children }: { children: React.ReactNode }) {
  return (
    <AppProviders>
      <AuthProvider>{children}</AuthProvider>
    </AppProviders>
  );
}
