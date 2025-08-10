'use client';

import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Clock, Plus, Trash2 } from 'lucide-react';
import {
  TIME_SLOTS,
  formatTimeArabic,
  createTimeSlotKey,
  AvailableDate
} from '@/utils/calendar-helpers';

interface TimeSlotGridProps {
  selectedDate: Date | null;
  availableDates: AvailableDate[];
  onTimeSlotToggle: (date: Date, timeSlot: { start: string; end: string }, isSelected: boolean) => void;
  onBulkSelect: (date: Date, timeSlots: { start: string; end: string }[]) => void;
  className?: string;
}

interface SelectedSlot {
  start: string;
  end: string;
  isExisting: boolean;
}

export const TimeSlotGrid: React.FC<TimeSlotGridProps> = ({
  selectedDate,
  availableDates,
  onTimeSlotToggle,
  onBulkSelect,
  className = ''
}) => {
  const [selectedSlots, setSelectedSlots] = useState<Set<string>>(new Set());
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartSlot, setDragStartSlot] = useState<string | null>(null);

  // Get existing time slots for the selected date
  const getExistingSlots = useCallback(() => {
    if (!selectedDate) return new Set<string>();
    
    return new Set(
      availableDates
        .filter(date => {
          const dateObj = new Date(date.date);
          return (
            dateObj.toDateString() === selectedDate.toDateString() &&
            !date.isRecurring
          );
        })
        .map(date => `${date.startTime}_${date.endTime}`)
    );
  }, [selectedDate, availableDates]);

  const existingSlots = getExistingSlots();

  // Check if a time slot is available (not booked)
  const isSlotAvailable = useCallback((timeSlot: { start: string; end: string }) => {
    if (!selectedDate) return false;
    
    const existingSlot = availableDates.find(date => {
      const dateObj = new Date(date.date);
      return (
        dateObj.toDateString() === selectedDate.toDateString() &&
        date.startTime === timeSlot.start &&
        date.endTime === timeSlot.end &&
        !date.isRecurring
      );
    });
    
    return existingSlot ? !existingSlot.isBooked : false;
  }, [selectedDate, availableDates]);

  // Handle mouse down on time slot
  const handleMouseDown = (timeSlot: { start: string; end: string }) => {
    if (!selectedDate) return;
    
    const slotKey = `${timeSlot.start}_${timeSlot.end}`;
    setIsDragging(true);
    setDragStartSlot(slotKey);
    
    // Toggle the clicked slot
    const newSelectedSlots = new Set(selectedSlots);
    if (newSelectedSlots.has(slotKey)) {
      newSelectedSlots.delete(slotKey);
    } else {
      newSelectedSlots.add(slotKey);
    }
    setSelectedSlots(newSelectedSlots);
  };

  // Handle mouse enter during drag
  const handleMouseEnter = (timeSlot: { start: string; end: string }) => {
    if (!isDragging || !dragStartSlot || !selectedDate) return;
    
    const slotKey = `${timeSlot.start}_${timeSlot.end}`;
    const startIndex = TIME_SLOTS.findIndex(slot => `${slot.start}_${slot.end}` === dragStartSlot);
    const currentIndex = TIME_SLOTS.findIndex(slot => `${slot.start}_${slot.end}` === slotKey);
    
    if (startIndex === -1 || currentIndex === -1) return;
    
    // Select range from start to current
    const newSelectedSlots = new Set<string>();
    const minIndex = Math.min(startIndex, currentIndex);
    const maxIndex = Math.max(startIndex, currentIndex);
    
    for (let i = minIndex; i <= maxIndex; i++) {
      const slot = TIME_SLOTS[i];
      newSelectedSlots.add(`${slot.start}_${slot.end}`);
    }
    
    setSelectedSlots(newSelectedSlots);
  };

  // Handle mouse up
  const handleMouseUp = () => {
    setIsDragging(false);
    setDragStartSlot(null);
  };

  // Apply selected time slots
  const handleApplySelection = () => {
    if (!selectedDate || selectedSlots.size === 0) return;
    
    const slotsToApply = Array.from(selectedSlots).map(slotKey => {
      const [start, end] = slotKey.split('_');
      return { start, end };
    });
    
    onBulkSelect(selectedDate, slotsToApply);
    setSelectedSlots(new Set());
  };

  // Clear selection
  const handleClearSelection = () => {
    setSelectedSlots(new Set());
  };

  // Toggle individual slot
  const handleSlotClick = (timeSlot: { start: string; end: string }) => {
    if (!selectedDate) return;
    
    const slotKey = `${timeSlot.start}_${timeSlot.end}`;
    const isCurrentlySelected = selectedSlots.has(slotKey);
    const isExisting = existingSlots.has(slotKey);
    
    if (isExisting) {
      // Remove existing slot
      onTimeSlotToggle(selectedDate, timeSlot, false);
    } else {
      // Add new slot
      onTimeSlotToggle(selectedDate, timeSlot, true);
    }
  };

  if (!selectedDate) {
    return (
      <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
        <div className="flex items-center justify-center h-64 text-gray-500">
          <div className="text-center">
            <Clock className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium">اختر تاريخاً لإدارة الأوقات المتاحة</p>
            <p className="text-sm text-gray-400 mt-2">انقر على تاريخ في التقويم لبدء إضافة الأوقات المتاحة</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`} onMouseUp={handleMouseUp}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3 space-x-reverse">
          <Clock className="w-6 h-6 text-blue-600" />
          <div>
            <h3 className="text-lg font-semibold text-gray-800">إدارة الأوقات المتاحة</h3>
            <p className="text-sm text-gray-600">
              {selectedDate.toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
          </div>
        </div>
        
        {selectedSlots.size > 0 && (
          <div className="flex items-center space-x-2 space-x-reverse">
            <button
              onClick={handleClearSelection}
              className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 transition-colors"
            >
              إلغاء التحديد
            </button>
            <button
              onClick={handleApplySelection}
              className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 space-x-reverse"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة ({selectedSlots.size})</span>
            </button>
          </div>
        )}
      </div>

      {/* Time Slots Grid */}
      <div className="grid grid-cols-3 gap-3">
        {TIME_SLOTS.map((timeSlot, index) => {
          const slotKey = `${timeSlot.start}_${timeSlot.end}`;
          const isExisting = existingSlots.has(slotKey);
          const isSelected = selectedSlots.has(slotKey);
          const isAvailable = isSlotAvailable(timeSlot);
          const isBooked = isExisting && !isAvailable;
          
          let slotClasses = 'relative p-4 rounded-lg border-2 transition-all duration-200 cursor-pointer select-none';
          
          if (isBooked) {
            slotClasses += ' bg-red-50 border-red-200 cursor-not-allowed';
          } else if (isSelected) {
            slotClasses += ' bg-blue-100 border-blue-400 shadow-md';
          } else if (isExisting) {
            slotClasses += ' bg-green-50 border-green-300 hover:bg-green-100';
          } else {
            slotClasses += ' bg-gray-50 border-gray-200 hover:bg-blue-50 hover:border-blue-300';
          }
          
          return (
            <motion.div
              key={index}
              className={slotClasses}
              onMouseDown={() => !isBooked && handleMouseDown(timeSlot)}
              onMouseEnter={() => !isBooked && handleMouseEnter(timeSlot)}
              onClick={() => !isBooked && handleSlotClick(timeSlot)}
              whileHover={{ scale: isBooked ? 1 : 1.02 }}
              whileTap={{ scale: isBooked ? 1 : 0.98 }}
            >
              <div className="text-center">
                <div className="text-sm font-medium text-gray-800">
                  {formatTimeArabic(timeSlot.start)}
                </div>
                <div className="text-xs text-gray-500 mt-1">إلى</div>
                <div className="text-sm font-medium text-gray-800">
                  {formatTimeArabic(timeSlot.end)}
                </div>
              </div>
              
              {/* Status Indicator */}
              <div className="absolute top-2 left-2">
                {isBooked && (
                  <div className="w-3 h-3 bg-red-500 rounded-full" title="محجوز" />
                )}
                {isExisting && !isBooked && (
                  <div className="w-3 h-3 bg-green-500 rounded-full" title="متاح" />
                )}
                {isSelected && (
                  <div className="w-3 h-3 bg-blue-500 rounded-full" title="محدد" />
                )}
              </div>
              
              {/* Remove Button for Existing Slots */}
              {isExisting && !isBooked && (
                <button
                  className="absolute top-2 right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    onTimeSlotToggle(selectedDate, timeSlot, false);
                  }}
                  title="حذف الوقت"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              )}
            </motion.div>
          );
        })}
      </div>
      
      {/* Legend */}
      <div className="flex items-center justify-center space-x-6 space-x-reverse mt-6 text-sm">
        <div className="flex items-center space-x-2 space-x-reverse">
          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          <span className="text-gray-600">متاح</span>
        </div>
        <div className="flex items-center space-x-2 space-x-reverse">
          <div className="w-3 h-3 bg-red-500 rounded-full"></div>
          <span className="text-gray-600">محجوز</span>
        </div>
        <div className="flex items-center space-x-2 space-x-reverse">
          <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
          <span className="text-gray-600">محدد</span>
        </div>
        <div className="flex items-center space-x-2 space-x-reverse">
          <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
          <span className="text-gray-600">غير متاح</span>
        </div>
      </div>
    </div>
  );
};

export default TimeSlotGrid;