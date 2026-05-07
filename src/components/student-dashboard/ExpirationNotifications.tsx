'use client';

import { FC } from 'react';
import { Clock, XCircle } from 'lucide-react';
import { Enrollment } from '@/types';

const ExpirationNotifications: FC<{ enrollments: Enrollment[] }> = ({ enrollments }) => {
  const expiredEnrollments = enrollments.filter(e => e.status === 'expired');
  const expiringSoonEnrollments = enrollments.filter(e => e.status === 'expiring_soon');

  if (expiredEnrollments.length === 0 && expiringSoonEnrollments.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4 mb-8">
      {expiredEnrollments.length > 0 && (
        <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-4">
          <div className="flex items-center space-x-2 space-x-reverse mb-2">
            <XCircle className="h-5 w-5 text-rose-400" />
            <h3 className="font-semibold text-rose-300">اشتراكات منتهية الصلاحية</h3>
          </div>
          <p className="text-sm text-rose-400/80 mb-3">
            لديك {expiredEnrollments.length} اشتراك منتهي الصلاحية. يرجى التجديد للوصول إلى المحتوى.
          </p>
          <div className="flex flex-wrap gap-2">
            {expiredEnrollments.map(enrollment => (
              <span key={enrollment.id} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-rose-500/15 text-rose-300 border border-rose-500/20">
                {enrollment.platform.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {expiringSoonEnrollments.length > 0 && (
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-4">
          <div className="flex items-center space-x-2 space-x-reverse mb-2">
            <Clock className="h-5 w-5 text-amber-400" />
            <h3 className="font-semibold text-amber-300">اشتراكات تنتهي قريباً</h3>
          </div>
          <p className="text-sm text-amber-400/80 mb-3">
            لديك {expiringSoonEnrollments.length} اشتراك ينتهي خلال 7 أيام. فكر في التجديد المبكر.
          </p>
          <div className="flex flex-wrap gap-2">
            {expiringSoonEnrollments.map(enrollment => (
              <span key={enrollment.id} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-amber-500/15 text-amber-300 border border-amber-500/20">
                {enrollment.platform.name} - {enrollment.daysRemaining} أيام
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default ExpirationNotifications;
