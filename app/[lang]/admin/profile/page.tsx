import { redirect } from 'next/navigation';
import { Suspense, use } from 'react';
import { createClient } from '@/utils/supabase/server';
import ProfileForm from '@/components/account/ProfileForm';
import AdminPageHeader from '@/components/AdminPageHeader';
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
      <AdminPageHeader
        title="Profile Settings"
        subtitle="Manage your personal information and account details"
      />

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
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      }
    >
      <ProfileContent lang={validatedLang} />
    </Suspense>
  );
}
