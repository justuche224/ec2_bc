import db from "./src/db/index.js";
import { sql } from "drizzle-orm";

async function main() {
  try {
    console.log("Recalculating sold_tokens in ico_rounds based on actual purchases...");

    // Update sold_tokens to exact sum of real purchases in ico_purchases
    await db.execute(sql`
      UPDATE ico_rounds
      SET sold_tokens = COALESCE(
        (SELECT SUM(tokens_allocated) FROM ico_purchases WHERE round_id = ico_rounds.id),
        0
      );
    `);

    console.log("Recalculated successfully!");
  } catch (err) {
    console.error("Error resetting stats:", err);
  } finally {
    process.exit(0);
  }
}

main();
