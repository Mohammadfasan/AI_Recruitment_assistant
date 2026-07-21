import React from 'react';

const LoadingSpinner = ({ fullPage = false, size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-5 h-5 border-2',
    md: 'w-10 h-10 border-3',
    lg: 'w-16 h-16 border-4',
  };

  const spinner = (
    <div className="flex flex-col items-center justify-center space-y-3">
      <div
        className={`${sizeClasses[size] || sizeClasses.md} border-indigo-200 border-t-indigo-600 rounded-full animate-spin`}
      />
      <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Loading...</span>
    </div>
  );

  if (fullPage) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-50/70 dark:bg-zinc-950/70 backdrop-blur-xs">
        {spinner}
      </div>
    );
  }

  return <div className="py-12 flex justify-center w-full">{spinner}</div>;
};

export default LoadingSpinner;
