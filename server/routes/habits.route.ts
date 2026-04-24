import {
  type Request,
  type Response,
  type NextFunction,
  Router,
  request,
} from "express";
import { auth } from "../auth/auth";
import { fromNodeHeaders } from "better-auth/node";
import { db } from "../db/db";
import { habitLogs, milestones } from "../db/schema";
import { habits } from "../db/schema";
import { eq, and, isNotNull, gte, inArray } from "drizzle-orm";
import { format, subWeeks } from "date-fns";
import { includes } from "zod";

const router = Router();

async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const session = await auth.api.getSession({
    headers: fromNodeHeaders(req.headers),
  });
  if (!session) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }
  (req as any).session = session;
  next();
}

const FREEZE_TIERS = [
  {
    threshold: 100,
    freezes: 5,
  },
  {
    threshold: 80,
    freezes: 4,
  },
  {
    threshold: 50,
    freezes: 3,
  },
  {
    threshold: 0,
    freezes: 2,
  },
];

const MILESTONE_THRESHOLDS = [7, 30, 100] as const;

export async function checkAndWriteMilestone(
  habitId: string,
  userId: string,
  currentStreak: number,
) {
  if (MILESTONE_THRESHOLDS.includes(currentStreak as any)) {
    const existing = await db
      .select()
      .from(milestones)
      .where(
        and(eq(milestones.habitId, habitId), eq(milestones.userId, userId)),
      )
      .limit(1);

    if (existing.length > 0) return;

    const [newMilestone] = await db
      .insert(milestones)
      .values({
        id: crypto.randomUUID(),
        habitId,
        userId,
        streakCount: currentStreak,
      })
      .returning();
  }
}

function getFreezesForRate(rate: number): number {
  return FREEZE_TIERS.find((t) => rate >= t.threshold)!.freezes;
}

export async function freezeResetEngine() {
  const allHabits = await db.select().from(habits);

  const userHabitMap = new Map<String, string[]>();
  for (const habit of allHabits) {
    if (userHabitMap.has(habit.userId)) {
      userHabitMap.set(habit.userId, []);
    }
    userHabitMap.get(habit.userId)!.push(habit.id);
  }

  const today = new Date();
  const weekAgo = new Date(today);

  weekAgo.setDate(today.getDate() - 7);
  const weekAgoStr = weekAgo.toISOString().split("T")[0]!;

  for (const [userId, habitIds] of userHabitMap) {
    const logs = await db
      .select()
      .from(habitLogs)
      .where(
        and(
          inArray(habitLogs.habitId, habitIds),
          gte(habitLogs.date, weekAgoStr),
        ),
      );

    const relevantLogs = logs.filter((log) => log.status !== "skipped").length;
    const completedLogs = logs.filter((l) => l.status === "completed").length;

    const completionRate =
      relevantLogs > 0 ? Math.round((completedLogs / relevantLogs) * 100) : 0;

    const newFreezes = getFreezesForRate(completionRate);

    // weekly freeze reset
    for (const habitId of habitIds) {
      await db
        .update(habits)
        .set({
          freezes: newFreezes,
          freezesUsed: 0,
          freezeResetDate: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(habits.id, habitId));
    }
  }
}

export async function streakEngine() {
  const allHabits = await db.select().from(habits);
  const today = new Date().toISOString().split("T")[0];

  for (const habit of allHabits) {
    // Prevents double counting
    if (habit.lastCheckedInDate === today) {
      continue;
    }
    // checks if habit is checked as done by the user
    if (habit.done) {
      await db
        .update(habits)
        .set({
          currentStreak: habit.currentStreak + 1,
          longestStreak: Math.max(habit.longestStreak, habit.currentStreak + 1),
          totalCompleted: habit.totalCompleted + 1,
          lastProcessedDate: today,
          done: false,
          updatedAt: new Date(),
        })
        .where(eq(habits.id, habit.id));

      // writes to habitLogs table
      await db
        .insert(habitLogs)
        .values({
          id: crypto.randomUUID(),
          userId: habit.userId,
          habitId: habit.id,

          date: today as string,
          status: "completed",
        })
        .returning();
    }
    // runs if habit was unchecked but freeze is active
    else if (habit.frozen) {
      await db
        .update(habits)
        .set({
          done: false,
          frozen: false,
          freezes: habit.freezes - 1,
          freezesUsed: habit.freezesUsed + 1,
          lastProcessedDate: today,
          totalSkipped: habit.totalSkipped + 1,
          updatedAt: new Date(),
        })
        .where(eq(habits.id, habit.id));

      await db
        .insert(habitLogs)
        .values({
          id: crypto.randomUUID(),
          userId: habit.userId,
          habitId: habit.id,
          date: today as string,
          status: "skipped",
        })
        .returning();
    } else {
      // Update habits
      await db
        .update(habits)
        .set({
          done: false,
          totalFailed: habit.totalFailed + 1,
          lastProcessedDate: today,
          currentStreak: 0,
          updatedAt: new Date(),
        })
        .where(eq(habits.id, habit.id));

      // Insert logs for habit if failed
      await db
        .insert(habitLogs)
        .values({
          id: crypto.randomUUID(),
          userId: habit.userId,
          habitId: habit.id,
          date: today as string,
          status: "failed",
        })
        .returning();
    }
  }
}

router.get(
  "/",
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const session = (req as any).session;

      const userHabits = await db
        .select()
        .from(habits)
        .where(eq(habits.userId, session.user.id));
      res.status(200).json({ habits: userHabits });
    } catch (error) {
      res.status(401).json({ message: "Something went wrong", error });
    }
  },
);

