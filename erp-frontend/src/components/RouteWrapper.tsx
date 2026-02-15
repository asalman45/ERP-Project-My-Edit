import React, { Suspense } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'react-router-dom';
import ErrorBoundary from './ErrorBoundary';
import LoadingSpinner from './LoadingSpinner';

interface RouteWrapperProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

const RouteWrapper: React.FC<RouteWrapperProps> = ({ 
  children, 
  fallback = <LoadingSpinner text="Loading page..." /> 
}) => {
  const { toast } = useToast();
  const location = useLocation();

  const handleError = (error: Error) => {
    console.error('Route error:', error);
    toast({
      title: "Page Error",
      description: "Failed to load this page.",
      variant: "destructive",
    });
  };

  return (
    <ErrorBoundary
      key={location.pathname} // Force remount on route change
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="text-center">
            <LoadingSpinner size="lg" text="Loading page..." />
          </div>
        </div>
      }
    >
      <Suspense fallback={fallback}>
        {children}
      </Suspense>
    </ErrorBoundary>
  );
};

export default RouteWrapper;

