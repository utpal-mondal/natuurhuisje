import AccountLayout from '@/components/AccountLayout';
import type { Locale } from '@/i18n/config';

export default async function UserRouteLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;

  return (
    <AccountLayout lang={lang as Locale}>
      {children}
    </AccountLayout>
  );
}