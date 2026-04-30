import {
  type Request,
  type Response,
  type NextFunction,
  Router,
} from "express";
import { auth } from "../auth/auth";
import { fromNodeHeaders } from "better-auth/node";
import { db } from "../db/db";
import { habitLogs, milestones, user } from "../db/schema";
import { habits } from "../db/schema";
import { eq, and, isNotNull, gte, inArray, ne, isNull } from "drizzle-orm";
import { format, subWeeks } from "date-fns";

const router = Router();

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

export async function streakEngine() {
  const allHabits = await db.select().from(habits).where(isNull(habits.deletedAt));
  const today = getDateKey();

  for (const habit of allHabits) {
    if (habit.lastProcessedDate === today) {
      continue;
    }

    const completedToday = habit.lastCheckedInDate === today;

    if (completedToday) {
      const nextStreak = habit.currentStreak + 1;

      const updatedHabit = await db
        .update(habits)
        .set({
          currentStreak: nextStreak,
          longestStreak: Math.max(habit.longestStreak, nextStreak),
          totalCompleted: habit.totalCompleted + 1,
          lastProcessedDate: today,
          done: false,
          updatedAt: new Date(),
        })
        .where(and(eq(habits.id, habit.id), ne(habits.lastProcessedDate, today)))
        .returning({ id: habits.id });

      if (updatedHabit.length === 0) {
        continue;
      }

      const [existingLog] = await db
        .select()
        .from(habitLogs)
        .where(
          and(
            eq(habitLogs.habitId, habit.id),
            eq(habitLogs.userId, habit.userId),
            eq(habitLogs.date, today),
          ),
        )
        .limit(1);

      if (!existingLog) {
        await db.insert(habitLogs).values({
          id: crypto.randomUUID(),
          userId: habit.userId,
          habitId: habit.id,
          date: today as string,
          status: "completed",
        });
      }

      await checkAndWriteMilestone(habit.id, habit.userId, nextStreak);
    }
    else if (habit.frozen) {
      const updatedHabit = await db
        .update(habits)
        .set({
          done: false,
          frozen: true,
          lastProcessedDate: today,
          totalSkipped: habit.totalSkipped + 1,
          updatedAt: new Date(),
        })
        .where(and(eq(habits.id, habit.id), ne(habits.lastProcessedDate, today)))
        .returning({ id: habits.id });

      if (updatedHabit.length === 0) {
        continue;
      }

      const [existingLog] = await db
        .select()
        .from(habitLogs)
        .where(
          and(
            eq(habitLogs.habitId, habit.id),
            eq(habitLogs.userId, habit.userId),
            eq(habitLogs.date, today),
          ),
        )
        .limit(1);

      if (!existingLog) {
        await db.insert(habitLogs).values({
          id: crypto.randomUUID(),
          userId: habit.userId,
          habitId: habit.id,
          date: today as string,
          status: "skipped",
        });
      }
    } else {
      const updatedHabit = await db
        .update(habits)
        .set({
          done: false,
          totalFailed: habit.totalFailed + 1,
          lastProcessedDate: today,
          currentStreak: 0,
          updatedAt: new Date(),
        })
        .where(and(eq(habits.id, habit.id), ne(habits.lastProcessedDate, today)))
        .returning({ id: habits.id });

      if (updatedHabit.length === 0) {
        continue;
      }

      const [existingLog] = await db
        .select()
        .from(habitLogs)
        .where(
          and(
            eq(habitLogs.habitId, habit.id),
            eq(habitLogs.userId, habit.userId),
            eq(habitLogs.date, today),
          ),
        )
        .limit(1);

      if (!existingLog) {
        await db.insert(habitLogs).values({
          id: crypto.randomUUID(),
          userId: habit.userId,
          habitId: habit.id,
          date: today as string,
          status: "failed",
        });
      }
    }
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

      const userHabits = rawHabits.map((habit) => ({
        ...habit,
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

      const [updatedHabit] = await db
        .update(habits)
        .set({
          done: true,
          lastCheckedInDate: today,
          updatedAt: new Date(),
        })
        .where(and(eq(habits.id, id), eq(habits.userId, session.user.id)))
        .returning();

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

      const [frozenHabit] = await db
        .update(habits)
        .set({
          frozen: true,
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

      return res
        .status(200)
        .json({ message: "Habit frozen successfully", habit: frozenHabit });
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

      if (todayLog) {
        return res
          .status(400)
          .json({ error: "Freeze token has already been consumed" });
      }
      const [unFrozenHabit] = await db
        .update(habits)
        .set({
          frozen: false,
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

      return res
        .status(200)
        .json({ message: "Habit unfrozen successfully", habit: unFrozenHabit });
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
