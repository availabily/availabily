'use client';

import { cn } from '@/lib/cn';

interface QuickFactsRowProps {
  serviceCategory?: string;
  location?: string;
  /** Optional estimated response time in minutes. If provided, shows a "responds quickly" chip. */
  responseTimeMinutes?: number;
  trustBulletsCount?: number;
  className?: string;
}

function CategoryIcon() {
  return (
    <svg className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
    </svg>
  );
}

function PinIcon() {
  return (
    <svg className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
    </svg>
  );
}

function StarIcon() {
  return (
    <svg className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
  );
}

interface ChipProps {
  icon: React.ReactNode;
  label: string;
  colorClass: string;
}

function Chip({ icon, label, colorClass }: ChipProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 flex-none rounded-full px-3 py-1.5 text-xs font-semibold whitespace-nowrap min-h-[36px]',
        colorClass
      )}
    >
      {icon}
      {label}
    </span>
  );
}

function getResponseLabel(minutes: number): string {
  if (minutes < 60) return 'Responds quickly';
  if (minutes < 180) return 'Usually responds in 1–3 hrs';
  if (minutes < 1440) return 'Responds same day';
  return 'Responds within 24 hrs';
}

export function QuickFactsRow({
  serviceCategory,
  location,
  responseTimeMinutes,
  trustBulletsCount,
  className,
}: QuickFactsRowProps) {
  const chips: ChipProps[] = [];

  if (serviceCategory) {
    chips.push({
      icon: <CategoryIcon />,
      label: serviceCategory,
      colorClass: 'bg-brand-50 border border-brand-100 text-brand-700',
    });
  }

  if (location) {
    chips.push({
      icon: <PinIcon />,
      label: location,
      colorClass: 'bg-slate-100 border border-slate-200 text-slate-700',
    });
  }

  if (responseTimeMinutes !== undefined) {
    chips.push({
      icon: <ClockIcon />,
      label: getResponseLabel(responseTimeMinutes),
      colorClass: 'bg-emerald-50 border border-emerald-100 text-emerald-700',
    });
  }

  if (trustBulletsCount && trustBulletsCount > 0) {
    chips.push({
      icon: <StarIcon />,
      label: `${trustBulletsCount} trust badge${trustBulletsCount !== 1 ? 's' : ''}`,
      colorClass: 'bg-amber-50 border border-amber-100 text-amber-700',
    });
  }

  if (chips.length === 0) return null;

  return (
    <div
      className={cn(
        'flex gap-2 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden touch-scroll-x',
        className
      )}
    >
      {chips.map((chip, idx) => (
        <Chip key={idx} {...chip} />
      ))}
    </div>
  );
}
