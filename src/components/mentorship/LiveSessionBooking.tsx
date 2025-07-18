import { FC, useState } from 'react';
import { MentorshipData } from '@/types';
import CalendlyStudentCalendar from '@/components/calendar/CalendlyStudentCalendar';

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
      (d) => new Date(d.date).toDateString() === selectedDate.toDateString() && d.timeSlot === selectedTime
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
    <div>
      <h4 className="font-semibold text-lg text-gray-800 mb-4">Select a Date & Time</h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <CalendlyStudentCalendar 
            availableDates={availableDates}
            onDateChange={(date) => {
              setSelectedDate(date);
              setSelectedTime(null);
            }}
          />
        </div>
        <div>
          {selectedDate && (
            <div>
              <h5 className="font-semibold text-gray-700 mb-3">Available Times for {selectedDate.toLocaleDateString()}</h5>
              <div className="grid grid-cols-3 gap-2">
                {availableTimesForSelectedDate.map((time) => (
                  <button 
                    key={time.id}
                    onClick={() => setSelectedTime(time.timeSlot)}
                    className={`p-2 rounded-lg text-center transition-colors ${selectedTime === time.timeSlot ? 'bg-orange-500 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}>
                    {time.timeSlot}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      {selectedDate && selectedTime && (
        <div className="mt-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="whatsapp" className="block text-sm font-medium text-gray-700 mb-2">
                WhatsApp Number *
              </label>
              <input
                id="whatsapp"
                type="tel"
                value={whatsappNumber}
                onChange={(e) => setWhatsappNumber(e.target.value)}
                placeholder="+966 50 123 4567"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                required
              />
            </div>
            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
                Notes (Optional)
              </label>
              <textarea
                id="notes"
                value={studentNotes}
                onChange={(e) => setStudentNotes(e.target.value)}
                placeholder="Any specific topics or questions..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 resize-none"
              />
            </div>
          </div>
          <div className="text-center">
            <button 
              onClick={handleBooking}
              disabled={isBooking || !whatsappNumber.trim()}
              className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg transition-colors disabled:bg-gray-400 text-lg font-medium">
              {isBooking ? 'Booking...' : 'Confirm Booking'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveSessionBooking;