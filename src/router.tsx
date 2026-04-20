import {
  createRootRoute,
  createRoute,
  createRouter,
  redirect,
} from "@tanstack/react-router";
import z from "zod";
import { authClient } from "./lib/auth.client";
import App from "./App";
import Dashboard from "./pages/Dashboard";
import SignIn from "./pages/auth/SignIn";
import SignUp from "./pages/auth/SignUp";

const rootRoute = createRootRoute();

const signInSearchSchema = z.object({ redirect: z.string().optional() });

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: App,
});

const signUpRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/sign-up",
  component: SignUp,
  beforeLoad: async () => {
    const { data: session } = await authClient.getSession();
    if (session) throw redirect({ to: "/dashboard" });
  },
});

const signInRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/sign-in",
  component: SignIn,
  validateSearch: signInSearchSchema,
  beforeLoad: async () => {
    const { data: session } = await authClient.getSession();
    if (session) throw redirect({ to: "/dashboard" });
  },
});

const protectedRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: "protected",
  beforeLoad: async ({ location }) => {
    const { data: session } = await authClient.getSession();
    if (!session)
      throw redirect({
        to: "/sign-in",
        search: { redirect: location.pathname } as any,
      });
    return { session };
  },
});
const dashboardRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: "/dashboard",
  component: Dashboard,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  signUpRoute,
  signInRoute,
  protectedRoute.addChildren([dashboardRoute]),
]);

export const router = createRouter({ routeTree });


declare module "@tanstack/react-router" {
    interface Register{
        router: typeof router
    }
}