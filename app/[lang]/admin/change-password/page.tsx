import { redirect } from 'next/navigation';
import { Suspense, use } from 'react';
import { createClient } from '@/utils/supabase/server';
import { ChangePasswordForm } from '@/components/account/ChangePasswordForm';
import AdminPageHeader from '@/components/AdminPageHeader';
import { i18n, type Locale } from '@/i18n/config';

async function ChangePasswordContent({ lang }: { lang: Locale }) {
  const supabase = await createClient();
  
  // Check if user is logged in
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    redirect(`/${lang}/login`);
  }

  // Get user profile for avatar (optional)
  let profile: any = null;
  try {
    const { data } = await supabase
      .from('users')
      .select('*')
      .eq('auth_user_id', session.user.id)
      .single();
    profile = data;
  } catch (error) {
    console.log('Profile fetch failed');
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Change Password"
        subtitle="Update your account password"
      />

      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6">
          <ChangePasswordForm session={session} />
        </div>
      </div>
    </div>
  );
}

export default function ChangePasswordPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = use(params);

  // Validate that lang is a supported locale
  if (!i18n.locales.includes(lang as Locale)) {
    throw new Error(`Unsupported locale: ${lang}`);
  }

  const validatedLang = lang as Locale;

  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      }
    >
      <ChangePasswordContent lang={validatedLang} />
    </Suspense>
  );
}
