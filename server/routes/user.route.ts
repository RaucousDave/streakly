import { requireAuth } from "./habits.route";
import { user } from "../db/schema";
import { db } from "../db/db";
import { eq } from "drizzle-orm";

import { Router } from "express";
import type { Request, Response } from "express";

const router = Router();

router.get("/me", requireAuth, async (req: Request, res: Response) => {
  try {
    const session = (req as any).session;

    const [User] = await db
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
        emailVerified: user.emailVerified,
        timeZone: user.timeZone,
        freezes: user.freezes,
        freezesUsed: user.freezesUsed,
        freezeResetDate: user.freezeResetDate,
        notificationDailyReminders: user.notificationDailyReminders,
        notificationStreakRisk: user.notificationStreakRisk,
        notificationMilestones: user.notificationMilestones,
        notificationWeeklyRecap: user.notificationWeeklyRecap,
        notificationComebackNudges: user.notificationComebackNudges,
        notificationFreezeSuggestions: user.notificationFreezeSuggestions,
        reminderWindowStart: user.reminderWindowStart,
        reminderWindowEnd: user.reminderWindowEnd,
        quietHoursStart: user.quietHoursStart,
        quietHoursEnd: user.quietHoursEnd,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      })
      .from(user)
      .where(eq(user.id, session.user.id));

    if (!User) {
      return res.status(404).json({ error: "User does not exist" });
    }

    return res.status(200).json({ success: true, userData: User });
  } catch (error) {
    return res.status(500).json({ error: "Something went wrong" });
  }
});

router.patch(
  "/me/notification-preferences",
  requireAuth,
  async (req: Request, res: Response) => {
    try {
      const session = (req as any).session;
      const {
        timeZone,
        notificationDailyReminders,
        notificationStreakRisk,
        notificationMilestones,
        notificationWeeklyRecap,
        notificationComebackNudges,
        notificationFreezeSuggestions,
        reminderWindowStart,
        reminderWindowEnd,
        quietHoursStart,
        quietHoursEnd,
      } = req.body ?? {};

      const [updatedUser] = await db
        .update(user)
        .set({
          ...(typeof timeZone === "string" && timeZone && { timeZone }),
          ...(typeof notificationDailyReminders === "boolean" && {
            notificationDailyReminders,
          }),
          ...(typeof notificationStreakRisk === "boolean" && {
            notificationStreakRisk,
          }),
          ...(typeof notificationMilestones === "boolean" && {
            notificationMilestones,
          }),
          ...(typeof notificationWeeklyRecap === "boolean" && {
            notificationWeeklyRecap,
          }),
          ...(typeof notificationComebackNudges === "boolean" && {
            notificationComebackNudges,
          }),
          ...(typeof notificationFreezeSuggestions === "boolean" && {
            notificationFreezeSuggestions,
          }),
          ...(typeof reminderWindowStart === "string" &&
            reminderWindowStart && { reminderWindowStart }),
          ...(typeof reminderWindowEnd === "string" &&
            reminderWindowEnd && { reminderWindowEnd }),
          ...(quietHoursStart === null || typeof quietHoursStart === "string"
            ? { quietHoursStart: quietHoursStart ?? null }
            : {}),
          ...(quietHoursEnd === null || typeof quietHoursEnd === "string"
            ? { quietHoursEnd: quietHoursEnd ?? null }
            : {}),
          updatedAt: new Date(),
        })
        .where(eq(user.id, session.user.id))
        .returning();

      return res.status(200).json({ success: true, userData: updatedUser });
    } catch (_error) {
      return res.status(500).json({ error: "Something went wrong" });
    }
  },
);

export default router;
