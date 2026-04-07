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
  Menu,
  X,
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { getUserRole, type RoleName } from "@/lib/roles";
import { Logo } from "./Logo";

interface AdminSidebarProps {
  lang: string;
  className?: string;
}

interface AdminMenuItem {
  href: string;
  label: string;
  icon: typeof Home;
  description: string;
  roles: RoleName[];
  section?: string;
}

export default function AdminSidebar({
  lang,
  className = "",
}: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<RoleName | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isSidebarLoading, setIsSidebarLoading] = useState(true);

  useEffect(() => {
    const getUser = async () => {
      const supabase = createClient();
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        setUser(user);
        if (!user) {
          setIsSidebarLoading(false);
        }
      } finally {
        // role fetch will end loading for authenticated users
      }
    };

    getUser();
  }, []);

  useEffect(() => {
    if (user !== null) {
      // Get user role
      const fetchUserRole = async () => {
        try {
          const role = await getUserRole(user.id);
          setUserRole(role);
        } finally {
          setIsSidebarLoading(false);
        }
      };

      fetchUserRole();
    }
  }, [user]);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push(`/${lang}/admin/login`);
  };

  // Role-based menu items
  const getAllMenuItems = (): AdminMenuItem[] => [
      // Basic items for all users
      {
        href: `/admin/dashboard`,
        label: "Dashboard",
        icon: Home,
        description: "Overview of your account",
        roles: ["user", "landlord", "admin"] as RoleName[],
      },
      {
        href: `/admin/profile`,
        label: "Profile",
        icon: User,
        description: "Manage your personal information",
        roles: ["user", "landlord", "admin"] as RoleName[],
      },
      {
        href: `/admin/change-password`,
        label: "Password change",
        icon: Settings,
        description: "Change your password",
        roles: ["user", "landlord", "admin"] as RoleName[],
      },
      {
        href: `/admin/bookings`,
        label: "My Bookings",
        icon: Calendar,
        description: "View your booking history",
        roles: ["user", "landlord", "admin"] as RoleName[],
      },
      // Landlord specific items
      {
        href: `/admin/host-bookings`,
        label: "Booking Management",
        icon: Grid,
        description: "Manage property bookings",
        roles: ["landlord", "admin"] as RoleName[],
      },
      {
        href: `/admin/listings`,
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
      //   href: `/admin/special-pricing`,
      //   label: "Special Pricing",
      //   icon: DollarSign,
      //   description: "Manage seasonal pricing",
      //   roles: ["landlord", "admin"] as RoleName[],
      // },
      // Admin specific items
      // {
      //   href: `/admin/users`,
      //   label: "User Management",
      //   icon: Users,
      //   description: "Manage system users",
      //   roles: ["admin"] as RoleName[],
      // },
      // {
      //   href: `/admin/analytics`,
      //   label: "Analytics",
      //   icon: BarChart,
      //   description: "View system analytics",
      //   roles: ["admin"] as RoleName[],
      // },
      // {
      //   href: `/admin/admin-settings`,
      //   label: "Admin Settings",
      //   icon: Shield,
      //   description: "System administration",
      //   roles: ["admin"] as RoleName[],
      // },
    ];

  // Filter menu items based on user role
  const menuItems = getAllMenuItems().filter(
    (item) => userRole && item.roles.includes(userRole),
  );

  const normalizedPathname = pathname.replace(new RegExp(`^/${lang}(?=/|$)`), "") || "/";

  const isActive = (href: string) => {
    if (href === "/admin/dashboard") {
      return normalizedPathname === href;
    }
    return normalizedPathname === href || normalizedPathname.startsWith(`${href}/`);
  };

  const groupedMenuItems = menuItems.reduce(
    (groups, item) => {
      const section = item.section || "MAIN MENU";
      groups[section] = groups[section] || [];
      groups[section].push(item);
      return groups;
    },
    {} as Record<string, AdminMenuItem[]>,
  );

  return (
    <div
      className={`${isCollapsed ? "w-[88px]" : "w-[280px]"} ${className} sticky top-0 hidden min-h-screen shrink-0 border-r border-slate-200 bg-white transition-all duration-300 ease-in-out lg:block`}
    >
      {/* Toggle Button */}
      <div className="flex items-center justify-between border-b border-slate-200 px-5 py-6">
        {!isCollapsed && (
          <div className="min-w-0">
            <Logo size="sm" className="items-center" />
          </div>
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
        >
          {isCollapsed ? (
            <Menu className="h-5 w-5" />
          ) : (
            <X className="h-5 w-5" />
          )}
        </button>
      </div>

      {/* Navigation Menu */}
      <nav className={`${isCollapsed ? "px-3 py-5" : "px-4 py-6"} flex-1 space-y-6 overflow-y-auto`}>
        {isSidebarLoading ? (
          <div className="space-y-3 animate-pulse">
            {!isCollapsed && <div className="h-3 w-24 rounded bg-slate-200" />}
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={`sidebar-skeleton-${index}`}
                className={`flex items-center ${isCollapsed ? "justify-center" : "gap-3"} rounded-2xl px-3.5 py-3`}
              >
                <div className="h-5 w-5 shrink-0 rounded bg-slate-200" />
                {!isCollapsed && <div className="h-3 w-24 rounded bg-slate-200" />}
              </div>
            ))}
          </div>
        ) : (
          Object.entries(groupedMenuItems).map(([section, items]) => (
            <div key={section} className="space-y-2">
              {!isCollapsed && (
                <p className="px-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                  {section}
                </p>
              )}
              <ul className="space-y-1.5">
                {items.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.href);

                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className={`flex items-center ${isCollapsed ? "justify-center px-2.5" : "gap-3 px-3.5"} rounded-2xl py-3 text-sm font-medium transition-all ${
                          active
                            ? "bg-[#5b2d8e] text-white shadow-sm"
                            : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                        }`}
                        title={isCollapsed ? item.label : undefined}
                      >
                        <Icon className="h-5 w-5 shrink-0" />
                        {!isCollapsed && (
                          <div className="min-w-0 flex-1">
                            <div className="truncate font-medium">{item.label}</div>
                          </div>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))
        )}
      </nav>

      {/* Logout Button */}
      <div className={`border-t border-slate-200 p-4 ${isCollapsed ? "pt-4" : "pt-5"}`}>
        <button
          onClick={handleLogout}
          className={`w-full flex items-center ${isCollapsed ? "justify-center" : "gap-3"} rounded-2xl px-3.5 py-3 text-sm font-medium text-rose-600 transition-colors hover:bg-rose-50`}
          title={isCollapsed ? "Sign Out" : undefined}
        >
          <LogOut className="h-5 w-5" />
          {!isCollapsed && <span>Sign Out</span>}
        </button>
      </div>
    </div>
  );
}
