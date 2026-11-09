import crypto from "crypto";

export interface CreatePaymentParams {
  price_amount: number;
  price_currency: string;
  pay_currency: string;
  ipn_callback_url?: string;
  order_id?: string;
  order_description?: string;
}

export interface NowPaymentsPaymentResponse {
  payment_id: string;
  payment_status: string;
  pay_address: string;
  price_amount: number;
  price_currency: string;
  pay_amount: number;
  actually_paid: number;
  pay_currency: string;
  order_id: string;
  order_description: string;
  purchase_id?: string;
  created_at: string;
  updated_at: string;
}

export class NowPaymentsService {
  private static instance: NowPaymentsService;
  private apiKey = process.env.NOWPAYMENTS_API_KEY || "";
  private ipnSecret = process.env.NOWPAYMENTS_IPN_SECRET || "";
  private apiUrl = process.env.NOWPAYMENTS_API_URL || "https://api.nowpayments.io/v1";

  private constructor() {}

  public static getInstance(): NowPaymentsService {
    if (!NowPaymentsService.instance) {
      NowPaymentsService.instance = new NowPaymentsService();
    }
    return NowPaymentsService.instance;
  }

  // Get list of cryptocurrencies available for payment
  async getAvailableCurrencies(): Promise<string[]> {
    const res = await fetch(`${this.apiUrl}/merchant/coins`, {
      method: "GET",
      headers: {
        "x-api-key": this.apiKey,
      },
    });

    if (!res.ok) {
      // Fallback to general currencies if merchant coins is not configured
      const fallbackRes = await fetch(`${this.apiUrl}/currencies`, {
        method: "GET",
        headers: {
          "x-api-key": this.apiKey,
        },
      });
      if (!fallbackRes.ok) {
        throw new Error("Failed to fetch currencies from NOWPayments");
      }
      const data = await fallbackRes.json();
      return data.currencies || [];
    }

    const data = await res.json();
    return data.selectedCurrencies || data.currencies || [];
  }

  // Get live price estimate (e.g. 100 USD -> BTC amount)
  async getEstimatedPrice(amount: number, currencyFrom = "usd", currencyTo = "usdttrc20"): Promise<any> {
    const url = new URL(`${this.apiUrl}/estimate`);
    url.searchParams.append("amount", amount.toString());
    url.searchParams.append("currency_from", currencyFrom);
    url.searchParams.append("currency_to", currencyTo);

    const res = await fetch(url.toString(), {
      method: "GET",
      headers: {
        "x-api-key": this.apiKey,
      },
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Estimation error: ${err}`);
    }

    return await res.json();
  }

  // Create an automated payment session
  async createPayment(params: CreatePaymentParams): Promise<NowPaymentsPaymentResponse> {
    const res = await fetch(`${this.apiUrl}/payment`, {
      method: "POST",
      headers: {
        "x-api-key": this.apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(params),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`NOWPayments error: ${err}`);
    }

    return await res.json();
  }

  // Poll status of an existing payment
  async getPaymentStatus(paymentId: string): Promise<NowPaymentsPaymentResponse> {
    const res = await fetch(`${this.apiUrl}/payment/${paymentId}`, {
      method: "GET",
      headers: {
        "x-api-key": this.apiKey,
      },
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`NOWPayments status fetch error: ${err}`);
    }

    return await res.json();
  }

  // Verify HMAC-SHA512 signature sent in 'x-nowpayments-sig' header
  verifyIpnSignature(body: Record<string, any> | string, signature: string): boolean {
    if (!this.ipnSecret || !signature) return false;

    let payloadString = "";
    if (typeof body === "string") {
      try {
        const parsed = JSON.parse(body);
        payloadString = this.sortAndStringify(parsed);
      } catch {
        payloadString = body;
      }
    } else {
      payloadString = this.sortAndStringify(body);
    }

    const hmac = crypto.createHmac("sha512", this.ipnSecret);
    hmac.update(payloadString);
    const digest = hmac.digest("hex");

    return digest.toLowerCase() === signature.toLowerCase();
  }

  private sortAndStringify(obj: Record<string, any>): string {
    const sortedKeys = Object.keys(obj).sort();
    const sortedObj: Record<string, any> = {};
    for (const key of sortedKeys) {
      sortedObj[key] = obj[key];
    }
    return JSON.stringify(sortedObj);
  }
}
