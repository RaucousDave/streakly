import { password } from "bun";
import { time } from "drizzle-orm/mysql-core";
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
  userId: text("user_id").references(() => user.id, { onDelete: "cascade" }),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const account = pgTable("account", {
  id: text("id").notNull(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
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
  userId: text("user_id").references(() => user.id, { onDelete: "cascade" }),
  credentialId: text("credential_id").notNull().unique(),
  counter: integer("counter").notNull().default(0),
  deviceType: text("device_type"),
  backedUp: boolean("backed_up").notNull().default(false),
  transports: text("transports"),
  aaguid: text("aaguid"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type User = typeof user.$inferSelect;
export type NewUser = typeof user.$inferInsert;
export type Session = typeof session.$inferSelect;
export type Account = typeof account.$inferSelect;
export type Verification = typeof verification.$inferSelect;
export type Passkey = typeof passkey.$inferSelect;
