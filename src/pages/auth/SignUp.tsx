import { useState } from "react";
import { Link } from "@tanstack/react-router";
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

export default function SignUp() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [verifyPrompt, setVerifyPrompt] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      return setError("Password must be at least 8 characters.");
    }

    setLoading(true);
    const { error } = await authClient.signUp.email({ name, email, password });
    setLoading(false);

    if (error) return setError(error.message ?? "Something went wrong.");
    setVerifyPrompt(true);
  };

  const pageShell =
    "relative flex min-h-screen items-center justify-center overflow-hidden bg-neutral-950 px-4 py-10 text-zinc-100";

  const backgroundGlow =
    "absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.18),_transparent_32%),radial-gradient(circle_at_bottom,_rgba(255,255,255,0.08),_transparent_28%)]";

  if (verifyPrompt) {
    return (
      <div className={pageShell}>
        <div className={backgroundGlow} />

        <div className="relative z-10 w-full max-w-sm">
          <Link to="/" className="mb-8 flex items-center justify-center gap-2">
            <FlameIcon className="h-5 w-5 text-emerald-400" />
            <span className="text-lg font-bold tracking-tight text-zinc-50">
              Streakly
            </span>
          </Link>

          <Card className="border-white/10 bg-zinc-900/85 shadow-2xl shadow-black/30 backdrop-blur">
            <CardContent className="p-6 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-emerald-500/20 bg-emerald-500/10 text-emerald-300">
                <MailCheck className="h-6 w-6" />
              </div>
              <h1 className="mb-2 text-xl font-bold text-zinc-50">
                Verify your email
              </h1>
              <p className="mb-2 text-sm leading-6 text-zinc-400">
                We sent a verification link to{" "}
                <span className="font-medium text-zinc-200">{email}</span>.
              </p>
              <p className="text-sm leading-6 text-zinc-400">
                Click the link in the email to activate your account, then sign
                in.
              </p>
              <div className="mt-6 border-t border-white/10 pt-5">
                <p className="text-xs text-zinc-500">
                  Didn't get it? Check your spam folder or{" "}
                  <button
                    type="button"
                    onClick={() => setVerifyPrompt(false)}
                    className="text-emerald-400 underline underline-offset-4 transition-colors hover:text-emerald-300"
                  >
                    try again
                  </button>
                  .
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className={pageShell}>
      <div className={backgroundGlow} />

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
              Create your account
            </h1>
            <p className="mb-6 text-sm text-zinc-400">
              Free forever for up to 5 habits. No credit card.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-sm text-zinc-300">
                  Name
                </Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Davies"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="h-11 rounded-xl border-white/10 bg-white/5 px-3 text-zinc-100 placeholder:text-zinc-500 focus-visible:border-emerald-400/60 focus-visible:ring-emerald-500/20"
                />
              </div>

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

              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-sm text-zinc-300">
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="At least 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-11 rounded-xl border-white/10 bg-white/5 px-3 text-zinc-100 placeholder:text-zinc-500 focus-visible:border-emerald-400/60 focus-visible:ring-emerald-500/20"
                />
                {password.length > 0 && (
                  <div className="mt-2 flex gap-1">
                    {[1, 2, 3].map((level) => (
                      <div
                        key={level}
                        className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${
                          password.length >= level * 4
                            ? level === 1
                              ? "bg-red-400"
                              : level === 2
                                ? "bg-amber-400"
                                : "bg-emerald-400"
                            : "bg-white/10"
                        }`}
                      />
                    ))}
                  </div>
                )}
              </div>

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
                {loading ? "Creating account..." : "Create account ->"}
              </Button>

              <p className="text-center text-xs leading-relaxed text-zinc-500">
                By signing up you agree to our{" "}
                <a
                  href="/terms"
                  className="underline underline-offset-4 transition-colors hover:text-zinc-300"
                >
                  Terms
                </a>{" "}
                and{" "}
                <a
                  href="/privacy"
                  className="underline underline-offset-4 transition-colors hover:text-zinc-300"
                >
                  Privacy Policy
                </a>
                .
              </p>
            </form>

            <p className="mt-5 text-center text-sm text-zinc-400">
              Already have an account?{" "}
              <Link
                to="/sign-in"
                className="font-medium text-emerald-400 underline underline-offset-4 transition-colors hover:text-emerald-300"
              >
                Sign in
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
