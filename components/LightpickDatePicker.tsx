"use client";

import { useState, useEffect, useRef } from 'react';
import { format } from 'date-fns';
import { X } from 'lucide-react';
import type { Locale } from '@/i18n/config';
import { getCalendarDictionary } from '@/i18n/get-calendar-dictionary';

interface LightpickDatePickerProps {
  checkIn: string;
  checkOut: string;
  onCheckInChange: (date: string) => void;
  onCheckOutChange: (date: string) => void;
  checkInLabel?: string;
  checkOutLabel?: string;
  onClose?: () => void;
  positionClass?: string;
  lang?: Locale;
}

export function LightpickDatePicker({
  checkIn,
  checkOut,
  onCheckInChange,
  onCheckOutChange,
  checkInLabel,
  checkOutLabel,
  onClose,
  positionClass,
  lang = 'nl'
}: LightpickDatePickerProps) {
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedStartDate, setSelectedStartDate] = useState<Date | null>(
    checkIn ? new Date(checkIn) : null
  );
  const [selectedEndDate, setSelectedEndDate] = useState<Date | null>(
    checkOut ? new Date(checkOut) : null
  );
  const dateInputRef = useRef<HTMLInputElement>(null);
  const lightpickRef = useRef<any>(null);
  const calendarRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [dynamicPosition, setDynamicPosition] = useState<string>('');
  const [t, setT] = useState<any>(null);

  // Load translations
  useEffect(() => {
    const loadTranslations = async () => {
      console.log('LightpickDatePicker - Loading translations for language:', lang);
      const translations = await getCalendarDictionary(lang);
      console.log('LightpickDatePicker - Translations loaded:', translations);
      setT(translations);
    };
    loadTranslations();
  }, [lang]);

  // Detect screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Calculate dynamic position when calendar opens
  useEffect(() => {
    if (!showCalendar || !containerRef.current || isMobile) {
      setDynamicPosition('');
      return;
    }

    const calculatePosition = () => {
      const container = containerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const calendarWidth = 800; // Desktop calendar width
      const padding = 20; // Minimum padding from edges

      // Check if centered position would overflow
      const centeredLeft = rect.left + (rect.width / 2) - (calendarWidth / 2);
      const centeredRight = centeredLeft + calendarWidth;

      let position = '';

      // Only set position if there's overflow, otherwise leave empty to use default centered
      if (centeredRight > viewportWidth - padding) {
        // Calendar would overflow on the right
        position = 'right-0 left-auto !-translate-x-0';
      } else if (centeredLeft < padding) {
        // Calendar would overflow on the left
        position = 'left-0 right-auto !-translate-x-0';
      }
      // Otherwise leave empty - will use default centered position

      setDynamicPosition(position);
    };

    calculatePosition();
    window.addEventListener('resize', calculatePosition);
    window.addEventListener('scroll', calculatePosition, true);

    return () => {
      window.removeEventListener('resize', calculatePosition);
      window.removeEventListener('scroll', calculatePosition, true);
    };
  }, [showCalendar, isMobile]);

  useEffect(() => {
    if (checkIn) setSelectedStartDate(new Date(checkIn));
  }, [checkIn]);

  useEffect(() => {
    if (checkOut) setSelectedEndDate(new Date(checkOut));
  }, [checkOut]);

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

  // Set moment.js locale globally when language changes
  useEffect(() => {
    if (typeof window !== "undefined" && (window as any).moment) {
      const moment = (window as any).moment;
      console.log('Setting global moment.js locale to:', lang);
      moment.locale(lang);
      console.log('Global moment.js locale is now:', moment.locale());
    }
  }, [lang]);

  // Initialize Lightpick when calendar is shown
  useEffect(() => {
    if (!dateInputRef.current || !showCalendar || !t) return;

    const initLightpick = () => {
      if (typeof window === "undefined" || !(window as any).moment) {
        setTimeout(initLightpick, 100);
        return;
      }

      import("lightpick")
        .then((LightpickModule) => {
          const Lightpick = LightpickModule.default;

          if (lightpickRef.current) {
            lightpickRef.current.destroy();
            lightpickRef.current = null;
          }

          if (!dateInputRef.current) return;

          const today = new Date();
          today.setHours(0, 0, 0, 0);

          // Ensure moment locale is set before creating Lightpick
          const moment = (window as any).moment;
          if (moment) {
            moment.locale(lang);
            console.log('Lightpick init - moment locale:', moment.locale());
          }

          lightpickRef.current = new Lightpick({
            field: dateInputRef.current,
            singleDate: false,
            numberOfMonths: isMobile ? 1 : 2,
            numberOfColumns: isMobile ? 1 : 2,
            footer: true,
            inline: true,
            lang: lang,
            minDate: today,
            locale: {
              buttons: {
                prev: '←',
                next: '→',
                close: '×',
                reset: t?.reset || 'Reset',
                apply: t?.apply || 'Apply'
              }
            },
            onSelect: function (start: any, end: any) {
              if (start) {
                const startDate = start.toDate();
                setSelectedStartDate(startDate);
                onCheckInChange(format(startDate, 'yyyy-MM-dd'));
              }
              if (end) {
                const endDate = end.toDate();
                setSelectedEndDate(endDate);
                onCheckOutChange(format(endDate, 'yyyy-MM-dd'));
              }
            },
          });

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
  }, [showCalendar, isMobile, lang, t]);

  // Close calendar when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
        setShowCalendar(false);
        if (onClose) onClose();
      }
    };

    if (showCalendar) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showCalendar, onClose]);

  const formatDateDisplay = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      // Format: 'di 10 mrt' (weekday day month)
      return date.toLocaleDateString(lang, { 
        weekday: 'short', 
        day: 'numeric', 
        month: 'short' 
      });
    } catch {
      return dateStr;
    }
  };

  if (!t) return null;

  const handleReset = () => {
    setSelectedStartDate(null);
    setSelectedEndDate(null);
    onCheckInChange('');
    onCheckOutChange('');
    if (lightpickRef.current) {
      lightpickRef.current.reset();
    }
  };

  const handleApply = () => {
    setShowCalendar(false);
    if (onClose) onClose();
  };

  return (
    <div className="relative" ref={containerRef}>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-2">
            {checkInLabel || t.arrival}
          </label>
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowCalendar(true)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-left hover:bg-gray-50 transition-colors text-gray-900"
            >
              {checkIn ? formatDateDisplay(checkIn) : t.selectDate}
            </button>
            {checkIn && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onCheckInChange('');
                  setSelectedStartDate(null);
                  if (lightpickRef.current) {
                    lightpickRef.current.setStartDate(null);
                  }
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-200 rounded-full transition-colors"
              >
                <svg className="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </button>
            )}
          </div>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-2">
            {checkOutLabel || t.departure}
          </label>
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowCalendar(true)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-left hover:bg-gray-50 transition-colors text-gray-900"
            >
              {checkOut ? formatDateDisplay(checkOut) : t.selectDate}
            </button>
            {checkOut && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onCheckOutChange('');
                  setSelectedEndDate(null);
                  if (lightpickRef.current) {
                    lightpickRef.current.setEndDate(null);
                  }
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-200 rounded-full transition-colors"
              >
                <svg className="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>

      {showCalendar && (
        <div 
          ref={calendarRef}
          className={`absolute top-full mt-2 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 
            ${isMobile ? 'left-0 right-0 w-full max-w-[95vw] mx-auto' : `${positionClass || dynamicPosition || 'left-1/2 -translate-x-1/2'} w-[800px] max-w-[95vw]`}`}
        >
          <div className="p-4 md:p-6">
            <div className="w-full mb-4 md:mb-6">
              {/* Mobile Layout */}
              <div className="md:hidden">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-base font-semibold text-gray-900 mb-1">
                      {t.title}
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowCalendar(false)}
                    className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X className="h-5 w-5 text-gray-500" />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      {t.arrival}
                    </label>
                    <button
                      type="button"
                      className={`w-full px-2 py-2 rounded-lg border-2 text-left transition-colors text-xs ${
                        selectedStartDate
                          ? "bg-purple-600 text-white border-purple-600"
                          : "bg-white text-gray-400 border-gray-300 hover:border-purple-400"
                      }`}
                    >
                      {selectedStartDate
                        ? format(selectedStartDate, "dd/MM/yyyy")
                        : t.selectDate}
                    </button>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      {t.departure}
                    </label>
                    <button
                      type="button"
                      className={`w-full px-2 py-2 rounded-lg border-2 text-left transition-colors text-xs ${
                        selectedEndDate
                          ? "bg-white text-gray-900 border-gray-300"
                          : "bg-white text-gray-400 border-gray-300 hover:border-purple-400"
                      }`}
                    >
                      {selectedEndDate
                        ? format(selectedEndDate, "dd/MM/yyyy")
                        : t.selectDate}
                    </button>
                  </div>
                </div>
              </div>

              {/* Desktop Layout */}
              <div className="hidden md:block relative">
                <div className="flex items-start justify-between gap-6">
                  <div className="flex-shrink-0">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2 whitespace-nowrap">
                      {t.title}
                    </h3>
                    <p className="text-sm text-gray-600 max-w-xs">
                      {t.subtitle}
                    </p>
                  </div>

                  <div className="flex items-end gap-4 flex-shrink-0">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t.arrival}
                      </label>
                      <button
                        type="button"
                        className={`px-4 py-3 rounded-lg border-2 text-left transition-colors text-sm whitespace-nowrap min-w-[140px] ${
                          selectedStartDate
                            ? "bg-purple-600 text-white border-purple-600"
                            : "bg-white text-gray-400 border-gray-300 hover:border-purple-400"
                        }`}
                      >
                        {selectedStartDate
                          ? format(selectedStartDate, "dd/MM/yyyy")
                          : t.selectDate}
                      </button>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t.departure}
                      </label>
                      <button
                        type="button"
                        className={`px-4 py-3 rounded-lg border-2 text-left transition-colors text-sm whitespace-nowrap min-w-[140px] ${
                          selectedEndDate
                            ? "bg-white text-gray-900 border-gray-300"
                            : "bg-white text-gray-400 border-gray-300 hover:border-purple-400"
                        }`}
                      >
                        {selectedEndDate
                          ? format(selectedEndDate, "dd/MM/yyyy")
                          : t.selectDate}
                      </button>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowCalendar(false)}
                    className="absolute -top-2 -right-2 p-1 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X className="h-5 w-5 text-gray-500" />
                  </button>
                </div>
              </div>
            </div>

            <input
              ref={dateInputRef}
              type="text"
              className="hidden"
              readOnly
            />

            {/* <div className="flex justify-between items-center mt-3 md:mt-4 pt-3 md:pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={handleReset}
                className="px-4 md:px-6 py-2 text-sm md:text-base text-purple-600 font-semibold hover:bg-purple-50 rounded-lg transition-colors"
              >
                {t.reset}
              </button>
              <button
                type="button"
                onClick={handleApply}
                className="px-4 md:px-6 py-2 text-sm md:text-base bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition-colors"
              >
                {t.apply}
              </button>
            </div> */}
          </div>
        </div>
      )}
    </div>
  );
}
