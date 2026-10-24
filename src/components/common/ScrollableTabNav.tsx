import React, { useRef, useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface ScrollableTabNavProps {
  children: React.ReactNode;
  className?: string;
  containerClassName?: string;
}

export const ScrollableTabNav: React.FC<ScrollableTabNavProps> = ({
  children,
  className = '',
  containerClassName = '',
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollLeft(scrollLeft > 4);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 4);
  };

  useEffect(() => {
    checkScroll();
    const el = scrollRef.current;
    if (!el) return;

    // Convert vertical mouse wheel on web to horizontal scroll
    const handleWheel = (e: WheelEvent) => {
      if (e.deltaY === 0) return;
      if (el.scrollWidth > el.clientWidth) {
        e.preventDefault();
        el.scrollLeft += e.deltaY;
        checkScroll();
      }
    };

    el.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('resize', checkScroll);

    // Initial check after a slight delay to ensure fonts/layout settled
    const timer = setTimeout(checkScroll, 100);

    return () => {
      el.removeEventListener('wheel', handleWheel);
      window.removeEventListener('resize', checkScroll);
      clearTimeout(timer);
    };
  }, []);

  const scroll = (direction: 'left' | 'right') => {
    const el = scrollRef.current;
    if (!el) return;
    const scrollAmount = direction === 'left' ? -240 : 240;
    el.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    setTimeout(checkScroll, 320);
  };

  return (
    <div className={`relative flex items-center w-full border-b border-slate-200 ${className}`}>
      {/* Left Arrow Button */}
      {canScrollLeft && (
        <button
          type="button"
          onClick={() => scroll('left')}
          className="absolute left-0 sm:left-1 z-20 p-1.5 bg-white/95 hover:bg-white text-slate-700 hover:text-slate-950 border border-slate-300 rounded-lg shadow-md backdrop-blur-xs transition-all flex items-center justify-center cursor-pointer"
          title="Geser tab ke kiri"
          aria-label="Geser tab ke kiri"
        >
          <ChevronLeft className="w-4 h-4 text-slate-700" />
        </button>
      )}

      {/* Left Gradient Fade Mask */}
      {canScrollLeft && (
        <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-white via-white/80 to-transparent pointer-events-none z-10" />
      )}

      {/* Scrollable Container */}
      <div
        ref={scrollRef}
        onScroll={checkScroll}
        className={`flex items-center gap-1 sm:gap-2 overflow-x-auto no-scrollbar scroll-smooth flex-nowrap w-full pt-1 px-1 ${containerClassName}`}
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {children}
      </div>

      {/* Right Gradient Fade Mask */}
      {canScrollRight && (
        <div className="absolute right-0 top-0 bottom-0 w-14 bg-gradient-to-r from-transparent via-white/80 to-white pointer-events-none z-10" />
      )}

      {/* Right Arrow Button */}
      {canScrollRight && (
        <button
          type="button"
          onClick={() => scroll('right')}
          className="absolute right-0 sm:right-1 z-20 p-1.5 bg-white/95 hover:bg-white text-slate-700 hover:text-slate-950 border border-slate-300 rounded-lg shadow-md backdrop-blur-xs transition-all flex items-center justify-center cursor-pointer"
          title="Geser tab ke kanan"
          aria-label="Geser tab ke kanan"
        >
          <ChevronRight className="w-4 h-4 text-slate-700" />
        </button>
      )}
    </div>
  );
};
