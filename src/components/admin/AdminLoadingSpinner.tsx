'use client';
import React from 'react';
import { Loader2 } from 'lucide-react';

interface AdminLoadingSpinnerProps {
  message?: string;
  className?: string;
}

export function AdminLoadingSpinner({ 
  message = 'جاري التحميل...', 
  className = '' 
}: AdminLoadingSpinnerProps) {
  return (
    <div className={`flex flex-col items-center justify-center min-h-[200px] ${className}`}>
      <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
      <p className="text-muted-foreground text-center">{message}</p>
    </div>
  );
}