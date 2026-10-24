import React, { useRef, useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface ScrollableTabNavProps {
  children: React.ReactNode;
  className?: string;
  containerClassName?: string;
  activeKey?: string | number;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
}

export const ScrollableTabNav: React.FC<ScrollableTabNavProps> = ({
  children,
  className = '',
  containerClassName = '',
  activeKey,
  onSwipeLeft,
  onSwipeRight,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // Swipe detection refs for touch devices
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollLeft(scrollLeft > 4);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 4);
  }, []);

  // Auto-scroll active tab into center view when activeKey changes
  useEffect(() => {
    checkScroll();
    const el = scrollRef.current;
    if (!el) return;

    const timer = setTimeout(() => {
      const activeEl = el.querySelector(
        '[aria-selected="true"], [data-active="true"], button.font-bold, button[class*="border-indigo-600"], button[class*="border-slate-900"], button[class*="bg-white"]'
      ) as HTMLElement | null;

      if (activeEl) {
        const containerLeft = el.scrollLeft;
        const containerWidth = el.clientWidth;
        const elLeft = activeEl.offsetLeft;
        const elWidth = activeEl.clientWidth;

        if (elLeft < containerLeft || elLeft + elWidth > containerLeft + containerWidth) {
          el.scrollTo({
            left: Math.max(0, elLeft - containerWidth / 2 + elWidth / 2),
            behavior: 'smooth',
          });
        }
      }
      checkScroll();
    }, 60);

    return () => clearTimeout(timer);
  }, [activeKey, checkScroll]);

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

    const timer = setTimeout(checkScroll, 100);

    return () => {
      el.removeEventListener('wheel', handleWheel);
      window.removeEventListener('resize', checkScroll);
      clearTimeout(timer);
    };
  }, [checkScroll]);

  const scroll = (direction: 'left' | 'right') => {
    const el = scrollRef.current;
    if (!el) return;
    const scrollAmount = direction === 'left' ? -240 : 240;
    el.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    setTimeout(checkScroll, 320);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length !== 1) return;
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const endX = e.changedTouches[0].clientX;
    const endY = e.changedTouches[0].clientY;
    const diffX = touchStartX.current - endX;
    const diffY = touchStartY.current - endY;

    // Trigger tab swipe if horizontal gesture is distinct
    if (Math.abs(diffX) > 45 && Math.abs(diffX) > Math.abs(diffY) * 1.35) {
      if (diffX > 0 && onSwipeLeft) {
        onSwipeLeft();
      } else if (diffX < 0 && onSwipeRight) {
        onSwipeRight();
      }
    }

    touchStartX.current = null;
    touchStartY.current = null;
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
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
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
