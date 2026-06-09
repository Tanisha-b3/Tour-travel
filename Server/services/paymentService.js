const CURRENCY = process.env.PAYMENT_CURRENCY || "INR";
const MERCHANT_NAME = process.env.PAYMENT_MERCHANT || "Airventure";

const TEST_DECLINE_NUMBERS = new Set(["4000000000000002", "4000000000009995"]);
const TEST_INSUFFICIENT_NUMBERS = new Set(["4000000000009995"]);

function digitsOnly(value) {
  return String(value || "").replace(/\D+/g, "");
}

function detectBrand(number) {
  if (/^4/.test(number)) return "Visa";
  if (/^(5[1-5]|2[2-7])/.test(number)) return "Mastercard";
  if (/^3[47]/.test(number)) return "American Express";
  if (/^6(?:011|5)/.test(number)) return "Discover";
  if (/^(35|2131|1800)/.test(number)) return "JCB";
  if (/^3(?:0[0-5]|[689])/.test(number)) return "Diners Club";
  if (/^(62|88)/.test(number)) return "UnionPay";
  return "Card";
}

function luhnValid(number) {
  const digits = digitsOnly(number);
  if (digits.length < 13 || digits.length > 19) return false;
  let sum = 0;
  let alt = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let n = Number(digits[i]);
    if (alt) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    alt = !alt;
  }
  return sum % 10 === 0;
}

function validateExpiry(expiry) {
  if (!expiry) return false;
  const match = String(expiry).match(/^(\d{2})\s*\/\s*(\d{2})$/);
  if (!match) return false;
  const month = Number(match[1]);
  const year = 2000 + Number(match[2]);
  if (month < 1 || month > 12) return false;
  const now = new Date();
  const expDate = new Date(year, month, 0, 23, 59, 59);
  return expDate >= new Date(now.getFullYear(), now.getMonth(), 1);
}

function validateCvc(cvc) {
  const digits = digitsOnly(cvc);
  return digits.length >= 3 && digits.length <= 4;
}

export function createPaymentIntent({ amount, currency = CURRENCY, metadata = {} } = {}) {
  const value = Number(amount);
  if (!Number.isFinite(value) || value <= 0) {
    throw Object.assign(new Error("Invalid payment amount"), { status: 400 });
  }
  return {
    id: `pi_test_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`,
    amount: Math.round(value * 100),
    currency: String(currency).toLowerCase(),
    status: "requires_confirmation",
    merchant: MERCHANT_NAME,
    createdAt: new Date().toISOString(),
    metadata,
  };
}

export function processTestPayment({ amount, currency = CURRENCY, card }) {
  const errors = [];
  if (!card || typeof card !== "object") {
    return { success: false, code: "invalid_card", message: "Card details are required" };
  }
  const number = digitsOnly(card.number);
  const name = String(card.name || "").trim();
  const expiry = String(card.expiry || "").trim();
  const cvc = String(card.cvc || "").trim();

  if (!name || name.length < 2) errors.push("Cardholder name is required");
  if (!luhnValid(number)) errors.push("Invalid card number");
  if (!validateExpiry(expiry)) errors.push("Invalid or expired card");
  if (!validateCvc(cvc)) errors.push("Invalid security code");

  if (errors.length) {
    return { success: false, code: "validation_failed", message: errors.join(". "), errors };
  }

  if (TEST_DECLINE_NUMBERS.has(number)) {
    return { success: false, code: "card_declined", message: "Your card was declined. Please try a different card." };
  }
  if (TEST_INSUFFICIENT_NUMBERS.has(number)) {
    return { success: false, code: "insufficient_funds", message: "Insufficient funds on this card." };
  }

  const value = Number(amount);
  if (!Number.isFinite(value) || value <= 0) {
    return { success: false, code: "invalid_amount", message: "Invalid payment amount" };
  }

  const brand = detectBrand(number);
  const last4 = number.slice(-4);
  return {
    success: true,
    paymentId: `ch_test_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`,
    brand,
    last4,
    amount: Math.round(value * 100),
    currency: String(currency).toLowerCase(),
    paidAt: new Date().toISOString(),
    receiptUrl: `https://example.com/receipts/${Date.now()}`,
    status: "succeeded",
    message: "Payment processed successfully (test mode).",
  };
}

export const PAYMENT_CONSTANTS = {
  CURRENCY,
  MERCHANT_NAME,
  TEST_CARDS: [
    { number: "4242424242424242", brand: "Visa", outcome: "succeeds" },
    { number: "4000000000000002", brand: "Visa", outcome: "declined" },
    { number: "4000000000009995", brand: "Visa", outcome: "insufficient_funds" },
    { number: "5555555555554444", brand: "Mastercard", outcome: "succeeds" },
    { number: "378282246310005", brand: "American Express", outcome: "succeeds" },
  ],
};
