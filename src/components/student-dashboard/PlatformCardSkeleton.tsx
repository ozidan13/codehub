'use client';

import { FC } from 'react';

const PlatformCardSkeleton: FC = () => (
  <div className="group relative rounded-xl sm:rounded-2xl lg:rounded-3xl overflow-hidden border border-white/[0.06] bg-[#111628]/80 shadow-lg shadow-black/20 animate-pulse">
    <div className="h-1 w-full bg-slate-700" />
    <div className="p-3 sm:p-4 lg:p-8">
      <div className="flex justify-between items-start mb-3 sm:mb-4 lg:mb-6">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="h-11 w-11 sm:h-12 sm:w-12 rounded-xl bg-slate-700" />
          <div className="space-y-2">
            <div className="h-4 w-32 sm:w-48 bg-slate-700 rounded" />
            <div className="h-3 w-24 sm:w-36 bg-slate-700 rounded hidden sm:block" />
          </div>
        </div>
        <div className="h-8 w-20 sm:w-24 bg-slate-700 rounded-lg" />
      </div>
      <div className="space-y-2 sm:space-y-3 mt-2 sm:mt-3">
        <div className="h-3 w-full bg-slate-700 rounded" />
        <div className="h-3 w-3/4 bg-slate-700 rounded" />
      </div>
    </div>
    <div className="p-3 sm:p-4 lg:p-6 grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-5">
      {[1, 2, 3].map((i) => (
        <div key={i} className="border border-white/[0.06] bg-[#111628]/60 rounded-xl sm:rounded-2xl p-3 sm:p-4 lg:p-6">
          <div className="flex justify-between items-start mb-2 sm:mb-3">
            <div className="h-4 w-24 sm:w-32 bg-slate-700 rounded" />
            <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-slate-700" />
          </div>
          <div className="h-3 w-full bg-slate-700 rounded mb-2" />
          <div className="h-2 w-2/3 bg-slate-700 rounded" />
        </div>
      ))}
    </div>
  </div>
);

export default PlatformCardSkeleton;
