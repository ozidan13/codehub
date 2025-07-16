'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Calendar } from 'lucide-react';
import CalendarBase from './CalendarBase';
import { isDateAvailable, AvailableDate } from '@/utils/calendar-helpers';
import { MentorshipData } from '@/types';

interface CalendlyStudentCalendarProps {
  availableDates: MentorshipData['availableDates'];
  onDateChange: (date: Date) => void;
  className?: string;
  loading?: boolean;
  selectedDate?: Date;
  minDate?: Date;
  maxDate?: Date;
  disabled?: boolean;
}

export const CalendlyStudentCalendar: React.FC<CalendlyStudentCalendarProps> = ({
  availableDates,
  onDateChange,
  className = '',
  loading = false,
  selectedDate,
  minDate,
  maxDate,
  disabled = false,
}) => {
  const [currentDate, setCurrentDate] = useState(selectedDate || new Date());

  // Transform available dates to the expected AvailableDate format
  const transformedAvailableDates: AvailableDate[] = useMemo(() => {
    if (!availableDates || !Array.isArray(availableDates)) {
      return [];
    }
    return availableDates.map(d => ({
      id: d.id || '',
      date: d.date,
      startTime: d.startTime || '',
      endTime: d.endTime || '',
      isBooked: d.isBooked || false,
      isRecurring: d.isRecurring || false,
      dayOfWeek: d.dayOfWeek
    }));
  }, [availableDates]);

  // Memoized date availability check
  const isDateSelectableAndAvailable = useCallback((date: Date) => {
    // Check if date is within min/max bounds
    if (minDate && date < minDate) return false;
    if (maxDate && date > maxDate) return false;
    
    // Check if date is available
    return isDateAvailable(date, transformedAvailableDates);
  }, [transformedAvailableDates, minDate, maxDate]);

  const handleDateSelect = useCallback((date: Date) => {
    if (disabled || !isDateSelectableAndAvailable(date)) {
      return;
    }
    
    setCurrentDate(date);
    onDateChange(date);
  }, [disabled, isDateSelectableAndAvailable, onDateChange]);

  const handleCurrentDateChange = useCallback((date: Date) => {
    setCurrentDate(date);
  }, []);

  return (
    <div className={`bg-white rounded-lg shadow-sm ${className}`}>
      <div className="p-4">
        <CalendarBase 
          currentDate={currentDate}
          onDateChange={handleCurrentDateChange}
          onDateSelect={handleDateSelect}
          availableDates={transformedAvailableDates}
          selectedDate={selectedDate}
          className="shadow-none p-0"
        />
      </div>
      
      {/* Empty state when no date is selected */}
      {!selectedDate && !loading && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-8 px-4 border-t border-gray-100"
        >
          <Calendar className="w-12 h-12 mx-auto mb-3 text-blue-600" />
          <h3 className="text-lg font-medium text-blue-800 mb-2">
            ابدأ بتحديد التاريخ
          </h3>
          <p className="text-blue-600 text-sm">
            اختر التاريخ المناسب لك من التقويم أعلاه لعرض الأوقات المتاحة
          </p>
        </motion.div>
      )}
      
      {/* Loading Overlay */}
      {loading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-25 flex items-center justify-center z-40"
        >
          <div className="bg-white rounded-lg p-6 flex items-center space-x-3 space-x-reverse shadow-lg">
            <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <span className="text-gray-700 font-medium">جاري التحميل...</span>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default CalendlyStudentCalendar;