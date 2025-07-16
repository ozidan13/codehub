'use client';

import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import {
  generateCalendarDays,
  getNextMonth,
  getPreviousMonth,
  isDateInCurrentMonth,
  AvailableDate
} from '@/utils/calendar-helpers';

interface CalendarBaseProps {
  currentDate: Date;
  onDateChange: (date: Date) => void;
  availableDates: AvailableDate[];
  onDateSelect?: (date: Date) => void;
  selectedDate?: Date;
  renderDateCell?: (date: Date, isCurrentMonth: boolean, isAvailable: boolean, isSelected: boolean) => React.ReactNode;
  className?: string;
}

const WEEKDAYS = ['ح', 'ن', 'ث', 'ر', 'خ', 'ج', 'س']; // Arabic weekday abbreviations

export const CalendarBase: React.FC<CalendarBaseProps> = ({
  currentDate,
  onDateChange,
  availableDates,
  onDateSelect,
  selectedDate,
  renderDateCell,
  className = ''
}) => {
  const [displayDate, setDisplayDate] = useState(currentDate);

  const calendarDays = generateCalendarDays(displayDate);

  const handlePreviousMonth = () => {
    const prevMonth = getPreviousMonth(displayDate);
    setDisplayDate(prevMonth);
    onDateChange(prevMonth);
  };

  const handleNextMonth = () => {
    const nextMonth = getNextMonth(displayDate);
    setDisplayDate(nextMonth);
    onDateChange(nextMonth);
  };

  const handleDateClick = (date: Date) => {
    if (onDateSelect && !isDateInPast(date) && isDateInCurrentMonth(date, displayDate)) {
      onDateSelect(date);
    }
  };

  const isDateInPast = (date: Date): boolean => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);
    return checkDate < today;
  };

  const isDateAvailable = (date: Date): boolean => {
    return availableDates.some(availableDate => {
      const availableDateTime = new Date(availableDate.date);
      return (
        availableDateTime.toDateString() === date.toDateString() &&
        !availableDate.isBooked &&
        !availableDate.isRecurring
      );
    });
  };

  const isDateSelected = (date: Date): boolean => {
    return selectedDate ? selectedDate.toDateString() === date.toDateString() : false;
  };

  const defaultRenderDateCell = (date: Date, isCurrentMonth: boolean, isAvailable: boolean, isSelected: boolean) => {
    const isPast = isDateInPast(date);
    const isToday = new Date().toDateString() === date.toDateString();
    
    let cellClasses = 'w-10 h-10 flex items-center justify-center text-sm rounded-lg transition-all duration-200';
    
    if (!isCurrentMonth) {
      cellClasses += ' text-gray-300 cursor-not-allowed';
    } else if (isPast) {
      cellClasses += ' text-gray-400 cursor-not-allowed';
    } else if (isSelected) {
      cellClasses += ' bg-blue-500 text-white cursor-pointer';
    } else if (isAvailable) {
      cellClasses += ' bg-green-100 text-green-800 hover:bg-green-200 cursor-pointer';
    } else if (isToday) {
      cellClasses += ' bg-blue-100 text-blue-800 border-2 border-blue-300 cursor-pointer';
    } else {
      cellClasses += ' text-gray-700 hover:bg-gray-100 cursor-pointer';
    }

    return (
      <div
        className={cellClasses}
        onClick={() => handleDateClick(date)}
      >
        {date.getDate()}
      </div>
    );
  };

  return (
    <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={handleNextMonth}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          aria-label="الشهر التالي"
        >
          <ChevronLeft className="w-5 h-5 text-gray-600" />
        </button>
        
        <h2 className="text-lg font-semibold text-gray-800">
          {format(displayDate, 'MMMM yyyy', { locale: ar })}
        </h2>
        
        <button
          onClick={handlePreviousMonth}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          aria-label="الشهر السابق"
        >
          <ChevronRight className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      {/* Weekday Headers */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {WEEKDAYS.map((day, index) => (
          <div
            key={index}
            className="w-10 h-10 flex items-center justify-center text-sm font-medium text-gray-500"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((date, index) => {
          const isCurrentMonth = isDateInCurrentMonth(date, displayDate);
          const isAvailable = isDateAvailable(date);
          const isSelected = isDateSelected(date);
          
          return (
            <div key={index} className="flex justify-center">
              {renderDateCell
                ? renderDateCell(date, isCurrentMonth, isAvailable, isSelected)
                : defaultRenderDateCell(date, isCurrentMonth, isAvailable, isSelected)
              }
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CalendarBase;