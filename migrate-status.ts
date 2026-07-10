import db from "./src/db/index.js";
import { sql } from "drizzle-orm";

async function main() {
  try {
    console.log("Adding status column to referrals table...");
    await db.execute(sql`ALTER TABLE referrals ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'PENDING';`);
    console.log("Migration successful!");
  } catch (error) {
    console.error("Migration failed:", error);
  } finally {
    process.exit(0);
  }
}

main();
