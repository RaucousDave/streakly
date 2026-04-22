import type { Request, Response, NextFunction } from "express";

export class AppError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly statusCode: number,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export const AuthErrors = {
  INVALID_CREDENTIALS: new AppError(
    "INVALID_CREDENTIALS",
    "Invalid email or password",
    401,
  ),

  EMAIL_NOT_VERIFIED: new AppError(
    "EMAIL_NOT_VERIFIED",
    "Please verify your email before signing in",
    403,
  ),

  EMAIL_ALREADY_EXISTS: new AppError(
    "EMAIL_ALREADY_EXISTS",
    "An account with this email already exists",
    409,
  ),
  SESSION_EXPIRED: new AppError(
    "SESSION_EXPIRED",
    "Your session has expired",
    401,
  ),
  UNAUTHORIZED: new AppError(
    "UNAUTHORIZED",
    "You must be signed in to access this resource",
    401,
  ),
  PASSKEY_NOT_FOUND: new AppError(
    "PASSKEY_NOT_FOUND",
    "Passkey not found or already removed",
    404,
  ),
  MAGIC_LINK_EXPIRED: new AppError(
    "MAGIC_LINK_EXPIRED",
    "This magic link has expired or has already been used",
    410,
  ),
} as const;

export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({
    success: false,
    code: "NOT_FOUND",
    message: `Route ${req.method} ${req.path} not found`,
  });
}

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      code: err.code,
      message: err.message,
    });
  }
  const isDev = process.env.NODE_ENV === "production";
  console.error("[Unhandled error]", err);

  return res.status(500).json({
    success: false,
    code: "INTERNAL_SERVER_ERROR",
    message: "Something went wrong. Please try again later",
    ...(isDev && err instanceof Error
      ? { stack: err.stack, detail: err.message }
      : {}),
  });
}
