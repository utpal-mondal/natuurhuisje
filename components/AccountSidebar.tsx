"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  User,
  Grid,
  Building,
  MessageSquare,
  Heart,
  Calendar,
  Settings,
  Home,
  LogOut,
  DollarSign,
  Users,
  BarChart,
  Shield,
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { getUserRole, type RoleName } from "@/lib/roles";

interface AccountSidebarProps {
  lang: string;
  className?: string;
}

export default function AccountSidebar({
  lang,
  className = "",
}: AccountSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [userRole, setUserRole] = useState<RoleName | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const getUser = async () => {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        setUser(user);
        if (!user) {
          setIsLoading(false);
        }
      } catch {
        setUser(null);
        setIsLoading(false);
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

      // Get user role
      const fetchUserRole = async () => {
        const role = await getUserRole(user.id);
        setUserRole(role);
        setIsLoading(false);
      };

      fetchUserRole();
    }
  }, [user]);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push(`/${lang}/login`);
  };

  // Role-based menu items
  const getAllMenuItems = () => [
    // Basic items for all users
    {
      href: `/account`,
      label: "Dashboard",
      icon: Home,
      description: "Overview of your account",
      roles: ["user", "landlord", "admin"] as RoleName[],
    },
    {
      href: `/account/profile`,
      label: "Profile",
      icon: User,
      description: "Manage your personal information",
      roles: ["user", "landlord", "admin"] as RoleName[],
    },
    {
      href: `/account/change-password`,
      label: "Password change",
      icon: Settings,
      description: "Change your password",
      roles: ["user", "landlord", "admin"] as RoleName[],
    },
    {
      href: `/account/bookings`,
      label: "My Bookings",
      icon: Calendar,
      description: "View your booking history",
      roles: ["user", "landlord", "admin"] as RoleName[],
    },
    // Landlord specific items
    {
      href: `/account/host-bookings`,
      label: "Booking Management",
      icon: Grid,
      description: "Manage property bookings",
      roles: ["landlord", "admin"] as RoleName[],
    },
    {
      href: `/account/listings`,
      label: "My Properties",
      icon: Building,
      description: "Manage your listings",
      roles: ["landlord", "admin"] as RoleName[],
    },
    // {
    //   href: `/host/new`,
    //   label: "Add New Property",
    //   icon: Building,
    //   description: "List a new property",
    //   roles: ["landlord", "admin"] as RoleName[],
    // },
    // {
    //   href: `/account/special-pricing`,
    //   label: "Special Pricing",
    //   icon: DollarSign,
    //   description: "Manage seasonal pricing",
    //   roles: ["landlord", "admin"] as RoleName[],
    // },
    // Admin specific items
    // {
    //   href: `/account/users`,
    //   label: "User Management",
    //   icon: Users,
    //   description: "Manage system users",
    //   roles: ["admin"] as RoleName[],
    // },
    // {
    //   href: `/account/analytics`,
    //   label: "Analytics",
    //   icon: BarChart,
    //   description: "View system analytics",
    //   roles: ["admin"] as RoleName[],
    // },
    // {
    //   href: `/account/admin-settings`,
    //   label: "Admin Settings",
    //   icon: Shield,
    //   description: "System administration",
    //   roles: ["admin"] as RoleName[],
    // },
  ];

  // Filter menu items based on user role
  const menuItems = getAllMenuItems().filter(item => 
    userRole && item.roles.includes(userRole)
  );

  const isActive = (href: string) => {
    const link = `/${lang}${href}`;
    if (href === `/account`) {
      return pathname === link;
    }
    return pathname.startsWith(link);
  };

  const fullName =
    user?.user_metadata?.first_name + " " + user?.user_metadata?.last_name;

  if (isLoading) {
    return (
      <div className={`w-64 ${className} animate-pulse`}>
        {/* User Profile Skeleton */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center space-x-4">
            <div className="h-12 w-12 bg-gray-200 rounded-full" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-24 bg-gray-200 rounded" />
              <div className="h-3 w-32 bg-gray-200 rounded" />
            </div>
          </div>
        </div>

        {/* Navigation Skeleton */}
        <nav className="bg-white rounded-lg shadow-sm">
          <ul className="space-y-1 p-2">
            {[...Array(5)].map((_, i) => (
              <li key={i}>
                <div className="flex items-center gap-3 px-4 py-3">
                  <div className="h-5 w-5 bg-gray-200 rounded" />
                  <div className="flex-1 space-y-1">
                    <div className="h-4 w-24 bg-gray-200 rounded" />
                    <div className="h-3 w-32 bg-gray-200 rounded" />
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </nav>

        {/* Logout Skeleton */}
        <div className="mt-6 px-4 py-3">
          <div className="h-5 w-24 bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className={`w-64 ${className}`}>
      {/* User Profile Section */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
            {userProfile?.avatar_url ? (
              <img
                src={userProfile?.avatar_url}
                alt={userProfile?.display_name || "Account"}
                className="w-12 h-12 rounded-full object-cover"
                onError={(e) => {
                  console.error(
                    "Avatar failed to load:",
                    userProfile?.avatar_url,
                  );
                  e.currentTarget.style.display = "none";
                }}
              />
            ) : (
              <img
                src={`https://ui-avatars.com/api/?name=${encodeURIComponent(fullName || "User")}&background=7B3FA0&color=fff&size=16`}
                alt={fullName || "Account"}
                className="h-4 w-4 rounded-full object-cover"
              />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {fullName || user?.email || "Guest"}
            </p>
            <p className="text-sm text-gray-500 truncate">{user?.email}</p>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="bg-white rounded-lg shadow-sm">
        <ul className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                    active
                      ? "bg-purple-50 text-purple-700 border-l-4 border-purple-600"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <div className="flex-1">
                    <div className="font-medium">{item.label}</div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      {item.description}
                    </div>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Logout Button */}
      <div className="mt-6">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
        >
          <LogOut className="h-5 w-5" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
}
