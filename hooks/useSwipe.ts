"use client";

import { useCallback, useRef } from "react";

interface SwipeHandlers {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  /** Minimum horizontal px to trigger a swipe (default: 50) */
  threshold?: number;
  /** If horizontal drag exceeds this fraction of vertical drag, treat as swipe (default: 1.5) */
  directionRatio?: number;
}

/**
 * Returns onTouchStart and onTouchEnd props to attach to any element.
 * Only fires swipe callbacks when the gesture is clearly horizontal
 * (not a vertical scroll).
 */
export function useSwipe({
  onSwipeLeft,
  onSwipeRight,
  threshold = 50,
  directionRatio = 1.5,
}: SwipeHandlers) {
  const startX = useRef<number>(0);
  const startY = useRef<number>(0);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    startY.current = e.touches[0].clientY;
  }, []);

  const onTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      const dx = e.changedTouches[0].clientX - startX.current;
      const dy = e.changedTouches[0].clientY - startY.current;

      // Ignore if the gesture is more vertical than horizontal
      if (Math.abs(dx) < threshold || Math.abs(dx) < Math.abs(dy) * directionRatio) return;

      if (dx < 0) {
        onSwipeLeft?.();
      } else {
        onSwipeRight?.();
      }
    },
    [onSwipeLeft, onSwipeRight, threshold, directionRatio],
  );

  return { onTouchStart, onTouchEnd };
}
