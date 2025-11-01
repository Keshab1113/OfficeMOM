import { useState, useEffect, useRef, useCallback } from 'react';

export const useAutoHideHeader = () => {
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const [isMouseNearTop, setIsMouseNearTop] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const timeoutRef = useRef(null);
  const lastScrollYRef = useRef(0);
  const isScrollingRef = useRef(false);

  // Check if device is desktop
  useEffect(() => {
    const checkDevice = () => {
      const isDesktop = window.innerWidth >= 1024; // lg breakpoint
      setIsDesktop(isDesktop);
      
      // Always show header on non-desktop devices
      if (!isDesktop) {
        setIsHeaderVisible(true);
      }
    };

    checkDevice();
    window.addEventListener('resize', checkDevice);
    
    return () => {
      window.removeEventListener('resize', checkDevice);
    };
  }, []);

  // Hide header after delay
  const hideHeader = useCallback(() => {
    if (!isDesktop) return; // Only hide on desktop
    
    timeoutRef.current = setTimeout(() => {
      if (!isMouseNearTop) {
        setIsHeaderVisible(false);
      }
    }, 2000); // Hide after 2 seconds of inactivity
  }, [isDesktop, isMouseNearTop]);

  // Show header and reset timer
  const showHeader = useCallback(() => {
    if (!isDesktop) return; // Only auto-hide on desktop
    
    setIsHeaderVisible(true);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    hideHeader();
  }, [hideHeader, isDesktop]);

  // Handle scroll events
  const handleScroll = useCallback(() => {
    if (!isDesktop) return; // Only auto-hide on desktop
    
    const currentScrollY = window.scrollY;
    
    // Show header when scrolling
    if (!isScrollingRef.current) {
      isScrollingRef.current = true;
      showHeader();
      
      // Hide scrolling flag after scroll ends
      setTimeout(() => {
        isScrollingRef.current = false;
      }, 150);
    }

    // Show header when scrolling up
    if (currentScrollY < lastScrollYRef.current - 10) {
      showHeader();
    }
    
    // Hide header when scrolling down significantly
    else if (currentScrollY > lastScrollYRef.current + 50 && currentScrollY > 100) {
      if (!isMouseNearTop) {
        setIsHeaderVisible(false);
      }
    }

    lastScrollYRef.current = currentScrollY;
  }, [showHeader, isMouseNearTop, isDesktop]);

  // Handle mouse movement
  const handleMouseMove = useCallback((event) => {
    if (!isDesktop) return; // Only auto-hide on desktop
    
    // Show header when mouse is near top of the page
    if (event.clientY < 100) {
      setIsMouseNearTop(true);
      showHeader();
    } else {
      setIsMouseNearTop(false);
    }
  }, [showHeader, isDesktop]);

  // Handle touch events
  const handleTouchStart = useCallback(() => {
    if (!isDesktop) {
      // On mobile/tablet, always show header on touch
      setIsHeaderVisible(true);
      return;
    }
    showHeader();
  }, [showHeader, isDesktop]);

  useEffect(() => {
    // Only set up event listeners for auto-hide on desktop
    if (isDesktop) {
      // Initial hide timer
      hideHeader();

      // Add event listeners
      window.addEventListener('scroll', handleScroll, { passive: true });
      window.addEventListener('mousemove', handleMouseMove, { passive: true });
      window.addEventListener('touchstart', handleTouchStart, { passive: true });
    } else {
      // Always show header on non-desktop devices
      setIsHeaderVisible(true);
    }

    // Cleanup
    return () => {
      if (isDesktop) {
        window.removeEventListener('scroll', handleScroll);
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('touchstart', handleTouchStart);
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [handleScroll, handleMouseMove, handleTouchStart, hideHeader, isDesktop]);

  // Always return true for non-desktop devices
  return isDesktop ? isHeaderVisible : true;
};