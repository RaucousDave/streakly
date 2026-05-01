import { Router, type Request, type Response } from "express";
import { and, desc, eq, inArray } from "drizzle-orm";
import { db } from "../db/db";
import { notificationEvents } from "../db/schema";
import { requireAuth } from "./habits.route";

const router = Router();

const ALLOWED_STATUSES = new Set(["queued", "sent", "skipped", "all"] as const);

router.get("/", requireAuth, async (req: Request, res: Response) => {
  try {
    const session = (req as any).session;
    const rawStatus = String(req.query.status ?? "queued");
    const status = ALLOWED_STATUSES.has(rawStatus as any) ? rawStatus : "queued";
    const requestedLimit = Number(req.query.limit ?? 20);
    const limit = Number.isFinite(requestedLimit)
      ? Math.min(Math.max(Math.trunc(requestedLimit), 1), 100)
      : 20;

    const filters =
      status === "all"
        ? eq(notificationEvents.userId, session.user.id)
        : and(
            eq(notificationEvents.userId, session.user.id),
            eq(notificationEvents.status, status as "queued" | "sent" | "skipped"),
          );

    const notifications = await db
      .select()
      .from(notificationEvents)
      .where(filters)
      .orderBy(
        desc(notificationEvents.scheduledFor),
        desc(notificationEvents.createdAt),
      )
      .limit(limit);

    return res.status(200).json({ notifications });
  } catch (error) {
    console.error("[GET /api/notifications]", error);
    return res.status(500).json({ error: "Something went wrong" });
  }
});

router.patch("/ack", requireAuth, async (req: Request, res: Response) => {
  try {
    const session = (req as any).session;
    const ids = Array.isArray(req.body?.ids)
      ? req.body.ids.filter((value: unknown): value is string => typeof value === "string" && value.length > 0)
      : [];

    if (ids.length === 0) {
      return res.status(400).json({ error: "ids must be a non-empty array" });
    }

    const updatedNotifications = await db
      .update(notificationEvents)
      .set({
        status: "sent",
        sentAt: new Date(),
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(notificationEvents.userId, session.user.id),
          eq(notificationEvents.status, "queued"),
          inArray(notificationEvents.id, ids),
        ),
      )
      .returning();

    return res.status(200).json({
      success: true,
      count: updatedNotifications.length,
      notifications: updatedNotifications,
    });
  } catch (error) {
    console.error("[PATCH /api/notifications/ack]", error);
    return res.status(500).json({ error: "Something went wrong" });
  }
});

export default router;
