import { streakEngine } from "./routes/habits.route";

import express from "express";
import cron from "node-cron";

const app = express();

const PORT = 3000;

cron.schedule("* * * * *", async () => {
  console.log("schedule is running");
  await streakEngine();
  console.log("streak engine operative");
});

app.listen(PORT, () => {
  console.log("Server is running on PORT", PORT);
});
