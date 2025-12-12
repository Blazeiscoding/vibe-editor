"use client";

import { Component, ReactNode } from "react";
import { AlertTriangle, RefreshCcw, Home, Bug } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface FeatureErrorBoundaryProps {
  children: ReactNode;
  featureName: string;
  fallback?: ReactNode;
  onReset?: () => void;
  showHomeButton?: boolean;
  homeUrl?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

export class FeatureErrorBoundary extends Component<FeatureErrorBoundaryProps, State> {
  constructor(props: FeatureErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ errorInfo });
    
    // Log error with feature context
    if (process.env.NODE_ENV === "production") {
      console.error(`[${this.props.featureName}] Error caught:`, {
        error: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
      });
      // TODO: Send to error reporting service (e.g., Sentry, LogRocket)
    } else {
      console.error(`[${this.props.featureName}] Error:`, error);
      console.error("Component Stack:", errorInfo.componentStack);
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    this.props.onReset?.();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const { featureName, showHomeButton = true, homeUrl = "/dashboard" } = this.props;

      return (
        <div 
          className="flex items-center justify-center min-h-[400px] p-4"
          role="alert"
          aria-live="assertive"
        >
          <Card className="w-full max-w-lg">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-destructive/10">
                  <AlertTriangle className="h-5 w-5 text-destructive" aria-hidden="true" />
                </div>
                <div>
                  <CardTitle className="text-lg">
                    {featureName} Error
                  </CardTitle>
                  <CardDescription>
                    Something went wrong in this section
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                We encountered an unexpected error while loading the {featureName.toLowerCase()}. 
                This has been logged and we&apos;ll look into it.
              </p>

              {process.env.NODE_ENV === "development" && this.state.error && (
                <details className="rounded-md border p-3 text-sm">
                  <summary className="cursor-pointer flex items-center gap-2 font-medium text-destructive">
                    <Bug className="h-4 w-4" aria-hidden="true" />
                    Error Details (Development Only)
                  </summary>
                  <div className="mt-2 space-y-2">
                    <pre className="whitespace-pre-wrap text-xs bg-muted p-2 rounded overflow-auto max-h-32">
                      {this.state.error.message}
                    </pre>
                    {this.state.error.stack && (
                      <pre className="whitespace-pre-wrap text-xs bg-muted p-2 rounded overflow-auto max-h-48">
                        {this.state.error.stack}
                      </pre>
                    )}
                  </div>
                </details>
              )}

              <div className="flex flex-wrap gap-2">
                <Button 
                  onClick={this.handleReset} 
                  variant="default"
                  className="gap-2"
                  aria-label={`Retry loading ${featureName}`}
                >
                  <RefreshCcw className="h-4 w-4" aria-hidden="true" />
                  Try Again
                </Button>
                {showHomeButton && (
                  <Button
                    onClick={() => window.location.href = homeUrl}
                    variant="outline"
                    className="gap-2"
                    aria-label="Go to Dashboard"
                  >
                    <Home className="h-4 w-4" aria-hidden="true" />
                    Go to Dashboard
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// Convenience wrapper components for specific features
export function DashboardErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <FeatureErrorBoundary 
      featureName="Dashboard" 
      homeUrl="/dashboard"
      showHomeButton={false}
    >
      {children}
    </FeatureErrorBoundary>
  );
}

export function PlaygroundErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <FeatureErrorBoundary 
      featureName="Playground" 
      homeUrl="/dashboard"
    >
      {children}
    </FeatureErrorBoundary>
  );
}

export function EditorErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <FeatureErrorBoundary 
      featureName="Code Editor" 
      homeUrl="/dashboard"
    >
      {children}
    </FeatureErrorBoundary>
  );
}

export function PreviewErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <FeatureErrorBoundary 
      featureName="Preview Panel" 
      showHomeButton={false}
    >
      {children}
    </FeatureErrorBoundary>
  );
}
