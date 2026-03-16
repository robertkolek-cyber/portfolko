export default function Footer() {
  return (
    <footer className="bg-dark-950 border-t border-dark-800 text-slate-500 py-8 px-6">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <span className="text-sm">
          &copy; {new Date().getFullYear()} Robert Kolek. All rights reserved.
        </span>
        <span className="text-sm text-slate-600">
          Designed & built with care.
        </span>
      </div>
    </footer>
  );
}
