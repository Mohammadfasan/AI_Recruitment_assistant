import React from 'react';
import { Link } from 'react-router-dom';
import { HelpCircle, ArrowLeft } from 'lucide-react';

const NotFound = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 px-4 transition-colors">
      <div className="max-w-md w-full text-center bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-lg p-8">
        <div className="w-14 h-14 bg-indigo-50 dark:bg-indigo-950 text-indigo-650 dark:text-indigo-400 rounded-full flex items-center justify-center mx-auto mb-5">
          <HelpCircle className="w-8 h-8" />
        </div>
        <h2 className="text-3xl font-bold text-zinc-900 dark:text-zinc-55">404</h2>
        <h3 className="text-lg font-bold text-zinc-800 dark:text-zinc-200 mt-1">Page Not Found</h3>
        <p className="text-zinc-550 dark:text-zinc-450 text-sm mt-3 leading-relaxed">
          The requested page does not exist or has been moved. Check the URL or navigate back to the main dashboard.
        </p>
        
        <div className="mt-8 pt-5 border-t border-zinc-100 dark:border-zinc-800">
          <Link
            to="/"
            className="inline-flex items-center space-x-2 px-4 py-2.5 bg-indigo-650 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
