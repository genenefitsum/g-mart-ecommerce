import { clsx } from "clsx";
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function formatBirr(value) {
  const raw = value
  const amount = Number(value ?? 0)
  const safeAmount = Number.isFinite(amount) ? amount : 0

  const typedDecimalMatch =
    typeof raw === "string" ? raw.trim().match(/^-?\d+\.(\d{1,2})$/) : null
  const typedDecimals = typedDecimalMatch ? typedDecimalMatch[1].length : null

  try {
    return new Intl.NumberFormat("en-ET", {
      style: "currency",
      currency: "ETB",
      currencyDisplay: "code",
      minimumFractionDigits: typedDecimals ?? 0,
      maximumFractionDigits: 2,
    }).format(safeAmount)
  } catch {
    if (typedDecimals != null) {
      return `ETB ${safeAmount.toFixed(typedDecimals)}`
    }

    return Number.isInteger(safeAmount)
      ? `ETB ${safeAmount}`
      : `ETB ${safeAmount.toString()}`
  }
}
