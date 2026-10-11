const SEVERE_KEYWORDS = [
  "alcohol",
  "pregnan",
  "drows",
  "driving",
  "overdose",
  "fatal",
  "allerg",
  "severe",
  "heart",
  "kidney",
  "liver",
  "bleed",
  "do not use",
  "emergency",
  "poison",
];

export function warningSeverity(text) {
  const lower = (text || "").toLowerCase();
  return SEVERE_KEYWORDS.some((keyword) => lower.includes(keyword)) ? "severe" : "caution";
}

function parseExpiry(value) {
  const text = (value || "").trim();
  if (!text) return null;
  const yyyyMm = text.match(/^(\d{4})-(\d{2})$/);
  if (yyyyMm) return new Date(Date.UTC(Number(yyyyMm[1]), Number(yyyyMm[2]), 1));
  const mmYyyy = text.match(/^(\d{2})\/(\d{4})$/);
  if (mmYyyy) return new Date(Date.UTC(Number(mmYyyy[2]), Number(mmYyyy[1]), 1));
  return null;
}

export function expiryInfo(expiry) {
  const date = parseExpiry(expiry);
  if (!date) {
    return {
      display: "Expiry not found",
      status: "unknown",
      classes: "border-slate-300 bg-slate-100 text-slate-700",
      label: "Ask your pharmacist about the expiry date.",
    };
  }
  const now = new Date();
  const monthEnd = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0));
  const expired = monthEnd < now;
  const display = `${String(date.getUTCMonth() + 1).padStart(2, "0")}/${date.getUTCFullYear()}`;
  if (expired) {
    return {
      display: `Expired ${display}`,
      status: "expired",
      classes: "border-red-300 bg-red-100 text-red-800",
      label: "This medicine is past its expiry date. Talk to your doctor or pharmacist.",
    };
  }
  return {
    display: `Expires ${display}`,
    status: "valid",
    classes: "border-emerald-300 bg-emerald-100 text-emerald-800",
    label: "Still in date.",
  };
}

export function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}