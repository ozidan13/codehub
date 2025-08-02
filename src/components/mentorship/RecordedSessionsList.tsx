import { FC, useState } from 'react';
import { MentorshipData } from '@/types';

interface RecordedSessionsListProps {
  sessions: MentorshipData['recordedSessions'];
  onPurchaseSuccess: () => void;
}

const RecordedSessionsList: FC<RecordedSessionsListProps> = ({ sessions, onPurchaseSuccess }) => {
  const [isPurchasing, setIsPurchasing] = useState<string | null>(null);

  const handlePurchase = async (sessionId: string) => {
    setIsPurchasing(sessionId);
    try {
      const response = await fetch('/api/mentorship', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          sessionType: 'RECORDED', 
          recordedSessionId: sessionId,
          duration: 60 // Default duration for recorded sessions
        }),
      });

      if (response.ok) {
        onPurchaseSuccess();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to purchase session.');
      }
    } catch (error) {
      console.error('Purchase error:', error);
      alert('An error occurred while purchasing the session.');
    } finally {
      setIsPurchasing(null);
    }
  };

  return (
    <div className="space-y-4">
      {sessions.map((session) => (
        <div key={session.id} className="bg-gray-50 rounded-lg p-4 flex items-center justify-between transition-shadow hover:shadow-md">
          <div>
            <h4 className="font-semibold text-gray-800">{session.title}</h4>
            <p className="text-sm text-gray-600">{session.description}</p>
          </div>
          <button 
            onClick={() => handlePurchase(session.id)}
            disabled={isPurchasing === session.id}
            className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg transition-colors disabled:bg-gray-400">
            {isPurchasing === session.id ? 'Purchasing...' : `Purchase for ${Number(session.price).toFixed(2)} جنية`}
          </button>
        </div>
      ))}
    </div>
  );
};

export default RecordedSessionsList;