import express from "express";
import cors from "cors";
import { toNodeHandler } from "better-auth/node";
import "dotenv/config";

import { auth } from "./auth/auth";
import { globalAuthLimiter } from "./middleware/rate-limiter";

import { errorHandler, notFoundHandler } from "./middleware/error-handler";

import habitRouter, {
  freezeResetEngine,
  streakEngine,
} from "./routes/habits.route";
import notificationsRouter from "./routes/notifications.route";
import userRouter from "./routes/user.route";

const app = express();

// Client <-> Server Connection
app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    credentials: true,
  }),
);

// 1. better-auth before express.json()
app.use("/api/auth", globalAuthLimiter);
app.all("/api/auth/*splat", toNodeHandler(auth));

// 2. json parser after better-auth
app.use(express.json());
app.use((req, res, next) => {
  const method = req.method;
  const url = req.url;
  const time = new Date().toLocaleTimeString();

  console.log(`[${method}] - [${time}] - [${url}]`);
  next();
});
// 3. your routes
app.use("/api/habits", habitRouter);
app.use("/api/notifications", notificationsRouter);
app.use("/api/user", userRouter);
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// 4. error handlers LAST — after all routes
app.use(notFoundHandler);
app.use(errorHandler);

app.listen(3000, () => {
  console.log("Server running on port 3000....")
})
export default app;
