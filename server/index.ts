import express from "express";
import cors from "cors";
import { toNodeHandler } from "better-auth/node";
import { Resend } from "resend";
import "dotenv/config";

import { auth } from "./auth/auth";
import {
  globalAuthLimiter,
  signInLimiter,
  signUpLimiter,
  magicLinkLimiter,
  passkeyLimiter,
} from "./middleware/rate-limiter";
import {
  validate,
  signInSchema,
  signUpSchema,
  magicLinkSchema,
} from "./middleware/validate";
import { errorHandler, notFoundHandler } from "./middleware/error-handler";

const app = express();

export const resend = new Resend(process.env.RESEND_API_KEY);
// Client <-> Server Connection
app.use(
  cors({
    origin: process.env.CLIENT_URL ?? "http://:5173",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  }),
);

app.use(express.json());

// Auth rate limiters + validation
app.use("/api/auth", globalAuthLimiter);
app.post("/api/auth/sign-in/email", signInLimiter, validate(signInSchema));
app.post("/api/auth/sign-up/email", signUpLimiter, validate(signUpSchema));
app.post(
  "/api/auth/magic-link/send",
  magicLinkLimiter,
  validate(magicLinkSchema),
);
app.post("/api/auth/passkey/register", passkeyLimiter);
app.post("/api/auth/passkey/verify", passkeyLimiter);

// better-auth handler
app.all("/api/auth/*splat", toNodeHandler(auth));

// Error handling — must be last
app.use(notFoundHandler);
app.use(errorHandler);

app.listen(3000, () => {
  console.log("Server running on port 3000");
});

export default app;
