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
    <div className={`bg-gradient-to-br from-white to-orange-50/20 rounded-2xl shadow-lg border border-orange-100/50 ${className}`}>
      <div className="p-6">
        <CalendarBase 
          currentDate={currentDate}
          onDateChange={handleCurrentDateChange}
          onDateSelect={handleDateSelect}
          availableDates={transformedAvailableDates}
          selectedDate={selectedDate}
          className="shadow-none p-0 bg-transparent"
        />
      </div>
      
      {/* Enhanced Empty state when no date is selected */}
      {!selectedDate && !loading && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-12 px-6 border-t border-orange-100/50 bg-gradient-to-br from-orange-50/30 to-transparent rounded-b-2xl"
        >
          <div className="relative">
            <div className="absolute inset-0 bg-orange-100 rounded-full blur-xl opacity-30 animate-pulse"></div>
            <Calendar className="w-16 h-16 mx-auto mb-4 text-orange-500 relative z-10" />
          </div>
          <h3 className="text-xl font-bold text-orange-800 mb-3">
            ابدأ بتحديد التاريخ
          </h3>
          <p className="text-orange-600 text-sm leading-relaxed max-w-sm mx-auto">
            اختر التاريخ المناسب لك من التقويم أعلاه لعرض الأوقات المتاحة للحجز
          </p>
          <div className="mt-6 flex items-center justify-center space-x-4 space-x-reverse">
            <div className="flex items-center space-x-2 space-x-reverse text-xs text-orange-600">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>الأيام المتاحة</span>
            </div>
            <div className="flex items-center space-x-2 space-x-reverse text-xs text-orange-600">
              <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
              <span>التاريخ المحدد</span>
            </div>
          </div>
        </motion.div>
      )}
      
      {/* Enhanced Loading Overlay */}
      {loading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-30 backdrop-blur-sm flex items-center justify-center z-50"
        >
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl p-8 flex flex-col items-center space-y-4 shadow-2xl border border-orange-100"
          >
            <div className="relative">
              <div className="w-8 h-8 border-3 border-orange-200 border-t-orange-600 rounded-full animate-spin" />
              <div className="absolute inset-0 w-8 h-8 border-3 border-transparent border-r-orange-400 rounded-full animate-spin animation-delay-150" />
            </div>
            <div className="text-center">
              <span className="text-gray-800 font-semibold text-lg">جاري التحميل...</span>
              <p className="text-gray-600 text-sm mt-1">يتم تحضير التقويم</p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );}

export default CalendlyStudentCalendar;