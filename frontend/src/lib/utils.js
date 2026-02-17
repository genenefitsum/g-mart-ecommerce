import { clsx } from "clsx";
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function formatBirr(value) {
  const amount = Number(value ?? 0)
  const safeAmount = Number.isFinite(amount) ? amount : 0

  try {
    return new Intl.NumberFormat("en-ET", {
      style: "currency",
      currency: "ETB",
      currencyDisplay: "code",
      maximumFractionDigits: 2,
    }).format(safeAmount)
  } catch {
    return `ETB ${safeAmount.toFixed(2)}`
  }
}
