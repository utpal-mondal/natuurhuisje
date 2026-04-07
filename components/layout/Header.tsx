"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { User } from "@supabase/supabase-js";
import {
  Menu,
  Search,
  User as UserIcon,
  Calendar,
  Users,
  X,
  MapPin,
  Home,
  Sparkles,
  Heart,
  ChevronDown,
} from "lucide-react";
import { Logo } from "@/components/Logo";
import { SearchDock } from "@/components/SearchDock";
import { useState, useEffect, useRef } from "react";
import { format } from "date-fns";
import { createClient } from "@/utils/supabase/client";
import type { Locale } from "@/i18n/config";
import { switchLanguage } from "@/lib/navigation";
import { getSearchDictionary } from "@/i18n/get-search-dictionary";
import { getRentOutDictionary } from "@/i18n/get-rent-out-dictionary";
import { getHeaderDictionary } from "@/i18n/get-header-dictionary";
import { useSearch } from "@/contexts/SearchContext";

interface HeaderProps {
  user?: User | null;
  lang: Locale;
}

interface Suggestion {
  id: string;
  name: string;
  type: string;
  icon: string;
}

export function Header({ user: propUser, lang }: HeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const dateInputRef = useRef<HTMLInputElement>(null);
  const lightpickRef = useRef<any>(null);
  const supabase = createClient();

  const [locale, setLocale] = useState<Locale>(lang);
  const [user, setUser] = useState<User | null>(propUser || null);
  const [userProfile, setUserProfile] = useState<{
    display_name: string;
    avatar_url?: string;
  } | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [searchT, setSearchT] = useState<any>(null);
  const [rentOutT, setRentOutT] = useState<any>(null);
  const [headerT, setHeaderT] = useState<any>(null);

  useEffect(() => {
    setLocale(lang);
  }, [lang]);

  useEffect(() => {
    const loadSearchTranslations = async () => {
      const translations = await getSearchDictionary(locale);
      setSearchT(translations);
    };
    loadSearchTranslations();
  }, [locale]);

  useEffect(() => {
    const loadRentOutTranslations = async () => {
      const translations = await getRentOutDictionary(locale);
      setRentOutT(translations);
    };
    loadRentOutTranslations();
  }, [locale]);

  useEffect(() => {
    const loadHeaderTranslations = async () => {
      const translations = await getHeaderDictionary(locale);
      setHeaderT(translations);
    };
    loadHeaderTranslations();
  }, [locale]);

  // Fetch user session on mount and when it changes
  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
      console.log("Header - User:", user);

      // Fetch user profile when user is available
      if (user) {
        // First try to get from database
        const { data: profile, error } = await supabase
          .from("users")
          .select("display_name, avatar_url")
          .eq("auth_user_id", user.id)
          .single();

        console.log("Header - Profile query result:", { profile, error });

        if (profile) {
          setUserProfile(profile);
        } else {
          console.log("Header - Using user metadata fallback");
          // Fallback to user metadata
          const firstName = user.user_metadata?.first_name;
          const lastName = user.user_metadata?.last_name;
          const displayName =
            firstName && lastName ? `${firstName} ${lastName}` : "Account";

          setUserProfile({ display_name: displayName });
        }

        // get user role
        const { data: userRole, error: userRoleError } = await supabase
          .from("user_roles")
          .select("role_name")
          .eq("user_id", user.id)
          .single<{ role_name: string }>();

        if (userRoleError) {
          console.error("Header - Error fetching user role:", userRoleError);
        } else if (userRole) {
          console.log("Header - User role:", userRole);
          setUserRole(userRole.role_name);
        }
      } else {
        setUserProfile(null);
      }
    };

    getUser();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      console.log("Header - Auth state change:", session?.user);

      // Fetch profile when auth state changes
      if (session?.user) {
        const fetchProfile = async () => {
          const { data: profile, error } = await supabase
            .from("users")
            .select("display_name, avatar_url")
            .eq("auth_user_id", session.user.id)
            .single();

          console.log("Header - Profile fetched:", { profile, error });

          if (profile) {
            setUserProfile(profile);
          } else {
            console.log("Header - Using user metadata fallback");
            // Fallback to user metadata
            const firstName = session.user.user_metadata?.first_name;
            const lastName = session.user.user_metadata?.last_name;
            const displayName =
              firstName && lastName ? `${firstName} ${lastName}` : "Account";

            setUserProfile({ display_name: displayName });
          }
        };

        fetchProfile();
      } else {
        setUserProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  const [showSearchBar, setShowSearchBar] = useState(false);
  const [showSearchDock, setShowSearchDock] = useState(false);
  const [activeSearchTab, setActiveSearchTab] = useState<
    "where" | "dates" | "people" | null
  >(null);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  // Search suggestions data
  // Use shared search context
  const searchContext = useSearch();
  const location = searchContext.location;
  const setLocation = searchContext.setLocation;
  const guests = searchContext.guests;
  const setGuests = searchContext.setGuests;
  const selectedStartDate = searchContext.selectedStartDate;
  const setSelectedStartDate = searchContext.setSelectedStartDate;
  const selectedEndDate = searchContext.selectedEndDate;
  const setSelectedEndDate = searchContext.setSelectedEndDate;

  const [suggestions, setSuggestions] = useState<{
    locations: Suggestion[];
    categories: Suggestion[];
  }>({
    locations: [],
    categories: [],
  });
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  const languageDropdownRef = useRef<HTMLDivElement>(null);

  // Check if we're on the rent-out or booking page
  const isRentOutPage = pathname?.includes("/rent-out");
  const isBookingPage = pathname?.startsWith(`${locale}/booking`);
  const isConfirmPage = pathname?.includes("/confirm");

  // Check if we should hide the search in header
  const hideHeaderSearch =
    pathname?.includes("/login") ||
    pathname?.includes("/register") ||
    pathname?.includes("/host/edit") ||
    pathname?.includes("/host/new") ||
    pathname?.includes("/account") ||
    pathname?.includes("/auth/callback") ||
    isRentOutPage ||
    isBookingPage;

  const languages = [
    { code: "nl", name: "Nederlands", flag: "/flags/nl.svg" },
    { code: "en", name: "English", flag: "/flags/gb.svg" },
    { code: "de", name: "Deutsch", flag: "/flags/de.svg" },
    { code: "fr", name: "Français", flag: "/flags/fr.svg" },
  ] as const;

  const handleLanguageChange = (newLocale: Locale) => {
    const newPath = switchLanguage(pathname, newLocale);

    // Set cookie for language persistence
    document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000; SameSite=Lax`;

    // Update local state
    setLocale(newLocale);
    setShowLanguageDropdown(false);

    // Use full page reload to ensure all content updates
    window.location.href = newPath;
  };

  useEffect(() => {
    const handleScroll = () => {
      // Desktop search bar (>= 768px)
      if (
        window.scrollY > 500 &&
        window.innerWidth >= 768 &&
        !hideHeaderSearch
      ) {
        setShowSearchBar(true);
      } else {
        setShowSearchBar(false);
        setShowSearchDock(false);
      }

      // Mobile search bar (< 768px)
      if (
        window.scrollY > 100 &&
        window.innerWidth < 768 &&
        !hideHeaderSearch
      ) {
        setShowMobileSearch(true);
      } else if (window.innerWidth < 768) {
        setShowMobileSearch(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    setActiveSearchTab(null);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [hideHeaderSearch]);

  // Prevent body scroll on mobile when activeSearchTab is open
  useEffect(() => {
    if (activeSearchTab && window.innerWidth < 768) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [activeSearchTab]);

  // Listen for custom event to open header search from SearchDock
  useEffect(() => {
    const handleOpenHeaderSearch = (event: any) => {
      const { tab } = event.detail || {};
      setActiveSearchTab(tab || "where");
      setShowSearchDock(true);
      setShowMobileSearch(true);

      // Scroll to top if needed on desktop
      if (window.innerWidth >= 768 && window.scrollY <= 100) {
        window.scrollTo({ top: 101, behavior: "smooth" });
      }
    };

    window.addEventListener(
      "openHeaderSearch",
      handleOpenHeaderSearch as EventListener,
    );
    return () => {
      window.removeEventListener(
        "openHeaderSearch",
        handleOpenHeaderSearch as EventListener,
      );
    };
  }, []);

  // Close language dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        languageDropdownRef.current &&
        !languageDropdownRef.current.contains(event.target as Node)
      ) {
        setShowLanguageDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Generate calendar months
  const generateCalendarMonths = (startMonth: Date, count: number) => {
    const months = [];
    for (let i = 0; i < count; i++) {
      const date = new Date(
        startMonth.getFullYear(),
        startMonth.getMonth() + i,
        1,
      );
      months.push(date);
    }
    return months;
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    return { daysInMonth, startingDayOfWeek };
  };

  const isDateInRange = (date: Date) => {
    if (!selectedStartDate || !selectedEndDate) return false;
    return date >= selectedStartDate && date <= selectedEndDate;
  };

  const handleDateClick = (date: Date) => {
    // Prevent selecting dates before today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (date < today) return;

    if (!selectedStartDate || (selectedStartDate && selectedEndDate)) {
      setSelectedStartDate(date);
      setSelectedEndDate(null);
    } else {
      if (date < selectedStartDate) {
        setSelectedStartDate(date);
        setSelectedEndDate(null);
      } else {
        setSelectedEndDate(date);
      }
    }
  };

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case "map-pin":
        return <MapPin className="h-5 w-5 text-gray-600 shrink-0" />;
      case "home":
        return <Home className="h-5 w-5 text-gray-600 shrink-0" />;
      case "sparkles":
        return <Sparkles className="h-5 w-5 text-gray-600 shrink-0" />;
      case "heart":
        return <Heart className="h-5 w-5 text-gray-600 shrink-0" />;
      default:
        return <MapPin className="h-5 w-5 text-gray-600 shrink-0" />;
    }
  };

  // If on rent-out or booking page, show minimal header
  if (isRentOutPage || isBookingPage) {
    return (
      <header className="w-full fixed top-0 z-50 bg-white border-b border-gray-200">
        {/* Top Banner - Hidden on mobile when scrolled */}
        <div
          className={`w-full bg-white border-b border-gray-200 py-2 transition-all duration-300 ${showMobileSearch ? "hidden md:block" : "block"}`}
        >
          <div className="container-custom">
            <div className="flex items-center justify-center gap-8 text-xs">
              <div className="flex items-center gap-1.5">
                <svg
                  className="w-3.5 h-3.5 text-green-600"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="text-gray-700">
                  {headerT?.topBanner?.nature || "In the middle of nature"}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <svg
                  className="w-3.5 h-3.5 text-green-600"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="text-gray-700">
                  {headerT?.topBanner?.awayFromCrowds || "Away from the crowds"}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <svg
                  className="w-3.5 h-3.5 text-green-600"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="text-gray-700">
                  {headerT?.topBanner?.contributeToNature ||
                    "Contribute to nature projects"}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="container-custom max-w-7xl py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Logo className="h-8" />

            {/* Progress Indicator - Centered - Hidden on mobile */}
            <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 items-center gap-1">
              <span
                className={`text-sm ${isConfirmPage ? "text-gray-400 font-normal" : "text-purple-900 font-medium"}`}
              >
                {isBookingPage
                  ? rentOutT?.steps?.step1 || "1. Booking details"
                  : rentOutT?.steps?.step1 || "1. Property details"}
              </span>
              <span className="text-gray-400 text-sm mx-1">›</span>
              <span
                className={`text-sm ${isConfirmPage ? "text-purple-900 font-medium" : "text-gray-400 font-normal"}`}
              >
                {rentOutT?.steps?.step2 || "2. Confirmation"}
              </span>
            </div>

            {/* Empty space for balance */}
            <div className="w-8"></div>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="w-full fixed top-0 z-50">
      {/* Top Banner - Hidden on mobile when scrolled */}
      <div
        className={`w-full bg-white border-b border-gray-200 py-2 transition-all duration-300 ${showMobileSearch ? "hidden md:block" : "block"}`}
      >
        <div className="container-custom">
          <div className="flex items-center justify-center gap-8 text-xs">
            <div className="flex items-center gap-1.5">
              <svg
                className="w-3.5 h-3.5 text-green-600"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="text-gray-700">
                {headerT?.topBanner?.nature || "In the middle of nature"}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <svg
                className="w-3.5 h-3.5 text-green-600"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="text-gray-700">
                {headerT?.topBanner?.awayFromCrowds || "Away from the crowds"}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <svg
                className="w-3.5 h-3.5 text-green-600"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="text-gray-700">
                {headerT?.topBanner?.contributeToNature ||
                  "Contribute to nature projects"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Hoofd Header */}
      <div className="w-full py-4 bg-white border-b border-black/5 shadow-sm transition-all duration-300">
        <div className="container-custom">
          {/* Mobile Compact Search Bar - Only on mobile when scrolled */}
          {!hideHeaderSearch && showMobileSearch ? (
            <div className="relative">
              <div className="md:hidden flex items-center gap-2">
                <div className="flex-1 flex items-center gap-2 bg-white border border-gray-300 rounded-lg px-3 py-2.5 shadow-sm">
                  <button
                    onClick={() => setActiveSearchTab("where")}
                    className="flex items-center gap-1.5 text-sm"
                  >
                    <Search className="h-4 w-4 text-purple-600" />
                    <span className="text-gray-700 font-medium text-xs truncate">
                      {location || searchT?.searchDock?.whereOrWhat || "Where?"}
                    </span>
                  </button>
                  <div className="h-4 w-px bg-gray-300"></div>
                  <button
                    onClick={() => setActiveSearchTab("dates")}
                    className="flex items-center gap-1.5 text-sm flex-1"
                  >
                    <Calendar className="h-4 w-4 text-purple-600" />
                    <span className="text-gray-700 text-xs truncate">
                      {selectedStartDate && selectedEndDate
                        ? `${format(selectedStartDate, "MMM d")} → ${format(selectedEndDate, "MMM d")}`
                        : selectedStartDate
                          ? `${format(selectedStartDate, "MMM d")} → ?`
                          : searchT?.searchDock?.chooseDates || "Dates"}
                    </span>
                  </button>
                  <div className="h-4 w-px bg-gray-300"></div>
                  <button
                    onClick={() => setActiveSearchTab("people")}
                    className="flex items-center gap-1.5 text-sm"
                  >
                    <Users className="h-4 w-4 text-purple-600" />
                    <span className="text-gray-700 text-xs">
                      {guests > 0 ? guests : "..."}
                    </span>
                  </button>
                </div>
                <button className="bg-teal-500 text-white p-3 rounded-lg hover:bg-teal-600 transition-colors flex-shrink-0">
                  <Search className="h-5 w-5" />
                </button>
              </div>

              {/* Where Dropdown */}
              {activeSearchTab == "where" && (
                <div className="fixed bottom-0 left-0 right-0 bg-white z-50 flex flex-col h-[90vh] rounded-t-2xl shadow-2xl">
                  {/* Header */}
                  <div className="flex items-center justify-between p-4 border-b border-gray-200 flex-shrink-0">
                    <h2 className="text-xl font-semibold text-gray-900">
                      Search where or what
                    </h2>
                    <button
                      onClick={() => setActiveSearchTab(null)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <X className="h-6 w-6 text-gray-600" />
                    </button>
                  </div>

                  {/* Search Input */}
                  <div className="p-4 flex-shrink-0">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type="text"
                        placeholder="For example Amsterdam, Tiny House"
                        className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-900 placeholder:text-gray-400"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        autoFocus
                      />
                    </div>
                  </div>

                  {/* Suggestions List */}
                  <div className="flex-1 overflow-y-auto">
                    <div className="space-y-1">
                      <button
                        onClick={() => {
                          setLocation("Amsterdam (NL)");
                          setActiveSearchTab(null);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-4 hover:bg-gray-50 transition-colors text-left border-b border-gray-100"
                      >
                        <MapPin className="h-5 w-5 text-gray-600" />
                        <span className="text-gray-900 font-medium">
                          Amsterdam (NL)
                        </span>
                      </button>
                      <button
                        onClick={() => {
                          setLocation("Veluwe (NL)");
                          setActiveSearchTab(null);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-4 hover:bg-gray-50 transition-colors text-left border-b border-gray-100"
                      >
                        <MapPin className="h-5 w-5 text-gray-600" />
                        <span className="text-gray-900 font-medium">
                          Veluwe (NL)
                        </span>
                      </button>
                      <button
                        onClick={() => {
                          setLocation("Belgium");
                          setActiveSearchTab(null);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-4 hover:bg-gray-50 transition-colors text-left border-b border-gray-100"
                      >
                        <MapPin className="h-5 w-5 text-gray-600" />
                        <span className="text-gray-900 font-medium">
                          Belgium
                        </span>
                      </button>
                      <button
                        onClick={() => {
                          setLocation("Tiny House");
                          setActiveSearchTab(null);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-4 hover:bg-gray-50 transition-colors text-left border-b border-gray-100"
                      >
                        <Home className="h-5 w-5 text-gray-600" />
                        <span className="text-gray-900 font-medium">
                          Tiny House
                        </span>
                      </button>
                      <button
                        onClick={() => {
                          setLocation("Wellness");
                          setActiveSearchTab(null);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-4 hover:bg-gray-50 transition-colors text-left border-b border-gray-100"
                      >
                        <Home className="h-5 w-5 text-gray-600" />
                        <span className="text-gray-900 font-medium">
                          Wellness
                        </span>
                      </button>
                      <button
                        onClick={() => {
                          setLocation("Romantic overnight stays");
                          setActiveSearchTab(null);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-4 hover:bg-gray-50 transition-colors text-left border-b border-gray-100"
                      >
                        <Heart className="h-5 w-5 text-gray-600" />
                        <span className="text-gray-900 font-medium">
                          Romantic overnight stays
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* Footer with Next Button */}
                  <div className="p-4 border-t border-gray-200">
                    <button
                      onClick={() => setActiveSearchTab("dates")}
                      className="w-full bg-teal-500 hover:bg-teal-600 text-white py-4 rounded-lg font-semibold text-lg transition-colors"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}

              {/* Dates Dropdown */}
              {activeSearchTab === "dates" && (
                <div className="fixed bottom-0 left-0 right-0 bg-white z-50 flex flex-col h-[90vh] rounded-t-2xl shadow-2xl">
                  {/* Header with nights count and close button */}
                  <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <div>
                      <h3 className="text-2xl font-bold text-purple-900">
                        {selectedStartDate && selectedEndDate
                          ? `${Math.ceil((selectedEndDate.getTime() - selectedStartDate.getTime()) / (1000 * 60 * 60 * 24))} nights`
                          : "Select dates"}
                      </h3>
                      {selectedStartDate && selectedEndDate && (
                        <p className="text-sm text-gray-600 mt-1">
                          from {format(selectedStartDate, "EEE d MMM")} to{" "}
                          {format(selectedEndDate, "EEE d MMM")}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => setActiveSearchTab(null)}
                      className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                      <X className="h-6 w-6 text-gray-900" />
                    </button>
                  </div>

                  {/* Calendar Content - Scrollable */}
                  <div className="flex-1 overflow-y-auto px-6 pb-6">
                    {generateCalendarMonths(new Date(), 6).map(
                      (monthDate, idx) => {
                        const { daysInMonth, startingDayOfWeek } =
                          getDaysInMonth(monthDate);
                        const monthName = format(monthDate, "MMMM yyyy");
                        const prevMonthDays =
                          startingDayOfWeek === 0 ? 6 : startingDayOfWeek - 1;
                        const prevMonthDate = new Date(
                          monthDate.getFullYear(),
                          monthDate.getMonth() - 1,
                          0,
                        );
                        const prevMonthLastDay = prevMonthDate.getDate();

                        return (
                          <div key={idx} className="mb-8 first:mt-6">
                            {/* Month Title */}
                            <h4 className="text-center font-semibold text-gray-900 mb-4 text-lg">
                              {monthName}
                            </h4>

                            {/* Day Headers */}
                            <div className="grid grid-cols-7 gap-1 mb-2">
                              {[
                                "mom",
                                "di",
                                "Wed",
                                "do",
                                "Fri",
                                "Sat",
                                "Like this",
                              ].map((day) => (
                                <div
                                  key={day}
                                  className="text-center text-xs font-medium text-gray-600 py-2"
                                >
                                  {day}
                                </div>
                              ))}
                            </div>

                            {/* Calendar Grid */}
                            <div className="grid grid-cols-7 gap-1">
                              {/* Previous month days */}
                              {Array.from({ length: prevMonthDays }).map(
                                (_, i) => (
                                  <div
                                    key={`prev-${i}`}
                                    className="aspect-square flex items-center justify-center text-sm text-gray-400"
                                  >
                                    {prevMonthLastDay - prevMonthDays + i + 1}
                                  </div>
                                ),
                              )}

                              {/* Current month days */}
                              {Array.from({ length: daysInMonth }).map(
                                (_, i) => {
                                  const day = i + 1;
                                  const currentDate = new Date(
                                    monthDate.getFullYear(),
                                    monthDate.getMonth(),
                                    day,
                                  );
                                  const today = new Date();
                                  today.setHours(0, 0, 0, 0);
                                  const isPast = currentDate < today;
                                  const inRange = isDateInRange(currentDate);
                                  const isStart =
                                    selectedStartDate &&
                                    currentDate.getTime() ===
                                      selectedStartDate.getTime();
                                  const isEnd =
                                    selectedEndDate &&
                                    currentDate.getTime() ===
                                      selectedEndDate.getTime();

                                  return (
                                    <button
                                      key={day}
                                      onClick={() =>
                                        handleDateClick(currentDate)
                                      }
                                      disabled={isPast}
                                      className={`aspect-square flex items-center justify-center text-sm font-medium transition-colors
                                    ${isPast ? "text-gray-300 cursor-not-allowed" : ""}
                                    ${!isPast && inRange ? "bg-purple-600 text-white" : ""}
                                    ${!isPast && !inRange ? "text-gray-900 hover:bg-purple-50" : ""}
                                    ${isStart ? "rounded-l-full" : ""}
                                    ${isEnd ? "rounded-r-full" : ""}
                                    ${isStart && !selectedEndDate ? "bg-purple-600 text-white rounded-full" : ""}
                                  `}
                                    >
                                      {day}
                                    </button>
                                  );
                                },
                              )}
                            </div>
                          </div>
                        );
                      },
                    )}

                    {/* Show next months button */}
                    <button className="w-full py-4 border-2 border-gray-300 rounded-lg text-gray-900 font-medium hover:border-gray-400 transition-colors">
                      Show next months
                    </button>
                  </div>

                  {/* Footer with action buttons */}
                  <div className="p-6 border-t border-gray-200 flex items-center justify-between bg-white">
                    <button
                      onClick={() => {
                        setSelectedStartDate(null);
                        setSelectedEndDate(null);
                      }}
                      className="text-blue-600 font-semibold hover:text-blue-700 transition-colors text-lg underline"
                    >
                      Clear dates
                    </button>
                    <button
                      onClick={() => setActiveSearchTab("people")}
                      className="bg-teal-500 hover:bg-teal-600 text-white px-10 py-4 rounded-lg font-semibold transition-colors text-lg"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}

              {/* People Dropdown */}
              {activeSearchTab === "people" && (
                <div className="fixed bottom-0 left-0 right-0 bg-white z-50 flex flex-col h-[90vh] rounded-t-2xl shadow-2xl">
                  <div className="">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-6 pt-6 px-6">
                      <h3 className="text-lg font-semibold text-gray-900">
                        Selecteer aantal personen
                      </h3>
                      <button
                        onClick={() => setActiveSearchTab(null)}
                        className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <X className="h-5 w-5 text-gray-500" />
                      </button>
                    </div>

                    {/* People Options */}
                    <div className="space-y-2 max-h-[65vh] overflow-y-auto">
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((num) => (
                        <button
                          key={num}
                          onClick={() => {
                            setGuests(num);
                            setActiveSearchTab(null);
                          }}
                          className={`w-full flex items-center gap-3 px-4 py-3 transition-colors text-left ${
                            guests === num
                              ? "bg-purple-50 border-b-2 border-purple-600"
                              : "hover:bg-gray-50 border-b-2 border-transparent"
                          }`}
                        >
                          <Users className="h-5 w-5 text-gray-600" />
                          <span className="text-gray-900 font-medium">
                            {num} {num === 1 ? "persoon" : "personen"}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Footer with Search Button */}
                  <div className="p-4 border-t border-gray-200">
                    <button
                      onClick={() => setActiveSearchTab(null)}
                      className="w-full bg-teal-500 hover:bg-teal-600 text-white py-4 rounded-lg font-semibold text-lg transition-colors"
                    >
                      Search
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : null}

          {/* Normal Header Layout */}
          <div
            className={`flex justify-between items-center ${showMobileSearch ? "hidden md:flex" : "flex"}`}
          >
            <Logo size="md" />

            {/* Zoekbalk - Wordt getoond bij scrollen */}
            {!hideHeaderSearch && (
              <div
                className={`hidden md:flex items-center transition-all duration-300 ${showSearchBar ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2 pointer-events-none"}`}
              >
                {!showSearchDock ? (
                  <div className="flex items-center bg-blue-50 rounded-xl overflow-hidden shadow-sm">
                    {/* Waar/Wat Input */}
                    <button
                      onClick={() => {
                        setActiveSearchTab("where");
                        setShowSearchDock(true);
                      }}
                      className="flex items-center gap-2 px-5 py-3 bg-white rounded-l-xl hover:bg-gray-50 transition-colors"
                    >
                      <MapPin className="h-5 w-5 text-gray-500" />
                      <span className="text-sm text-gray-700">
                        {location ||
                          searchT?.searchDock?.whereOrWhat ||
                          "Waar of wat?"}
                      </span>
                    </button>

                    {/* Datum Picker */}
                    <button
                      onClick={() => {
                        setActiveSearchTab("dates");
                        setShowSearchDock(true);
                      }}
                      className="flex items-center gap-2 px-5 py-3 bg-white ml-px hover:bg-gray-50 transition-colors"
                    >
                      <Calendar className="h-5 w-5 text-gray-500" />
                      <span className="text-sm text-gray-700">
                        {selectedStartDate && selectedEndDate
                          ? `${format(selectedStartDate, "dd MMM")} - ${format(selectedEndDate, "dd MMM")}`
                          : searchT?.searchDock?.chooseDates || "Kies datums"}
                      </span>
                    </button>

                    {/* Gasten */}
                    <button
                      onClick={() => {
                        setActiveSearchTab("people");
                        setShowSearchDock(true);
                      }}
                      className="flex items-center gap-2 px-5 py-3 bg-white ml-px hover:bg-gray-50 transition-colors"
                    >
                      <Users className="h-5 w-5 text-gray-500" />
                      <span className="text-sm text-gray-700">
                        {guests > 0
                          ? `${guests} ${guests === 1 ? searchT?.searchDock?.guest || "persoon" : searchT?.searchDock?.guests || "personen"}`
                          : searchT?.searchDock?.guests || "personen"}
                      </span>
                    </button>

                    {/* Zoek Knop */}
                    <button
                      onClick={() => setShowSearchDock(true)}
                      className="bg-teal-500 text-white px-6 py-3 rounded-r-xl ml-px flex items-center justify-center hover:bg-teal-600 transition-colors"
                    >
                      <Search className="h-5 w-5" />
                    </button>
                  </div>
                ) : (
                  <div className="w-full max-w-3xl">
                    <SearchDock
                      variant="compact"
                      maxWidth="max-w-3xl"
                      initialTab={activeSearchTab}
                      lang={locale}
                    />
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center gap-4">
              {/* Heart Icon */}
              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <Heart className="h-5 w-5 text-gray-700" />
              </button>

              {/* Language Selector */}
              {/* <div className="relative" ref={languageDropdownRef}> */}
              {/* <button
                  onClick={() => setShowLanguageDropdown(!showLanguageDropdown)}
                  className="flex items-center gap-1.5 hover:bg-gray-100 px-2 py-1.5 rounded-lg transition-colors"
                >
                  <img
                    src={
                      languages.find((l) => l.code === locale)?.flag ||
                      "/flags/gb.svg"
                    }
                    alt={locale?.toUpperCase() || "EN"}
                    className="w-5 h-5 object-cover rounded-full"
                  />
                  <span className="text-sm font-medium text-gray-900">
                    {locale?.toUpperCase() || "EN"}
                  </span>
                  <ChevronDown className="h-3.5 w-3.5 text-gray-600" />
                </button> */}

              {/* Language Dropdown */}
              {/* {showLanguageDropdown && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                    {languages.map((language) => (
                      <button
                        key={language.code}
                        onClick={() => handleLanguageChange(language.code)}
                        className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors ${
                          locale === language.code ? "bg-purple-50" : ""
                        }`}
                      >
                        <img
                          src={language.flag}
                          alt={language.code}
                          className="w-6 h-6 object-cover rounded-full"
                        />
                        <span className="text-sm font-medium text-gray-900">
                          {language.name} ({language.code.toUpperCase()})
                        </span>
                      </button>
                    ))}
                  </div>
                )} */}
              {/* </div> */}

              {/* Rent out and To register buttons / User Account */}
              {!user ? (
                <>
                  <Link
                    href={`/${locale}/rent-out`}
                    className="text-sm font-medium px-4 py-2 rounded-lg text-gray-900 hover:bg-gray-100 transition-colors"
                  >
                    Rent out
                  </Link>
                  <Link
                    href={`/${locale}/login`}
                    className="text-sm font-medium px-4 py-2 rounded-lg text-gray-900 hover:bg-gray-100 transition-colors"
                  >
                    To register
                  </Link>
                </>
              ) : (
                <Link
                  href={`${userRole === "admin" ? `/${locale}/admin/dashboard` : `/${locale}/account`}`}
                  className="flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-lg text-white transition-all hover:shadow-md"
                  style={{
                    background: "linear-gradient(135deg, #7B3FA0, #5B2D8E)",
                  }}
                >
                  {userProfile?.avatar_url ? (
                    <img
                      src={userProfile.avatar_url}
                      alt={userProfile?.display_name || "Account"}
                      className="h-4 w-4 rounded-full object-cover"
                      onError={(e) => {
                        console.error(
                          "Avatar failed to load:",
                          userProfile.avatar_url,
                        );
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  ) : (
                    <img
                      src={`https://ui-avatars.com/api/?name=${encodeURIComponent(userProfile?.display_name || "User")}&background=7B3FA0&color=fff&size=16`}
                      alt={userProfile?.display_name || "Account"}
                      className="h-4 w-4 rounded-full object-cover"
                    />
                  )}
                  <span className="hidden md:inline">
                    {userProfile?.display_name || "Account"}
                  </span>
                  <span className="md:hidden">
                    {userProfile?.display_name?.split(" ")[0] || "Account"}
                  </span>
                </Link>
              )}

              <button className="p-2.5 rounded-xl hover:bg-gray-100 md:hidden transition-colors">
                <Menu className="h-5 w-5 text-gray-600" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
