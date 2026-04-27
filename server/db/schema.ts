import { sql } from "drizzle-orm";
import {
  pgTable,
  text,
  boolean,
  timestamp,
  integer,
} from "drizzle-orm/pg-core";

export const user = pgTable("user", {
  id: text("id").notNull().primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  image: text("image"),
  emailVerified: boolean("email_verified").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const session = pgTable("session", {
  id: text("id").notNull().primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .references(() => user.id, { onDelete: "cascade" })
    .notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const account = pgTable("account", {
  id: text("id").notNull(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" })
    .notNull(),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const verification = pgTable("verification", {
  id: text("id"),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const passkey = pgTable("passkey", {
  id: text("id").notNull(),
  name: text("name"),
  publicKey: text("public_key").notNull(),
  userId: text("user_id")
    .references(() => user.id, { onDelete: "cascade" })
    .notNull(),
  credentialId: text("credential_id").notNull().unique(),
  counter: integer("counter").notNull().default(0),
  deviceType: text("device_type"),
  backedUp: boolean("backed_up").notNull().default(false),
  transports: text("transports"),
  aaguid: text("aaguid"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const habits = pgTable("habits", {
  id: text("id").notNull().primaryKey(),
  name: text("name").notNull(),
  userId: text("user_id")
    .references(() => user.id, { onDelete: "cascade" })
    .notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  minimumInput: text("minimum_input").notNull(),
  done: boolean("done").notNull().default(false),
  color: text("color").notNull(),

  frozen: boolean("frozen").default(false).notNull(),
  freezes: integer("freezes").default(2).notNull(),
  maximumStreak: integer("maximum_streak").notNull().default(0),
  currentStreak: integer("current_streak").notNull().default(0),
  freezesUsed: integer("freezes_used").notNull().default(0),
  freezeResetDate: timestamp("freeze_reset_date").default(
    sql`CURRENT_TIMESTAMP`,
  ),
  longestStreak: integer("longest_streak").notNull().default(0),
  totalCompleted: integer("total_completed").notNull().default(0),
  lastCheckedInDate: text("last_checked_in_date"),
  lastProcessedDate: text("last_processed_date"),
  totalSkipped: integer("total_skipped").notNull().default(0),
  totalFailed: integer("total_failed").notNull().default(0),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  deletedAt: timestamp("deleted_at"),
});

export const habitLogs = pgTable("habit_logs", {
  id: text("id").primaryKey().notNull(),
  userId: text("user_id")
    .references(() => user.id, { onDelete: "cascade" })
    .notNull(),
  habitId: text("habit_id")
    .references(() => habits.id, { onDelete: "cascade" })
    .notNull(),
  date: text("date").notNull(),
  status: text("status", {
    enum: ["skipped", "completed", "failed"],
  }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const milestones = pgTable("milestones", {
  id: text("id").notNull().primaryKey(),
  habitId: text("habit_id").references(() => habits.id, {
    onDelete: "cascade",
  }),
  userId: text("user_id").references(() => user.id, { onDelete: "cascade" }),
  reachedAt: timestamp("reached_at").defaultNow().notNull(),
  streakCount: integer("streak_count").notNull().default(0),
});

export type User = typeof user.$inferSelect;
export type NewUser = typeof user.$inferInsert;
export type Session = typeof session.$inferSelect;
export type Account = typeof account.$inferSelect;
export type Habits = typeof habits.$inferSelect;
export type Verification = typeof verification.$inferSelect;
export type Passkey = typeof passkey.$inferSelect;
export type HabitLogs = typeof habitLogs.$inferSelect;
