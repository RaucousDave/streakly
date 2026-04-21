import { rateLimit, ipKeyGenerator } from "express-rate-limit";
import type { Request, Response } from "express";

const rateLimitHandler = (_req: Request, res: Response) => {
  res.status(429).json({
    success: false,
    code: "TOO_MANY_REQUESTS",
    message: "Too many requests, please try again later",
  });
};

export const signInLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  keyGenerator: (req: any) =>
    `${ipKeyGenerator(req)}:${(req.body?.email ?? "").toLowerCase()}`,
});

export const signUpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  handler: rateLimitHandler,
  legacyHeaders: false,
});

export const magicLinkLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: any) =>
    `${ipKeyGenerator(req)}:${(req.body?.email ?? "").toLowerCase()}`,
});

export const passkeyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
});

export const globalAuthLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
});
