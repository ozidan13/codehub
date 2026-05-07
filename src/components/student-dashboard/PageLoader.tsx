'use client';

import { FC } from 'react';

interface PageLoaderProps {
  compact?: boolean;
  title?: string;
  subtitle?: string;
}

const PageLoader: FC<PageLoaderProps> = ({
  compact,
  title = 'جاري التحميل...',
  subtitle = 'يتم تجهيز لوحة التحكم الخاصة بك.',
}) => {
  if (compact) {
    return (
      <div className="flex items-center justify-center p-8 rounded-2xl border border-white/[0.06] bg-[#111628]/80 backdrop-blur-md">
        <div className="text-center">
          <div className="relative h-10 w-10 mb-3 mx-auto">
            <div className="absolute inset-0 rounded-full border-[3px] border-slate-800" />
            <div className="absolute inset-0 rounded-full border-[3px] border-t-blue-500 border-r-transparent border-b-transparent border-l-transparent animate-spin" />
          </div>
          <p className="text-sm font-semibold text-slate-200">{title}</p>
          <p className="text-xs text-slate-500 mt-1">{subtitle}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#0B0F1E]">
      <div className="text-center">
        <div className="relative h-32 w-32 mb-4 mx-auto">
          <div className="absolute inset-0 rounded-full border-8 border-slate-800" />
          <div className="absolute inset-0 rounded-full border-8 border-t-blue-500 border-r-transparent border-b-transparent border-l-transparent animate-spin" />
        </div>
        <h2 className="text-2xl font-semibold text-slate-200">{title}</h2>
        <p className="text-slate-500 mt-2">{subtitle}</p>
      </div>
    </div>
  );
};

export default PageLoader;
