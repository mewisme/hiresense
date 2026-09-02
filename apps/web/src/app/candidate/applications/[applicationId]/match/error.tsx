'use client';

export default function ErrorPage({
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
      <div className="max-w-md rounded-3xl border border-red-200 bg-white p-8 text-center shadow-sm">
        <p className="text-sm font-semibold text-red-600">Match result unavailable</p>
        <h1 className="mt-2 text-2xl font-semibold text-slate-950">
          We could not load this analysis.
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-500">
          The application is unchanged. Retry the request or return later.
        </p>
        <button
          className="mt-6 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white"
          onClick={() => retry()}
        >
          Try again
        </button>
      </div>
    </main>
  );
}
