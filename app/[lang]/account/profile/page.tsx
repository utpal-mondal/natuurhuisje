import { redirect } from 'next/navigation';
import { Suspense, use } from 'react';
import { createClient } from '@/utils/supabase/server';
import ProfileForm from '@/components/account/ProfileForm';
import { i18n, type Locale } from '@/i18n/config';

async function ProfileContent({ lang }: { lang: Locale }) {
  const supabase = await createClient();
  
  // Check if user is logged in
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    redirect(`/${lang}/login`);
  }
  
  // Get user profile from users table
  let profile: any = null;
  try {
    const { data } = await supabase
      .from('users')
      .select('*')
      .eq('auth_user_id', session.user.id)
      .single();
    profile = data;
  } catch (error) {
    console.log('Profile fetch failed, using metadata fallback');
  }

  // Get user metadata for additional info
  const firstName = session.user.user_metadata?.first_name;
  const lastName = session.user.user_metadata?.last_name;
  
  const fullName = firstName && lastName ? 
    `${firstName} ${lastName}` : 
    profile?.display_name || 
    (profile?.first_name && profile?.last_name ? `${profile.first_name} ${profile.last_name}` : 'User');

  const avatarUrl = profile?.avatar_url || '';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Profile Settings
        </h1>
        <p className="mt-2 text-gray-600">
          Manage your personal information and account details
        </p>
      </div>

      <ProfileForm 
        profile={profile} 
        session={session}
        fullName={fullName}
      />
    </div>
  );
}

export default function ProfilePage({
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
            <div className="mt-2 h-5 w-80 bg-gray-200 rounded" />
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-6 space-y-6">
            <div className="flex items-center gap-4">
              <div className="h-20 w-20 bg-gray-200 rounded-full" />
              <div className="space-y-2">
                <div className="h-5 w-40 bg-gray-200 rounded" />
                <div className="h-4 w-24 bg-gray-200 rounded" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="space-y-2">
                  <div className="h-4 w-24 bg-gray-200 rounded" />
                  <div className="h-10 w-full bg-gray-200 rounded" />
                </div>
              ))}
            </div>
            <div className="h-10 w-32 bg-gray-200 rounded" />
          </div>
        </div>
      }
    >
      <ProfileContent lang={validatedLang} />
    </Suspense>
  );
}
