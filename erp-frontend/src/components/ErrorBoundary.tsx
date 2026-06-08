import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Check if it's a dynamic import failure / chunk load error
    const isChunkError = 
      error && 
      error.message && 
      (error.message.includes('dynamically imported module') || 
       error.message.includes('Failed to fetch dynamically imported module') ||
       error.message.includes('Importing a module script failed') ||
       error.message.includes('error loading dynamically imported module') ||
       error.message.includes('Failed to fetch'));

    if (isChunkError) {
      const chunkErrorKey = 'chunk_load_failed_reload';
      const lastReload = sessionStorage.getItem(chunkErrorKey);
      const now = Date.now();
      
      // Prevent infinite reloading loop (only reload if we haven't reloaded in the last 15 seconds)
      if (!lastReload || now - parseInt(lastReload, 10) > 15000) {
        sessionStorage.setItem(chunkErrorKey, now.toString());
        console.warn('Dynamic import/chunk load failure detected. Automatically refreshing page to get the latest assets...');
        window.location.reload();
      }
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="max-w-md w-full mx-auto p-6">
            <div className="text-center">
              <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-foreground mb-2">
                Something went wrong
              </h1>
              <p className="text-muted-foreground mb-6">
                An error occurred while loading this page. Please try refreshing or contact support if the problem persists.
              </p>
              <div className="space-y-3">
                <Button
                  onClick={() => {
                    this.setState({ hasError: false, error: undefined });
                  }}
                  className="w-full"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
                <Button
                  variant="outline"
                  onClick={() => window.location.reload()}
                  className="w-full"
                >
                  Refresh Page
                </Button>
              </div>
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="mt-6 text-left">
                  <summary className="cursor-pointer text-sm text-muted-foreground">
                    Error Details (Development)
                  </summary>
                  <pre className="mt-2 p-3 bg-muted rounded text-xs overflow-auto">
                    {this.state.error.stack}
                  </pre>
                </details>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

