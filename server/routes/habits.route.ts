import {
  type Request,
  type Response,
  type NextFunction,
  Router,
} from "express";
import { auth } from "../auth/auth";
import { fromNodeHeaders } from "better-auth/node";
import { db } from "../db/db";
import { habitLogs, milestones, user, type HabitLogs } from "../db/schema";
import { habits } from "../db/schema";
import { eq, and, isNotNull, gte, inArray, ne, isNull } from "drizzle-orm";
import { format, getDate, subWeeks } from "date-fns";
import { queueMilestoneNotification } from "../lib/notifications";

const router = Router();

interface Habit {
  id: string;
  name: string;
  userId: string;
  minimumInput: string;
  done: boolean;
  color: string;
  maximumStreak: number;
  currentStreak: number;
  longestStreak: number;
  totalCompleted: number;
  totalSkipped: number;
  totalFailed: number;
  lastCheckedInDate: string;
  createdAt: Date;
  lastProcessedDate: string;
}

interface HabitLog {
  id: string;
  userId: string;
  habitId: string;
  date: string;
  createdAt: Date;
  status: string;
}
export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
) {
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

export function getDateKey(date = new Date()) {
  return format(date, "yyyy-MM-dd");
}

function shiftDateKey(dateKey: string, days: number) {
  const date = new Date(`${dateKey}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function diffDays(leftDateKey: string, rightDateKey: string) {
  const left = new Date(`${leftDateKey}T00:00:00.000Z`);
  const right = new Date(`${rightDateKey}T00:00:00.000Z`);
  return Math.floor((left.getTime() - right.getTime()) / (24 * 60 * 60 * 1000));
}

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
        and(
          eq(milestones.habitId, habitId),
          eq(milestones.userId, userId),
          eq(milestones.streakCount, currentStreak),
        ),
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

    await queueMilestoneNotification({
      userId,
      habitId,
      streakCount: currentStreak,
    });
  }
}

function getFreezesForRate(rate: number): number {
  return FREEZE_TIERS.find((t) => rate >= t.threshold)!.freezes;
}

export async function freezeResetEngine() {
  const allUsers = await db.select().from(user);
  const allHabits = await db.select().from(habits);

  const userHabitMap = new Map<string, string[]>();
  for (const habit of allHabits) {
    const list = userHabitMap.get(habit.userId) ?? [];
    list.push(habit.id);
    userHabitMap.set(habit.userId, list);
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

    await db
      .update(user)
      .set({
        freezes: newFreezes,
        freezesUsed: 0,
        freezeResetDate: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(user.id, userId));
  }
}

export async function reconcileMissingLogs(
  habit: Habit,
  today: string,
): Promise<HabitLog[]> {
  const createdDateKey = getDateKey(habit.createdAt);
  const lastProcessedDate =
    habit.lastProcessedDate ?? shiftDateKey(createdDateKey, -1);
  const daysToProcess = diffDays(lastProcessedDate, createdDateKey);

  if (daysToProcess <= 0) return [];

  const logs: HabitLog[] = [];

  for (let offset = 1; offset <= daysToProcess; offset++) {
    const dateKey = shiftDateKey(lastProcessedDate, offset);

    const [existingLog] = await db
      .select()
      .from(habitLogs)
      .where(
        and(
          eq(habitLogs.habitId, habit.id),
          eq(habitLogs.userId, habit.userId),
          eq(habitLogs.date, dateKey),
        ),
      );

    if (existingLog) {
      logs.push(existingLog);
      continue;
    }
    const status = (
      habit.lastCheckedInDate === today ? "completed" : "failed"
    ) as "completed" | "failed";

    const newLog: HabitLog = {
      id: crypto.randomUUID(),
      date: dateKey,
      status,
      userId: habit.userId,
      habitId: habit.id,
      createdAt: new Date(),
    };
    await db.insert(habitLogs).values(newLog);
    logs.push(newLog);
  }

  return logs;
}

export async function streakEngine() {
  const allHabits = await db
    .select()
    .from(habits)
    .where(isNull(habits.deletedAt));
  const today = getDateKey();

  for (const habit of allHabits) {
    if (habit.lastProcessedDate === today) {
      continue;
    }

    const createdDateKey = getDateKey(habit.createdAt);
    const lastProcessedDate =
      habit.lastProcessedDate ?? shiftDateKey(createdDateKey, -1);
    const daysToProcess = diffDays(today, lastProcessedDate);

    if (daysToProcess <= 0) {
      continue;
    }

    let currentStreak = habit.currentStreak;
    let longestStreak = habit.longestStreak;
    let totalCompleted = habit.totalCompleted;
    let totalSkipped = habit.totalSkipped;
    let totalFailed = habit.totalFailed;
    let processedThrough = lastProcessedDate;

    for (let offset = 1; offset <= daysToProcess; offset += 1) {
      const dateKey = shiftDateKey(lastProcessedDate, offset);
      const [existingLog] = await db
        .select()
        .from(habitLogs)
        .where(
          and(
            eq(habitLogs.habitId, habit.id),
            eq(habitLogs.userId, habit.userId),
            eq(habitLogs.date, dateKey),
          ),
        )
        .limit(1);

      let dailyStatus = existingLog?.status;

      if (!dailyStatus) {
        dailyStatus =
          dateKey === today && habit.lastCheckedInDate === today
            ? "completed"
            : "failed";

        await db.insert(habitLogs).values({
          id: crypto.randomUUID(),
          userId: habit.userId,
          habitId: habit.id,
          date: dateKey,
          status: dailyStatus,
        });
      }

      if (dailyStatus === "completed") {
        currentStreak += 1;
        totalCompleted += 1;
        longestStreak = Math.max(longestStreak, currentStreak);
        await checkAndWriteMilestone(habit.id, habit.userId, currentStreak);
      } else if (dailyStatus === "skipped") {
        totalSkipped += 1;
      } else {
        totalFailed += 1;
        currentStreak = 0;
      }

      processedThrough = dateKey;
    }

    await db
      .update(habits)
      .set({
        currentStreak,
        longestStreak,
        totalCompleted,
        totalSkipped,
        totalFailed,
        lastProcessedDate: processedThrough,
        done: false,
        updatedAt: new Date(),
      })
      .where(and(eq(habits.id, habit.id), ne(habits.lastProcessedDate, today)));
  }
}

router.get(
  "/",
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const session = (req as any).session;
      const today = getDateKey();

      const rawHabits = await db
        .select()
        .from(habits)
        .where(eq(habits.userId, session.user.id));
      const todayLogs = await db
        .select()
        .from(habitLogs)
        .where(eq(habitLogs.userId, session.user.id));
      const skippedTodayHabitIds = new Set(
        todayLogs
          .filter((log) => log.date === today && log.status === "skipped")
          .map((log) => log.habitId),
      );

      const userHabits = rawHabits.map((habit) => ({
        ...habit,
        frozen: skippedTodayHabitIds.has(habit.id),
        done:
          habit.lastCheckedInDate === today &&
          habit.lastProcessedDate !== today &&
          !habit.deletedAt,
      }));

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
      const today = getDateKey();

      const rawId = req.params.id;

      if (typeof rawId !== "string" || !rawId) {
        return res.status(400).json({ error: "Id is invalid" });
      }

      const id = rawId;

      const body = (req.body ?? {}) as {
        date?: string;
        status?: "completed" | "skipped" | "failed";
      };

      if (body.date && body.date !== today) {
        return res.status(400).json({
          error: "Check-in only supports today's date",
        });
      }

      if (body.status && body.status !== "completed") {
        return res.status(400).json({
          error: "Check-in only supports completed status",
        });
      }

      const [habit] = await db
        .select()
        .from(habits)
        .where(and(eq(habits.id, id), eq(habits.userId, session.user.id)));
      const [todayLog] = await db
        .select()
        .from(habitLogs)
        .where(
          and(
            eq(habitLogs.habitId, id),
            eq(habitLogs.userId, session.user.id),
            eq(habitLogs.date, today),
          ),
        )
        .limit(1);

        console.log("DEBUG =>", {
          id,
          userId: session.user.id,
          today,
          habit: habit ?? "NOT FOUND",
          todayLog: todayLog ?? "NO LOG",
          lastCheckedInDate: habit?.lastCheckedInDate,
          lastProcessedDate: habit?.lastProcessedDate,
        });
        

      if (!habit) {
        res.status(404).json({ error: "Habit not found" });
        return;
      }

      if (habit.lastCheckedInDate === today) {
        res.status(400).json({ error: "Already checked in today" });
        return;
      }

      if (habit.lastProcessedDate === today) {
        return res.status(400).json({
          error: "This habit has already been processed for today",
        });
      }

      if (todayLog?.status === "skipped") {
        return res.status(400).json({
          error: "Unfreeze this habit before checking in today",
        });
      }

      const [updatedHabit] = await db
        .update(habits)
        .set({
          done: true,
          currentStreak: habit.currentStreak + 1,
          lastCheckedInDate: today,
          updatedAt: new Date(),
        })
        .where(and(eq(habits.id, id), eq(habits.userId, session.user.id)))
        .returning();

      if (!todayLog) {
        await db.insert(habitLogs).values({
          id: crypto.randomUUID(),
          userId: session.user.id,
          habitId: id,
          date: today,
          status: "completed",
        });
      }
      else if(todayLog.status !== "completed"){
        await db.update(habitLogs).set({status: "completed"}).where(habitLogs.id, todayLogs.id)
      }


      return res.status(200).json({ habit: updatedHabit });
    } catch (err) {
      console.log("Checking error: ", err);
      return res.status(500).json({ message: "Internal Server Error" });
    }
  },
);

// route for updating habits info
router.patch("/:id", requireAuth, async (req: Request, res: Response) => {
  try {
    const session = (req as any).session;
    const id = req.params.id;

    const { name, minimumInput, color, frozen } = req.body;

    if (typeof id !== "string" || !id) {
      return res.status(400).json({ error: "Id is invalid" });
    }

    const [habit] = await db
      .select()
      .from(habits)
      .where(and(eq(habits.id, id), eq(habits.userId, session.user.id)));
    const [User] = await db
      .select()
      .from(user)
      .where(eq(user.id, session.user.id));

    if (!habit) {
      return res.status(400).json({ error: "Habit does not exist" });
    }
    if (!User) return res.status(400).json({ error: "User does not exist" });

    if (frozen === true) {
      if (User?.freezes === 0) {
        return res.status(400).json({ error: "No freezes remaining" });
      }

      if (habit.lastProcessedDate === getDateKey()) {
        return res.status(400).json({
          error: "Cannot freeze a habit that has already been processed today",
        });
      }

      if (habit.lastCheckedInDate === getDateKey()) {
        return res.status(400).json({
          error: "Cannot freeze a habit that is already checked in today",
        });
      }

      const today = getDateKey();
      const [todayLog] = await db
        .select()
        .from(habitLogs)
        .where(
          and(
            eq(habitLogs.habitId, id),
            eq(habitLogs.userId, session.user.id),
            eq(habitLogs.date, today),
          ),
        )
        .limit(1);

      if (todayLog?.status === "completed") {
        return res.status(400).json({
          error: "Cannot freeze a habit that is already completed today",
        });
      }

      if (todayLog?.status === "skipped") {
        return res.status(400).json({
          error: "Habit is already frozen for today",
        });
      }

      if (!todayLog) {
        await db.insert(habitLogs).values({
          id: crypto.randomUUID(),
          userId: session.user.id,
          habitId: id,
          date: today,
          status: "skipped",
        });
      }

      const [frozenHabit] = await db
        .update(habits)
        .set({
          updatedAt: new Date(),
        })
        .where(and(eq(habits.id, id), eq(habits.userId, session.user.id)))
        .returning();

      await db
        .update(user)
        .set({
          freezes: Number(User.freezes ?? 0) - 1,
          freezesUsed: Number(User.freezesUsed ?? 0) + 1,
        })
        .where(eq(user.id, session.user.id))
        .returning();

      return res.status(200).json({
        message: "Habit frozen successfully",
        habit: frozenHabit ? { ...frozenHabit, frozen: true } : frozenHabit,
      });
    }

    if (frozen === false) {
      const today = getDateKey();

      const [todayLog] = await db
        .select()
        .from(habitLogs)
        .where(
          and(
            eq(habitLogs.habitId, id),
            eq(habitLogs.userId, session.user.id),
            eq(habitLogs.date, today),
            eq(habitLogs.status, "skipped"),
          ),
        );

      if (!todayLog) {
        return res.status(400).json({ error: "Habit is not frozen today" });
      }

      if (todayLog) {
        await db
          .delete(habitLogs)
          .where(
            and(
              eq(habitLogs.habitId, id),
              eq(habitLogs.userId, session.user.id),
              eq(habitLogs.date, today),
              eq(habitLogs.status, "skipped"),
            ),
          );
      }
      const [unFrozenHabit] = await db
        .update(habits)
        .set({
          updatedAt: new Date(),
        })
        .where(and(eq(habits.id, id), eq(habits.userId, session.user.id)))
        .returning();

      await db
        .update(user)
        .set({
          freezes: Number(User.freezes ?? 0) + 1,
          freezesUsed: Math.max(0, Number(User.freezesUsed ?? 0) - 1),
        })
        .where(eq(user.id, session.user.id))
        .returning();

      return res.status(200).json({
        message: "Habit unfrozen successfully",
        habit: unFrozenHabit
          ? { ...unFrozenHabit, frozen: false }
          : unFrozenHabit,
      });
    }

    const [updatedHabit] = await db
      .update(habits)
      .set({
        ...(name && { name }),
        ...(minimumInput !== undefined && { minimumInput }),
        ...(color && { color }),
        updatedAt: new Date(),
      })
      .where(and(eq(habits.id, id), eq(habits.userId, session.user.id)))
      .returning();

    return res.status(200).json({ success: true, message: updatedHabit });
  } catch (err) {
    return res.status(500).json({ error: "Internal server error", err });
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
      .where(
        and(
          isNotNull(habits.deletedAt),
          eq(habits.id, id),
          eq(habits.userId, session.user.id),
        ),
      )
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
      return;
    }

    const since = new Date();
    since.setMonth(since.getMonth() - months);
    const sinceStr = since.toISOString().split("T")[0];

    const logs = await db
      .select()
      .from(habitLogs)
      .where(
        and(eq(habitLogs.habitId, id), eq(habitLogs.userId, session.user.id)),
      );

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
    return res.status(500).json({ error: err });
  }
});

router.get("/:id/history", requireAuth, async (req: Request, res: Response) => {
  try {
    const session = (req as any).session;
    const { id } = req.params as { id: string };
    const sixteenWeeksAgo = format(subWeeks(new Date(), 16), "yyyy-MM-dd");

    const [habit] = await db
      .select()
      .from(habits)
      .where(and(eq(habits.id, id), eq(habits.userId, session.user.id)));

    if (!habit) {
      return res.status(404).json({ error: "Habit not found" });
    }

    const logs = await db
      .select()
      .from(habitLogs)
      .where(
        and(
          eq(habitLogs.habitId, id),
          eq(habitLogs.userId, session.user.id),
          gte(habitLogs.date, sixteenWeeksAgo),
        ),
      );

    return res.status(200).json({ message: logs });
  } catch (err) {
    return res.status(500).json({ error: "Something went wrong" });
  }
});

export default router;
