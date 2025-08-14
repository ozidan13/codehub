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
    <div className={`space-y-8 ${className}`}>
      {/* Enhanced Header */}
      <div className="bg-gradient-to-br from-white to-blue-50/30 rounded-2xl shadow-lg border border-blue-100/50 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 space-x-reverse">
            <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg">
              <Calendar className="w-8 w-8" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-1">إدارة الأوقات المتاحة</h2>
              <p className="text-blue-600 font-medium flex items-center space-x-2 space-x-reverse">
                <Settings className="h-4 w-4" />
                <span>اختر التواريخ والأوقات المتاحة للحجز</span>
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3 space-x-reverse">
            <button
              onClick={() => setShowBulkModal(true)}
              className="px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 transition-all duration-200 flex items-center space-x-2 space-x-reverse shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              <Plus className="w-5 h-5" />
              <span className="font-medium">إضافة بالجملة</span>
            </button>
            
            <button
              onClick={onRefresh}
              disabled={loading}
              className="p-3 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all duration-200 disabled:opacity-50 transform hover:scale-105"
              title="تحديث"
            >
              <RefreshCw className={`w-6 h-6 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Enhanced Main Content */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Enhanced Calendar */}
        <div className="bg-gradient-to-br from-white to-gray-50/30 rounded-2xl shadow-lg border border-gray-100/50 p-6">
          <div className="mb-4">
            <h3 className="text-lg font-bold text-gray-800 mb-2 flex items-center space-x-2 space-x-reverse">
              <Calendar className="h-5 w-5 text-blue-600" />
              <span>التقويم</span>
            </h3>
            <p className="text-gray-600 text-sm">اختر التاريخ لإدارة الأوقات المتاحة</p>
          </div>
          <CalendarBase
            currentDate={currentDate}
            onDateChange={setCurrentDate}
            availableDates={availableDates}
            onDateSelect={setSelectedDate}
            selectedDate={selectedDate || undefined}
            className="h-fit bg-transparent shadow-none"
          />
        </div>
        
        {/* Enhanced Time Slot Grid */}
        <div className="bg-gradient-to-br from-white to-green-50/30 rounded-2xl shadow-lg border border-green-100/50 p-6">
          <div className="mb-4">
            <h3 className="text-lg font-bold text-gray-800 mb-2 flex items-center space-x-2 space-x-reverse">
              <Settings className="h-5 w-5 text-green-600" />
              <span>إدارة الأوقات</span>
            </h3>
            <p className="text-gray-600 text-sm">أضف أو احذف الأوقات المتاحة للتاريخ المحدد</p>
          </div>
          <TimeSlotGrid
            selectedDate={selectedDate}
            availableDates={availableDates}
            onTimeSlotToggle={handleTimeSlotToggle}
            onBulkSelect={handleBulkSelect}
            className="h-fit"
          />
        </div>
      </div>
      
      {/* Enhanced Selected Date Info */}
      {selectedDate && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-blue-50 to-blue-100/50 border border-blue-200 rounded-2xl p-6 shadow-md"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 space-x-reverse">
              <div className="p-3 bg-blue-500 rounded-xl text-white">
                <Calendar className="h-6 w-6" />
              </div>
              <div>
                <h4 className="font-bold text-blue-800 text-lg">التاريخ المحدد</h4>
                <p className="text-blue-600 font-medium">{formatDateArabic(selectedDate)}</p>
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-700">
                {availableDates.filter(date => {
                  const dateObj = new Date(date.date);
                  return dateObj.toDateString() === selectedDate.toDateString() && !date.isRecurring;
                }).length}
              </div>
              <div className="text-sm text-blue-600 font-medium">وقت متاح</div>
            </div>
          </div>
        </motion.div>
      )}
      
      {/* Enhanced Loading Overlay */}
      {(loading || isCreating) && (
        <div className="fixed inset-0 bg-black bg-opacity-30 backdrop-blur-sm flex items-center justify-center z-50">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl p-8 flex flex-col items-center space-y-4 shadow-2xl border border-blue-100"
          >
            <div className="relative">
              <div className="w-8 h-8 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
              <div className="absolute inset-0 w-8 h-8 border-3 border-transparent border-r-blue-400 rounded-full animate-spin animation-delay-150" />
            </div>
            <div className="text-center">
              <span className="text-gray-800 font-semibold text-lg">{isCreating ? 'جاري الحفظ...' : 'جاري التحميل...'}</span>
              <p className="text-gray-600 text-sm mt-1">{isCreating ? 'يتم حفظ التغييرات' : 'يتم تحضير البيانات'}</p>
            </div>
          </motion.div>
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