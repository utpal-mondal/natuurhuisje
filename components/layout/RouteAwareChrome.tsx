"use client";

import { usePathname } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import type { Locale } from "@/i18n/config";

interface RouteAwareChromeProps {
  lang: Locale;
  children: React.ReactNode;
}

export function RouteAwareChrome({ lang, children }: RouteAwareChromeProps) {
  const pathname = usePathname();
  const isAdminRoute =
    pathname === `/${lang}/admin` || pathname.startsWith(`/${lang}/admin/`);

  return (
    <>
      {!isAdminRoute && <Header lang={lang} />}
      <main className={`min-h-screen ${!isAdminRoute ? "pt-20" : ""}`}>
        {children}
      </main>
      <Footer lang={lang} />
    </>
  );
}
