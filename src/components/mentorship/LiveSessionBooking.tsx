import { FC, useState } from 'react';
import { MentorshipData } from '@/types';
import CalendlyStudentCalendar from '@/components/calendar/CalendlyStudentCalendar';
import { formatTimeRange } from '@/lib/dateUtils';
import { Calendar, Clock, MessageSquare, Phone, CheckCircle } from 'lucide-react';

interface LiveSessionBookingProps {
  availableDates: MentorshipData['availableDates'];
  onBookingSuccess: () => void;
}

const LiveSessionBooking: FC<LiveSessionBookingProps> = ({ availableDates, onBookingSuccess }) => {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [whatsappNumber, setWhatsappNumber] = useState<string>('');
  const [studentNotes, setStudentNotes] = useState<string>('');
  const [isBooking, setIsBooking] = useState(false);

  const handleBooking = async () => {
    if (!selectedDate || !selectedTime) return;

    if (!whatsappNumber.trim()) {
      alert('WhatsApp number is required for face-to-face sessions.');
      return;
    }

    // Find the selected date/time combination to get the ID
    const selectedDateTimeSlot = availableDates.find(
      (d) => new Date(d.date).toDateString() === selectedDate.toDateString() && 
            formatTimeRange(d.startTime, d.endTime) === selectedTime
    );

    if (!selectedDateTimeSlot) {
      alert('Selected time slot is no longer available.');
      return;
    }

    setIsBooking(true);
    try {
      const response = await fetch('/api/mentorship', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          sessionType: 'FACE_TO_FACE',
          duration: 60,
          selectedDateId: selectedDateTimeSlot.id,
          whatsappNumber: whatsappNumber.trim(),
          studentNotes: studentNotes.trim()
        }),
      });

      if (response.ok) {
        onBookingSuccess();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to book session.');
      }
    } catch (error) {
      console.error('Booking error:', error);
      alert('An error occurred while booking the session.');
    } finally {
      setIsBooking(false);
    }
  };

  const availableTimesForSelectedDate = selectedDate
    ? availableDates.filter(
        (d) => new Date(d.date).toDateString() === selectedDate.toDateString()
      )
    : [];

  return (
    <div className="space-y-8">
      {/* Enhanced Header */}
      <div className="text-center">
        <div className="flex items-center justify-center space-x-3 space-x-reverse mb-4">
          <div className="p-3 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl text-white shadow-lg">
            <Calendar className="w-6 h-6" />
          </div>
          <h4 className="text-2xl font-bold text-gray-800">احجز جلستك المباشرة</h4>
        </div>
        <p className="text-gray-600 max-w-md mx-auto">اختر التاريخ والوقت المناسب لك لبدء رحلة التعلم</p>
      </div>

      {/* Enhanced Main Content */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Calendar Section */}
        <div className="bg-gradient-to-br from-white to-orange-50/30 rounded-2xl shadow-lg border border-orange-100/50 p-6">
          <div className="flex items-center space-x-3 space-x-reverse mb-6">
            <Calendar className="w-5 h-5 text-orange-600" />
            <h5 className="text-lg font-bold text-gray-800">اختر التاريخ</h5>
          </div>
          <CalendlyStudentCalendar 
            availableDates={availableDates}
            onDateChange={(date) => {
              setSelectedDate(date);
              setSelectedTime(null);
            }}
            className="bg-transparent shadow-none"
          />
        </div>

        {/* Time Selection Section */}
        <div className="bg-gradient-to-br from-white to-blue-50/30 rounded-2xl shadow-lg border border-blue-100/50 p-6">
          <div className="flex items-center space-x-3 space-x-reverse mb-6">
            <h5 className="text-lg font-bold text-gray-800">اختر الوقت</h5>
          </div>
          
          {selectedDate ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {availableTimesForSelectedDate.map((time) => {
                  const formattedTime = formatTimeRange(time.startTime, time.endTime);
                  const isSelected = selectedTime === formattedTime;
                  return (
                    <button 
                      key={time.id}
                      onClick={() => setSelectedTime(formattedTime)}
                      className={`p-4 rounded-xl text-center transition-all duration-200 transform hover:scale-105 font-medium ${
                        isSelected 
                          ? 'bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-lg ring-2 ring-orange-200' 
                          : 'bg-white hover:bg-orange-50 text-gray-700 border border-gray-200 hover:border-orange-300 shadow-sm'
                      }`}>
                      <div className="text-sm">{formattedTime}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 font-medium">اختر تاريخاً أولاً لعرض الأوقات المتاحة</p>
            </div>
          )}
        </div>
      </div>
      {/* Enhanced Booking Form */}
      {selectedDate && selectedTime && (
        <div className="bg-gradient-to-br from-white to-green-50/30 rounded-2xl shadow-lg border border-green-100/50 p-8 space-y-6">
          {/* Booking Summary */}
          <div className="bg-green-50 border border-green-200 rounded-xl p-6">
            <div className="flex items-center space-x-3 space-x-reverse mb-4">
              <CheckCircle className="w-6 h-6 text-green-600" />
              <h6 className="text-lg font-bold text-green-800">ملخص الحجز</h6>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div className="flex items-center space-x-2 space-x-reverse">
                <span className="text-green-700 font-medium">{selectedTime}</span>
              </div>
            </div>
          </div>

          {/* Form Fields */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label htmlFor="whatsapp" className="flex items-center space-x-2 space-x-reverse text-sm font-bold text-gray-700">
                <Phone className="w-4 h-4 text-orange-600" />
                <span>رقم الواتساب *</span>
              </label>
              <input
                id="whatsapp"
                type="tel"
                value={whatsappNumber}
                onChange={(e) => setWhatsappNumber(e.target.value)}
                placeholder="+966 50 123 4567"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200 bg-white shadow-sm"
                required
              />
              <p className="text-xs text-gray-500 flex items-center space-x-1 space-x-reverse">
                <Phone className="w-3 h-3" />
                <span>سيتم التواصل معك عبر هذا الرقم</span>
              </p>
            </div>
            
            <div className="space-y-2">
              <label htmlFor="notes" className="flex items-center space-x-2 space-x-reverse text-sm font-bold text-gray-700">
                <MessageSquare className="w-4 h-4 text-blue-600" />
                <span>ملاحظات (اختياري)</span>
              </label>
              <textarea
                id="notes"
                value={studentNotes}
                onChange={(e) => setStudentNotes(e.target.value)}
                placeholder="أي مواضيع محددة أو أسئلة تريد مناقشتها..."
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 resize-none transition-all duration-200 bg-white shadow-sm"
              />
              <p className="text-xs text-gray-500 flex items-center space-x-1 space-x-reverse">
                <MessageSquare className="w-3 h-3" />
                <span>ساعدنا في تحضير الجلسة بشكل أفضل</span>
              </p>
            </div>
          </div>

          {/* Enhanced Booking Button */}
          <div className="text-center pt-4">
            <button 
              onClick={handleBooking}
              disabled={isBooking || !whatsappNumber.trim()}
              className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-8 py-4 rounded-xl transition-all duration-200 disabled:from-gray-400 disabled:to-gray-500 text-lg font-bold shadow-lg hover:shadow-xl transform hover:scale-105 disabled:transform-none disabled:hover:scale-100 flex items-center space-x-3 space-x-reverse mx-auto">
              {isBooking ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>جاري الحجز...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5" />
                  <span>تأكيد الحجز</span>
                </>
              )}
            </button>
            
            {!whatsappNumber.trim() && (
              <p className="text-sm text-red-500 mt-3 flex items-center justify-center space-x-1 space-x-reverse">
                <Phone className="w-4 h-4" />
                <span>رقم الواتساب مطلوب للجلسات المباشرة</span>
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveSessionBooking;