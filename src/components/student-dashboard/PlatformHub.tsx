'use client';

import { useState, useEffect, FC } from 'react';
import { Box, Code2, Database, Layers, Wifi, Palette, FileCode, Cpu, Globe, Terminal, Codepen, Server, GitBranch, ChevronRight, CheckCircle2, Users } from 'lucide-react';
import { Platform, Enrollment } from '@/types';

const PLATFORM_ICON_MAP: Record<string, { icon: typeof Box; color: string; bg: string }> = {
  'system design': { icon: Box, color: 'text-violet-400', bg: 'bg-violet-500/15' },
  'oop': { icon: Code2, color: 'text-emerald-400', bg: 'bg-emerald-500/15' },
  'object oriented': { icon: Code2, color: 'text-emerald-400', bg: 'bg-emerald-500/15' },
  'database': { icon: Database, color: 'text-blue-400', bg: 'bg-blue-500/15' },
  'solid': { icon: Layers, color: 'text-amber-400', bg: 'bg-amber-500/15' },
  'design pattern': { icon: Layers, color: 'text-amber-400', bg: 'bg-amber-500/15' },
  'network': { icon: Wifi, color: 'text-purple-400', bg: 'bg-purple-500/15' },
  'ui/ux': { icon: Palette, color: 'text-pink-400', bg: 'bg-pink-500/15' },
  'ui ux': { icon: Palette, color: 'text-pink-400', bg: 'bg-pink-500/15' },
  'javascript': { icon: FileCode, color: 'text-yellow-400', bg: 'bg-yellow-500/15' },
  'js': { icon: FileCode, color: 'text-yellow-400', bg: 'bg-yellow-500/15' },
  'interview': { icon: Terminal, color: 'text-yellow-400', bg: 'bg-yellow-500/15' },
  'algorithm': { icon: Cpu, color: 'text-cyan-400', bg: 'bg-cyan-500/15' },
  'data structure': { icon: GitBranch, color: 'text-rose-400', bg: 'bg-rose-500/15' },
  'web': { icon: Globe, color: 'text-sky-400', bg: 'bg-sky-500/15' },
  'frontend': { icon: Codepen, color: 'text-orange-400', bg: 'bg-orange-500/15' },
  'backend': { icon: Server, color: 'text-indigo-400', bg: 'bg-indigo-500/15' },
};

const FALLBACK_ICONS = [
  { icon: Box, color: 'text-violet-400', bg: 'bg-violet-500/15' },
  { icon: Code2, color: 'text-emerald-400', bg: 'bg-emerald-500/15' },
  { icon: Database, color: 'text-blue-400', bg: 'bg-blue-500/15' },
  { icon: Layers, color: 'text-amber-400', bg: 'bg-amber-500/15' },
  { icon: Wifi, color: 'text-purple-400', bg: 'bg-purple-500/15' },
  { icon: Palette, color: 'text-pink-400', bg: 'bg-pink-500/15' },
  { icon: FileCode, color: 'text-yellow-400', bg: 'bg-yellow-500/15' },
  { icon: Cpu, color: 'text-cyan-400', bg: 'bg-cyan-500/15' },
];

export function getPlatformIcon(platformName: string, index: number) {
  const lower = platformName.toLowerCase();
  for (const [key, value] of Object.entries(PLATFORM_ICON_MAP)) {
    if (lower.includes(key)) return value;
  }
  return FALLBACK_ICONS[index % FALLBACK_ICONS.length];
}

const PlatformHubCard: FC<{
  platform: Platform;
  isActive: boolean;
  iconMeta: { icon: typeof Box; color: string; bg: string };
  Icon: typeof Box;
  onClick: () => void;
  delay: number;
}> = ({ platform, isActive, iconMeta, Icon, onClick, delay }) => (
  <button
    type="button"
    onClick={onClick}
    className="group h-full text-left"
    style={{ animationDelay: `${delay}ms` }}
  >
    <span className="flex h-full items-start gap-4 rounded-2xl border border-white/[0.06] bg-[#111628]/80 px-5 py-4 shadow-lg shadow-black/20 backdrop-blur-md transition-all duration-300 hover:border-white/[0.12] hover:bg-[#161d35]/90 hover:scale-[1.02]">
      <span className={`mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconMeta.bg}`}>
        <Icon className={`h-5 w-5 ${iconMeta.color}`} />
      </span>
      <span className="flex-1 min-w-0">
        <span className="block break-words text-sm font-semibold leading-snug text-slate-100 sm:text-base">
          {platform.name}
        </span>
        <span className="mt-1 flex items-center gap-2 text-xs text-slate-400">
          <span className="flex items-center gap-1.5">
            <span className={`h-1.5 w-1.5 rounded-full ${isActive ? 'bg-emerald-400' : 'bg-slate-500'}`} />
            {isActive ? 'Active' : 'Locked'}
          </span>
        </span>
        <span className="mt-1 block text-xs font-medium text-slate-500">
          {platform.tasks?.length || 0} <span className="text-slate-600">Lessons</span>
        </span>
      </span>
      <span className="mt-3 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/[0.04] text-slate-500 transition-colors duration-300 group-hover:bg-white/[0.08] group-hover:text-slate-300">
        <ChevronRight className="h-4 w-4" />
      </span>
    </span>
  </button>
);

const PlatformHub: FC<{ platforms: Platform[]; enrollments: Enrollment[] }> = ({ platforms, enrollments }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const orbitPlatforms = platforms.slice(0, 8);
  const totalTasks = orbitPlatforms.reduce((sum, platform) => sum + (platform.tasks?.length || 0), 0);
  const activeCount = orbitPlatforms.filter((platform) => {
    const enrollment = enrollments.find((item) => item.platform.id === platform.id);
    return !!enrollment && enrollment.status !== 'expired';
  }).length;

  useEffect(() => {
    const timer = window.setTimeout(() => setIsExpanded(true), 120);
    return () => window.clearTimeout(timer);
  }, []);

  const handlePlatformSelect = (platformId: string) => {
    setIsExpanded(true);
    document.getElementById(`platform-${platformId}`)?.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });
  };

  if (orbitPlatforms.length === 0) return null;

  return (
    <section className="relative w-full rounded-3xl bg-[#0B0F1E] shadow-2xl shadow-black/40" aria-label="Coding platform hub">
      {/* Ambient background */}
      <div className="pointer-events-none absolute inset-0 rounded-3xl overflow-hidden">
        <div className="absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-600/5 blur-3xl" />
        <div className="absolute left-1/2 top-1/2 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-600/5 blur-2xl" />
      </div>

      <div className="relative mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        {/* Desktop: 3x3 Grid with center node in middle */}
        <div className="hidden lg:grid lg:grid-cols-3 lg:gap-5 lg:items-center">
          {orbitPlatforms.slice(0, 4).map((platform, index) => {
            const enrollment = enrollments.find((item) => item.platform.id === platform.id);
            const isActive = !!enrollment && enrollment.status !== 'expired';
            const iconMeta = getPlatformIcon(platform.name, index);
            const Icon = iconMeta.icon;
            return (
              <PlatformHubCard
                key={platform.id}
                platform={platform}
                isActive={isActive}
                iconMeta={iconMeta}
                Icon={Icon}
                onClick={() => handlePlatformSelect(platform.id)}
                delay={index * 80}
              />
            );
          })}

          {/* Center Node */}
          <div className="flex items-center justify-center py-4">
            <button
              type="button"
              onClick={() => setIsExpanded((v) => !v)}
              className="group relative flex h-28 w-28 items-center justify-center rounded-full focus:outline-none"
              aria-pressed={isExpanded}
            >
              <span className="absolute inset-0 rounded-full border border-cyan-400/40 shadow-[0_0_20px_rgba(6,182,212,0.25),inset_0_0_20px_rgba(6,182,212,0.1)]" />
              <span className="absolute inset-[3px] rounded-full bg-[#0B0F1E]" />
              <span className="absolute inset-[3px] rounded-full bg-gradient-to-br from-blue-600/20 via-indigo-600/20 to-cyan-500/20" />
              <span className="relative font-black text-3xl tracking-wider text-white">
                C<span className="text-cyan-400">/</span>
              </span>
            </button>
          </div>

          {orbitPlatforms.slice(4, 8).map((platform, index) => {
            const enrollment = enrollments.find((item) => item.platform.id === platform.id);
            const isActive = !!enrollment && enrollment.status !== 'expired';
            const iconMeta = getPlatformIcon(platform.name, index + 4);
            const Icon = iconMeta.icon;
            return (
              <PlatformHubCard
                key={platform.id}
                platform={platform}
                isActive={isActive}
                iconMeta={iconMeta}
                Icon={Icon}
                onClick={() => handlePlatformSelect(platform.id)}
                delay={(index + 4) * 80}
              />
            );
          })}
        </div>

        {/* Tablet: 2-column grid */}
        <div className="hidden sm:grid sm:grid-cols-2 sm:gap-4 lg:hidden">
          {/* Center node full width */}
          <div className="col-span-2 flex justify-center py-6">
            <button
              type="button"
              onClick={() => setIsExpanded((v) => !v)}
              className="group relative flex h-24 w-24 items-center justify-center rounded-full focus:outline-none"
            >
              <span className="absolute inset-0 rounded-full border border-cyan-400/40 shadow-[0_0_20px_rgba(6,182,212,0.25)]" />
              <span className="absolute inset-[3px] rounded-full bg-[#0B0F1E]" />
              <span className="relative font-black text-2xl tracking-wider text-white">
                C<span className="text-cyan-400">/</span>
              </span>
            </button>
          </div>
          {orbitPlatforms.map((platform, index) => {
            const enrollment = enrollments.find((item) => item.platform.id === platform.id);
            const isActive = !!enrollment && enrollment.status !== 'expired';
            const iconMeta = getPlatformIcon(platform.name, index);
            const Icon = iconMeta.icon;
            return (
              <PlatformHubCard
                key={platform.id}
                platform={platform}
                isActive={isActive}
                iconMeta={iconMeta}
                Icon={Icon}
                onClick={() => handlePlatformSelect(platform.id)}
                delay={index * 60}
              />
            );
          })}
        </div>

        {/* Mobile: stacked */}
        <div className="flex flex-col gap-4 sm:hidden">
          <div className="flex justify-center py-4">
            <button
              type="button"
              onClick={() => setIsExpanded((v) => !v)}
              className="group relative flex h-20 w-20 items-center justify-center rounded-full focus:outline-none"
            >
              <span className="absolute inset-0 rounded-full border border-cyan-400/40" />
              <span className="absolute inset-[3px] rounded-full bg-[#0B0F1E]" />
              <span className="relative font-black text-xl tracking-wider text-white">
                C<span className="text-cyan-400">/</span>
              </span>
            </button>
          </div>
          {orbitPlatforms.map((platform, index) => {
            const enrollment = enrollments.find((item) => item.platform.id === platform.id);
            const isActive = !!enrollment && enrollment.status !== 'expired';
            const iconMeta = getPlatformIcon(platform.name, index);
            const Icon = iconMeta.icon;
            return (
              <PlatformHubCard
                key={platform.id}
                platform={platform}
                isActive={isActive}
                iconMeta={iconMeta}
                Icon={Icon}
                onClick={() => handlePlatformSelect(platform.id)}
                delay={index * 60}
              />
            );
          })}
        </div>

        {/* Bottom Stats Bar */}
        <div className={`mt-10 flex flex-wrap items-center justify-center gap-4 sm:gap-6 rounded-2xl border border-white/[0.06] bg-[#111628]/80 px-6 py-4 shadow-lg shadow-black/20 backdrop-blur-md transition-all duration-700 ${isExpanded ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/15">
              <Box className="h-5 w-5 text-emerald-400" />
            </span>
            <div className="flex flex-col">
              <span className="text-lg font-bold leading-none text-slate-100">{activeCount}</span>
              <span className="mt-0.5 text-[11px] font-medium text-slate-500">Active Platforms</span>
            </div>
          </div>
          <span className="hidden h-8 w-px bg-white/[0.08] sm:block" />
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-500/15">
              <CheckCircle2 className="h-5 w-5 text-violet-400" />
            </span>
            <div className="flex flex-col">
              <span className="text-lg font-bold leading-none text-slate-100">{totalTasks}</span>
              <span className="mt-0.5 text-[11px] font-medium text-slate-500">Lessons Completed</span>
            </div>
          </div>
          <span className="hidden h-8 w-px bg-white/[0.08] sm:block" />
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/15">
              <Users className="h-5 w-5 text-blue-400" />
            </span>
            <div className="flex flex-col">
              <span className="text-lg font-bold leading-none text-slate-100">{orbitPlatforms.length}</span>
              <span className="mt-0.5 text-[11px] font-medium text-slate-500">Platforms</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PlatformHub;
