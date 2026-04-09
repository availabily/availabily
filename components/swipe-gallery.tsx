'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import { cn } from '@/lib/cn';

interface SwipeGalleryProps {
  images: string[];
  className?: string;
}

export function SwipeGallery({ images, className }: SwipeGalleryProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const handleScroll = useCallback(() => {
    const container = scrollRef.current;
    if (!container) return;
    const scrollLeft = container.scrollLeft;
    const cardWidth = container.offsetWidth * 0.82;
    const gap = 12;
    const index = Math.round(scrollLeft / (cardWidth + gap));
    setActiveIndex(Math.min(index, images.length - 1));
  }, [images.length]);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;
    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  if (images.length === 0) return null;

  return (
    <div className={cn('', className)}>
      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto snap-x snap-mandatory pb-3 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
        style={{ scrollPaddingLeft: '4px' }}
      >
        {images.map((url, idx) => (
          <div
            key={idx}
            className="flex-none w-[82%] snap-start"
          >
            <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-slate-100">
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
      {images.length > 1 && (
        <div className="flex items-center justify-center gap-1.5 mt-2">
          {images.map((_, idx) => (
            <span
              key={idx}
              className={cn(
                'w-1.5 h-1.5 rounded-full transition-all duration-200',
                idx === activeIndex ? 'bg-indigo-500 w-3' : 'bg-slate-300'
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}
