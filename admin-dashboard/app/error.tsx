'use client'; // Error components must be Client Components

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <div className="flex justify-center items-center h-screen bg-red-50">
      <div className="text-center p-8 bg-white shadow-lg rounded-lg">
        <h2 className="text-2xl font-bold text-red-700 mb-4">Something went wrong!</h2>
        <p className="text-red-600 mb-6">{error.message}</p>
        <button
          className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          onClick={
            // Attempt to recover by trying to re-render the segment
            () => reset()
          }
        >
          Try again
        </button>
      </div>
    </div>
  );
}
