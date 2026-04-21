import { useState } from "react";
import { useNavigate, useSearch, Link } from "@tanstack/react-router";
import { MailCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { authClient } from "@/lib/auth.client";

function FlameIcon({ className = "" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M12.017 0C9.5 4.5 13 7 11 10c-1.5-1-2-3-2-3C6.5 10 5 13.5 5 16a7 7 0 0014 0c0-5.5-4-9-6.983-16z" />
    </svg>
  );
}

type Tab = "password" | "magic";

export default function SignIn() {
  const navigate = useNavigate();
  const { redirect } = useSearch({ from: "/sign-in" });

  const [tab, setTab] = useState<Tab>("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [magicSent, setMagicSent] = useState(false);

  const handlePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const { error } = await authClient.signIn.email({ email, password });
    setLoading(false);
    if (error) return setError(error.message ?? "Invalid email or password.");
    navigate({ to: redirect ?? "/dashboard" });
  };

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const { error } = await authClient.signIn.magicLink({ email });
    setLoading(false);
    if (error) return setError(error.message ?? "Something went wrong.");
    setMagicSent(true);
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-neutral-950 px-4 py-10 text-zinc-100">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.18),_transparent_32%),radial-gradient(circle_at_bottom,_rgba(255,255,255,0.08),_transparent_28%)]" />

      <div className="relative z-10 w-full max-w-sm">
        <Link to="/" className="mb-8 flex items-center justify-center gap-2">
          <FlameIcon className="h-5 w-5 text-emerald-400" />
          <span className="text-lg font-bold tracking-tight text-zinc-50">
            Streakly
          </span>
        </Link>

        <Card className="border-white/10 bg-zinc-900/85 shadow-2xl shadow-black/30 backdrop-blur">
          <CardContent className="p-6">
            <h1 className="mb-1 text-xl font-bold text-zinc-50">
              Welcome back
            </h1>
            <p className="mb-6 text-sm text-zinc-400">
              Sign in to your account to continue.
            </p>

            <div className="mb-6 flex rounded-xl border border-white/10 bg-zinc-950/70 p-1">
              {(["password", "magic"] as Tab[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => {
                    setTab(t);
                    setError("");
                    setMagicSent(false);
                  }}
                  className={`flex-1 rounded-lg py-2 text-sm font-medium transition-all duration-150 ${
                    tab === t
                      ? "border border-emerald-500/30 bg-emerald-500/15 text-emerald-200 shadow-sm shadow-emerald-950/40"
                      : "text-zinc-400 hover:text-zinc-100"
                  }`}
                >
                  {t === "password" ? "Password" : "Magic link"}
                </button>
              ))}
            </div>

            {magicSent ? (
              <div className="py-4 text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full border border-emerald-500/20 bg-emerald-500/10 text-emerald-300">
                  <MailCheck className="h-5 w-5" />
                </div>
                <p className="mb-1 font-semibold text-zinc-50">
                  Check your inbox
                </p>
                <p className="text-sm leading-6 text-zinc-400">
                  We sent a sign-in link to{" "}
                  <span className="font-medium text-zinc-200">{email}</span>. It
                  expires in 10 minutes.
                </p>
                <button
                  type="button"
                  onClick={() => setMagicSent(false)}
                  className="mt-4 text-sm font-medium text-emerald-400 underline underline-offset-4 transition-colors hover:text-emerald-300"
                >
                  Send another
                </button>
              </div>
            ) : (
              <form
                onSubmit={tab === "password" ? handlePassword : handleMagicLink}
                className="space-y-4"
              >
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-sm text-zinc-300">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-11 rounded-xl border-white/10 bg-white/5 px-3 text-zinc-100 placeholder:text-zinc-500 focus-visible:border-emerald-400/60 focus-visible:ring-emerald-500/20"
                  />
                </div>

                {tab === "password" && (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label
                        htmlFor="password"
                        className="text-sm text-zinc-300"
                      >
                        Password
                      </Label>
                    </div>
                    <Input
                      id="password"
                      type="password"
                      placeholder="........"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="h-11 rounded-xl border-white/10 bg-white/5 px-3 text-zinc-100 placeholder:text-zinc-500 focus-visible:border-emerald-400/60 focus-visible:ring-emerald-500/20"
                    />
                  </div>
                )}

                {error && (
                  <p className="rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-200">
                    {error}
                  </p>
                )}

                <Button
                  type="submit"
                  disabled={loading}
                  className="h-11 w-full rounded-full bg-emerald-500 font-medium text-white transition-all duration-200 hover:scale-[1.01] hover:bg-emerald-400 active:scale-[0.99]"
                >
                  {loading
                    ? "Please wait..."
                    : tab === "password"
                      ? "Sign in"
                      : "Send magic link"}
                </Button>
              </form>
            )}

            <p className="mt-5 text-center text-sm text-zinc-400">
              Don't have an account?{" "}
              <Link
                to="/sign-up"
                className="font-medium text-emerald-400 underline underline-offset-4 transition-colors hover:text-emerald-300"
              >
                Sign up free
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
