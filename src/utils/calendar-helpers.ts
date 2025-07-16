import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, addMonths, subMonths, startOfWeek, endOfWeek, isSameMonth } from 'date-fns';
import { ar } from 'date-fns/locale';

// Time slot configuration
export const TIME_SLOTS = [
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

// Date formatting utilities
export const formatDateArabic = (date: Date): string => {
  return format(date, 'dd / MM / yyyy', { locale: ar });
};

export const formatDateForAPI = (date: Date): string => {
  return date.toISOString();
};

export const formatTimeArabic = (time: string): string => {
  const [hours, minutes] = time.split(':');
  const hour = parseInt(hours);
  const period = hour >= 12 ? 'م' : 'ص';
  const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  return `${displayHour}:${minutes} ${period}`;
};

// Calendar generation utilities
export const generateCalendarDays = (currentDate: Date) => {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 6 }); // Saturday start
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 6 });
  
  return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
};

// Availability checking utilities
export interface AvailableDate {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  isBooked: boolean;
  isRecurring: boolean;
  dayOfWeek?: number;
}

export const isDateAvailable = (date: Date, availableDates: AvailableDate[]): boolean => {
  return availableDates.some(availableDate => {
    const availableDateTime = new Date(availableDate.date);
    return isSameDay(date, availableDateTime) && !availableDate.isBooked && !availableDate.isRecurring;
  });
};

export const getAvailableTimeSlotsForDate = (date: Date, availableDates: AvailableDate[]) => {
  return availableDates.filter(availableDate => {
    const availableDateTime = new Date(availableDate.date);
    return isSameDay(date, availableDateTime) && !availableDate.isBooked && !availableDate.isRecurring;
  });
};

// Calendar navigation utilities
export const getNextMonth = (currentDate: Date): Date => {
  return addMonths(currentDate, 1);
};

export const getPreviousMonth = (currentDate: Date): Date => {
  return subMonths(currentDate, 1);
};

// Date validation utilities
export const isDateInPast = (date: Date): boolean => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const checkDate = new Date(date);
  checkDate.setHours(0, 0, 0, 0);
  return checkDate < today;
};

export const isDateToday = (date: Date): boolean => {
  return isToday(date);
};

export const isDateInCurrentMonth = (date: Date, currentMonth: Date): boolean => {
  return isSameMonth(date, currentMonth);
};

// Time slot utilities
export const createTimeSlotKey = (date: Date, timeSlot: { start: string; end: string }): string => {
  return `${format(date, 'yyyy-MM-dd')}_${timeSlot.start}_${timeSlot.end}`;
};

export const parseTimeSlotKey = (key: string) => {
  const [dateStr, startTime, endTime] = key.split('_');
  return {
    date: new Date(dateStr),
    startTime,
    endTime
  };
};

// Bulk operations utilities
export const generateDateRange = (startDate: Date, endDate: Date): Date[] => {
  return eachDayOfInterval({ start: startDate, end: endDate });
};

export const filterWeekdays = (dates: Date[]): Date[] => {
  return dates.filter(date => {
    const dayOfWeek = date.getDay();
    return dayOfWeek !== 5 && dayOfWeek !== 6; // Exclude Friday (5) and Saturday (6)
  });
};

// Calendar styling utilities
export const getDateCellClasses = (date: Date, currentMonth: Date, availableDates: AvailableDate[]) => {
  const baseClasses = 'w-10 h-10 flex items-center justify-center text-sm rounded-lg cursor-pointer transition-all duration-200';
  
  const isCurrentMonth = isDateInCurrentMonth(date, currentMonth);
  const isPast = isDateInPast(date);
  const isAvailable = isDateAvailable(date, availableDates);
  const isTodayDate = isDateToday(date);
  
  let classes = baseClasses;
  
  if (!isCurrentMonth) {
    classes += ' text-gray-300 cursor-not-allowed';
  } else if (isPast) {
    classes += ' text-gray-400 cursor-not-allowed';
  } else if (isAvailable) {
    classes += ' bg-green-100 text-green-800 hover:bg-green-200';
  } else if (isTodayDate) {
    classes += ' bg-blue-100 text-blue-800 border-2 border-blue-300';
  } else {
    classes += ' text-gray-700 hover:bg-gray-100';
  }
  
  return classes;
};

export const getTimeSlotClasses = (isAvailable: boolean, isSelected: boolean) => {
  const baseClasses = 'px-4 py-2 text-sm rounded-lg border transition-all duration-200 cursor-pointer';
  
  if (isSelected) {
    return `${baseClasses} bg-blue-500 text-white border-blue-500`;
  } else if (isAvailable) {
    return `${baseClasses} bg-white text-gray-700 border-gray-300 hover:bg-blue-50 hover:border-blue-300`;
  } else {
    return `${baseClasses} bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed`;
  }
};