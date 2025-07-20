import { format } from 'date-fns';

export const formatDate = (date: string | Date | null | undefined): string => {
  if (!date) return 'غير محدد';
  try {
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) return 'تاريخ غير صحيح';
    return format(dateObj, 'MMMM d, yyyy');
  } catch (error) {
    return 'تاريخ غير صحيح';
  }
};

export const formatDateTime = (date: string | Date | null | undefined): string => {
  if (!date) return 'غير محدد';
  try {
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) return 'تاريخ غير صحيح';
    return format(dateObj, 'MMMM d, yyyy, h:mm:ss a');
  } catch (error) {
    return 'تاريخ غير صحيح';
  }
};

export const formatTime = (time: string): string => {
  // Convert 24-hour format (HH:MM) to 12-hour format with AM/PM
  const [hours, minutes] = time.split(':');
  const hour = parseInt(hours, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minutes} ${ampm}`;
};

export const formatTimeRange = (startTime: string, endTime: string): string => {
  return `${formatTime(startTime)} - ${formatTime(endTime)}`;
};