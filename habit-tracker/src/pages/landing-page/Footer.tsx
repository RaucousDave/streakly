import { Flame } from "lucide-react";

export default function Footer() {
  return (
    <footer className="px-6 py-8">
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-zinc-400">
        <div className="flex items-center gap-2">
          <Flame className="w-4 h-4 text-emerald-500" />
          <span className="font-semibold text-zinc-300">Streakly</span>
        </div>
        <p>© {new Date().getFullYear()} Streakly. Built with discipline.</p>
      </div>
    </footer>
  );
}
