import db from "./src/db/index.js";
import { sql } from "drizzle-orm";

async function main() {
  try {
    console.log("Migrating Airdrop and ICO tables...");

    // 1. airdrop_tasks
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS airdrop_tasks (
        id VARCHAR(36) PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        category VARCHAR(50) NOT NULL DEFAULT 'SOCIAL',
        reward INTEGER NOT NULL DEFAULT 100,
        action_url TEXT,
        action_label TEXT DEFAULT 'Start Task',
        task_type VARCHAR(50) NOT NULL DEFAULT 'ONCE',
        is_active BOOLEAN NOT NULL DEFAULT true,
        sort_order INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);

    // 2. airdrop_user_profile
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS airdrop_user_profile (
        id VARCHAR(36) PRIMARY KEY,
        user_id TEXT NOT NULL UNIQUE REFERENCES "user"(id) ON DELETE CASCADE,
        test_token_balance INTEGER NOT NULL DEFAULT 0,
        xrpl_wallet_address TEXT,
        xrpl_destination_tag TEXT,
        current_streak INTEGER NOT NULL DEFAULT 0,
        last_checkin_at TIMESTAMP,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);

    // 3. user_airdrop_completions
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS user_airdrop_completions (
        id VARCHAR(36) PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
        task_id VARCHAR(36) NOT NULL REFERENCES airdrop_tasks(id) ON DELETE CASCADE,
        status VARCHAR(50) NOT NULL DEFAULT 'COMPLETED',
        reward_paid INTEGER NOT NULL,
        metadata TEXT,
        completed_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);

    // 4. ico_rounds
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS ico_rounds (
        id VARCHAR(36) PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        stage_number INTEGER NOT NULL DEFAULT 1,
        price_usd DOUBLE PRECISION NOT NULL DEFAULT 0.05,
        total_tokens DOUBLE PRECISION NOT NULL DEFAULT 15000000,
        sold_tokens DOUBLE PRECISION NOT NULL DEFAULT 0,
        min_purchase_usd DOUBLE PRECISION NOT NULL DEFAULT 20,
        max_purchase_usd DOUBLE PRECISION NOT NULL DEFAULT 50000,
        status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
        start_date TIMESTAMP NOT NULL DEFAULT NOW(),
        end_date TIMESTAMP,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);

    // 5. ico_purchases
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS ico_purchases (
        id VARCHAR(36) PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
        round_id VARCHAR(36) NOT NULL REFERENCES ico_rounds(id) ON DELETE CASCADE,
        tokens_allocated DOUBLE PRECISION NOT NULL,
        currency_paid VARCHAR(20) NOT NULL,
        amount_paid DOUBLE PRECISION NOT NULL,
        usd_value DOUBLE PRECISION NOT NULL,
        xrpl_wallet_address TEXT,
        status VARCHAR(50) NOT NULL DEFAULT 'CONFIRMED',
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);

    console.log("Tables created successfully! Now seeding default data...");

    // Seed default tasks
    const tasks = [
      {
        id: "task-wallet-connect",
        title: "Bind Your XRPL Wallet Address",
        description: "Submit your XRP Ledger (e.g. Xaman/Xumm or Crossmark) address (r...) to receive your real mainnet tokens at TGE.",
        category: "ONBOARDING",
        reward: 250,
        action_url: "/dashboard/airdrop",
        action_label: "Save Wallet",
        task_type: "ONCE",
        sort_order: 1,
      },
      {
        id: "task-follow-x",
        title: "Follow EcoHarvest on X (Twitter)",
        description: "Follow our official X handle @ecohavest to stay updated on our real-world asset farming milestones.",
        category: "SOCIAL",
        reward: 150,
        action_url: "https://x.com/ecohavest",
        action_label: "Follow @ecohavest",
        task_type: "ONCE",
        sort_order: 2,
      },
      {
        id: "task-join-telegram",
        title: "Join Official Telegram Community",
        description: "Join the EcoHarvest official Telegram community discussion and connect with fellow green token supporters.",
        category: "SOCIAL",
        reward: 150,
        action_url: "https://t.me/ecohavest",
        action_label: "Join Telegram",
        task_type: "ONCE",
        sort_order: 3,
      },
      {
        id: "task-daily-checkin",
        title: "Daily Check-in & Faucet Claim",
        description: "Check in every 24 hours to claim free test tokens ($tECO) and build your reward streak multiplier.",
        category: "DAILY",
        reward: 50,
        action_url: "/dashboard/airdrop",
        action_label: "Daily Check-in",
        task_type: "DAILY",
        sort_order: 4,
      },
      {
        id: "task-visit-store",
        title: "Explore Solar & Agricultural Hardware Store",
        description: "Discover clean energy hardware, solar irrigation kits, and farming machinery tokenized on EcoHarvest.",
        category: "PLATFORM",
        reward: 100,
        action_url: "/store",
        action_label: "Visit Store",
        task_type: "ONCE",
        sort_order: 5,
      },
      {
        id: "task-referral",
        title: "Invite Friends & Partners",
        description: "Share your referral link. Earn 200 $tECO for every friend who registers and binds their wallet.",
        category: "REFERRAL",
        reward: 200,
        action_url: "/dashboard/referrals",
        action_label: "Get Referral Link",
        task_type: "RECURRING",
        sort_order: 6,
      },
    ];

    for (const t of tasks) {
      await db.execute(sql`
        INSERT INTO airdrop_tasks (id, title, description, category, reward, action_url, action_label, task_type, is_active, sort_order)
        VALUES (${t.id}, ${t.title}, ${t.description}, ${t.category}, ${t.reward}, ${t.action_url}, ${t.action_label}, ${t.task_type}, true, ${t.sort_order})
        ON CONFLICT (id) DO UPDATE SET
          title = EXCLUDED.title,
          description = EXCLUDED.description,
          reward = EXCLUDED.reward,
          action_url = EXCLUDED.action_url,
          action_label = EXCLUDED.action_label,
          category = EXCLUDED.category,
          sort_order = EXCLUDED.sort_order;
      `);
    }

    // Seed default ICO Stage 1
    await db.execute(sql`
      INSERT INTO ico_rounds (id, name, stage_number, price_usd, total_tokens, sold_tokens, min_purchase_usd, max_purchase_usd, status)
      VALUES (
        'ico-stage-1',
        'Stage 1: Early Harvest Presale',
        1,
        0.05,
        15000000,
        2450000,
        25,
        50000,
        'ACTIVE'
      )
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        price_usd = EXCLUDED.price_usd,
        total_tokens = EXCLUDED.total_tokens;
    `);

    console.log("Migration & seeding completed successfully!");
  } catch (error) {
    console.error("Migration error:", error);
  } finally {
    process.exit(0);
  }
}

main();
