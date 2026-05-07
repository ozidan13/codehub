'use client';

import { useState, FC } from 'react';
import { BookOpen, XCircle, GraduationCap, Clock, Activity, ArrowUp, ExternalLink, ShoppingCart, RefreshCw, CheckCircle, Star, Target, Trophy, FileText, Play } from 'lucide-react';
import { Platform, Enrollment, Task } from '@/types';
import { formatDate } from '@/lib/dateUtils';

const getTaskStatus = (task: Task) => {
  const submission = task.submissions?.[0];
  if (submission?.status === 'APPROVED') return { status: 'completed', color: 'text-green-500', icon: CheckCircle, text: 'مكتمل' };
  if (submission?.status === 'PENDING') return { status: 'pending', color: 'text-yellow-500', icon: Clock, text: 'قيد المراجعة' };
  if (submission?.status === 'REJECTED') return { status: 'rejected', color: 'text-red-500', icon: XCircle, text: 'مرفوض' };
  return { status: 'not_started', color: 'text-gray-400', icon: Star, text: 'لم يبدأ' };
};

const TaskCard: FC<{ task: Task; onClick: () => void }> = ({ task, onClick }) => {
  const taskStatus = getTaskStatus(task);
  const StatusIcon = taskStatus.icon;
  const submission = task.submissions?.[0];
  const difficultyMap = { EASY: 'سهل', MEDIUM: 'متوسط', HARD: 'صعب' };
  const difficultyColors = {
    EASY: {
      bg: 'bg-gradient-to-r from-emerald-500/10 to-emerald-500/10',
      text: 'text-emerald-400',
      border: 'border-emerald-500/20',
      icon: 'text-emerald-400'
    },
    MEDIUM: {
      bg: 'bg-gradient-to-r from-amber-500/10 to-amber-500/10',
      text: 'text-amber-400',
      border: 'border-amber-500/20',
      icon: 'text-amber-400'
    },
    HARD: {
      bg: 'bg-gradient-to-r from-rose-500/10 to-rose-500/10',
      text: 'text-rose-400',
      border: 'border-rose-500/20',
      icon: 'text-rose-400'
    },
  };

  // Fallback for undefined difficulty
  const difficulty = task.difficulty || 'MEDIUM';
  const currentDifficultyColors = difficultyColors[difficulty as keyof typeof difficultyColors] || difficultyColors.MEDIUM;

  const scorePercentage = submission?.score ? (submission.score / 100) * 100 : 0;
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'from-green-400 to-emerald-500';
    if (score >= 60) return 'from-blue-400 to-blue-500';
    if (score >= 40) return 'from-yellow-400 to-orange-500';
    return 'from-red-400 to-red-500';
  };

  return (
    <div
      onClick={onClick}
      className="group relative border border-white/[0.06] bg-[#111628]/80 backdrop-blur-md rounded-xl sm:rounded-2xl p-3 sm:p-4 lg:p-6 transition-all duration-500 hover:shadow-2xl hover:border-blue-500/30 hover:scale-[1.03] hover:-translate-y-1 cursor-pointer overflow-hidden"
    >
      {/* Animated Background Pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

      {/* Status Indicator */}
      <div className={`absolute top-0 right-0 w-2 h-2 sm:w-3 sm:h-3 rounded-full m-2 sm:m-3 ${taskStatus.color.includes('green') ? 'bg-emerald-400' : taskStatus.color.includes('yellow') ? 'bg-amber-400' : taskStatus.color.includes('blue') ? 'bg-blue-400' : 'bg-slate-500'} animate-pulse`}></div>

      <div className="relative z-10">
        <div className="flex justify-between items-start mb-2 sm:mb-3 lg:mb-4">
          <div className="flex-1 pr-2 sm:pr-3 lg:pr-4">
            <h3 className="font-bold text-sm sm:text-base lg:text-lg text-slate-200 group-hover:text-blue-400 transition-colors duration-300 leading-tight">{task.title}</h3>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 sm:mt-2 line-clamp-2 leading-relaxed hidden sm:block">{task.description}</p>
          </div>
          <div className={`p-1.5 sm:p-2 lg:p-3 rounded-lg sm:rounded-xl lg:rounded-2xl shadow-lg ${currentDifficultyColors.bg} ${currentDifficultyColors.border} border group-hover:scale-110 transition-transform duration-300`}>
            <StatusIcon className={`h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 transition-colors duration-300 ${taskStatus.color}`} />
          </div>
        </div>

        {/* Score Display with Progress */}
        {submission?.score !== null && submission?.score !== undefined && (
          <div className="mb-2 sm:mb-3 lg:mb-4 p-2 sm:p-3 lg:p-4 bg-white/[0.03] rounded-lg sm:rounded-xl lg:rounded-2xl border border-white/[0.06]">
            <div className="flex items-center justify-between mb-1 sm:mb-2">
              <div className="flex items-center gap-1 sm:gap-2">
                <div className="p-1 sm:p-1.5 lg:p-2 bg-amber-500/10 rounded-lg sm:rounded-xl border border-amber-500/20">
                  <Trophy className="w-3 h-3 sm:w-4 sm:h-4 text-amber-400" />
                </div>
                <span className="text-xs sm:text-sm font-semibold text-slate-300 hidden sm:inline">النتيجة</span>
              </div>
              <span className={`text-sm sm:text-base lg:text-lg font-bold ${
                submission.score >= 80 ? 'text-emerald-400' :
                submission.score >= 60 ? 'text-blue-400' :
                submission.score >= 40 ? 'text-amber-400' : 'text-rose-400'
              }`}>
                {submission.score}/100
              </span>
            </div>
            {/* Score Progress Bar */}
            <div className="w-full bg-slate-700/50 rounded-full h-1.5 sm:h-2 overflow-hidden">
              <div
                className={`h-full bg-gradient-to-r ${getScoreColor(submission.score)} rounded-full transition-all duration-1000 ease-out`}
                style={{ width: `${scorePercentage}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Enhanced Feedback Display */}
        {submission?.feedback && (submission.status === 'APPROVED' || submission.status === 'REJECTED') && (
          <div className="mb-2 sm:mb-3 lg:mb-4 p-2 sm:p-3 lg:p-4 bg-white/[0.03] rounded-lg sm:rounded-xl lg:rounded-2xl border border-white/[0.06] shadow-sm hidden sm:block">
            <div className="flex items-center gap-2 mb-2 sm:mb-3">
              <div className="p-1.5 sm:p-2 bg-blue-500/10 rounded-lg sm:rounded-xl border border-blue-500/20">
                <FileText className="w-3 h-3 sm:w-4 sm:h-4 text-blue-400" />
              </div>
              <span className="text-xs sm:text-sm font-semibold text-slate-300">ملاحظات المدرب</span>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed bg-white/[0.03] p-2 sm:p-3 rounded-lg sm:rounded-xl border border-white/[0.06]">{submission.feedback}</p>
          </div>
        )}

        {/* Enhanced Footer */}
        <div className="flex justify-between items-center pt-2 sm:pt-3 lg:pt-4 border-t border-white/[0.06]">
          <div className="flex items-center gap-1 sm:gap-2">
             <div className={`p-1 sm:p-1.5 lg:p-2 rounded-lg sm:rounded-xl ${currentDifficultyColors.bg} ${currentDifficultyColors.border} border`}>
               <Target className={`h-3 w-3 sm:h-4 sm:w-4 ${currentDifficultyColors.icon}`} />
             </div>
             <span className={`text-xs sm:text-sm font-semibold ${currentDifficultyColors.text} hidden sm:inline`}>
               {difficultyMap[difficulty as keyof typeof difficultyMap] || 'متوسط'}
             </span>
           </div>

          <div className="flex items-center gap-1 sm:gap-2">
            <div className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${
              taskStatus.color.includes('green') ? 'bg-emerald-400' :
              taskStatus.color.includes('yellow') ? 'bg-amber-400' :
              taskStatus.color.includes('blue') ? 'bg-blue-400' : 'bg-slate-500'
            } animate-pulse`}></div>
            <span className={`text-xs sm:text-sm font-semibold ${taskStatus.color} hidden sm:inline`}>{taskStatus.text}</span>
          </div>
        </div>

        {/* Hover Effect Indicator */}
        <div className="absolute bottom-1 sm:bottom-2 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 hidden sm:block">
          <div className="flex items-center gap-1 text-xs text-blue-400 font-medium">
            <Play className="h-3 w-3" />
            <span>انقر للتفاصيل</span>
          </div>
        </div>
      </div>

      {/* Glow Effect */}
      <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-20 transition-opacity duration-500 blur-xl"></div>
    </div>
  );
};

const PlatformCard: FC<{ platform: Platform; enrollments: Enrollment[]; onTaskClick: (task: Task) => void; onEnrollmentSuccess: () => void }> = ({ platform, enrollments, onTaskClick, onEnrollmentSuccess }) => {
  const enrollment = enrollments.find(e => e.platform.id === platform.id);
  const isEnrolled = !!enrollment;
  const isActive = enrollment && enrollment.status !== 'expired';
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [isRenewing, setIsRenewing] = useState(false);

  const handleRenewEnrollment = async () => {
    if (!enrollment) return;

    setIsRenewing(true);
    try {
      const response = await fetch('/api/enrollments', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enrollmentId: enrollment.id }),
      });

      if (response.ok) {
        onEnrollmentSuccess();
      } else {
        const error = await response.json();
        alert(error.error || 'فشل في تجديد الاشتراك');
      }
    } catch (error) {
      console.error('Renewal error:', error);
      alert('حدث خطأ أثناء تجديد الاشتراك');
    } finally {
      setIsRenewing(false);
    }
  };

  const handleEnroll = async () => {
    setIsEnrolling(true);
    try {
      const response = await fetch('/api/enrollments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platformId: platform.id }),
      });
      if (response.ok) {
        onEnrollmentSuccess();
      } else {
        const error = await response.json();
        alert(`فشل الاشتراك: ${error.error}`);
      }
    } catch (error) {
      console.error('Enrollment error:', error);
      alert('حدث خطأ أثناء الاشتراك.');
    } finally {
      setIsEnrolling(false);
    }
  };

  return (
    <div className="group relative rounded-xl sm:rounded-2xl lg:rounded-3xl overflow-hidden transition-all duration-500 hover:shadow-2xl border border-white/[0.06] bg-[#111628]/80 shadow-lg shadow-black/20">
      {/* Animated Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

      {/* Status Indicator Bar */}
      <div className={`h-1 w-full ${
        !isEnrolled ? 'bg-slate-600' :
        enrollment?.status === 'expired' ? 'bg-gradient-to-r from-rose-400 to-rose-600' :
        enrollment?.status === 'expiring_soon' ? 'bg-gradient-to-r from-amber-400 to-orange-500' :
        'bg-gradient-to-r from-emerald-400 to-emerald-500'
      }`}></div>

      <div className="relative z-10 p-3 sm:p-4 lg:p-8">
        <div className="flex justify-between items-start mb-3 sm:mb-4 lg:mb-6">
          <div className="flex-1">
            <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
              <div className={`p-2 sm:p-2.5 lg:p-3 rounded-lg sm:rounded-xl lg:rounded-2xl shadow-lg ${
                !isEnrolled ? 'bg-gradient-to-br from-slate-500 to-slate-700' :
                enrollment?.status === 'expired' ? 'bg-gradient-to-br from-rose-400 to-rose-600' :
                enrollment?.status === 'expiring_soon' ? 'bg-gradient-to-br from-amber-400 to-orange-500' :
                'bg-gradient-to-br from-emerald-400 to-emerald-600'
              } text-white group-hover:scale-110 transition-transform duration-300`}>
                <GraduationCap className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6" />
              </div>
              <div>
                <h2 className="text-sm sm:text-lg lg:text-2xl font-bold text-slate-200 group-hover:text-white transition-colors">{platform.name}</h2>
                <p className="text-slate-400 text-xs sm:text-sm mt-0.5 sm:mt-1 hidden sm:block">{platform.description}</p>
              </div>
            </div>

            {/* Enrollment Details */}
            {isEnrolled && enrollment && (
              <div className="mt-2 sm:mt-3 lg:mt-4 space-y-2 sm:space-y-3">
                {/* Expiration Date */}
                {enrollment.expiresAt && (
                  <div className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm bg-white/[0.03] rounded-lg sm:rounded-xl p-2 sm:p-3 border border-white/[0.06]">
                    <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-slate-500" />
                    <span className="text-slate-400 hidden sm:inline">تاريخ الانتهاء:</span>
                    <span className="font-semibold text-slate-200">{formatDate(enrollment.expiresAt)}</span>
                  </div>
                )}

                {/* Days Remaining with Progress */}
                <div className="space-y-1 sm:space-y-2">
                  <div className={`inline-flex items-center px-2 sm:px-3 lg:px-4 py-1 sm:py-1.5 lg:py-2 rounded-lg sm:rounded-xl lg:rounded-2xl text-xs sm:text-sm font-semibold shadow-sm ${
                    enrollment.status === 'expired' ? 'bg-rose-500/10 text-rose-300 border border-rose-500/20' :
                    enrollment.status === 'expiring_soon' ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20' :
                    'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                  }`}>
                    <Activity className="h-3 w-3 sm:h-4 sm:w-4 ml-1 sm:ml-2" />
                    {enrollment.status === 'expired' ? 'منتهي الصلاحية' :
                     enrollment.status === 'expiring_soon' ? `${enrollment.daysRemaining} أيام متبقية` :
                     `${enrollment.daysRemaining} يوم متبقي`}
                  </div>

                  {/* Progress Bar for Days Remaining */}
                  {enrollment.status !== 'expired' && enrollment.daysRemaining !== undefined && (
                    <div className="w-full bg-slate-700/50 rounded-full h-1.5 sm:h-2 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-1000 ${
                          enrollment.status === 'expiring_soon' ? 'bg-gradient-to-r from-amber-400 to-orange-500' :
                          'bg-gradient-to-r from-emerald-400 to-emerald-500'
                        }`}
                        style={{ width: `${Math.min((enrollment.daysRemaining / 30) * 100, 100)}%` }}
                      ></div>
                    </div>
                  )}
                </div>

                {/* Platform URL for active enrollments */}
                {enrollment.status !== 'expired' && platform.url && (
                  <div className="mt-2 sm:mt-3">
                    <a
                      href={platform.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group/link inline-flex items-center gap-1 sm:gap-2 text-blue-400 hover:text-blue-300 text-xs sm:text-sm font-semibold bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 px-2 sm:px-3 lg:px-4 py-1 sm:py-1.5 lg:py-2 rounded-lg sm:rounded-xl transition-all duration-300 hover:scale-105"
                    >
                      <span className="hidden sm:inline">زيارة المنصة</span>
                      <span className="sm:hidden">زيارة</span>
                      <ArrowUp className="h-3 w-3 sm:h-4 sm:w-4 rotate-45 group-hover/link:rotate-12 transition-transform duration-300" />
                    </a>
                  </div>
                )}

                {/* Course Link for active enrollments */}
                {enrollment.status !== 'expired' && platform.courseLink && (
                  <div className="mt-2 sm:mt-3">
                    <a
                      href={platform.courseLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group/link inline-flex items-center gap-1 sm:gap-2 text-emerald-400 hover:text-emerald-300 text-xs sm:text-sm font-semibold bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 px-2 sm:px-3 lg:px-4 py-1 sm:py-1.5 lg:py-2 rounded-lg sm:rounded-xl transition-all duration-300 hover:scale-105"
                    >
                      <span className="hidden sm:inline">رابط الكورس</span>
                      <span className="sm:hidden">كورس</span>
                      <ExternalLink className="h-3 w-3 sm:h-4 sm:w-4 group-hover/link:scale-110 transition-transform duration-300" />
                    </a>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex flex-col items-end space-y-2 sm:space-y-3">
            {/* Price with Enhanced Design */}
            {platform.isPaid && (
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-lg sm:rounded-xl lg:rounded-2xl blur opacity-30"></div>
                <span className="relative bg-gradient-to-r from-amber-500/10 to-orange-500/10 text-amber-300 px-2 sm:px-3 lg:px-4 py-1 sm:py-1.5 lg:py-2 rounded-lg sm:rounded-xl lg:rounded-2xl text-xs sm:text-sm font-bold border border-amber-500/20 shadow-sm">
                  {platform.price} جنية
                </span>
              </div>
            )}

            {/* Enhanced Enrollment Status and Actions */}
            {!isEnrolled ? (
              <button
                onClick={handleEnroll}
                disabled={isEnrolling}
                className="group/btn relative overflow-hidden bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-3 sm:px-4 lg:px-6 py-2 sm:py-2.5 lg:py-3 rounded-lg sm:rounded-xl lg:rounded-2xl text-xs sm:text-sm lg:text-base font-semibold transition-all duration-300 hover:scale-105 hover:shadow-lg disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300"></div>
                <div className="relative flex items-center gap-2">
                  <ShoppingCart className={`h-3 w-3 sm:h-4 sm:w-4 ${isEnrolling ? 'animate-bounce' : 'group-hover/btn:scale-110'} transition-transform duration-300`} />
                  <span className="hidden sm:inline">{isEnrolling ? 'جاري الاشتراك...' : 'اشترك الآن'}</span>
                  <span className="sm:hidden">{isEnrolling ? '...' : 'اشترك'}</span>
                </div>
              </button>
            ) : enrollment?.status === 'expired' ? (
              <button
                onClick={handleRenewEnrollment}
                disabled={isRenewing}
                className="group/btn relative overflow-hidden bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-3 sm:px-4 lg:px-6 py-2 sm:py-2.5 lg:py-3 rounded-lg sm:rounded-xl lg:rounded-2xl text-xs sm:text-sm lg:text-base font-semibold transition-all duration-300 hover:scale-105 hover:shadow-lg disabled:from-gray-400 disabled:to-gray-500"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300"></div>
                <div className="relative flex items-center gap-2">
                  <RefreshCw className={`h-3 w-3 sm:h-4 sm:w-4 ${isRenewing ? 'animate-spin' : 'group-hover/btn:rotate-180'} transition-transform duration-500`} />
                  <span className="hidden sm:inline">{isRenewing ? 'جاري التجديد...' : 'تجديد الاشتراك'}</span>
                  <span className="sm:hidden">{isRenewing ? '...' : 'تجديد'}</span>
                </div>
              </button>
            ) : enrollment?.status === 'expiring_soon' ? (
              <button
                onClick={handleRenewEnrollment}
                disabled={isRenewing}
                className="group/btn relative overflow-hidden bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white px-3 sm:px-4 lg:px-6 py-2 sm:py-2.5 lg:py-3 rounded-lg sm:rounded-xl lg:rounded-2xl text-xs sm:text-sm lg:text-base font-semibold transition-all duration-300 hover:scale-105 hover:shadow-lg disabled:from-gray-400 disabled:to-gray-500"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300"></div>
                <div className="relative flex items-center gap-2">
                  <RefreshCw className={`h-3 w-3 sm:h-4 sm:w-4 ${isRenewing ? 'animate-spin' : 'group-hover/btn:rotate-180'} transition-transform duration-500`} />
                  <span className="hidden sm:inline">{isRenewing ? 'جاري التجديد...' : 'تجديد مبكر'}</span>
                  <span className="sm:hidden">{isRenewing ? '...' : 'تجديد مبكر'}</span>
                </div>
              </button>
            ) : (
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-500 rounded-lg sm:rounded-xl lg:rounded-2xl blur opacity-30"></div>
                <span className="relative bg-gradient-to-r from-emerald-500/10 to-emerald-500/10 text-emerald-300 px-2 sm:px-3 lg:px-4 py-1 sm:py-1.5 lg:py-2 rounded-lg sm:rounded-xl lg:rounded-2xl text-xs sm:text-sm font-bold border border-emerald-500/20 shadow-sm flex items-center gap-1 sm:gap-2">
                  <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">مشترك ونشط</span>
                  <span className="sm:hidden">نشط</span>
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="p-3 sm:p-4 lg:p-6 grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-5">
        {isActive ? (
          platform.tasks.map((task) => (
            <TaskCard key={task.id} task={task} onClick={() => onTaskClick(task)} />
          ))
        ) : isEnrolled && enrollment?.status === 'expired' ? (
          <div className="col-span-full text-center py-8">
            <div className="text-rose-400 mb-2">
              <XCircle className="h-12 w-12 mx-auto" />
            </div>
            <p className="text-rose-400 font-medium mb-2">انتهت صلاحية اشتراكك في هذه المنصة</p>
            <p className="text-slate-500 text-sm">يرجى تجديد الاشتراك للوصول إلى المهام</p>
          </div>
        ) : (
          <div className="col-span-full text-center py-8">
            <div className="text-slate-500 mb-2">
              <BookOpen className="h-12 w-12 mx-auto" />
            </div>
            <p className="text-slate-400">يجب الاشتراك في المنصة لعرض المهام</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PlatformCard;
