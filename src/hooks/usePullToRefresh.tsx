import { useEffect, useRef, useState } from 'react';
import { Capacitor } from '@capacitor/core';

export const usePullToRefresh = (onRefresh: () => Promise<void>) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const currentY = useRef(0);
  const isDragging = useRef(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleTouchStart = (e: TouchEvent) => {
      // Only allow pull to refresh when at the top of the page
      if (window.scrollY === 0) {
        startY.current = e.touches[0].clientY;
        isDragging.current = true;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging.current) return;
      
      currentY.current = e.touches[0].clientY;
      const diff = currentY.current - startY.current;

      // Only trigger if pulling down
      if (diff > 0 && window.scrollY === 0) {
        // Visual feedback could be added here
      }
    };

    const handleTouchEnd = async () => {
      if (!isDragging.current) return;

      const diff = currentY.current - startY.current;
      
      // Trigger refresh if pulled down enough (80px threshold)
      if (diff > 80 && window.scrollY === 0) {
        setIsRefreshing(true);
        try {
          await onRefresh();
        } finally {
          setIsRefreshing(false);
        }
      }

      isDragging.current = false;
      startY.current = 0;
      currentY.current = 0;
    };

    container.addEventListener('touchstart', handleTouchStart);
    container.addEventListener('touchmove', handleTouchMove);
    container.addEventListener('touchend', handleTouchEnd);

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [onRefresh]);

  return {
    containerRef,
    isRefreshing,
  };
};
