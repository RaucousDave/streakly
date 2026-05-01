import { and, eq, gte, isNull } from "drizzle-orm";
import { db } from "../db/db";
import { habitLogs, habits, notificationEvents, user } from "../db/schema";

type NotificationType =
  | "daily_reminder"
  | "streak_risk"
  | "freeze_suggestion"
  | "milestone_earned"
  | "weekly_recap"
  | "comeback_nudge"
  | "low_freeze_warning";

type NotificationPriority = "normal" | "high";

type LocalParts = {
  dateKey: string;
  hour: number;
  minute: number;
  weekday: string;
};

function shiftDateKey(dateKey: string, days: number): string {
  const date = new Date(`${dateKey}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function diffDays(leftDateKey: string, rightDateKey: string): number {
  const left = new Date(`${leftDateKey}T00:00:00.000Z`);
  const right = new Date(`${rightDateKey}T00:00:00.000Z`);
  return Math.floor((left.getTime() - right.getTime()) / (24 * 60 * 60 * 1000));
}

function getLocalParts(now: Date, timeZone: string): LocalParts {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    weekday: "short",
  });

  const parts = formatter.formatToParts(now);
  const map = new Map(parts.map((part) => [part.type, part.value]));

  return {
    dateKey: `${map.get("year")}-${map.get("month")}-${map.get("day")}`,
    hour: Number(map.get("hour") ?? 0),
    minute: Number(map.get("minute") ?? 0),
    weekday: map.get("weekday") ?? "Mon",
  };
}

function toMinutes(clock: string): number {
  const [hours = "0", minutes = "0"] = clock.split(":");
  return Number(hours) * 60 + Number(minutes);
}

function isWithinWindow(
  hour: number,
  minute: number,
  start: string,
  end: string,
): boolean {
  const current = hour * 60 + minute;
  const startMinutes = toMinutes(start);
  const endMinutes = toMinutes(end);

  return current >= startMinutes && current <= endMinutes;
}

function isInQuietHours(
  hour: number,
  minute: number,
  start?: string | null,
  end?: string | null,
): boolean {
  if (!start || !end) return false;

  const current = hour * 60 + minute;
  const startMinutes = toMinutes(start);
  const endMinutes = toMinutes(end);

  if (startMinutes <= endMinutes) {
    return current >= startMinutes && current <= endMinutes;
  }

  return current >= startMinutes || current <= endMinutes;
}

function buildReminderCopy(openHabitCount: number) {
  if (openHabitCount === 1) {
    return {
      title: "One habit is still open today.",
      body: "Quick check-in: your habit is still waiting for today.",
    };
  }

  return {
    title: `You still have ${openHabitCount} habits open today.`,
    body: "Keep the streak alive.",
  };
}

function buildRiskCopy(habitName: string, streak: number) {
  return {
    title: `Your ${streak}-day ${habitName} streak is at risk tonight.`,
    body: "One check-in keeps your streak going.",
  };
}

function buildFreezeCopy(habitName: string, freezesLeft: number) {
  return {
    title: "Can't finish today?",
    body: `You have ${freezesLeft} freeze${freezesLeft === 1 ? "" : "s"} left. Use one to save your ${habitName} streak.`,
  };
}

function buildComebackCopy() {
  return {
    title: "A quick check-in gets you moving again.",
    body: "You have been away for a few days. Pick one habit and restart today.",
  };
}

async function queueNotification(params: {
  userId: string;
  localDateKey: string;
  type: NotificationType;
  priority: NotificationPriority;
  title: string;
  body: string;
  dedupeKey: string;
  habitId?: string;
  scheduledFor?: Date;
}) {
  const [existing] = await db
    .select({ id: notificationEvents.id })
    .from(notificationEvents)
    .where(eq(notificationEvents.dedupeKey, params.dedupeKey))
    .limit(1);

  if (existing) {
    return false;
  }

  await db.insert(notificationEvents).values({
    id: crypto.randomUUID(),
    userId: params.userId,
    habitId: params.habitId,
    type: params.type,
    priority: params.priority,
    title: params.title,
    body: params.body,
    dedupeKey: params.dedupeKey,
    localDateKey: params.localDateKey,
    scheduledFor: params.scheduledFor ?? new Date(),
    updatedAt: new Date(),
  });

  return true;
}

async function getDailyNotificationCount(userId: string, localDateKey: string) {
  const events = await db
    .select({ id: notificationEvents.id })
    .from(notificationEvents)
    .where(
      and(
        eq(notificationEvents.userId, userId),
        eq(notificationEvents.localDateKey, localDateKey),
      ),
    );

  return events.length;
}

export async function queueMilestoneNotification(params: {
  userId: string;
  habitId: string;
  streakCount: number;
}) {
  const [recipient] = await db
    .select({
      id: user.id,
      timeZone: user.timeZone,
      enabled: user.notificationMilestones,
    })
    .from(user)
    .where(eq(user.id, params.userId))
    .limit(1);

  if (!recipient || !recipient.enabled) {
    return;
  }

  const local = getLocalParts(new Date(), recipient.timeZone);

  await queueNotification({
    userId: params.userId,
    habitId: params.habitId,
    localDateKey: local.dateKey,
    type: "milestone_earned",
    priority: "normal",
    title: `${params.streakCount}-day streak achieved.`,
    body:
      params.streakCount === 7
        ? "Week warrior unlocked."
        : "You just hit a streak milestone. Nice work.",
    dedupeKey: `milestone:${params.habitId}:${params.streakCount}`,
  });
}

export async function runNotificationDigestEngine(now = new Date()) {
  const allUsers = await db
    .select()
    .from(user);

  for (const currentUser of allUsers) {
    const local = getLocalParts(now, currentUser.timeZone);

    if (
      isInQuietHours(
        local.hour,
        local.minute,
        currentUser.quietHoursStart,
        currentUser.quietHoursEnd,
      )
    ) {
      continue;
    }

    const activeHabits = await db
      .select()
      .from(habits)
      .where(and(eq(habits.userId, currentUser.id), isNull(habits.deletedAt)));

    if (activeHabits.length === 0) {
      continue;
    }

    const openHabits = activeHabits.filter(
      (habit) => habit.lastCheckedInDate !== local.dateKey,
    );

    if (openHabits.length === 0) {
      continue;
    }

    let notificationCount = await getDailyNotificationCount(
      currentUser.id,
      local.dateKey,
    );

    if (
      currentUser.notificationDailyReminders &&
      notificationCount < 2 &&
      isWithinWindow(
        local.hour,
        local.minute,
        currentUser.reminderWindowStart,
        currentUser.reminderWindowEnd,
      )
    ) {
      const copy = buildReminderCopy(openHabits.length);
      const queued = await queueNotification({
        userId: currentUser.id,
        localDateKey: local.dateKey,
        type: "daily_reminder",
        priority: "normal",
        title: copy.title,
        body: copy.body,
        dedupeKey: `daily_reminder:${currentUser.id}:${local.dateKey}`,
      });

      if (queued) {
        notificationCount += 1;
      }
    }

    const topRiskHabit = openHabits
      .filter((habit) => habit.currentStreak > 0)
      .sort((left, right) => right.currentStreak - left.currentStreak)[0];

    if (
      topRiskHabit &&
      currentUser.notificationStreakRisk &&
      notificationCount < 2 &&
      isWithinWindow(local.hour, local.minute, "21:00", "22:00")
    ) {
      const copy = buildRiskCopy(topRiskHabit.name, topRiskHabit.currentStreak);
      const queued = await queueNotification({
        userId: currentUser.id,
        habitId: topRiskHabit.id,
        localDateKey: local.dateKey,
        type: "streak_risk",
        priority: "high",
        title: copy.title,
        body: copy.body,
        dedupeKey: `streak_risk:${topRiskHabit.id}:${local.dateKey}`,
      });

      if (queued) {
        notificationCount += 1;
      }
    }

    if (
      topRiskHabit &&
      currentUser.notificationFreezeSuggestions &&
      currentUser.freezes > 0 &&
      notificationCount < 2 &&
      isWithinWindow(local.hour, local.minute, "21:00", "22:00")
    ) {
      const copy = buildFreezeCopy(topRiskHabit.name, currentUser.freezes);
      const queued = await queueNotification({
        userId: currentUser.id,
        habitId: topRiskHabit.id,
        localDateKey: local.dateKey,
        type: "freeze_suggestion",
        priority: "high",
        title: copy.title,
        body: copy.body,
        dedupeKey: `freeze_suggestion:${topRiskHabit.id}:${local.dateKey}`,
      });

      if (queued) {
        notificationCount += 1;
      }
    }

    if (
      currentUser.notificationWeeklyRecap &&
      local.weekday === "Sun" &&
      notificationCount < 2 &&
      isWithinWindow(local.hour, local.minute, "18:00", "20:00")
    ) {
      const sevenDaysAgo = shiftDateKey(local.dateKey, -6);
      const weeklyLogs = await db
        .select()
        .from(habitLogs)
        .where(
          and(
            eq(habitLogs.userId, currentUser.id),
            gte(habitLogs.date, sevenDaysAgo),
          ),
        );

      const completions = weeklyLogs.filter(
        (log) => log.status === "completed",
      ).length;

      const queued = await queueNotification({
        userId: currentUser.id,
        localDateKey: local.dateKey,
        type: "weekly_recap",
        priority: "normal",
        title: "Your week in Streakly.",
        body: `You completed ${completions} check-ins this week.`,
        dedupeKey: `weekly_recap:${currentUser.id}:${local.dateKey}`,
      });

      if (queued) {
        notificationCount += 1;
      }
    }

    if (
      currentUser.notificationComebackNudges &&
      notificationCount < 2 &&
      isWithinWindow(
        local.hour,
        local.minute,
        currentUser.reminderWindowStart,
        currentUser.reminderWindowEnd,
      )
    ) {
      const lastCheckin = activeHabits
        .map((habit) => habit.lastCheckedInDate)
        .filter((value): value is string => Boolean(value))
        .sort()
        .at(-1);

      if (lastCheckin) {
        const daysSinceLastCheckin = diffDays(local.dateKey, lastCheckin);
        const recentEvents = await db
          .select({ id: notificationEvents.id })
          .from(notificationEvents)
          .where(
            and(
              eq(notificationEvents.userId, currentUser.id),
              eq(notificationEvents.type, "comeback_nudge"),
              gte(
                notificationEvents.createdAt,
                new Date(now.getTime() - 72 * 60 * 60 * 1000),
              ),
            ),
          );

        if (
          daysSinceLastCheckin >= 2 &&
          daysSinceLastCheckin <= 3 &&
          recentEvents.length === 0
        ) {
          const copy = buildComebackCopy();
          await queueNotification({
            userId: currentUser.id,
            localDateKey: local.dateKey,
            type: "comeback_nudge",
            priority: "normal",
            title: copy.title,
            body: copy.body,
            dedupeKey: `comeback_nudge:${currentUser.id}:${local.dateKey}`,
          });
        }
      }
    }
  }
}
