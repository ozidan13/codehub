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
    
    let cellClasses = 'w-12 h-12 flex items-center justify-center text-sm font-medium rounded-xl transition-all duration-300 transform hover:scale-105 relative';
    
    if (!isCurrentMonth) {
      cellClasses += ' text-gray-300 cursor-not-allowed opacity-50';
    } else if (isPast) {
      cellClasses += ' text-gray-400 cursor-not-allowed opacity-60';
    } else if (isSelected) {
      cellClasses += ' bg-gradient-to-br from-orange-500 to-orange-600 text-white cursor-pointer shadow-lg ring-2 ring-orange-200';
    } else if (isAvailable) {
      cellClasses += ' bg-gradient-to-br from-green-100 to-green-200 text-green-800 hover:from-green-200 hover:to-green-300 cursor-pointer border border-green-300 shadow-sm';
    } else if (isToday) {
      cellClasses += ' bg-gradient-to-br from-blue-100 to-blue-200 text-blue-800 border-2 border-blue-400 cursor-pointer shadow-sm';
    } else {
      cellClasses += ' text-gray-700 hover:bg-gradient-to-br hover:from-gray-50 hover:to-gray-100 cursor-pointer border border-transparent hover:border-gray-200';
    }

    return (
      <div
        className={cellClasses}
        onClick={() => handleDateClick(date)}
      >
        <span className="relative z-10">{date.getDate()}</span>
        {isAvailable && (
          <div className="absolute top-1 right-1 w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
        )}
        {isToday && (
          <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-blue-500 rounded-full"></div>
        )}
      </div>
    );
  };

  return (
    <div className={`bg-gradient-to-br from-white to-gray-50/50 rounded-2xl shadow-xl border border-gray-100 p-6 ${className}`}>
      {/* Enhanced Calendar Header */}
      <div className="flex items-center justify-between mb-8">
        <button
          onClick={handleNextMonth}
          className="p-3 rounded-xl hover:bg-orange-100 transition-all duration-200 hover:scale-105 group"
          aria-label="الشهر التالي"
        >
          <ChevronLeft className="w-5 h-5 text-gray-600 group-hover:text-orange-600 transition-colors" />
        </button>
        
        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-800 mb-1">
            {format(displayDate, 'MMMM yyyy', { locale: ar })}
          </h2>
          <div className="w-16 h-1 bg-gradient-to-r from-orange-400 to-orange-600 rounded-full mx-auto"></div>
        </div>
        
        <button
          onClick={handlePreviousMonth}
          className="p-3 rounded-xl hover:bg-orange-100 transition-all duration-200 hover:scale-105 group"
          aria-label="الشهر السابق"
        >
          <ChevronRight className="w-5 h-5 text-gray-600 group-hover:text-orange-600 transition-colors" />
        </button>
      </div>



      {/* Enhanced Calendar Grid */}
      <div className="grid grid-cols-7 gap-2">
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
      
      {/* Legend */}
      <div className="flex items-center justify-center space-x-6 space-x-reverse mt-6 pt-4 border-t border-gray-200">
        <div className="flex items-center space-x-2 space-x-reverse">
          <div className="w-3 h-3 bg-gradient-to-br from-green-100 to-green-200 border border-green-300 rounded-full"></div>
          <span className="text-xs text-gray-600">متاح</span>
        </div>
        <div className="flex items-center space-x-2 space-x-reverse">
          <div className="w-3 h-3 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full"></div>
          <span className="text-xs text-gray-600">محدد</span>
        </div>
        <div className="flex items-center space-x-2 space-x-reverse">
          <div className="w-3 h-3 bg-gradient-to-br from-blue-100 to-blue-200 border-2 border-blue-400 rounded-full"></div>
          <span className="text-xs text-gray-600">اليوم</span>
        </div>
      </div>
    </div>
  );}

export default CalendarBase;