'use client';

import { FC, ReactNode } from 'react';
import { FileText, CheckCircle, Clock, Trophy, BarChart3, Activity, ArrowUp, ArrowDown, Medal, Sparkles, Award, Target, TrendingUp } from 'lucide-react';
import { StudentStats } from '@/types';

const EnhancedStatCard: FC<{
  icon: ReactNode;
  title: string;
  value: number | string;
  color: 'blue' | 'green' | 'yellow' | 'purple';
  trend?: 'up' | 'down' | 'neutral';
  subtitle?: string;
  progress?: number;
}> = ({ icon, title, value, color, trend = 'neutral', subtitle, progress }) => {
  const colors = {
    blue: {
      gradient: 'from-blue-500 to-blue-600',
      bg: 'bg-blue-500/10',
      text: 'text-blue-400',
      border: 'border-blue-500/20'
    },
    green: {
      gradient: 'from-emerald-500 to-emerald-600',
      bg: 'bg-emerald-500/10',
      text: 'text-emerald-400',
      border: 'border-emerald-500/20'
    },
    yellow: {
      gradient: 'from-amber-500 to-amber-600',
      bg: 'bg-amber-500/10',
      text: 'text-amber-400',
      border: 'border-amber-500/20'
    },
    purple: {
      gradient: 'from-violet-500 to-violet-600',
      bg: 'bg-violet-500/10',
      text: 'text-violet-400',
      border: 'border-violet-500/20'
    },
  };

  const TrendIcon = trend === 'up' ? ArrowUp : trend === 'down' ? ArrowDown : Activity;
  const trendColor = trend === 'up' ? 'text-emerald-400' : trend === 'down' ? 'text-rose-400' : 'text-slate-500';

  return (
    <div className={`p-6 rounded-2xl border ${colors[color].border} bg-[#111628]/80 backdrop-blur-md transition-all duration-200 hover:shadow-lg hover:shadow-black/20`}>
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-xl bg-gradient-to-br ${colors[color].gradient} text-white shadow-sm`}>
          <div className="h-5 w-5">{icon}</div>
        </div>
        <div className={`flex items-center gap-1 ${trendColor}`}>
          <TrendIcon className="h-4 w-4" />
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-medium text-slate-400">{title}</h3>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-semibold text-slate-100">{value}</span>
          {subtitle && <span className="text-xs text-slate-500">{subtitle}</span>}
        </div>

        {/* Minimalist Progress Bar */}
        {progress !== undefined && (
          <div className="mt-3">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
              <span>التقدم</span>
              <span>{progress.toFixed(0)}%</span>
            </div>
            <div className="w-full bg-slate-700/50 rounded-full h-2">
              <div
                className={`h-full bg-gradient-to-r ${colors[color].gradient} rounded-full transition-all duration-500`}
                style={{ width: `${Math.min(progress, 100)}%` }}
              ></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const StatsSection: FC<{ stats: StudentStats | null }> = ({ stats }) => {
  if (!stats) return null;

  const totalTasks = stats.totalSubmissions;
  const completionRate = totalTasks > 0 ? (stats.approvedSubmissions / totalTasks) * 100 : 0;
  const averageScore = stats.averageScore ? Number(stats.averageScore) : 0;

  return (
    <div className="space-y-6">
      {/* Main Stats Grid - Dark Mode */}
      <div className="grid grid-cols-2 gap-4">
        <EnhancedStatCard
          icon={<FileText />}
          title="إجمالي التسليمات"
          value={stats.totalSubmissions}
          color="blue"
          trend={stats.totalSubmissions > 0 ? 'up' : 'neutral'}
          subtitle="مهمة مكتملة"
        />
        <EnhancedStatCard
          icon={<CheckCircle />}
          title="المقبولة"
          value={stats.approvedSubmissions}
          color="green"
          trend={stats.approvedSubmissions > 0 ? 'up' : 'neutral'}
          subtitle="تم قبولها"
          progress={completionRate}
        />
        <EnhancedStatCard
          icon={<Clock />}
          title="قيد المراجعة"
          value={stats.pendingSubmissions}
          color="yellow"
          trend={stats.pendingSubmissions > 0 ? 'up' : 'neutral'}
          subtitle="في انتظار المراجعة"
        />
        <EnhancedStatCard
          icon={<Trophy />}
          title="متوسط الدرجات"
          value={averageScore > 0 ? `${averageScore.toFixed(1)}%` : 'لا يوجد'}
          color="purple"
          trend={averageScore >= 70 ? 'up' : averageScore >= 50 ? 'neutral' : 'down'}
          subtitle="من إجمالي الدرجات"
          progress={averageScore}
        />
      </div>

      {/* Progress Overview - Dark */}
      <div className="rounded-2xl border border-white/[0.06] bg-[#111628]/80 p-6 shadow-lg shadow-black/20">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-slate-200 flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-blue-400" />
            نظرة عامة على الأداء
          </h3>
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Activity className="h-4 w-4" />
            تحديث مباشر
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
          {/* Completion Rate */}
          <div className="text-center">
            <div className="relative w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-2 sm:mb-3">
              <svg className="w-16 h-16 sm:w-20 sm:h-20 transform -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-slate-700"
                  stroke="currentColor"
                  strokeWidth="3"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-emerald-400"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeDasharray={`${completionRate}, 100`}
                  strokeLinecap="round"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-sm sm:text-lg font-bold text-slate-200">{completionRate.toFixed(0)}%</span>
              </div>
            </div>
            <p className="text-xs sm:text-sm font-medium text-slate-300">معدل الإنجاز</p>
            <p className="text-xs text-slate-500 hidden sm:block">من المهام المقبولة</p>
          </div>

          {/* Average Score */}
          <div className="text-center">
            <div className="relative w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-2 sm:mb-3">
              <svg className="w-16 h-16 sm:w-20 sm:h-20 transform -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-slate-700"
                  stroke="currentColor"
                  strokeWidth="3"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className={`${averageScore >= 70 ? 'text-emerald-400' : averageScore >= 50 ? 'text-amber-400' : 'text-rose-400'}`}
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeDasharray={`${averageScore}, 100`}
                  strokeLinecap="round"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-sm sm:text-lg font-bold text-slate-200">{averageScore.toFixed(0)}</span>
              </div>
            </div>
            <p className="text-xs sm:text-sm font-medium text-slate-300">متوسط الدرجات</p>
            <p className="text-xs text-slate-500 hidden sm:block">من 100 درجة</p>
          </div>

          {/* Performance Level */}
          <div className="text-center">
            <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-2 sm:mb-3 flex items-center justify-center">
              {averageScore >= 90 ? (
                <div className="relative">
                  <Medal className="h-8 w-8 sm:h-12 sm:w-12 text-yellow-400" />
                  <Sparkles className="absolute -top-1 -right-1 h-3 w-3 sm:h-4 sm:w-4 text-yellow-300 animate-pulse" />
                </div>
              ) : averageScore >= 70 ? (
                <Award className="h-8 w-8 sm:h-12 sm:w-12 text-emerald-400" />
              ) : averageScore >= 50 ? (
                <Target className="h-8 w-8 sm:h-12 sm:w-12 text-amber-400" />
              ) : (
                <TrendingUp className="h-8 w-8 sm:h-12 sm:w-12 text-blue-400" />
              )}
            </div>
            <p className="text-xs sm:text-sm font-medium text-slate-300">
              {averageScore >= 90 ? 'ممتاز' : averageScore >= 70 ? 'جيد جداً' : averageScore >= 50 ? 'جيد' : 'يحتاج تحسين'}
            </p>
            <p className="text-xs text-slate-500 hidden sm:block">مستوى الأداء</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default StatsSection;
