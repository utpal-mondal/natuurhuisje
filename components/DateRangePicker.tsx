"use client";

import { useState, useEffect, useRef } from 'react';
import { format } from 'date-fns';
import { Calendar, X } from 'lucide-react';

interface DateRangePickerProps {
  checkIn: string;
  checkOut: string;
  onCheckInChange: (date: string) => void;
  onCheckOutChange: (date: string) => void;
  checkInLabel?: string;
  checkOutLabel?: string;
}

export function DateRangePicker({
  checkIn,
  checkOut,
  onCheckInChange,
  onCheckOutChange,
  checkInLabel = "Check-in",
  checkOutLabel = "Check-out"
}: DateRangePickerProps) {
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedStartDate, setSelectedStartDate] = useState<Date | null>(
    checkIn ? new Date(checkIn) : null
  );
  const [selectedEndDate, setSelectedEndDate] = useState<Date | null>(
    checkOut ? new Date(checkOut) : null
  );
  const calendarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (checkIn) setSelectedStartDate(new Date(checkIn));
  }, [checkIn]);

  useEffect(() => {
    if (checkOut) setSelectedEndDate(new Date(checkOut));
  }, [checkOut]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
        setShowCalendar(false);
      }
    };

    if (showCalendar) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showCalendar]);

  const generateCalendarMonths = (startMonth: Date, count: number) => {
    const months = [];
    for (let i = 0; i < count; i++) {
      const date = new Date(startMonth.getFullYear(), startMonth.getMonth() + i, 1);
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
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (date < today) return;

    if (!selectedStartDate || (selectedStartDate && selectedEndDate)) {
      setSelectedStartDate(date);
      setSelectedEndDate(null);
      onCheckInChange(format(date, 'yyyy-MM-dd'));
      onCheckOutChange('');
    } else {
      if (date < selectedStartDate) {
        setSelectedStartDate(date);
        setSelectedEndDate(null);
        onCheckInChange(format(date, 'yyyy-MM-dd'));
        onCheckOutChange('');
      } else {
        setSelectedEndDate(date);
        onCheckOutChange(format(date, 'yyyy-MM-dd'));
        setShowCalendar(false);
      }
    }
  };

  const formatDateDisplay = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      return format(new Date(dateStr), 'MMM d, yyyy');
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="relative" ref={calendarRef}>
      <div className="grid grid-cols-2 border border-gray-300 rounded-lg overflow-hidden">
        <button
          type="button"
          onClick={() => setShowCalendar(true)}
          className="p-3 border-r border-gray-300 text-left hover:bg-gray-50 transition-colors"
        >
          <label className="text-xs font-semibold text-gray-700 uppercase block cursor-pointer">
            {checkInLabel}
          </label>
          <div className="text-sm mt-1 text-gray-900">
            {checkIn ? formatDateDisplay(checkIn) : 'Select date'}
          </div>
        </button>
        <button
          type="button"
          onClick={() => setShowCalendar(true)}
          className="p-3 text-left hover:bg-gray-50 transition-colors"
        >
          <label className="text-xs font-semibold text-gray-700 uppercase block cursor-pointer">
            {checkOutLabel}
          </label>
          <div className="text-sm mt-1 text-gray-900">
            {checkOut ? formatDateDisplay(checkOut) : 'Select date'}
          </div>
        </button>
      </div>

      {showCalendar && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl z-50 max-h-[500px] overflow-y-auto border border-gray-200">
          <div className="sticky top-0 bg-white z-10 flex items-center justify-between p-4 border-b border-gray-200">
            <div>
              <h3 className="text-lg font-bold text-purple-900">
                {selectedStartDate && selectedEndDate
                  ? `${Math.ceil((selectedEndDate.getTime() - selectedStartDate.getTime()) / (1000 * 60 * 60 * 24))} nights`
                  : "Select dates"}
              </h3>
              {selectedStartDate && selectedEndDate && (
                <p className="text-xs text-gray-600 mt-1">
                  from {format(selectedStartDate, "EEE d MMM")} to {format(selectedEndDate, "EEE d MMM")}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={() => setShowCalendar(false)}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="h-5 w-5 text-gray-900" />
            </button>
          </div>

          <div className="p-4">
            {generateCalendarMonths(new Date(), 6).map((monthDate, idx) => {
              const { daysInMonth, startingDayOfWeek } = getDaysInMonth(monthDate);
              const monthName = format(monthDate, "MMMM yyyy");
              const prevMonthDays = startingDayOfWeek === 0 ? 6 : startingDayOfWeek - 1;
              const prevMonthDate = new Date(monthDate.getFullYear(), monthDate.getMonth() - 1, 0);
              const prevMonthLastDay = prevMonthDate.getDate();

              return (
                <div key={idx} className="mb-6 first:mt-0">
                  <h4 className="text-center font-semibold text-gray-900 mb-3 text-base">
                    {monthName}
                  </h4>

                  <div className="grid grid-cols-7 gap-1 mb-2">
                    {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
                      <div key={day} className="text-center text-xs font-medium text-gray-600 py-1">
                        {day}
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-7 gap-1">
                    {Array.from({ length: prevMonthDays }).map((_, i) => (
                      <div
                        key={`prev-${i}`}
                        className="aspect-square flex items-center justify-center text-sm text-gray-400"
                      >
                        {prevMonthLastDay - prevMonthDays + i + 1}
                      </div>
                    ))}

                    {Array.from({ length: daysInMonth }).map((_, i) => {
                      const day = i + 1;
                      const currentDate = new Date(monthDate.getFullYear(), monthDate.getMonth(), day);
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      const isPast = currentDate < today;
                      const inRange = isDateInRange(currentDate);
                      const isStart = selectedStartDate && currentDate.getTime() === selectedStartDate.getTime();
                      const isEnd = selectedEndDate && currentDate.getTime() === selectedEndDate.getTime();

                      return (
                        <button
                          key={day}
                          type="button"
                          onClick={() => handleDateClick(currentDate)}
                          disabled={isPast}
                          className={`aspect-square flex items-center justify-center text-sm rounded-lg transition-all ${
                            isPast
                              ? "text-gray-300 cursor-not-allowed"
                              : isStart || isEnd
                                ? "bg-purple-600 text-white font-bold"
                                : inRange
                                  ? "bg-purple-100 text-purple-900"
                                  : "hover:bg-gray-100 text-gray-900"
                          }`}
                        >
                          {day}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
