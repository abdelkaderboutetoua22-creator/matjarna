import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { initTracking, trackPageView } from '@/lib/tracking';

interface TrackingProviderProps {
  children: React.ReactNode;
}

export function TrackingProvider({ children }: TrackingProviderProps) {
  const location = useLocation();

  // Initialize tracking on mount
  useEffect(() => {
    initTracking();
  }, []);

  // Track page views on route change
  useEffect(() => {
    trackPageView(location.pathname);
  }, [location.pathname]);

  return <>{children}</>;
}
