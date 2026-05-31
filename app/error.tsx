"use client";

import { useEffect } from "react";
import { AlertCircle } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Unhandled Global Error Caught:", error);
  }, [error]);

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-[#0C0A15] p-6 text-white">
      <div className="max-w-md rounded-xl border border-red-900/30 bg-red-950/20 p-8 text-center backdrop-blur-sm">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-500/20">
          <AlertCircle className="h-8 w-8 text-red-400" />
        </div>
        <h2 className="mb-3 text-2xl font-bold tracking-tight">Something went wrong</h2>
        <p className="mb-8 text-sm text-gray-400">
          An unexpected error occurred in the application interface.
          {error.message && (
            <span className="mt-2 block rounded bg-black/40 p-2 font-mono text-xs text-red-300 overflow-hidden text-ellipsis whitespace-nowrap">
              {error.message}
            </span>
          )}
        </p>
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            onClick={() => reset()}
            className="rounded-md bg-white px-5 py-2.5 text-sm font-medium text-black transition-colors hover:bg-gray-200"
          >
            Try again
          </button>
          <button
            onClick={() => window.location.href = "/"}
            className="rounded-md border border-gray-700 bg-transparent px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-gray-800"
          >
            Return Home
          </button>
        </div>
      </div>
    </div>
  );
}
