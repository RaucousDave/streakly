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
import HeatmapPage from "./pages/HeatmapPage";
import SignUp from "./pages/auth/SignUp";

const rootRoute = createRootRoute();

const progressSearchSchema = z.object({ habitId: z.string().optional() });

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

const protectedRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: "protected",
  beforeLoad: async ({ location }) => {
    const { data: session } = await authClient.getSession();
    if (!session)
      throw redirect({
        to: "/sign-up",
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
const progressRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: "/dashboard/progress",
  component: HeatmapPage,
  validateSearch: progressSearchSchema,
});
const heatmapRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: "/dashboard/heatmap",
  component: HeatmapPage,
  validateSearch: progressSearchSchema,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  signUpRoute,
  protectedRoute.addChildren([dashboardRoute, progressRoute, heatmapRoute]),
]);

export const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
