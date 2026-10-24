import { useRef, useCallback } from 'react';

export interface UseTabSwipeOptions<T extends string> {
  tabs: readonly T[] | T[];
  activeTab: T;
  onTabChange: (tab: T) => void;
  threshold?: number;
  disabled?: boolean;
}

/**
 * Custom hook to enable horizontal swipe navigation (swap kiri/kanan) between tabs.
 * Supports touch gestures on mobile/tablet devices, safely ignoring vertical scrolls
 * and interactions with inputs, textareas, buttons, and canvas elements.
 */
export function useTabSwipe<T extends string>({
  tabs,
  activeTab,
  onTabChange,
  threshold = 45,
  disabled = false,
}: UseTabSwipeOptions<T>) {
  const startX = useRef<number | null>(null);
  const startY = useRef<number | null>(null);

  const onTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (disabled || e.touches.length > 1) return;
      const target = e.target as HTMLElement | null;

      // Do not trigger tab switch when user is interacting with interactive form elements or canvas
      if (
        target?.closest(
          'input, textarea, select, button, a, [contenteditable="true"], .no-swipe, [data-no-swipe], canvas'
        )
      ) {
        startX.current = null;
        startY.current = null;
        return;
      }

      startX.current = e.touches[0].clientX;
      startY.current = e.touches[0].clientY;
    },
    [disabled]
  );

  const onTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (disabled || startX.current === null || startY.current === null) return;
      const endX = e.changedTouches[0].clientX;
      const endY = e.changedTouches[0].clientY;
      const diffX = startX.current - endX;
      const diffY = startY.current - endY;

      // Only trigger if horizontal swipe is clearly dominant over vertical scroll
      if (Math.abs(diffX) >= threshold && Math.abs(diffX) > Math.abs(diffY) * 1.35) {
        const currentIndex = tabs.indexOf(activeTab);
        if (currentIndex !== -1) {
          if (diffX > 0 && currentIndex < tabs.length - 1) {
            // Swiped left -> Switch to next tab
            onTabChange(tabs[currentIndex + 1]);
          } else if (diffX < 0 && currentIndex > 0) {
            // Swiped right -> Switch to previous tab
            onTabChange(tabs[currentIndex - 1]);
          }
        }
      }

      startX.current = null;
      startY.current = null;
    },
    [tabs, activeTab, onTabChange, threshold, disabled]
  );

  return {
    onTouchStart,
    onTouchEnd,
  };
}
