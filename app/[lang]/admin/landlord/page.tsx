'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { useParams } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { Grid, Building, MessageSquare, Heart, Calendar, Settings, LogOut, User } from 'lucide-react';
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
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading...</div>
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
    <div className="flex h-screen bg-gray-50 py-6">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-sm border-r border-gray-200">
        <div className="p-6">
          <div className="flex items-center gap-1 mb-6">
            <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 border-2 border-white shadow-sm">
              {userProfile?.avatar_url ? (
                <img 
                  src={userProfile.avatar_url} 
                  alt={fullName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-purple-600 text-white text-sm font-medium">
                  {fullName.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{fullName}</h3>
              <p className="text-sm text-gray-600">{session.user.email}</p>
            </div>
          </div>
        </div>

        {/* Menu Items */}
        <nav className="px-4">
          <div className="space-y-1">
            <Link
              href="/account"
              className="flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Grid className="h-5 w-5" />
              Overview
            </Link>
            <Link
              href="/account/landlord"
              className="flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg bg-purple-50 text-purple-700 border-l-4 border-purple-600"
            >
              <Building className="h-5 w-5" />
              Landlord
            </Link>
            <Link
              href="/account/messages"
              className="flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <MessageSquare className="h-5 w-5" />
              Messages
            </Link>
            <Link
              href="/account/favorites"
              className="flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Heart className="h-5 w-5" />
              Favorites
            </Link>
            <Link
              href="/account/bookings"
              className="flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Calendar className="h-5 w-5" />
              Bookings
            </Link>
            <Link
              href="/account/profile"
              className="flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <User className="h-5 w-5" />
              Profile
            </Link>
            <Link
              href="/account/change-password"
              className="flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Settings className="h-5 w-5" />
              Change password
            </Link>
            <Link
              href="/account/communication"
              className="flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <MessageSquare className="h-5 w-5" />
              Communication
            </Link>
          </div>

          {/* Sign Out Button */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <form action="/auth/signout" method="post">
              <button 
                type="submit" 
                className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <LogOut className="h-5 w-5" />
                Log out
              </button>
            </form>
          </div>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
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
      </div>
    </div>
  );
}

export default LandlordPage;
