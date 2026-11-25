import db from "./src/db/index.js";
import { sql } from "drizzle-orm";

async function main() {
  try {
    console.log("Migrating Crowdfunding Pool & Star Achievement System tables...");

    // 1. Add columns to crowdfunding_settings if not exist
    await db.execute(sql`
      ALTER TABLE crowdfunding_settings
      ADD COLUMN IF NOT EXISTS qualifying_deposit_amount DOUBLE PRECISION NOT NULL DEFAULT 99,
      ADD COLUMN IF NOT EXISTS max_team_depth INTEGER NOT NULL DEFAULT 3,
      ADD COLUMN IF NOT EXISTS cycle_requirement INTEGER NOT NULL DEFAULT 12,
      ADD COLUMN IF NOT EXISTS level1_points INTEGER NOT NULL DEFAULT 10,
      ADD COLUMN IF NOT EXISTS level2_points INTEGER NOT NULL DEFAULT 100,
      ADD COLUMN IF NOT EXISTS level3_points INTEGER NOT NULL DEFAULT 1000;
    `);

    // 2. crowdfunding_user_achievements
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS crowdfunding_user_achievements (
        id VARCHAR(36) PRIMARY KEY,
        user_id VARCHAR(36) NOT NULL UNIQUE REFERENCES "user"(id) ON DELETE CASCADE,
        total_points INTEGER NOT NULL DEFAULT 0,
        direct_participants INTEGER NOT NULL DEFAULT 0,
        indirect_participants INTEGER NOT NULL DEFAULT 0,
        completed_cycles INTEGER NOT NULL DEFAULT 0,
        cycle_remainder INTEGER NOT NULL DEFAULT 0,
        stars_earned INTEGER NOT NULL DEFAULT 0,
        level1_achieved_at TIMESTAMP,
        level2_achieved_at TIMESTAMP,
        level3_achieved_at TIMESTAMP,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);

    // 3. crowdfunding_ledger
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS crowdfunding_ledger (
        id VARCHAR(36) PRIMARY KEY,
        user_id VARCHAR(36) NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
        source_user_id VARCHAR(36) NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
        tier INTEGER NOT NULL,
        event_type VARCHAR(50) NOT NULL,
        points_delta INTEGER NOT NULL DEFAULT 1,
        deposit_id VARCHAR(36),
        deposit_amount DOUBLE PRECISION,
        note TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);

    // 4. crowdfunding_cycle_history
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS crowdfunding_cycle_history (
        id VARCHAR(36) PRIMARY KEY,
        user_id VARCHAR(36) NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
        cycle_number INTEGER NOT NULL,
        stars_awarded INTEGER NOT NULL DEFAULT 1,
        participants_count INTEGER NOT NULL DEFAULT 12,
        completed_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);

    // 5. crowdfunding_certificates
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS crowdfunding_certificates (
        id VARCHAR(36) PRIMARY KEY,
        user_id VARCHAR(36) NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
        certificate_code VARCHAR(64) NOT NULL UNIQUE,
        level INTEGER NOT NULL,
        title VARCHAR(255) NOT NULL,
        points_threshold INTEGER NOT NULL,
        issued_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);

    // 6. Ensure default global crowdfunding pool exists
    await db.execute(sql`
      INSERT INTO crowdfunding_pools (id, name, description, beneficiary_for, target_participants, current_participants, total_invested, min_investment_amount, status, created_at, updated_at)
      VALUES (
        'global-pool-1000',
        'EcoHarvest Global Crowdfunding Pool',
        'Target 1,000 verified sustainable agricultural and clean energy participants.',
        'EcoHarvest Community Agriculture & Clean Energy Expansion',
        1000,
        0,
        0,
        99,
        'ACTIVE',
        NOW(),
        NOW()
      )
      ON CONFLICT (id) DO NOTHING;
    `);

    console.log("Crowdfunding Pool & Star Achievement migration completed successfully!");
  } catch (error) {
    console.error("Migration error:", error);
  } finally {
    process.exit(0);
  }
}

main();
