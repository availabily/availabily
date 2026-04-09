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

function PlaceholderCard() {
  return (
    <div className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-gradient-to-br from-brand-50 via-white to-brand-100/60 border border-brand-100/80 flex items-center justify-center">
      <div className="flex flex-col items-center text-brand-400">
        <svg
          className="w-10 h-10 mb-1.5 opacity-70"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.6}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <rect x="3" y="4" width="18" height="16" rx="3" />
          <circle cx="9" cy="10" r="1.6" />
          <path d="M3 17l5-5 4 4 3-3 6 6" />
        </svg>
        <span className="text-[11px] font-medium uppercase tracking-wider opacity-70">
          Photo coming soon
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
                <PlaceholderCard />
              </div>
            ))
          : images.map((url, idx) => (
              <div key={idx} className="flex-none w-[82%] snap-start">
                <div className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.06)] group">
                  <img
                    src={url}
                    alt={`Gallery image ${idx + 1}`}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                    loading={idx === 0 ? 'eager' : 'lazy'}
                  />
                  {/* Gradient overlay at bottom */}
                  <div
                    aria-hidden
                    className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/30 to-transparent pointer-events-none"
                  />
                  {/* Image counter overlay */}
                  <div
                    aria-label={`Image ${idx + 1} of ${images.length}`}
                    className="absolute top-3 right-3 rounded-full bg-black/40 backdrop-blur-sm px-2.5 py-1 text-[11px] font-semibold text-white"
                  >
                    {idx + 1} / {images.length}
                  </div>
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
