import { format, subDays } from "date-fns";
import { getDateKey } from "./routes/habits.route";
const yesterday = getDateKey(subDays(new Date(), 1));

console.log("Yesterday: ", yesterday)