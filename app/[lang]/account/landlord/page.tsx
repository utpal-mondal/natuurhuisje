'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { useParams } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import React from 'react';

interface UserProfile {
  display_name: string;
  avatar_url?: string;
}

function LandlordPage() {
  const params = useParams();
  const lang = params.lang as string;
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        redirect('/login');
        return;
      }
      
      setSession(session);
      
      // Get user profile from database
      let profile: UserProfile | null = null;
      try {
        const { data } = await supabase
          .from('users')
          .select('display_name, avatar_url')
          .eq('auth_user_id', session.user.id)
          .single();
        profile = data;
      } catch (error) {
        console.log('Profile fetch failed, using metadata fallback');
      }
      
      setUserProfile(profile);
      setLoading(false);
    };

    fetchUserData();
  }, []);

  if (loading || !session) {
    return (
      <div className="p-8 space-y-8 animate-pulse">
        <div className="mb-8">
          <div className="h-10 w-64 bg-gray-200 rounded mb-2" />
          <div className="h-6 w-56 bg-gray-200 rounded" />
        </div>
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6 text-center space-y-4">
          <div className="h-6 w-48 bg-gray-200 rounded mx-auto" />
          <div className="h-12 w-48 bg-gray-200 rounded mx-auto" />
        </div>
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="h-5 w-40 bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  // Format user name - prioritize metadata since it's more reliable
  const firstName = session.user.user_metadata?.first_name;
  const lastName = session.user.user_metadata?.last_name;
  
  const fullName = firstName && lastName ? 
    `${firstName} ${lastName}` : 
    userProfile?.display_name || 
    'User';

  return (
    <div className="p-8">
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          Hello {fullName}!
        </h1>
        <p className="text-lg text-gray-600">
          Put your nature houses online
        </p>
      </div>

      {/* Add New Nature House Section */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6 text-center">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Add a new nature house?
        </h2>
        <Link href={`/${lang}/host/new`}>
          <button className="bg-teal-500 hover:bg-teal-600 text-white font-medium px-6 py-3 rounded-lg transition-colors">
            Add advertisement
          </button>
        </Link>
      </div>

      {/* My Nature Houses Link */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <Link 
          href="/account/listings"
          className="inline-flex items-center text-teal-600 hover:text-teal-700 font-medium transition-colors"
        >
          To my nature houses
          <svg 
            className="ml-2 w-4 h-4" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M9 5l7 7-7 7" 
            />
          </svg>
        </Link>
      </div>
    </div>
  );
}

export default LandlordPage;
