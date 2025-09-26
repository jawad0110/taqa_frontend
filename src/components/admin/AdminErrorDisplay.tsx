'use client';
import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface AdminErrorDisplayProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  className?: string;
}

export function AdminErrorDisplay({ 
  title = 'حدث خطأ', 
  message, 
  onRetry,
  className = '' 
}: AdminErrorDisplayProps) {
  return (
    <div className={`p-6 ${className}`}>
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>{title}</AlertTitle>
        <AlertDescription className="mt-2">
          {message}
          {onRetry && (
            <div className="mt-4">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={onRetry}
                className="gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                إعادة المحاولة
              </Button>
            </div>
          )}
        </AlertDescription>
      </Alert>
    </div>
  );
}