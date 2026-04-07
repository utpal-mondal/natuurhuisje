"use client";

import { ReactNode, useEffect, useState } from "react";
import type { Locale } from "@/i18n/config";
import { ChevronDown } from "lucide-react";
import AdminSidebar from "./AdminSidebar";
import { createClient } from "@/utils/supabase/client";

interface AdminLayoutProps {
  children: ReactNode;
  lang: Locale;
}

export default function AdminLayout({ children, lang }: AdminLayoutProps) {
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isUserLoading, setIsUserLoading] = useState(true);

  useEffect(() => {
    const getUser = async () => {
      const supabase = createClient();
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        setUser(user);
      } finally {
        setIsUserLoading(false);
      }
    };

    getUser();
  }, []);

  useEffect(() => {
    if (user !== null) {
      const getUserProfile = async () => {
        const supabase = createClient();
        const { data: profile, error } = await supabase
          .from("users")
          .select("display_name, avatar_url")
          .eq("auth_user_id", user.id)
          .single();

        setUserProfile(profile);
      };

      getUserProfile();
    }
  }, [user]);

  const fullName =
    user?.user_metadata?.first_name + " " + user?.user_metadata?.last_name;
  const displayName = fullName?.trim() || userProfile?.display_name || "Admin User";

  return (
    <div className="h-screen overflow-hidden bg-[#f5f7fb] text-slate-900">
      <div className="flex h-full">
        <AdminSidebar lang={lang} />
        <div className="flex h-full min-w-0 flex-1 flex-col overflow-hidden">
          <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/90 backdrop-blur">
            <div className="flex flex-col gap-4 px-4 py-4 sm:px-6 lg:px-8 xl:flex-row xl:items-center xl:justify-between">
              <div className="min-w-0" />
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                {/* <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500 shadow-sm sm:min-w-65">
                  <Search className="h-4 w-4 text-slate-400" />
                  <span className="truncate">Search dashboards, bookings, listings...</span>
                </div> */}
                <div className="flex items-center gap-3 self-start sm:self-auto">
                  {/* <button
                    type="button"
                    className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:border-slate-300 hover:text-slate-700"
                  >
                    <Moon className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    className="relative flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:border-slate-300 hover:text-slate-700"
                  >
                    <Bell className="h-4 w-4" />
                    <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-rose-500" />
                  </button> */}
                  {isUserLoading ? (
                    <div className="flex items-center gap-3 rounded-full border border-slate-200 bg-white px-3 py-2 shadow-sm animate-pulse">
                      <div className="h-9 w-9 rounded-full bg-slate-200" />
                      <div className="hidden min-w-35 space-y-2 sm:block">
                        <div className="h-3 w-24 rounded bg-slate-200" />
                        <div className="h-2.5 w-32 rounded bg-slate-100" />
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 rounded-full border border-slate-200 bg-white px-3 py-2 shadow-sm">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-linear-to-br from-teal-400 to-cyan-500 text-sm font-semibold text-white">
                        {userProfile?.avatar_url ? (
                          <img
                            src={userProfile.avatar_url}
                            alt={userProfile?.display_name || "Account"}
                            className="h-9 w-9 rounded-full object-cover"
                            onError={(e) => {
                              console.error("Avatar failed to load:", userProfile?.avatar_url);
                              e.currentTarget.style.display = "none";
                            }}
                          />
                        ) : (
                          <img
                            src={`https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=7B3FA0&color=fff&size=64`}
                            alt={displayName}
                            className="h-9 w-9 rounded-full object-cover"
                          />
                        )}
                      </div>
                      <div className="hidden min-w-0 sm:block">
                        <p className="truncate text-sm font-semibold text-slate-900">{displayName}</p>
                        <p className="truncate text-xs text-slate-500">{user?.email || "admin@natuurhuisje.com"}</p>
                      </div>
                      {/* <ChevronDown className="hidden h-4 w-4 text-slate-400 sm:block" /> */}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </header>
          <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
            <div>{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
}
