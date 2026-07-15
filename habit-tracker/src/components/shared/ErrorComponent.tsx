import { Button } from "@base-ui/react";
import type { Error } from "@/router";
import { Link } from "@tanstack/react-router";

export default function ErrorComponent({ error }: { error: Error }) {
  return (
    <div className="bg-neutral-900 gap-4 flex flex-col justify-center items-center text-white h-screen">
      <label className="text-white text-center text-3xl font-semibold">
        {error.message ?? "Something went wrong"}
      </label>
      <Button
        render={<Link to="/">Back to Home Page</Link>}
        className="bg-white hover:bg-emerald-600 transition ease-linear hover:text-white text-neutral-900 text-lg px-8 py-2 rounded-lg"
      ></Button>
    </div>
  );
}
