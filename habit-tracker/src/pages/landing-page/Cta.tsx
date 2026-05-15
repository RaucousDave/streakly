import { Flame, Snowflake } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";
export default function Cta() {
  return (
    <section className="py-28 px-6">
      <div className="max-w-5xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 mb-6">
          <Flame className="w-6 h-6 text-emerald-500" />
          <Snowflake className="w-5 h-5 text-sky-400" />
        </div>
        <h2 className="text-4xl sm:text-5xl font-bold tracking-tight text-zinc-100 mb-5">
          Start your streak today.
        </h2>
        <p className="text-lg text-zinc-400 mb-10 max-w-md mx-auto leading-relaxed">
          Free forever!
        </p>
        <Button
          asChild
          size="lg"
          className="bg-zinc-100 hover:bg-emerald-500 hover:text-white text-zinc-900 rounded-full px-10 h-13 text-base font-medium transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] shadow-md"
        >
          <Link to="/sign-up">Get started free →</Link>
        </Button>
      </div>
    </section>
  );
}