router.post("/", requireAuth, async (req: Request, res: Response) => {
  try {
    const session = (req as any).session;

    const { name, minimumInput, color } = await req.body;

    if (!name || !minimumInput || !color) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const [habit] = await db
      .insert(habits)
      .values({
        id: crypto.randomUUID(),
        name,
        freezesUsed: 0,
        minimumInput,
        color,
        createdAt: new Date(),
        userId: session.user.id,
      })
      .returning();

    return res.status(200).json({ newHabit: habit });
  } catch (error) {
    return res.status(400).json({ message: "Something went wrong", error });
  }
});

// route for checking and unchecking habits daily
router.patch(
  "/:id/checkin",
  requireAuth,
  async (req: Request, res: Response) => {
    try {
      const session = (req as any).session;
      const today = new Date().toISOString().split("T")[0];

      const rawId = req.params.id;

      if (typeof rawId !== "string" || !rawId) {
        return res.status(400).json({ error: "Id is invalid" });
      }

      const id = rawId;

      const { date, status } = req.body as {
        date: string;
        status: "completed" | "skipped" | "failed";
      };

      await db.insert(habitLogs).values({
        id: crypto.randomUUID(),
        userId: session.user.id,
        habitId: id,
        date: date ?? today,
        status: status ?? "completed",
        createdAt: new Date(),
      });

      const logs = await db
        .select()
        .from(habitLogs)
        .where(eq(habitLogs.habitId, id))
        .orderBy(habitLogs.date);

      const sortedDesc = [...logs].sort((a, b) => b.date.localeCompare(a.date));

      let currentStreak = 0;
      for (const log of logs) {
        if (log.status === "completed") {
          currentStreak++;
        } else if (log.status === "skipped") {
          continue;
        } else {
          break;
        }
      }
      const [habit] = await db
        .select()
        .from(habits)
        .where(and(eq(habits.id, id), eq(habits.userId, session.user.id)));

      if (!habit) {
        res.status(400).json({ error: "Habit not found" });
        return;
      }

      if (habit.lastCheckedInDate === today || habit.done) {
        res.status(400).json({ error: "Already checked in today" });
        return;
      }

      const [updatedHabit] = await db
        .update(habits)
        .set({
          done: true,
          updatedAt: new Date(),
        })
        .where(and(eq(habits.id, id), eq(habits.userId, session.user.id)))
        .returning();

      await checkAndWriteMilestone(id, session.user.id, currentStreak);
      return res.status(200).json({ message: updatedHabit });
    } catch (err) {
      return res.status(400).json({ message: "Something went wrong", err });
    }
  },
);

// route for updating habits info
router.patch("/:id", requireAuth, async (req: Request, res: Response) => {
  try {
    const session = (req as any).session;
    const id = req.params.id;

    const { name, minimumInput, color, frozen } = await req.body;

    if (typeof id !== "string" || !id) {
      return res.status(400).json({ error: "Id is invalid" });
    }

    const [habit] = await db.select().from(habits).where(eq(habits.id, id));

    if (!habit) {
      return res.status(400).json({ error: "Habit does not exist" });
    }

    if (frozen as boolean) {
      if (habit?.freezes === 0) {
        return res.status(400).json({ error: "No freezes remaining" });
      }

      const [frozenHabit] = await db
        .update(habits)
        .set({
          freezes: Number(habits.freezes ?? 0) - 1,
          freezesUsed: Number (habits.freezesUsed ?? 0) + 1,
          frozen: true,
          updatedAt: new Date(),
        })
        .where(and(eq(habits.id, id), eq(habits.userId, session.user.id)));

      return res
        .status(200)
        .json({ message: "Habit frozen successfully", habit: frozenHabit });
    }

    const [updatedHabit] = await db
      .update(habits)
      .set({
        ...(name && { name }),
        ...(minimumInput && { minimumInput }),
        ...(color && { color }),
        updatedAt: new Date(),
      })
      .where(and(eq(habits.id, id), eq(habits.userId, session.user.id)));

    return res.status(200).json({ success: true, message: updatedHabit });
  } catch (err) {
    return res.status(400).json({ error: "something went wrong" });
  }
});

