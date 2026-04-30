export default function Footer() {
  return (
    <footer className="bg-dark-900 border-t border-dark-700/50 py-10 px-6">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <span className="font-[family-name:var(--font-display)] text-sm font-bold tracking-widest text-slate-500">
          ROBERT KOLEK<span className="text-lime">.</span>
        </span>
        <span className="text-sm text-slate-600">
          &copy; {new Date().getFullYear()} — Designed &amp; built with care.
        </span>
      </div>
    </footer>
  );
}
