import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4 text-center">
      <h1 className="text-4xl font-extrabold text-[var(--text-main)] font-mono">404</h1>
      <p className="text-xs text-[var(--text-muted)]">The requested page or record could not be found.</p>
      <Link
        href="/"
        className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 transition-colors shadow-xs"
      >
        Return to Overview
      </Link>
    </div>
  );
}
