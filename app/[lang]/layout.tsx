import type { Metadata } from 'next'
import { Inter, Poppins } from 'next/font/google'
import '../globals.css'

import { RouteAwareChrome } from '@/components/layout/RouteAwareChrome'
import { SearchProvider } from '@/contexts/SearchContext'
import { i18n, type Locale } from '@/i18n/config'
import { getDictionary } from '@/i18n/get-dictionary'

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
})

const poppins = Poppins({
  subsets: ['latin'],
  variable: '--font-poppins',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
})

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  
  // Validate that lang is a supported locale
  if (!i18n.locales.includes(lang as Locale)) {
    throw new Error(`Unsupported locale: ${lang}`);
  }
  
  const dict = await getDictionary(lang as Locale);
  
  return {
    title: 'Demo hotel - Find your perfect getaway in nature',
    description: 'Discover and book unique nature accommodations: cabins, treehouses, glamping, and more in the most beautiful natural settings.',
    icons: {
      icon: '/images/fav.ico',
    },
  };
}

export async function generateStaticParams() {
  return i18n.locales.map((locale) => ({ lang: locale }));
}

export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  
  // Validate that lang is a supported locale
  if (!i18n.locales.includes(lang as Locale)) {
    throw new Error(`Unsupported locale: ${lang}`);
  }
  
  const validatedLang = lang as Locale;
  
  return (
    <html lang={validatedLang} className={[inter.variable, poppins.variable].join(' ')}>
      <body className="font-sans antialiased">
        <SearchProvider>
          <RouteAwareChrome lang={validatedLang}>{children}</RouteAwareChrome>
        </SearchProvider>
      </body>
    </html>
  )
}
