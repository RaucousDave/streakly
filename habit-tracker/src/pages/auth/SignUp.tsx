import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { googleSignIn } from "@/lib/auth.client";
function FlameIcon({ className = "" }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12.017 0C9.5 4.5 13 7 11 10c-1.5-1-2-3-2-3C6.5 10 5 13.5 5 16a7 7 0 0014 0c0-5.5-4-9-6.983-16z" />
    </svg>
  );
}

function GoogleIcon({ className = "" }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

export default function SignUp() {
  const [loading, setLoading] = useState(false);


  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center px-4">
      {/* Logo */}
      <Link to="/" className="flex items-center gap-2 mb-8">
        <FlameIcon className="w-5 h-5 text-emerald-500" />
        <span className="font-bold text-zinc-100 text-lg tracking-tight">Streakly</span>
      </Link>

      <Card className="w-full max-w-sm border border-zinc-800 shadow-xl bg-zinc-900">
        <CardContent className="p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-4">
              <FlameIcon className="w-6 h-6 text-emerald-500" />
            </div>
            <h1 className="text-xl font-bold text-zinc-100 mb-1">Create your account</h1>
            <p className="text-sm text-zinc-500">
              Free forever for up to 5 habits. No credit card.
            </p>
          </div>

          {/* Google button */}
          <Button
            onClick={googleSignIn}
            disabled={loading}
            className="w-full h-11 bg-white hover:bg-zinc-100 text-zinc-900 font-medium rounded-full flex items-center justify-center gap-3 transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] border border-zinc-200"
          >
            <GoogleIcon className="w-5 h-5 shrink-0" />
            {loading ? "Redirecting..." : "Continue with Google"}
          </Button>

          {/* Divider — room for future providers */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-zinc-800" />
            </div>
            <div className="relative flex justify-center">
              <span className="px-3 text-xs text-zinc-600 bg-zinc-900">more options coming soon</span>
            </div>
          </div>

          {/* Trust signals */}
          <div className="space-y-2 mb-6">
            {[
              "No password to remember",
              "Your data stays private",
              "Cancel or delete anytime",
            ].map((point) => (
              <div key={point} className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                <p className="text-xs text-zinc-500">{point}</p>
              </div>
            ))}
          </div>

          {/* Legal */}
          {/* <p className="text-xs text-zinc-600 text-center leading-relaxed">
            By continuing you agree to our{" "}
            <a href="/terms" className="underline underline-offset-2 hover:text-zinc-400 transition-colors">
              Terms
            </a>{" "}
            and{" "}
            <a href="/privacy" className="underline underline-offset-2 hover:text-zinc-400 transition-colors">
              Privacy Policy
            </a>.
          </p> */}

          {/* Sign in link */}
          {/* <p className="text-sm text-zinc-600 text-center mt-5 pt-5 border-t border-zinc-800">
            Already have an account?{" "}
            <Link
              to="/sign-in"
              className="text-emerald-500 hover:text-emerald-400 font-medium underline underline-offset-2"
            >
              Sign in
            </Link>
          </p> */}
        </CardContent>
      </Card>
    </div>
  );
}