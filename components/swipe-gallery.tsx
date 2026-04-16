'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import { cn } from '@/lib/cn';

interface SwipeGalleryProps {
  images: string[];
  className?: string;
  /** When true, show placeholder cards if `images` is empty. Default: false. */
  showPlaceholderWhenEmpty?: boolean;
}

const CARD_WIDTH_RATIO = 0.82; // matches w-[82%] in JSX
const CARD_GAP_PX = 12; // matches gap-3
const PLACEHOLDER_COUNT = 3;

const PLACEHOLDER_GRADIENTS = [
  'from-brand-100 via-brand-50 to-violet-100/60',
  'from-violet-100/80 via-white to-brand-100/50',
  'from-brand-50 via-violet-50 to-brand-100/40',
];

const PLACEHOLDER_ICONS = [
  { emoji: '📸', text: 'Add photos to your profile' },
  { emoji: '✨', text: 'Show off your work' },
  { emoji: '🎨', text: 'Make it yours' },
];

function PlaceholderCard({ index }: { index: number }) {
  return (
    <div className={cn(
      'relative aspect-[4/3] rounded-2xl overflow-hidden border border-brand-100/60 flex items-center justify-center',
      'bg-gradient-to-br',
      PLACEHOLDER_GRADIENTS[index % PLACEHOLDER_GRADIENTS.length]
    )}>
      <div className="flex flex-col items-center gap-2 text-center px-6">
        <span className="text-3xl" role="img" aria-hidden>
          {PLACEHOLDER_ICONS[index % PLACEHOLDER_ICONS.length].emoji}
        </span>
        <span className="text-[13px] font-medium text-brand-600/70 leading-snug">
          {PLACEHOLDER_ICONS[index % PLACEHOLDER_ICONS.length].text}
        </span>
      </div>
    </div>
  );
}

export function SwipeGallery({
  images,
  className,
  showPlaceholderWhenEmpty = false,
}: SwipeGalleryProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const useEmptyState = images.length === 0;
  const itemCount = useEmptyState ? PLACEHOLDER_COUNT : images.length;

  const handleScroll = useCallback(() => {
    const container = scrollRef.current;
    if (!container) return;
    const scrollLeft = container.scrollLeft;
    const cardWidth = container.offsetWidth * CARD_WIDTH_RATIO;
    const index = Math.round(scrollLeft / (cardWidth + CARD_GAP_PX));
    setActiveIndex(Math.min(index, itemCount - 1));
  }, [itemCount]);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;
    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  if (useEmptyState && !showPlaceholderWhenEmpty) return null;

  return (
    <div className={cn('', className)}>
      <div
        ref={scrollRef}
        className="touch-scroll-x flex gap-3 overflow-x-auto snap-x snap-mandatory pb-3 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
        style={{ scrollPaddingLeft: '4px' }}
      >
        {useEmptyState
          ? Array.from({ length: PLACEHOLDER_COUNT }).map((_, idx) => (
              <div key={`placeholder-${idx}`} className="flex-none w-[82%] snap-start">
                <PlaceholderCard index={idx} />
              </div>
            ))
          : images.map((url, idx) => (
              <div key={idx} className="flex-none w-[82%] snap-start">
                <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.06)]">
                  <img
                    src={url}
                    alt={`Gallery image ${idx + 1}`}
                    className="w-full h-full object-cover"
                    loading={idx === 0 ? 'eager' : 'lazy'}
                  />
                </div>
              </div>
            ))}
      </div>

      {/* Dot indicators */}
      {itemCount > 1 && (
        <div className="flex items-center justify-center gap-1.5 mt-2">
          {Array.from({ length: itemCount }).map((_, idx) => (
            <span
              key={idx}
              className={cn(
                'h-1.5 rounded-full transition-all duration-200',
                idx === activeIndex ? 'bg-brand-600 w-3' : 'bg-slate-300 w-1.5'
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}
