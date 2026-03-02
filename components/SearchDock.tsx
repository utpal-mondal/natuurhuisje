"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  Calendar as CalendarIcon,
  Search,
  Users,
  MapPin,
  Home,
  Sparkles,
  Heart,
  X,
} from "lucide-react";
import { format } from "date-fns";
import type { Locale } from '@/i18n/config';
import { getSearchDictionary } from '@/i18n/get-search-dictionary';
import { useSearch } from '@/contexts/SearchContext';

interface SearchDockProps {
  variant?: "hero" | "compact";
  className?: string;
  defaultLocation?: string;
  defaultGuests?: number;
  defaultPets?: boolean;
  defaultDateRange?: { from: Date; to: Date };
  maxWidth?: string;
  height?: string;
  initialTab?: "where" | "dates" | "people" | null;
  lang?: Locale;
}

interface Suggestion {
  id: string;
  name: string;
  type: string;
  icon: string;
}

export function SearchDock({
  variant = "hero",
  className = "",
  defaultLocation = "",
  defaultGuests = 2,
  defaultPets = false,
  defaultDateRange,
  maxWidth = "max-w-full",
  height = "py-3",
  initialTab = null,
  lang,
}: SearchDockProps) {
  const router = useRouter();
  const params = useParams();
  const currentLang = (lang || params?.lang || 'nl') as Locale;
  const dropdownRef = useRef<HTMLDivElement>(null);
  const dateInputRef = useRef<HTMLInputElement>(null);
  const lightpickRef = useRef<any>(null);
  const [t, setT] = useState<any>(null);

  // Use shared search context
  const searchContext = useSearch();
  const location = searchContext.location;
  const setLocation = searchContext.setLocation;
  const guests = searchContext.guests;
  const setGuests = searchContext.setGuests;
  const pets = searchContext.pets;
  const setPets = searchContext.setPets;
  const selectedStartDate = searchContext.selectedStartDate;
  const setSelectedStartDate = searchContext.setSelectedStartDate;
  const selectedEndDate = searchContext.selectedEndDate;
  const setSelectedEndDate = searchContext.setSelectedEndDate;

  const [activeTab, setActiveTab] = useState<
    "where" | "dates" | "people" | null
  >(initialTab);

  // Initialize with defaults if provided
  useEffect(() => {
    if (defaultLocation && !location) setLocation(defaultLocation);
    if (defaultGuests && guests === 2) setGuests(defaultGuests);
    if (defaultPets && !pets) setPets(defaultPets);
    if (defaultDateRange?.from && !selectedStartDate) setSelectedStartDate(defaultDateRange.from);
    if (defaultDateRange?.to && !selectedEndDate) setSelectedEndDate(defaultDateRange.to);
  }, []);

  useEffect(() => {
    const loadTranslations = async () => {
      const translations = await getSearchDictionary(currentLang);
      setT(translations);
    };
    loadTranslations();
  }, [currentLang]);

  // Set moment.js locale globally when language changes
  useEffect(() => {
    if (typeof window !== "undefined" && (window as any).moment) {
      const moment = (window as any).moment;
      moment.locale(currentLang);
    }
  }, [currentLang]);

  // Load Lightpick CSS and moment.js with locales
  useEffect(() => {
    // Add Lightpick CSS
    const lightpickCSS = document.createElement("link");
    lightpickCSS.rel = "stylesheet";
    lightpickCSS.href =
      "https://cdn.jsdelivr.net/npm/lightpick@1.6.2/css/lightpick.min.css";
    document.head.appendChild(lightpickCSS);

    // Add moment.js script with locales
    const momentScript = document.createElement("script");
    momentScript.src =
      "https://cdnjs.cloudflare.com/ajax/libs/moment.js/2.29.4/moment-with-locales.min.js";
    document.head.appendChild(momentScript);

    return () => {
      if (document.head.contains(lightpickCSS)) {
        document.head.removeChild(lightpickCSS);
      }
      if (document.head.contains(momentScript)) {
        document.head.removeChild(momentScript);
      }
    };
  }, []);

  // Initialize Lightpick when dates tab is active
  useEffect(() => {
    if (!dateInputRef.current || activeTab !== "dates") return;

    // Wait for moment.js to load
    const initLightpick = () => {
      if (typeof window === "undefined" || !(window as any).moment) {
        setTimeout(initLightpick, 100);
        return;
      }

      import("lightpick")
        .then((LightpickModule) => {
          const Lightpick = LightpickModule.default;

          // Destroy existing instance
          if (lightpickRef.current) {
            lightpickRef.current.destroy();
            lightpickRef.current = null;
          }

          if (!dateInputRef.current) return;

          // Create new Lightpick instance
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          
          // Set moment locale based on language
          const moment = (window as any).moment;
          if (moment) {
            console.log('SearchDock - Setting moment.js locale to:', currentLang);
            const result = moment.locale(currentLang);
            console.log('SearchDock - Moment.js locale set to:', result);
            console.log('SearchDock - Current moment locale:', moment.locale());
          } else {
            console.error('SearchDock - Moment.js not loaded!');
          }
          
          lightpickRef.current = new Lightpick({
            field: dateInputRef.current,
            singleDate: false,
            numberOfMonths: 2,
            numberOfColumns: 2,
            footer: true,
            inline: true,
            lang: currentLang,
            minDate: today,
            onSelect: function (start: any, end: any) {
              if (start) {
                setSelectedStartDate(start.toDate());
              }
              if (end) {
                setSelectedEndDate(end.toDate());
              }
            },
            onClose: function () {
              setActiveTab(null);
            },
          });

          // Set initial dates if they exist
          if (selectedStartDate && lightpickRef.current) {
            lightpickRef.current.setStartDate(selectedStartDate);
          }
          if (selectedEndDate && lightpickRef.current) {
            lightpickRef.current.setEndDate(selectedEndDate);
          }
        })
        .catch((error) => {
          console.error("Failed to load Lightpick:", error);
        });
    };

    initLightpick();

    return () => {
      if (lightpickRef.current) {
        lightpickRef.current.destroy();
        lightpickRef.current = null;
      }
    };
  }, [activeTab, currentLang, t]);

  // Search suggestions data
  const [suggestions, setSuggestions] = useState<{
    locations: Suggestion[];
    categories: Suggestion[];
  }>({
    locations: [],
    categories: [],
  });

  // Load search options from JSON
  useEffect(() => {
    fetch("/data/search-options.json")
      .then((response) => {
        return response.json();
      })
      .then((data) => {
        setSuggestions({
          locations: data.locations || [],
          categories: data.categories || [],
        });
        console.log("Suggestions set:", {
          locations: data.locations?.length,
          categories: data.categories?.length,
        });
      })
      .catch((error) => {
        console.error("Error loading search options:", error);
      });
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setActiveTab(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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

  const handleSearch = () => {
    const searchParams = new URLSearchParams();

    if (location) {
      searchParams.set("location", location);
    }

    if (selectedStartDate) {
      searchParams.set("checkin", format(selectedStartDate, "yyyy-MM-dd"));
    }

    if (selectedEndDate) {
      searchParams.set("checkout", format(selectedEndDate, "yyyy-MM-dd"));
    }

    if (guests > 0) {
      searchParams.set("guests", guests.toString());
    }

    if (pets) {
      searchParams.set("pets", "true");
    }

    router.push(`/${currentLang}/search?${searchParams.toString()}`);
  };

  if (!t || !t.searchDock) {
    return null;
  }

  return (
    <div
      className={`relative w-full ${maxWidth} mx-auto ${className} z-50`}
      ref={dropdownRef}
    >
      {/* Tabbed Search Bar */}
      <div className="relative bg-white rounded-xl shadow-md overflow-visible z-50">
        <div className="grid md:flex items-center overflow-hidden rounded-xl">
          {/* Where or what Tab */}
          <button
            onClick={() => {
              if (window.innerWidth < 768) {
                // On mobile, scroll down first if needed
                if (window.scrollY <= 100) {
                  window.scrollTo({ top: 101, behavior: 'smooth' });
                  // Wait for scroll to complete, then open modal
                  setTimeout(() => {
                    window.dispatchEvent(new CustomEvent('openHeaderSearch', { detail: { tab: 'where' } }));
                  }, 300);
                } else {
                  // Already scrolled, open modal immediately
                  window.dispatchEvent(new CustomEvent('openHeaderSearch', { detail: { tab: 'where' } }));
                }
              } else {
                // On desktop, use normal dropdown
                setActiveTab(activeTab === "where" ? null : "where");
              }
            }}
            className={`relative flex items-center gap-2.5 px-6 ${height} flex-1 transition-colors rounded-l-xl ${
              activeTab === "where"
                ? "bg-purple-600 text-white"
                : "bg-white text-gray-900 hover:bg-gray-50"
            }`}
          >
            <Search
              className={`h-5 w-5 shrink-0 ${activeTab === "where" ? "text-white" : "text-gray-500"}`}
            />
            <span
              className={`font-medium text-[15px] ${activeTab === "where" ? "text-white" : "text-gray-900"}`}
            >
              {location || t.searchDock.whereOrWhat}
            </span>
            {location.length > 0 && (
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  setLocation("");
                }}
                className={`absolute right-0 top-1/2 -translate-y-1/2 p-1 rounded-lg transition-colors cursor-pointer ${activeTab === "where" ? "text-white" : "text-gray-500 hover:bg-gray-100"}`}
              >
                <X className="h-5 w-5" />
              </div>
            )}
          </button>

          {/* Choose dates Tab */}
          <button
            onClick={() => {
              if (window.innerWidth < 768) {
                // On mobile, scroll down first if needed
                if (window.scrollY <= 100) {
                  window.scrollTo({ top: 101, behavior: 'smooth' });
                  // Wait for scroll to complete, then open modal
                  setTimeout(() => {
                    window.dispatchEvent(new CustomEvent('openHeaderSearch', { detail: { tab: 'dates' } }));
                  }, 300);
                } else {
                  // Already scrolled, open modal immediately
                  window.dispatchEvent(new CustomEvent('openHeaderSearch', { detail: { tab: 'dates' } }));
                }
              } else {
                // On desktop, use normal dropdown
                setActiveTab(activeTab === "dates" ? null : "dates");
              }
            }}
            className={`relative flex items-center gap-2.5 px-6 ${height} border-b border-t md:border-b-0 md:border-t-0 border-l border-gray-200 transition-colors ${
              activeTab === "dates"
                ? "bg-purple-600 text-white"
                : "bg-white text-gray-900 hover:bg-gray-50"
            }`}
          >
            <CalendarIcon
              className={`h-5 w-5 shrink-0 ${activeTab === "dates" ? "text-white" : "text-gray-500"}`}
            />
            <span
              className={`text-[15px] whitespace-nowrap ${activeTab === "dates" ? "text-white" : "text-gray-900"}`}
            >
              {selectedStartDate && selectedEndDate
                ? `${format(selectedStartDate, "MMMM d")} → ${format(selectedEndDate, "MMMM d")}`
                : selectedStartDate
                  ? `${format(selectedStartDate, "MMMM d")} → ?`
                  : t.searchDock.chooseDates}
            </span>
            {selectedStartDate && selectedEndDate && (
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedStartDate(null);
                  setSelectedEndDate(null);
                }}
                className={`absolute right-0 top-1/2 -translate-y-1/2 p-1 rounded-lg transition-colors cursor-pointer ${activeTab === "dates" ? "text-white" : "text-gray-500 hover:bg-gray-100"}`}
              >
                <X className="h-5 w-5" />
              </span>
            )}
          </button>

          {/* People Tab */}
          <button
            onClick={() => {
              if (window.innerWidth < 768) {
                // On mobile, scroll down first if needed
                if (window.scrollY <= 100) {
                  window.scrollTo({ top: 101, behavior: 'smooth' });
                  // Wait for scroll to complete, then open modal
                  setTimeout(() => {
                    window.dispatchEvent(new CustomEvent('openHeaderSearch', { detail: { tab: 'people' } }));
                  }, 300);
                } else {
                  // Already scrolled, open modal immediately
                  window.dispatchEvent(new CustomEvent('openHeaderSearch', { detail: { tab: 'people' } }));
                }
              } else {
                // On desktop, use normal dropdown
                setActiveTab(activeTab === "people" ? null : "people");
              }
            }}
            className={`flex items-center gap-2.5 px-6 ${height} border-l border-gray-200 transition-colors ${
              activeTab === "people"
                ? "bg-purple-600 text-white"
                : "bg-white text-gray-900 hover:bg-gray-50"
            }`}
          >
            <Users
              className={`h-5 w-5 shrink-0 ${activeTab === "people" ? "text-white" : "text-gray-500"}`}
            />
            <span
              className={`text-[15px] whitespace-nowrap ${activeTab === "people" ? "text-white" : "text-gray-900"}`}
            >
              {guests > 0
                ? `${guests} ${guests === 1 ? t.searchDock.person : t.searchDock.persons}`
                : t.searchDock.people}
            </span>
          </button>

          {/* Search Button */}
          <div className={`px-4 ${height}`}>
            <button
              onClick={handleSearch}
              className="px-8 py-3 rounded-lg text-white font-semibold text-[15px] transition-all hover:shadow-lg whitespace-nowrap"
              style={{ background: "#10b981" }}
            >
              {t.searchDock.search}
            </button>
          </div>
        </div>

        {/* Where Dropdown */}
        {activeTab === "where" && (
          <div className="absolute top-full left-0 mt-2 bg-white rounded-xl shadow-2xl border border-gray-200 animate-in fade-in slide-in-from-top-2 duration-200 w-[500px] z-50 max-h-[500px] overflow-y-auto">
            <div className="">
              {/* Header */}
              <div className="flex items-center justify-between mb-4 px-6 pt-6">
                <h3 className="text-lg font-semibold text-gray-900">
                  {t.searchDock.whereModal.title}
                </h3>
                <button
                  onClick={() => setActiveTab(null)}
                  className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>

              {/* Search Input */}
              <div className="relative mb-6 px-6">
                <Search className="absolute left-10 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder={t.searchDock.whereModal.placeholder}
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 placeholder:text-gray-400"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
                {location.length > 0 && (
                  <button
                    onClick={() => setLocation("")}
                    className="absolute right-10 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X className="h-5 w-5 text-gray-500" />
                  </button>
                )}
              </div>

              {/* Suggestions */}
              <div className="space-y-1 max-h-[300px] overflow-y-auto">
                {suggestions.locations.length === 0 &&
                suggestions.categories.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    {t.searchDock.whereModal.loading}
                  </div>
                ) : (
                  <>
                    {/* Filtered Location Suggestions */}
                    {suggestions.locations
                      .slice(0, 3)
                      .filter(
                        (item) =>
                          location === "" ||
                          item.name
                            .toLowerCase()
                            .includes(location.toLowerCase()),
                      )
                      .map((item) => (
                        <button
                          key={item.id}
                          onClick={() => {
                            setLocation(item.name);
                            setActiveTab(null);
                          }}
                          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 rounded-lg transition-colors text-left"
                        >
                          <MapPin className="h-5 w-5 text-gray-600 shrink-0" />
                          <span className="text-gray-900 font-medium">
                            {item.name}
                          </span>
                        </button>
                      ))}

                    {/* Filtered Category Suggestions */}
                    {suggestions.categories
                      .slice(0, 2)
                      .filter(
                        (item) =>
                          location === "" ||
                          item.name
                            .toLowerCase()
                            .includes(location.toLowerCase()),
                      )
                      .map((item) => (
                        <button
                          key={item.id}
                          onClick={() => {
                            setLocation(item.name);
                            setActiveTab(null);
                          }}
                          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 rounded-lg transition-colors text-left"
                        >
                          {getIcon(item.icon)}
                          <span className="text-gray-900 font-medium">
                            {item.name}
                          </span>
                        </button>
                      ))}

                    {/* No results message */}
                    {suggestions.locations.filter(
                      (item) =>
                        location === "" ||
                        item.name
                          .toLowerCase()
                          .includes(location.toLowerCase()),
                    ).length === 0 &&
                      suggestions.categories.filter(
                        (item) =>
                          location === "" ||
                          item.name
                            .toLowerCase()
                            .includes(location.toLowerCase()),
                      ).length === 0 &&
                      location !== "" && (
                        <div className="text-center py-8 text-gray-500">
                          Geen resultaten gevonden voor "{location}"
                        </div>
                      )}
                  </>
                )}
              </div>

              {/* View All Link */}
              {/* <div className="mt-4 pt-4 border-t border-gray-200">
                <button className="text-purple-600 font-semibold hover:text-purple-700 transition-colors flex items-center gap-2">
                  Bekijk alles
                  <span className="text-xl">→</span>
                </button>
              </div> */}
            </div>
          </div>
        )}

        {/* Dates Dropdown */}
        {activeTab === "dates" && (
          <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 bg-white rounded-xl shadow-2xl border border-gray-200 animate-in fade-in slide-in-from-top-2 duration-200 w-[800px] z-50">
            <div className="p-6">
              <div className="w-full flex justify-between relative">
                <div>
                  {/* Header */}
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {t.searchDock.datesModal.title}
                    </h3>
                  </div>

                  {/* Subtitle */}
                  <p className="text-sm text-gray-600 mb-4">
                    {t.searchDock.datesModal.subtitle}
                  </p>
                </div>

                {/* Date Selection Buttons */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t.searchDock.datesModal.arrival}
                    </label>
                    <button
                      className={`w-full px-4 py-3 rounded-lg border-2 text-left transition-colors ${
                        selectedStartDate
                          ? "bg-purple-600 text-white border-purple-600"
                          : "bg-white text-gray-400 border-gray-300 hover:border-purple-400"
                      }`}
                    >
                      {selectedStartDate
                        ? format(selectedStartDate, "dd/MM/yyyy")
                        : t.searchDock.datesModal.selectDate}
                    </button>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t.searchDock.datesModal.departure}
                    </label>
                    <button
                      className={`w-full px-4 py-3 rounded-lg border-2 text-left transition-colors ${
                        selectedEndDate
                          ? "bg-white text-gray-900 border-gray-300"
                          : "bg-white text-gray-400 border-gray-300 hover:border-purple-400"
                      }`}
                    >
                      {selectedEndDate
                        ? format(selectedEndDate, "dd/MM/yyyy")
                        : t.searchDock.datesModal.selectDate}
                    </button>
                  </div>
                </div>

                <div className="absolute top-0 right-0">
                  <button
                    onClick={() => setActiveTab(null)}
                    className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X className="h-5 w-5 text-gray-500" />
                  </button>
                </div>
              </div>

              {/* Hidden input for Lightpick */}
              <input
                ref={dateInputRef}
                type="text"
                className="hidden"
                readOnly
              />
            </div>
          </div>
        )}

        {/* People Dropdown */}
        {activeTab === "people" && (
          <div className="absolute top-full right-0 mt-2 bg-white rounded-xl shadow-2xl border border-gray-200 animate-in fade-in slide-in-from-top-2 duration-200 w-[400px] z-50 max-h-[500px] overflow-y-auto">
            <div className="">
              {/* Header */}
              <div className="flex items-center justify-between mb-6 pt-6 px-6">
                <h3 className="text-lg font-semibold text-gray-900">
                  {t.searchDock.peopleModal.title}
                </h3>
                <button
                  onClick={() => setActiveTab(null)}
                  className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>

              {/* People Options */}
              <div className="space-y-2 max-h-[350px] overflow-y-auto">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((num) => (
                  <button
                    key={num}
                    onClick={() => {
                      setGuests(num);
                      setActiveTab(null);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 transition-colors text-left ${
                      guests === num
                        ? "bg-purple-50 border-b-2 border-purple-600"
                        : "hover:bg-gray-50 border-b-2 border-transparent"
                    }`}
                  >
                    <Users className="h-5 w-5 text-gray-600 shrink-0" />
                    <span className="text-gray-900 font-medium">
                      {num} {num === 1 ? "persoon" : "personen"}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
