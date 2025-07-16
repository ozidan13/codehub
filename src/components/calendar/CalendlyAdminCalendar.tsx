'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Settings, RefreshCw, Plus } from 'lucide-react';
import CalendarBase from './CalendarBase';
import TimeSlotGrid from './TimeSlotGrid';
import { AvailableDate, formatDateArabic } from '@/utils/calendar-helpers';

interface CalendlyAdminCalendarProps {
  availableDates: AvailableDate[];
  onRefresh: () => void;
  onCreateTimeSlot: (date: Date, timeSlot: { start: string; end: string }) => Promise<void>;
  onDeleteTimeSlot: (dateId: string) => Promise<void>;
  onBulkCreate: (date: Date, timeSlots: { start: string; end: string }[]) => Promise<void>;
  onBulkDateRangeCreate?: (startDate: Date, endDate: Date, timeSlots: { start: string; end: string }[], excludeWeekends: boolean) => Promise<any>;
  loading?: boolean;
  className?: string;
}

interface BulkOperationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (startDate: Date, endDate: Date, timeSlots: { start: string; end: string }[], excludeWeekends: boolean) => void;
}

const BulkOperationModal: React.FC<BulkOperationModalProps> = ({ isOpen, onClose, onConfirm }) => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [excludeWeekends, setExcludeWeekends] = useState(true);
  const [selectedTimeSlots, setSelectedTimeSlots] = useState<Set<string>>(new Set());

  const timeSlots = [
    { start: '09:00', end: '10:00', label: '9:00 ص - 10:00 ص' },
    { start: '10:00', end: '11:00', label: '10:00 ص - 11:00 ص' },
    { start: '11:00', end: '12:00', label: '11:00 ص - 12:00 م' },
    { start: '12:00', end: '13:00', label: '12:00 م - 1:00 م' },
    { start: '13:00', end: '14:00', label: '1:00 م - 2:00 م' },
    { start: '14:00', end: '15:00', label: '2:00 م - 3:00 م' },
    { start: '15:00', end: '16:00', label: '3:00 م - 4:00 م' },
    { start: '16:00', end: '17:00', label: '4:00 م - 5:00 م' },
    { start: '17:00', end: '18:00', label: '5:00 م - 6:00 م' }
  ];

  const handleTimeSlotToggle = (timeSlot: { start: string; end: string }) => {
    const key = `${timeSlot.start}_${timeSlot.end}`;
    const newSelected = new Set(selectedTimeSlots);
    if (newSelected.has(key)) {
      newSelected.delete(key);
    } else {
      newSelected.add(key);
    }
    setSelectedTimeSlots(newSelected);
  };

  const handleSubmit = () => {
    if (!startDate || !endDate || selectedTimeSlots.size === 0) return;
    
    const slots = Array.from(selectedTimeSlots).map(key => {
      const [start, end] = key.split('_');
      return { start, end };
    });
    
    onConfirm(new Date(startDate), new Date(endDate), slots, excludeWeekends);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl mx-4"
      >
        <h3 className="text-xl font-bold text-gray-800 mb-6">إضافة أوقات متاحة بالجملة</h3>
        
        <div className="space-y-6">
          {/* Date Range */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">تاريخ البداية</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">تاريخ النهاية</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          
          {/* Options */}
          <div>
            <label className="flex items-center space-x-3 space-x-reverse">
              <input
                type="checkbox"
                checked={excludeWeekends}
                onChange={(e) => setExcludeWeekends(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">استبعاد عطلة نهاية الأسبوع (الجمعة والسبت)</span>
            </label>
          </div>
          
          {/* Time Slots Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">اختر الأوقات المتاحة</label>
            <div className="grid grid-cols-3 gap-2">
              {timeSlots.map((slot, index) => {
                const key = `${slot.start}_${slot.end}`;
                const isSelected = selectedTimeSlots.has(key);
                return (
                  <button
                    key={index}
                    onClick={() => handleTimeSlotToggle(slot)}
                    className={`p-3 text-sm rounded-lg border transition-colors ${
                      isSelected
                        ? 'bg-blue-100 border-blue-300 text-blue-800'
                        : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-blue-50'
                    }`}
                  >
                    {slot.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
        
        {/* Actions */}
        <div className="flex items-center justify-end space-x-3 space-x-reverse mt-8">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            إلغاء
          </button>
          <button
            onClick={handleSubmit}
            disabled={!startDate || !endDate || selectedTimeSlots.size === 0}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            إضافة الأوقات
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export const CalendlyAdminCalendar: React.FC<CalendlyAdminCalendarProps> = ({
  availableDates,
  onRefresh,
  onCreateTimeSlot,
  onDeleteTimeSlot,
  onBulkCreate,
  onBulkDateRangeCreate,
  loading = false,
  className = ''
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // Handle time slot toggle (add/remove individual slot)
  const handleTimeSlotToggle = useCallback(async (date: Date, timeSlot: { start: string; end: string }, isSelected: boolean) => {
    try {
      setIsCreating(true);
      
      if (isSelected) {
        // Check if time slot already exists before creating
        const existingSlot = availableDates.find(availableDate => {
          const availableDateTime = new Date(availableDate.date);
          return (
            availableDateTime.toDateString() === date.toDateString() &&
            availableDate.startTime === timeSlot.start &&
            availableDate.endTime === timeSlot.end &&
            !availableDate.isRecurring
          );
        });
        
        if (!existingSlot) {
          // Add new time slot only if it doesn't exist
          await onCreateTimeSlot(date, timeSlot);
        }
      } else {
        // Remove existing time slot
        const existingSlot = availableDates.find(availableDate => {
          const availableDateTime = new Date(availableDate.date);
          return (
            availableDateTime.toDateString() === date.toDateString() &&
            availableDate.startTime === timeSlot.start &&
            availableDate.endTime === timeSlot.end &&
            !availableDate.isRecurring
          );
        });
        
        if (existingSlot) {
          await onDeleteTimeSlot(existingSlot.id);
        }
      }
      
      onRefresh();
    } catch (error) {
      console.error('Error toggling time slot:', error);
      alert('حدث خطأ أثناء تحديث الوقت المتاح');
    } finally {
      setIsCreating(false);
    }
  }, [availableDates, onCreateTimeSlot, onDeleteTimeSlot, onRefresh]);

  // Handle bulk time slot creation
  const handleBulkSelect = useCallback(async (date: Date, timeSlots: { start: string; end: string }[]) => {
    try {
      setIsCreating(true);
      await onBulkCreate(date, timeSlots);
      onRefresh();
    } catch (error) {
      console.error('Error creating bulk time slots:', error);
      alert('حدث خطأ أثناء إضافة الأوقات المتاحة');
    } finally {
      setIsCreating(false);
    }
  }, [onBulkCreate, onRefresh]);

  // Handle bulk operation from modal
  const handleBulkOperation = useCallback(async (
    startDate: Date,
    endDate: Date,
    timeSlots: { start: string; end: string }[],
    excludeWeekends: boolean
  ) => {
    try {
      setIsCreating(true);
      
      if (onBulkDateRangeCreate) {
        // Use the efficient bulk date range creation
        const result = await onBulkDateRangeCreate(startDate, endDate, timeSlots, excludeWeekends);
        onRefresh();
        alert(`تم إضافة ${result.createdCount || 0} وقت متاح بنجاح`);
      } else {
        // Fallback to individual date creation
        const dates: Date[] = [];
        const currentDate = new Date(startDate);
        
        while (currentDate <= endDate) {
          const dayOfWeek = currentDate.getDay();
          const isWeekend = dayOfWeek === 5 || dayOfWeek === 6; // Friday (5) or Saturday (6)
          
          if (!excludeWeekends || !isWeekend) {
            dates.push(new Date(currentDate));
          }
          
          currentDate.setDate(currentDate.getDate() + 1);
        }
        
        // Create time slots for each date
        for (const date of dates) {
          await onBulkCreate(date, timeSlots);
        }
        
        onRefresh();
        alert(`تم إضافة ${dates.length * timeSlots.length} وقت متاح بنجاح`);
      }
    } catch (error) {
      console.error('Error creating bulk time slots:', error);
      alert('حدث خطأ أثناء إضافة الأوقات المتاحة');
    } finally {
      setIsCreating(false);
    }
  }, [onBulkCreate, onBulkDateRangeCreate, onRefresh]);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3 space-x-reverse">
          <Calendar className="w-8 h-8 text-blue-600" />
          <div>
            <h2 className="text-2xl font-bold text-gray-800">إدارة الأوقات المتاحة</h2>
            <p className="text-gray-600">اختر التواريخ والأوقات المتاحة للحجز</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3 space-x-reverse">
          <button
            onClick={() => setShowBulkModal(true)}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2 space-x-reverse"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة بالجملة</span>
          </button>
          
          <button
            onClick={onRefresh}
            disabled={loading}
            className="p-2 text-gray-600 hover:text-gray-800 transition-colors disabled:opacity-50"
            title="تحديث"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Calendar */}
        <CalendarBase
          currentDate={currentDate}
          onDateChange={setCurrentDate}
          availableDates={availableDates}
          onDateSelect={setSelectedDate}
          selectedDate={selectedDate || undefined}
          className="h-fit"
        />
        
        {/* Time Slot Grid */}
        <TimeSlotGrid
          selectedDate={selectedDate}
          availableDates={availableDates}
          onTimeSlotToggle={handleTimeSlotToggle}
          onBulkSelect={handleBulkSelect}
          className="h-fit"
        />
      </div>
      
      {/* Selected Date Info */}
      {selectedDate && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-blue-50 border border-blue-200 rounded-lg p-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-blue-800">التاريخ المحدد</h4>
              <p className="text-blue-600">{formatDateArabic(selectedDate)}</p>
            </div>
            <div className="text-sm text-blue-600">
              {availableDates.filter(date => {
                const dateObj = new Date(date.date);
                return dateObj.toDateString() === selectedDate.toDateString() && !date.isRecurring;
              }).length} وقت متاح
            </div>
          </div>
        </motion.div>
      )}
      
      {/* Loading Overlay */}
      {(loading || isCreating) && (
        <div className="fixed inset-0 bg-black bg-opacity-25 flex items-center justify-center z-40">
          <div className="bg-white rounded-lg p-6 flex items-center space-x-3 space-x-reverse">
            <RefreshCw className="w-5 h-5 animate-spin text-blue-600" />
            <span className="text-gray-700">{isCreating ? 'جاري الحفظ...' : 'جاري التحميل...'}</span>
          </div>
        </div>
      )}
      
      {/* Bulk Operation Modal */}
      <BulkOperationModal
        isOpen={showBulkModal}
        onClose={() => setShowBulkModal(false)}
        onConfirm={handleBulkOperation}
      />
    </div>
  );
};

export default CalendlyAdminCalendar;