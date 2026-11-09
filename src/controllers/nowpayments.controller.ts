import type { Context } from "hono";
import { NowPaymentsService } from "../services/nowpayments.service.js";
import { BalanceService } from "../services/balance.service.js";
import { mailService } from "../services/mail.service.js";
import db from "../db/index.js";
import { nowpaymentsTransaction, user } from "../db/schema.js";
import { eq } from "drizzle-orm";
import crypto from "crypto";

const nowPaymentsService = NowPaymentsService.getInstance();
const balanceService = BalanceService.getInstance();

export class NowPaymentsController {
  // Get supported currencies with popular currencies prioritized
  static async getCurrencies(c: Context) {
    try {
      const currencies = await nowPaymentsService.getAvailableCurrencies();
      const popular = ["usdttrc20", "btc", "eth", "sol", "ltc", "bnbbsc", "trx", "doge"];
      
      // Ensure popular ones are at the front
      const sorted = [
        ...popular.filter((p) => currencies.includes(p)),
        ...currencies.filter((cur) => !popular.includes(cur)).sort(),
      ];

      return c.json({
        success: true,
        currencies: sorted,
      });
    } catch (error: any) {
      console.error("Error fetching currencies:", error);
      return c.json(
        {
          success: false,
          error: error.message || "Failed to fetch currencies",
        },
        500
      );
    }
  }

  // Get live price estimate
  static async getEstimate(c: Context) {
    try {
      const amount = parseFloat(c.req.query("amount") || "100");
      const payCurrency = c.req.query("pay_currency") || "usdttrc20";

      if (isNaN(amount) || amount <= 0) {
        return c.json({ success: false, error: "Invalid amount" }, 400);
      }

      const estimate = await nowPaymentsService.getEstimatedPrice(amount, "usd", payCurrency);
      return c.json({
        success: true,
        estimate,
      });
    } catch (error: any) {
      console.error("Error getting estimate:", error);
      return c.json(
        {
          success: false,
          error: error.message || "Failed to calculate estimate",
        },
        500
      );
    }
  }

