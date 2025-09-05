
import React from 'react';
import { Button } from '@/components/ui/button';

interface ErrorDisplayProps {
  errorMessage: string;
  onRetry: () => void;
}

const ErrorDisplay = ({ errorMessage, onRetry }: ErrorDisplayProps) => {
  return (
    <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 mb-4 text-center">
      <p>{errorMessage}</p>
      <Button
        variant="outline"
        size="sm"
        onClick={onRetry}
        className="mt-2 text-red-700 border-red-300"
      >
        إعادة المحاولة
      </Button>
    </div>
  );
};

export default ErrorDisplay;
