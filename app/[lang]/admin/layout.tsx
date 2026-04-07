"use client";

import { useEffect, useState } from "react";
import { useParams, usePathname, useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import type { Locale } from "@/i18n/config";
import AdminShell from "@/components/AdminLayout";

export default function AdminRouteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const pathname = usePathname();
  const router = useRouter();
  const lang = params.lang as Locale;
  const supabase = createClient();
  const isLoginRoute = pathname === `/${lang}/admin/login`;

  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    if (isLoginRoute) {
      setLoading(false);
      setAuthorized(true);
      return;
    }

    checkAdminAccess();
  }, [isLoginRoute]);

  const checkAdminAccess = async () => {
    try {
      // Check if user is authenticated
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        // User not authenticated - redirect to admin login
        router.push(`/${lang}/admin/login`);
        return;
      }

      // Check if user has admin role
      const { data: userData, error: userError } = await (supabase as any)
        .from("user_roles")
        .select("role_name")
        .eq("user_id", session.user.id)
        .single();

      if (userError || !userData) {
        console.error("Error checking user role:", userError);
        // User exists but role check failed - redirect to admin login
        router.push(`/${lang}/admin/login`);
        return;
      }

      // Check if user is admin
      if (userData.role_name !== "admin") {
        console.error("User is not admin:", userData.role_name);
        // User is authenticated but not admin - go back to previous route
        router.back();
        return;
      }

      setAuthorized(true);
    } catch (error) {
      console.error("Error checking admin access:", error);
      // Unexpected error - redirect to admin login
      router.push(`/${lang}/admin/login`);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking authorization...</p>
        </div>
      </div>
    );
  }

  if (!authorized) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 mb-4">
            <svg
              className="w-16 h-16 mx-auto"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Access Denied
          </h2>
          <p className="text-gray-600 mb-4">
            You don't have permission to access this area.
          </p>
          <button
            onClick={() => router.push(`/${lang}/admin/login`)}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  if (isLoginRoute) {
    return <>{children}</>;
  }

  return (
    <AdminShell lang={lang}>{children}</AdminShell>
  );
}
