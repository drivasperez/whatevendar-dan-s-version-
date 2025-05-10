'use client';

import { useState } from 'react';

export default function ExcuseGenerator() {
  const [context, setContext] = useState('');
  const [excuse, setExcuse] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const generateExcuse = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch('/api/generate-excuse', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ context }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate excuse');
      }

      const data = await response.json();
      setExcuse(data.excuse);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-gradient-to-r from-pink-300 via-purple-300 to-indigo-400 dark:from-pink-900 dark:via-purple-900 dark:to-indigo-950">
      <div className="w-full max-w-md space-y-6 bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg border-2 border-purple-200 dark:border-purple-700">
        <h1 className="text-3xl font-extrabold text-center text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-pink-500 dark:from-purple-300 dark:to-pink-300">
          ✨ Excuse Fabricator ✨
        </h1>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <label 
              htmlFor="context" 
              className="text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              What do you need an excuse for?
            </label>
            <input
              id="context"
              type="text"
              placeholder="e.g., being late for work, missing a deadline..."
              value={context}
              onChange={(e) => setContext(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            />
          </div>
          
          <button
            onClick={generateExcuse}
            disabled={loading}
            className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 focus:ring-blue-500 focus:ring-offset-blue-200 text-white transition ease-in duration-200 text-center text-base font-semibold shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Generating...' : 'Generate Excuse'}
          </button>
        </div>

        {error && (
          <div className="text-red-500 text-sm mt-2">
            Error: {error}
          </div>
        )}

        {excuse && (
          <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
              Your Excuse:
            </h2>
            <p className="text-gray-900 dark:text-white">{excuse}</p>
          </div>
        )}
      </div>
    </main>
  );
} 