router.delete("/:id", requireAuth, async (req: Request, res: Response) => {
  try {
    const session = (req as any).session;
    const id = req.params.id;

    if (typeof id !== "string" || !id) {
      res.status(400).json({ message: "Id is invalid" });
      return;
    }

    const [habit] = await db
      .select()
      .from(habits)
      .where(and(eq(habits.id, id), eq(habits.userId, session.user.id)));

    if (!habit || habit.deletedAt) {
      return res.status(404).json({ error: "Habit does not exist" });
    }

    const [updated] = await db
      .update(habits)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(and(eq(habits.userId, session.user.id), eq(habits.id, id)))
      .returning();

    return res
      .status(200)
      .json({ message: "Habit deleted successfully", habit: updated });
  } catch (err) {
    return res.status(400).json({ error: err });
  }
});

router.patch(
  "/:id/restore",
  requireAuth,
  async (req: Request, res: Response) => {
    const session = (req as any).session;
    const id = req.params.id;

    if (typeof id !== "string" || !id) {
      res.status(400).json({ error: "Id is invalid" });
      return;
    }

    const [restoredHabit] = await db
      .update(habits)
      .set({ deletedAt: null, updatedAt: new Date() })
      .where(and(isNotNull(habits.deletedAt), eq(habits.id, id)))
      .returning({ id: habits.id, name: habits.name, color: habits.color });

    return res
      .status(200)
      .json({ message: "Habit restored successfully", habit: restoredHabit });
  },
);

router.get("/:id/logs", requireAuth, async (req: Request, res: Response) => {
  try {
    const session = (req as any).session;
    const id = req.params.id;
    const months = Number(req.query.months ?? 3);

    // check if id is valid
    if (typeof id !== "string" || !id) {
      res.status(400).json({ error: "Id is invalid" });
      return;
    }

    const [habit] = await db
      .select()
      .from(habits)
      .where(and(eq(habits.id, id), eq(habits.userId, session.user.id)));
    if (!habit) {
      res.status(404).json({ error: "Habit not found" });
    }

    const since = new Date();
    since.setMonth(since.getMonth() - months);
    const sinceStr = since.toISOString().split("T")[0];

    const logs = await db
      .select()
      .from(habitLogs)
      .where(and(eq(habits.id, id), eq(habits.userId, session.user.id)));

    const filtered = logs.filter((log) => log.date >= sinceStr!);

    res.json({ logs: filtered });
  } catch (err) {
    console.error("[GET /api/habits/:id/logs]", err);
    res.status(500).json({ error: "Something went wrong" });
  }
});

router.post("/streak-engine", async (_req: Request, res: Response) => {
  try {
    await streakEngine();
    res
      .status(200)
      .json({ success: true, message: "Streak engine ran successfully" });
  } catch (err) {
    return res.json(500).json({ error: err });
  }
});

router.get("/:id/history", requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string };
    const sixteenWeeksAgo = format(subWeeks(new Date(), 16), "yyyy-mm-dd");

    const logs = await db
      .select()
      .from(habitLogs)
      .where(and(eq(habitLogs.id, id), gte(habitLogs.date, sixteenWeeksAgo)));

    return res.status(200).json({ message: logs });
  } catch (err) {
    return res.status(500).json({ error: "Something went wrong" });
  }
});

router.get("/:id/stats", requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string };
    const logs = await db
      .select()
      .from(habitLogs)
      .where(eq(habitLogs.habitId, id))
      .orderBy(habitLogs.date);

    if (logs.length === 0) {
      return res.json({
        completionRate: 0,
        currentStreak: 0,
        longestStreak: 0,
        totalCompleted: 0,
        totalLogs: 0,
      });
    }

    const totalCompleted = logs.filter(
      (log) => log.status === "completed",
    ).length;
    const relevantLogs = logs.filter((log) => log.status !== "skipped").length;
    const completionRate = Math.round((totalCompleted / relevantLogs) * 100);

    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;

    const sortedDesc = [...logs].sort((a, b) => b.date.localeCompare(a.date));
    for (const log of sortedDesc) {
      if (log.status === "completed") {
        currentStreak++;
      } else if (log.status === "skipped") {
        continue;
      } else {
        break;
      }
    }

    for (const log of logs) {
      if (log.status === "completed") {
        tempStreak++;
        longestStreak = Math.max(longestStreak, tempStreak);
      } else if (log.status === "skipped") {
        continue;
      } else {
        tempStreak = 0;
      }
    }

    return res.json({
      currentStreak,
      longestStreak,
      relevantLogs,
      completionRate,
      totalCompleted,
      totalLogs: logs.length,
    });
  } catch (err) {
    return res.status(500).json({ error: "Something went wrong" });
  }
});

export default router;
