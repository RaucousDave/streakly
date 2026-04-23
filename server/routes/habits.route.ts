import {
  type Request,
  type Response,
  type NextFunction,
  Router,
} from "express";
import { auth } from "../auth/auth";
import { fromNodeHeaders } from "better-auth/node";
import { db } from "../db/db";
import { habitLogs } from "../db/schema";
import { habits } from "../db/schema";
import { eq, and, sql } from "drizzle-orm";
import { isTemplateLiteralTypeNode } from "typescript";
import { error } from "better-auth/api";

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

export async function streakEngine() {
  const allHabits = await db.select().from(habits);
  const today = new Date().toISOString().split("T")[0];

  for (const habit of allHabits) {
    // checks if habit is checked as done by the user
    if (habit.done) {
      await db
        .update(habits)
        .set({
          currentStreak: habit.currentStreak + 1,
          longestStreak: Math.max(habit.longestStreak, habit.currentStreak + 1),
          totalCompleted: habit.totalCompleted + 1,
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
    else if (habit.freezes > 0) {
      await db
        .update(habits)
        .set({
          done: false,
          freezes: habit.freezes - 1,
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

      const rawId = req.params.id;

      if (typeof rawId !== "string" || !rawId) {
        return res.status(400).json({ error: "Id is invalid" });
      }

      const id = rawId;

      const [habit] = await db
        .select()
        .from(habits)
        .where(and(eq(habits.id, id), eq(habits.userId, session.user.id)));

      if (!habit) {
        res.status(400).json({ error: "Habit not found" });
        return;
      }

      const [updatedHabit] = await db
        .update(habits)
        .set({
          done: !habit.done,
          updatedAt: new Date(),
        })
        .where(and(eq(habits.id, id), eq(habits.userId, session.user.id)))
        .returning();

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

    const { name, minimumInput, color } = await req.body;

    if (typeof id !== "string" || !id) {
      return res.status(400).json({ error: "Id is invalid" });
    }

    const [habit] = await db.select().from(habits).where(eq(habits.id, id));

    if (!habit) {
      return res.status(400).json({ error: "Habit does not exist" });
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

    if (!habit) {
      return res.status(404).json({ error: "Habit does not exist" });
    }

    await db
      .delete(habits)
      .where(and(eq(habits.userId, session.user.id), eq(habits.id, id)));
  } catch (err) {
    return res.status(400).json({ error: err });
  }
});

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

export default router;