  // Create an automated crypto deposit
  static async createDeposit(c: Context) {
    try {
      const currentUser = c.get("user");
      if (!currentUser?.id) {
        return c.json({ success: false, error: "Unauthorized" }, 401);
      }

      const body = await c.req.json();
      const { amount, pay_currency } = body;

      if (!amount || isNaN(Number(amount)) || Number(amount) < 10) {
        return c.json({ success: false, error: "Minimum deposit is $10" }, 400);
      }

      if (!pay_currency) {
        return c.json({ success: false, error: "Cryptocurrency is required" }, 400);
      }

      const orderId = `EH-DEP-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
      const backendBaseUrl = process.env.BASE_URL || "https://me.ecohavest.org";
      const ipnCallbackUrl = `${backendBaseUrl}/api/deposit/crypto/ipn`;

      const payment = await nowPaymentsService.createPayment({
        price_amount: Number(amount),
        price_currency: "usd",
        pay_currency: pay_currency.toLowerCase(),
        ipn_callback_url: ipnCallbackUrl,
        order_id: orderId,
        order_description: `EcoHarvest Balance Deposit - Order ${orderId}`,
      });

      // Save to database
      await db.insert(nowpaymentsTransaction).values({
        id: crypto.randomUUID(),
        userId: currentUser.id,
        paymentId: String(payment.payment_id),
        paymentStatus: payment.payment_status || "waiting",
        payAddress: payment.pay_address,
        priceAmount: Number(payment.price_amount),
        priceCurrency: payment.price_currency || "usd",
        payAmount: Number(payment.pay_amount),
        actuallyPaid: Number(payment.actually_paid || 0),
        payCurrency: payment.pay_currency,
        orderId: payment.order_id,
        orderDescription: payment.order_description,
        ipnCallbackUrl: ipnCallbackUrl,
        credited: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      return c.json({
        success: true,
        payment: {
          payment_id: payment.payment_id,
          payment_status: payment.payment_status,
          pay_address: payment.pay_address,
          pay_amount: payment.pay_amount,
          pay_currency: payment.pay_currency,
          price_amount: payment.price_amount,
          price_currency: payment.price_currency,
          order_id: payment.order_id,
        },
      });
    } catch (error: any) {
      console.error("Error creating deposit:", error);
      return c.json(
        {
          success: false,
          error: error.message || "Failed to create crypto deposit",
        },
        500
      );
    }
  }

  // Poll status of deposit
  static async getStatus(c: Context) {
    try {
      const paymentId = c.req.param("paymentId");
      if (!paymentId) {
        return c.json({ success: false, error: "Payment ID is required" }, 400);
      }

      const records = await db
        .select()
        .from(nowpaymentsTransaction)
        .where(eq(nowpaymentsTransaction.paymentId, paymentId))
        .limit(1);

      if (records.length === 0) {
        return c.json({ success: false, error: "Payment not found" }, 404);
      }

      const localTrx = records[0];

      // If already finished and credited, return immediately
      if (localTrx.paymentStatus === "finished" && localTrx.credited) {
        return c.json({
          success: true,
          status: localTrx.paymentStatus,
          transaction: localTrx,
        });
      }

      // Check live status from NOWPayments
      try {
        const liveStatus = await nowPaymentsService.getPaymentStatus(paymentId);
        if (liveStatus && liveStatus.payment_status !== localTrx.paymentStatus) {
          await db
            .update(nowpaymentsTransaction)
            .set({
              paymentStatus: liveStatus.payment_status,
              actuallyPaid: Number(liveStatus.actually_paid || 0),
              updatedAt: new Date(),
            })
            .where(eq(nowpaymentsTransaction.paymentId, paymentId));

          // If reached finished, credit balance safely
          if (liveStatus.payment_status === "finished" && !localTrx.credited) {
            await NowPaymentsController.creditUser(localTrx);
          }

          return c.json({
            success: true,
            status: liveStatus.payment_status,
            actually_paid: liveStatus.actually_paid,
            transaction: {
              ...localTrx,
              paymentStatus: liveStatus.payment_status,
              actuallyPaid: liveStatus.actually_paid,
            },
          });
        }
      } catch (pollErr) {
        // Fallback to local DB record if NOWPayments API is unreachable
        console.warn("Status fetch fallback:", pollErr);
      }

      return c.json({
        success: true,
        status: localTrx.paymentStatus,
        actually_paid: localTrx.actuallyPaid,
        transaction: localTrx,
      });
    } catch (error: any) {
      console.error("Error getting status:", error);
      return c.json(
        {
          success: false,
          error: error.message || "Failed to fetch status",
        },
        500
      );
    }
  }

  // Handle Instant Payment Notification (IPN) webhook
  static async handleIpn(c: Context) {
    try {
      const signature = c.req.header("x-nowpayments-sig") || "";
      const rawBody = await c.req.text();

      if (!signature) {
        return c.json({ error: "Missing signature header" }, 401);
      }

      const isValid = nowPaymentsService.verifyIpnSignature(rawBody, signature);
      if (!isValid) {
        console.error("Invalid NOWPayments IPN signature:", signature);
        return c.json({ error: "Invalid signature" }, 403);
      }

      const payload = JSON.parse(rawBody);
      const { payment_id, payment_status, actually_paid } = payload;

      console.log(`NOWPayments IPN received: Payment ${payment_id} -> ${payment_status}`);

      const records = await db
        .select()
        .from(nowpaymentsTransaction)
        .where(eq(nowpaymentsTransaction.paymentId, String(payment_id)))
        .limit(1);

      if (records.length === 0) {
        console.warn(`NOWPayments IPN: Transaction ${payment_id} not found in database`);
        return c.json({ error: "Transaction not found" }, 404);
      }

      const trx = records[0];

      // Update status
      await db
        .update(nowpaymentsTransaction)
        .set({
          paymentStatus: String(payment_status),
          actuallyPaid: Number(actually_paid || 0),
          updatedAt: new Date(),
        })
        .where(eq(nowpaymentsTransaction.paymentId, String(payment_id)));

      // Credit user when status is finished
      if (payment_status === "finished" && !trx.credited) {
        await NowPaymentsController.creditUser(trx);
      }

      return c.json({ status: "ok" });
    } catch (error: any) {
      console.error("NOWPayments IPN error:", error);
      return c.json({ error: error.message || "IPN handling failed" }, 500);
    }
  }

  // Helper method to safely credit user balance and send email
  private static async creditUser(trx: typeof nowpaymentsTransaction.$inferSelect) {
    try {
      // Mark as credited first to prevent double-spending in race conditions
      await db
        .update(nowpaymentsTransaction)
        .set({
          credited: true,
          updatedAt: new Date(),
        })
        .where(eq(nowpaymentsTransaction.paymentId, trx.paymentId));

      // In EcoHarvest, deposits credit the USDT balance (1:1 with USD)
      const creditCurrency = "USDT";
      const creditAmount = String(trx.priceAmount);

      await balanceService.incrementBalance(trx.userId, creditCurrency, creditAmount);
      console.log(`Successfully credited ${creditAmount} ${creditCurrency} to user ${trx.userId}`);

      // Send email notification
      const userRecords = await db
        .select()
        .from(user)
        .where(eq(user.id, trx.userId))
        .limit(1);

      if (userRecords.length > 0 && userRecords[0].email) {
        mailService.sendDepositNotification({
          email: userRecords[0].email,
          amount: creditAmount,
          currency: creditCurrency,
          status: "APPROVED",
          method: "CRYPTO",
          date: new Date(),
        });
      }
    } catch (err) {
      console.error(`Error crediting user ${trx.userId}:`, err);
    }
  }
}
