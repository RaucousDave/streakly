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
        freezes: user.freezes,
        freezesUsed: user.freezesUsed,
        freezeResetDate: user.freezeResetDate,
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

export default router;
