import { redirect } from 'next/navigation';
import { Suspense, use } from 'react';
import { createClient } from '@/utils/supabase/server';
import { ChangePasswordForm } from '@/components/account/ChangePasswordForm';
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
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Change Password
        </h1>
        <p className="mt-2 text-gray-600">
          Update your account password
        </p>
      </div>

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
        <div className="space-y-6 animate-pulse">
          <div>
            <div className="h-9 w-56 bg-gray-200 rounded" />
            <div className="mt-2 h-5 w-72 bg-gray-200 rounded" />
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-6 space-y-6">
            <div className="space-y-2">
              <div className="h-4 w-32 bg-gray-200 rounded" />
              <div className="h-10 w-full bg-gray-200 rounded" />
            </div>
            <div className="space-y-2">
              <div className="h-4 w-40 bg-gray-200 rounded" />
              <div className="h-10 w-full bg-gray-200 rounded" />
            </div>
            <div className="space-y-2">
              <div className="h-4 w-48 bg-gray-200 rounded" />
              <div className="h-10 w-full bg-gray-200 rounded" />
            </div>
            <div className="h-10 w-40 bg-gray-200 rounded" />
          </div>
        </div>
      }
    >
      <ChangePasswordContent lang={validatedLang} />
    </Suspense>
  );
}
