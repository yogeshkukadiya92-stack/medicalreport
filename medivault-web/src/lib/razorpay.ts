import { createHmac } from "node:crypto";

export type RazorpayOrderResponse = {
  amount: number;
  currency: string;
  id: string;
  receipt: string;
  status: string;
};

export function isRazorpayConfigured() {
  return Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);
}

export function getRazorpayPublicConfig() {
  return {
    currency: process.env.RAZORPAY_CURRENCY || "INR",
    enabled: isRazorpayConfigured(),
    keyId: process.env.RAZORPAY_KEY_ID || "",
  };
}

export async function createRazorpayOrder(input: { amountPaise: number; currency: string; notes?: Record<string, string>; receipt: string }) {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    throw new Error("Razorpay is not configured.");
  }

  const auth = Buffer.from(`${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`).toString("base64");
  const response = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: input.amountPaise,
      currency: input.currency,
      notes: input.notes,
      receipt: input.receipt,
    }),
  });

  const result = (await response.json().catch(() => null)) as RazorpayOrderResponse | { error?: { description?: string } } | null;
  if (!response.ok || !result || !("id" in result)) {
    const message = result && "error" in result ? result.error?.description : "";
    throw new Error(message || "Razorpay order could not be created.");
  }

  return result;
}

export function verifyRazorpaySignature(input: { orderId: string; paymentId: string; signature: string }) {
  if (!process.env.RAZORPAY_KEY_SECRET) return false;
  const expected = createHmac("sha256", process.env.RAZORPAY_KEY_SECRET).update(`${input.orderId}|${input.paymentId}`).digest("hex");
  return expected === input.signature;
}
