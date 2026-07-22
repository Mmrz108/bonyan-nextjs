"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { LocaleSwitcher } from "@/components/ui/locale-switcher";
import { cn } from "@/lib/utils";

const GALLERY = [
  "/home/gallery-1.jpg",
  "/home/gallery-2.jpg",
  "/home/gallery-3.jpg",
  "/home/gallery-4.jpg",
] as const;

const PHONE_TEL = "+96895114511";
const WHATSAPP = "96895114511";
const EMAIL = "bonyanec.oman@gmail.com";

export function HomePage() {
  const t = useTranslations("home");
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    const id = requestAnimationFrame(() => setVisible(true));
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(id);
    };
  }, []);

  const nav = [
    { href: "#top", label: t("navHome") },
    { href: "#about", label: t("navPages") },
    { href: "#services", label: t("navServices") },
    { href: "#gallery", label: t("navPortfolio") },
    { href: "#blog", label: t("navBlog") },
    { href: "#contact", label: t("navContacts") },
  ] as const;

  return (
    <div className="home-site min-h-screen bg-[var(--home-paper)] text-[var(--home-ink)]">
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-50 transition-[background-color,box-shadow,backdrop-filter] duration-300",
          scrolled
            ? "border-b border-white/10 bg-[color-mix(in_srgb,var(--home-ink)_92%,transparent)] shadow-[0_10px_40px_rgba(8,20,40,0.25)] backdrop-blur-md"
            : "bg-transparent",
        )}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <a href="#top" className="flex items-center gap-3">
            <span className="inline-flex h-12 w-12 shrink-0 overflow-hidden rounded-full bg-white shadow-md ring-2 ring-white/40 sm:h-14 sm:w-14">
              <Image
                src="/brand/bonyan-logo.png"
                alt={t("brandAlt")}
                width={56}
                height={56}
                className="h-full w-full object-contain object-center p-1.5"
                priority
              />
            </span>
            <span className="hidden max-w-[11rem] text-xs font-semibold leading-snug text-white sm:block">
              Bonyän Construction &amp; Engineering Consultancy
            </span>
          </a>

          <nav
            className="hidden items-center gap-6 lg:flex"
            aria-label={t("navHome")}
          >
            {nav.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="text-sm font-medium tracking-wide text-white/85 transition-colors hover:text-white"
              >
                {item.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <LocaleSwitcher className="border-white/20 bg-white/10 [&_button]:text-white/80 [&_button[aria-pressed=true]]:bg-[var(--home-cta)] [&_button[aria-pressed=true]]:text-[var(--home-ink)]" />
            <Link
              href="/login"
              className="hidden rounded-md bg-[var(--home-cta)] px-3.5 py-2 text-sm font-semibold text-[var(--home-ink)] transition hover:bg-[var(--home-cta-strong)] hover:text-white sm:inline-flex"
            >
              {t("signIn")}
            </Link>
            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-white/25 text-white lg:hidden"
              aria-expanded={menuOpen}
              aria-label={menuOpen ? t("closeMenu") : t("openMenu")}
              onClick={() => setMenuOpen((v) => !v)}
            >
              <span className="sr-only">{menuOpen ? t("closeMenu") : t("openMenu")}</span>
              <span aria-hidden className="flex flex-col gap-1.5">
                <span className="block h-0.5 w-5 bg-current" />
                <span className="block h-0.5 w-5 bg-current" />
                <span className="block h-0.5 w-5 bg-current" />
              </span>
            </button>
          </div>
        </div>

        {menuOpen ? (
          <div className="border-t border-white/10 bg-[var(--home-ink)] px-4 py-4 lg:hidden">
            <div className="flex flex-col gap-3">
              {nav.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className="text-base font-medium text-white/90"
                  onClick={() => setMenuOpen(false)}
                >
                  {item.label}
                </a>
              ))}
              <Link
                href="/login"
                className="mt-2 rounded-md bg-[var(--home-cta)] px-3.5 py-2.5 text-center text-sm font-semibold text-[var(--home-ink)]"
                onClick={() => setMenuOpen(false)}
              >
                {t("signIn")}
              </Link>
            </div>
          </div>
        ) : null}
      </header>

      <main>
        {/* Hero — one composition: brand, headline, support, CTAs, full-bleed image */}
        <section
          id="top"
          className="relative isolate min-h-[100svh] overflow-hidden"
        >
          <Image
            src="/home/hero.jpg"
            alt=""
            fill
            priority
            sizes="100vw"
            className={cn(
              "object-cover transition-transform duration-[8s] ease-out",
              visible ? "scale-100" : "scale-105",
            )}
          />
          <div className="absolute inset-0 bg-[linear-gradient(105deg,rgba(8,22,48,0.88)_0%,rgba(8,22,48,0.55)_48%,rgba(20,90,60,0.35)_100%)]" />
          <div className="absolute inset-0 home-hero-grain" aria-hidden />

          <div className="relative z-10 mx-auto flex min-h-[100svh] max-w-7xl flex-col justify-end px-4 pb-16 pt-28 sm:px-6 sm:pb-20 lg:px-8 lg:pb-24">
            <div
              className={cn(
                "max-w-3xl transition-all duration-700 ease-out",
                visible
                  ? "translate-y-0 opacity-100"
                  : "translate-y-6 opacity-0",
              )}
            >
              <span className="mb-8 inline-flex h-32 w-32 overflow-hidden rounded-full bg-white shadow-[0_12px_40px_rgba(0,0,0,0.35)] ring-4 ring-white/30 sm:h-40 sm:w-40">
                <Image
                  src="/brand/bonyan-logo.png"
                  alt={t("brandAlt")}
                  width={160}
                  height={160}
                  className="h-full w-full object-contain object-center p-3"
                  priority
                />
              </span>
              <h1 className="font-[family-name:var(--font-display)] text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-6xl">
                {t("heroHeadline")}
              </h1>
              <p className="mt-4 max-w-xl text-base leading-relaxed text-white/85 sm:text-lg">
                {t("heroSupport")}
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <a
                  href="#gallery"
                  className="inline-flex items-center justify-center rounded-md bg-[var(--home-cta)] px-5 py-3 text-sm font-semibold text-[var(--home-ink)] transition hover:bg-[var(--home-cta-strong)] hover:text-white"
                >
                  {t("ctaProjects")}
                </a>
                <a
                  href="#about"
                  className="inline-flex items-center justify-center rounded-md border-2 border-[var(--home-gold)] bg-[var(--home-action)] px-5 py-3 text-sm font-semibold text-white shadow-md shadow-black/25 transition hover:bg-[var(--home-action-strong)] hover:border-[var(--home-gold-soft)]"
                >
                  {t("ctaAbout")}
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Pillars */}
        <section className="border-b border-[var(--home-line)] bg-[var(--home-ink)] text-white">
          <div className="mx-auto grid max-w-7xl gap-0 md:grid-cols-3">
            {[
              { n: "01", title: t("pillar1Title") },
              { n: "02", title: t("pillar2Title") },
              { n: "03", title: t("pillar3Title") },
            ].map((item, i) => (
              <div
                key={item.n}
                className={cn(
                  "px-6 py-10 sm:px-8",
                  i > 0 && "border-t border-white/10 md:border-t-0 md:border-s md:border-white/10",
                )}
              >
                <p className="font-[family-name:var(--font-display)] text-3xl text-[var(--home-gold)]">
                  {item.n}.
                </p>
                <h2 className="mt-3 text-lg font-semibold leading-snug">
                  {item.title}
                </h2>
              </div>
            ))}
          </div>
        </section>

        {/* Gallery + contact strip */}
        <section id="gallery" className="scroll-mt-24 py-20 sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <p className="home-eyebrow">{t("galleryEyebrow")}</p>
            <h2 className="home-title mt-2">{t("galleryTitle")}</h2>
            <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {GALLERY.map((src, index) => (
                <figure
                  key={src}
                  className="group relative aspect-[4/5] overflow-hidden bg-[var(--home-mist)]"
                >
                  <Image
                    src={src}
                    alt=""
                    fill
                    sizes="(max-width:1024px) 50vw, 25vw"
                    className="object-cover transition duration-700 group-hover:scale-105"
                  />
                  <figcaption className="sr-only">
                    {t("galleryTitle")} {index + 1}
                  </figcaption>
                </figure>
              ))}
            </div>

            <div
              id="contact-info"
              className="mt-14 grid gap-8 border-t border-[var(--home-line)] pt-10 md:grid-cols-[1.2fr_1fr]"
            >
              <div>
                <h3 className="font-[family-name:var(--font-display)] text-2xl text-[var(--home-ink)]">
                  {t("contactInfoTitle")}
                </h3>
                <ul className="mt-4 space-y-2 text-[var(--home-muted)]">
                  <li>{t("contactAddress")}</li>
                  <li>
                    <a
                      className="hover:text-[var(--home-action)]"
                      href={`mailto:${EMAIL}`}
                    >
                      {t("contactEmail")}
                    </a>
                  </li>
                  <li>
                    <a
                      className="hover:text-[var(--home-action)]"
                      href={`tel:${PHONE_TEL}`}
                    >
                      {t("contactPhone")}
                    </a>
                  </li>
                </ul>
                <div className="mt-5 flex flex-wrap gap-4 text-sm font-semibold text-[var(--home-action)]">
                  <a href="https://facebook.com" rel="noreferrer" target="_blank">
                    {t("socialFacebook")}
                  </a>
                  <a href="https://linkedin.com" rel="noreferrer" target="_blank">
                    {t("socialLinkedin")}
                  </a>
                  <a href="https://instagram.com" rel="noreferrer" target="_blank">
                    {t("socialInstagram")}
                  </a>
                </div>
              </div>
              <blockquote className="border-s-4 border-[var(--home-cta)] ps-5 text-lg leading-relaxed text-[var(--home-ink-soft)]">
                {t("teamQuote")}
              </blockquote>
            </div>
          </div>
        </section>

        {/* About */}
        <section
          id="about"
          className="scroll-mt-24 border-y border-[var(--home-line)] bg-[var(--home-mist)] py-20 sm:py-24"
        >
          <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 sm:px-6 lg:grid-cols-2 lg:gap-16 lg:px-8">
            <div className="relative aspect-[4/3] overflow-hidden">
              <Image
                src="/home/about.jpg"
                alt=""
                fill
                sizes="(max-width:1024px) 100vw, 50vw"
                className="object-cover"
              />
            </div>
            <div>
              <p className="home-eyebrow">{t("benefitsEyebrow")}</p>
              <h2 className="home-title mt-2">{t("aboutTitle")}</h2>
              <p className="mt-5 text-base leading-relaxed text-[var(--home-muted)]">
                {t("aboutP1")}
              </p>
              <p className="mt-4 text-base leading-relaxed text-[var(--home-muted)]">
                {t("aboutP2")}
              </p>
            </div>
          </div>
        </section>

        {/* Services */}
        <section id="services" className="scroll-mt-24 py-20 sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <p className="home-eyebrow">{t("servicesEyebrow")}</p>
            <h2 className="home-title mt-2">{t("servicesTitle")}</h2>
            <div className="mt-12 grid gap-x-10 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
              {(
                [
                  ["serviceDesignTitle", "serviceDesignBody"],
                  ["serviceValueTitle", "serviceValueBody"],
                  ["serviceFurnitureTitle", "serviceFurnitureBody"],
                  ["serviceExteriorTitle", "serviceExteriorBody"],
                  ["serviceArchTitle", "serviceArchBody"],
                  ["serviceLandscapeTitle", "serviceLandscapeBody"],
                ] as const
              ).map(([titleKey, bodyKey]) => (
                <article key={titleKey} className="border-t border-[var(--home-line)] pt-6">
                  <h3 className="font-[family-name:var(--font-display)] text-xl text-[var(--home-ink)]">
                    {t(titleKey)}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-[var(--home-muted)]">
                    {t(bodyKey)}
                  </p>
                  <a
                    href="#contact"
                    className="mt-4 inline-flex text-sm font-semibold tracking-wide text-[var(--home-action)] underline-offset-4 hover:underline"
                  >
                    {t("readMore")}
                  </a>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Values / skills */}
        <section
          id="values"
          className="scroll-mt-24 bg-[var(--home-ink)] py-20 text-white sm:py-24"
        >
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--home-gold)]">
              {t("skillsEyebrow")}
            </p>
            <h2 className="mt-2 font-[family-name:var(--font-display)] text-3xl sm:text-4xl">
              {t("skillsTitle")}
            </h2>
            <p className="mt-4 max-w-3xl text-base leading-relaxed text-white/75">
              {t("skillsIntro")}
            </p>
            <div className="mt-12 grid gap-8 md:grid-cols-3">
              {(
                [
                  ["skillIntegrity", 100],
                  ["skillQuality", 100],
                  ["skillClient", 100],
                ] as const
              ).map(([key, value]) => (
                <div key={key}>
                  <div className="flex items-end justify-between gap-3">
                    <h3 className="text-lg font-semibold">{t(key)}</h3>
                    <span className="font-[family-name:var(--font-display)] text-2xl text-[var(--home-gold)]">
                      {value}%
                    </span>
                  </div>
                  <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/15">
                    <div
                      className="home-skill-bar h-full rounded-full bg-[linear-gradient(90deg,var(--home-gold),var(--home-teal))]"
                      style={{ width: `${value}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-16 grid gap-8 md:grid-cols-2">
              <div className="border border-white/10 bg-white/5 p-6 sm:p-8">
                <h3 className="font-[family-name:var(--font-display)] text-2xl">
                  {t("missionTitle")}
                </h3>
                <p className="mt-3 leading-relaxed text-white/75">{t("missionBody")}</p>
              </div>
              <div className="border border-white/10 bg-white/5 p-6 sm:p-8">
                <h3 className="font-[family-name:var(--font-display)] text-2xl">
                  {t("visionTitle")}
                </h3>
                <p className="mt-3 leading-relaxed text-white/75">{t("visionBody")}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="py-20 sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <p className="home-eyebrow">{t("testimonialsEyebrow")}</p>
            <h2 className="home-title mt-2">{t("testimonialsTitle")}</h2>
            <div className="mt-12 grid gap-10 lg:grid-cols-3">
              {(
                [
                  ["testimonial1Quote", "testimonial1Name", "testimonial1Role"],
                  ["testimonial2Quote", "testimonial2Name", "testimonial2Role"],
                  ["testimonial3Quote", "testimonial3Name", "testimonial3Role"],
                ] as const
              ).map(([quote, name, role]) => (
                <figure
                  key={name}
                  className="flex flex-col border-t-2 border-[var(--home-cta)] pt-6"
                >
                  <blockquote className="flex-1 text-base leading-relaxed text-[var(--home-ink-soft)]">
                    “{t(quote)}”
                  </blockquote>
                  <figcaption className="mt-6">
                    <p className="font-semibold text-[var(--home-ink)]">{t(name)}</p>
                    <p className="text-sm text-[var(--home-muted)]">{t(role)}</p>
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>

        {/* Blog teaser */}
        <section
          id="blog"
          className="scroll-mt-24 border-y border-[var(--home-line)] bg-[var(--home-mist)] py-16"
        >
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <p className="home-eyebrow">{t("blogEyebrow")}</p>
            <h2 className="home-title mt-2">{t("blogTitle")}</h2>
            <p className="mt-4 max-w-2xl text-[var(--home-muted)]">{t("blogTeaser")}</p>
          </div>
        </section>
      </main>

      <footer id="contact" className="scroll-mt-24 bg-[var(--home-ink)] text-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-2 lg:px-8">
          <div>
            <span className="inline-flex h-20 w-20 overflow-hidden rounded-full bg-white shadow-md ring-2 ring-white/20">
              <Image
                src="/brand/bonyan-logo.png"
                alt={t("brandAlt")}
                width={80}
                height={80}
                className="h-full w-full object-contain object-center p-2"
              />
            </span>
            <h2 className="mt-6 font-[family-name:var(--font-display)] text-2xl">
              {t("footerContacts")}
            </h2>
            <ul className="mt-4 space-y-2 text-white/75">
              <li>{t("contactAddress")}</li>
              <li>
                <a href={`mailto:${EMAIL}`} className="hover:text-white">
                  {t("contactEmail")}
                </a>
              </li>
              <li>
                <a href={`tel:${PHONE_TEL}`} className="hover:text-white">
                  {t("contactPhone")}
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h2 className="font-[family-name:var(--font-display)] text-2xl">
              {t("footerQuickLink")}
            </h2>
            <ul className="mt-4 space-y-2 text-white/75">
              <li>
                <a href="#top" className="hover:text-white">
                  {t("footerHome")}
                </a>
              </li>
              <li>
                <a href="#about" className="hover:text-white">
                  {t("footerAbout")}
                </a>
              </li>
              <li>
                <a href="#contact" className="hover:text-white">
                  {t("footerContact")}
                </a>
              </li>
              <li>
                <Link href="/login" className="hover:text-white">
                  {t("navPlatform")}
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-white/10 px-4 py-5 text-center text-sm text-white/55 sm:px-6">
          {t("footerCopyright")}
        </div>
      </footer>

      {/* Persistent contact actions — outside hero */}
      <div className="fixed bottom-4 end-4 z-40 flex flex-col gap-2 sm:bottom-6 sm:end-6">
        <a
          href={`tel:${PHONE_TEL}`}
          className="inline-flex items-center justify-center rounded-md bg-[var(--home-cta)] px-4 py-2.5 text-sm font-semibold text-[var(--home-ink)] shadow-lg shadow-black/20 transition hover:bg-[var(--home-cta-strong)] hover:text-white"
        >
          {t("callNow")}
        </a>
        <a
          href={`https://wa.me/${WHATSAPP}`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center justify-center rounded-md bg-[var(--home-action)] px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-black/20 transition hover:bg-[var(--home-action-strong)]"
        >
          {t("whatsapp")}
        </a>
      </div>
    </div>
  );
}
