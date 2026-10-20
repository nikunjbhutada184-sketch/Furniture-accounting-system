import { Prisma } from "@prisma/client";
import { type Decimal128 } from "mongodb";

/**
 * Money handling.
 *
 * RULE: monetary values are NEVER JavaScript numbers. They are arbitrary
 * precision decimals (`Prisma.Decimal`, which is decimal.js) end to end:
 * Database (NUMERIC or BSON Decimal128) -> Prisma.Decimal -> service -> string for the UI.
 *
 * Numbers may only appear at the very edges (parsing raw user input), and are
 * converted immediately via `toMoney`.
 */

export const Decimal = Prisma.Decimal;
export type Decimal = Prisma.Decimal;

/** Decimal places stored for monetary amounts. Matches NUMERIC(18,2). */
export const MONEY_SCALE = 2;
/** Decimal places stored for quantities. Matches NUMERIC(18,3). */
export const QUANTITY_SCALE = 3;
/** Decimal places stored for unit prices. Matches NUMERIC(18,4). */
export const PRICE_SCALE = 4;

/** Banker-free, predictable rounding: 0.005 -> 0.01. */
export const ROUNDING = Prisma.Decimal.ROUND_HALF_UP;

export const ZERO: Decimal = new Decimal(0);

export type MoneyInput = Decimal | string | number | Decimal128;

/** Internal helper converting MoneyInput to Decimal without precision loss */
function toDec(v: MoneyInput): Decimal {
  if (v instanceof Decimal) return v;
  if (typeof v === "object" && v !== null) {
    return new Decimal(v.toString());
  }
  return new Decimal(v);
}

/**
 * Coerces any MoneyInput (including MongoDB Decimal128, string, number, or Decimal)
 * into a Decimal instance rounded to the monetary scale.
 */
export function toMoney(value: MoneyInput): Decimal {
  return round(toDec(value), MONEY_SCALE);
}

/** Coerces raw input into a Decimal rounded to the quantity scale. */
export function toQuantity(value: MoneyInput): Decimal {
  return round(toDec(value), QUANTITY_SCALE);
}

/** Coerces raw input into a Decimal rounded to the unit-price scale. */
export function toPrice(value: MoneyInput): Decimal {
  return round(toDec(value), PRICE_SCALE);
}

export function round(value: Decimal, scale: number = MONEY_SCALE): Decimal {
  return value.toDecimalPlaces(scale, ROUNDING);
}

export function add(a: MoneyInput, b: MoneyInput): Decimal {
  return round(toDec(a).plus(toDec(b)));
}

export function subtract(a: MoneyInput, b: MoneyInput): Decimal {
  return round(toDec(a).minus(toDec(b)));
}

/** Sums a list of amounts at monetary scale. Empty list sums to zero. */
export function sum(values: readonly MoneyInput[]): Decimal {
  return round(values.reduce<Decimal>((acc, v) => acc.plus(toDec(v)), new Decimal(0)));
}

/**
 * Line amount = quantity x unit price, rounded once to the monetary scale.
 * Rounding once at the end (not per operand) keeps document totals consistent.
 */
export function lineAmount(quantity: MoneyInput, unitPrice: MoneyInput): Decimal {
  return round(toDec(quantity).times(toDec(unitPrice)));
}

/** `base` x `percent`% rounded to the monetary scale. */
export function percentOf(base: MoneyInput, percent: MoneyInput): Decimal {
  return round(toDec(base).times(toDec(percent)).dividedBy(100));
}

export function isZero(value: MoneyInput): boolean {
  return toDec(value).isZero();
}

export function isNegative(value: MoneyInput): boolean {
  const d = toDec(value);
  return d.isNegative() && !d.isZero();
}

export function isPositive(value: MoneyInput): boolean {
  return toDec(value).greaterThan(0);
}

export function equals(a: MoneyInput, b: MoneyInput): boolean {
  return toDec(a).equals(toDec(b));
}

export function compare(a: MoneyInput, b: MoneyInput): -1 | 0 | 1 {
  return toDec(a).comparedTo(toDec(b)) as -1 | 0 | 1;
}

export function max(a: MoneyInput, b: MoneyInput): Decimal {
  return compare(a, b) >= 0 ? toDec(a) : toDec(b);
}

export function min(a: MoneyInput, b: MoneyInput): Decimal {
  return compare(a, b) <= 0 ? toDec(a) : toDec(b);
}

export function negate(value: MoneyInput): Decimal {
  return toDec(value).negated();
}

export function absolute(value: MoneyInput): Decimal {
  return toDec(value).absoluteValue();
}

/**
 * Serialises a Decimal for transport to a client component.
 * Decimal instances are not serialisable across the RSC boundary, so services
 * that return data to the UI must map amounts through this.
 */
export function toAmountString(value: MoneyInput): string {
  return round(toDec(value)).toFixed(MONEY_SCALE);
}

/**
 * Formats an amount for display. Presentation only -- never feed the result
 * back into a calculation.
 */
export function formatMoney(
  value: MoneyInput,
  options: { currency?: string; locale?: string } = {},
): string {
  const { currency = "INR", locale = "en-IN" } = options;
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: MONEY_SCALE,
    maximumFractionDigits: MONEY_SCALE,
  }).format(toDec(value).toNumber());
}
