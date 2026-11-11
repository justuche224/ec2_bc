# EcoHarvest XRPL Token ($ECO): ICO & Airdrop Implementation Plan

## 1. Executive Summary
This document specifies the complete architecture and implementation roadmap for the **EcoHarvest Token ($ECO)** on the **XRP Ledger (XRPL)**. It covers two complementary distribution mechanisms:
1. **The ICO (Initial Coin Offering / Presale)**: Allowing early investors and community members to buy $ECO at early-bird rates using XRP, USDT, and crypto.
2. **The Airdrop (Task-to-Earn)**: Allowing active users to complete social, community, and platform quests to earn test tokens ($tECO) that convert into real mainnet $ECO shares at the Token Generation Event (TGE).

---

## 2. Tokenomics & XRPL Token Profile

* **Token Name**: EcoHarvest Token
* **Symbol / Currency Code**: `ECO`
* **Network**: XRP Ledger (XRPL)
* **Initial Supply**: `100,000,000 ECO`
* **Issuer Account (Testnet)**: `rn8AMxe3saqz6RfvtPVDF2jZ3gzggt59aw`
* **Holder / Distribution Account**: `rKzv9mJwWfVcQGCda3gPi9zWjFfuksnwrf`
* **Verified Issuance Tx**: `125D3EB2452FE7B114CC3C38DCF8450B6621F2B79663FCF5F5D97B61368B7EA8`
* **Trustline Limit**: `100,000,000 ECO`

### Token Allocation Breakdown (Example Blueprint)
| Bucket | % of Supply | Amount ($ECO) | Purpose |
| :--- | :--- | :--- | :--- |
| **Public ICO / Presale** | 35% | 35,000,000 | Early capital generation for green agricultural hardware & operations |
| **Community Airdrop & Quests** | 15% | 15,000,000 | Task-to-Earn rewards for grassroots growth, social buzz & platform adoption |
| **EcoHarvest Staking & Yield** | 20% | 20,000,000 | Rewards for long-term token lockers and crowdfunding pool contributors |
| **Liquidity & DEX Reserves** | 15% | 15,000,000 | XRPL DEX liquidity (XRP/ECO, USD/ECO pools) |
| **Treasury & Green Dev** | 15% | 15,000,000 | R&D, smart agricultural machinery expansion, partnerships |

---

## 3. The Dual Ecosystem: ICO vs Airdrop

```
                                  ECOHARVEST PLATFORM
                                           │
             ┌─────────────────────────────┴─────────────────────────────┐
             ▼                                                           ▼
   ┌───────────────────┐                                       ┌───────────────────┐
   │    PUBLIC ICO     │                                       │   FREE AIRDROP    │
   │ (Token Presale)   │                                       │  (Task-to-Earn)   │
   └─────────┬─────────┘                                       └─────────┬─────────┘
             │                                                           │
             │ Users invest XRP / USDT / Crypto                          │ Users complete tasks (Social,
             │ at Early-Bird price (e.g. $0.05/ECO)                      │ Daily Check-in, Referrals)
             ▼                                                           ▼
   ┌──────────────────────────────┐                            ┌──────────────────────────────┐
   │ Guaranteed Token Allocation  │                            │ Accumulate $tECO Test Tokens │
   │ + Bonus Tiers for Size       │                            │ (Pro-rata share of 15M pool) │
   └──────────────┬───────────────┘                            └──────────────┬───────────────┘
                  │                                                           │
                  └─────────────────────────────┬─────────────────────────────┘
                                                │
                                                ▼
                                ┌───────────────────────────────┐
                                │   TGE / MAINNET GO-LIVE       │
                                │   Tokens Distributed to XRPL  │
                                │   Wallets (Xaman / Trustline) │
                                └───────────────────────────────┘
```

---

## 4. Phase-by-Phase Implementation Roadmap

