import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "../db/db";


import { magicLink } from "better-auth/plugins";

import * as schema from "../db/schema";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
  }),

  //   enabled: true,
  //   requireEmailVerification: true,

  //   sendVerificationEmail: async ({
  //     user,
  //     url,
  //   }: {
  //     user: any;
  //     url: string;
  //   }) => {
  //     await sendMail({
  //       to: user.email,
  //       subject: "Verify your streakly email",
  //       html: verificationEmail(url),
  //     });
  //   },

  //   sendResetPassword: async ({ user, url }: { user: any; url: string }) => {
  //     await sendMail({
  //       to: user.email,
  //       subject: "Reset your Streakly password",
  //       html: passwordResetEmail(url),
  //     });
  //   },
  // },

  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    }
  },


  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5,
    },
  },

  baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
  trustedOrigins: [process.env.CLIENT_URL ?? "http://localhost:5173"],

  advanced: {
    useSecureCookies: process.env.NODE_ENV === "production",
    generateId: () => crypto.randomUUID(),
  },
});

export type Session = typeof auth.$Infer.Session;
