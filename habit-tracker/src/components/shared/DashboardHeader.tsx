import { Link } from "@tanstack/react-router";
import { Flame } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DashboardHeaderProps {
  userLabel?: string | null;
  onSignOut: () => void | Promise<void>;
}

export function DashboardHeader({
  userLabel,
  onSignOut,
}: DashboardHeaderProps) {
  return (
    <header className="bg-zinc-900 border-b border-zinc-800 sticky top-0 z-40">
      <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <Flame className="w-5 h-5 text-emerald-500" aria-hidden="true" />
          <span className="font-bold text-zinc-100 tracking-tight">Streakly</span>
        </Link>
        <div className="flex items-center gap-3">
          <span className="text-sm text-zinc-500 hidden sm:block">{userLabel}</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={onSignOut}
            className="text-zinc-500 hover:text-zinc-700 hover:bg-neutral-100 text-sm"
          >
            Sign out
          </Button>
        </div>
      </div>
    </header>
  );
}