### Phase 1: Database & Backend Engine (`ec2_bc`)
* [ ] **XRPL Config & Currency Support**:
  * Add `XRP` to `currencyEnum` in database schema (for direct XRP deposits, transfers, and ICO buys).
  * Configure XRPL issuer and distributor secrets in `.env`.
* [ ] **Airdrop Tables**:
  * `airdrop_tasks`: Quest title, description, reward, category (`SOCIAL`, `DAILY`, `REFERRAL`, `ECOSYSTEM`), verification URL.
  * `user_airdrop_completions`: User completion history and claimed timestamps.
  * `airdrop_user_profiles`: User $tECO balance, bound XRPL wallet address (`r...`), streak count.
* [ ] **ICO Tables / Extension**:
  * `ico_rounds`: Round name (e.g. "Early Bird Stage 1"), token price in USD, min/max purchase, hard cap, total sold, start/end dates.
  * `ico_purchases`: user_id, round_id, currency paid (XRP/USDT), amount paid, $ECO tokens purchased, status.
* [ ] **Backend Endpoints (`ec2_bc/src/routes/`)**:
  * `GET /api/ico/rounds` — Active ICO stages, pricing, progress bar (tokens sold vs hard cap).
  * `POST /api/ico/buy` — Buy $ECO using account balance or direct crypto transaction.
  * `GET /api/airdrop/tasks` & `POST /api/airdrop/claim` — Airdrop task verification and claiming.
  * `POST /api/airdrop/daily-checkin` — Daily faucet claim.
  * `POST /api/airdrop/wallet` — Bind XRPL address.

### Phase 2: Navigation Links & Badges (`echoharvest-front-end`)
* [ ] **Public Header (`Header.tsx`)**:
  * Add **"🚀 ICO Presale"** with a glowing `STAGE 1 LIVE` badge.
  * Add **"🎁 Airdrop"** with a `FREE` badge.
  * Keep clean spacing and integrate both seamlessly in desktop navbar and mobile sheet menu.
  * Update top announcement bar with direct links to both ICO & Airdrop.
* [ ] **Dashboard Navigation (`nav-main.tsx`)**:
  * Add **"ICO Presale"** tab with quick buy option.
  * Add **"Airdrop Quests"** tab showing live $tECO balance.

### Phase 3: Public Front-Facing Pages
* [ ] **ICO Public Presale Page (`/ico`)**:
  * Live countdown to next price increase / round completion.
  * Dynamic Progress Bar: Total $ Raised / Hard Cap (e.g., $1.2M / $3.0M).
  * Token Swap Calculator: "Pay [ 100 XRP / USDT ] -> Receive [ 2,000 $ECO ]".
  * Direct "Buy with XRP / USDT" modal or redirect to dashboard purchase.
  * Tokenomics visual breakdown, roadmap, and whitepaper download link.
* [ ] **Airdrop Public Page (`/airdrop`)**:
  * Step-by-step onboarding guide.
  * Airdrop pool stats (Total participants, test tokens earned, remaining pool).
  * Direct CTA to create account and start earning.

### Phase 4: Dashboard Experience
* [ ] **Dashboard ICO Hub (`/dashboard/ico`)**:
  * Instant token purchase using available wallet balance (XRP, USDT, etc.) or external deposit.
  * Purchase history ledger with allocated $ECO tokens.
* [ ] **Dashboard Airdrop Hub (`/dashboard/airdrop`)**:
  * User balance overview ($tECO points, community rank, estimated share).
  * XRPL destination wallet binder (`r...`).
  * Daily faucet streak claimer.
  * Interactive task board (X/Twitter, Telegram, referrals, platform actions).

### Phase 5: Mainnet TGE & XRPL Distribution
* [ ] Issue final supply on XRPL Mainnet.
* [ ] Open trustlines from community wallets to the Mainnet Issuer address.
* [ ] Batch release ICO purchases and Airdrop rewards directly to purchasers and quest winners.
