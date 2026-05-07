import { useState } from "react";

export default function SignIn() {
  const [isLoading, setIsLoading] = useState(false);
  return (
    <div className="flex justify-center text-zinc-200 bg-zinc-900 items-center h-screen">
      {!isLoading ? (
        <div className="space-y-4">
          <h1>Welcome to the signin page.</h1>
          <button
            onClick={() => setIsLoading(true)}
            className="text-white bg-emerald-500 px-6 py-3 rounded-md"
          >
            Activate Loading
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="w-112 h-112 bg-zinc-800 animate-pulse"></div>
          <button
            onClick={() => setIsLoading(false)}
            className="text-white bg-emerald-500 px-6 py-3 rounded-md"
          >
            De-activate Loading
          </button>
        </div>
      )}
    </div>
  );
}
