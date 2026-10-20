import { describe, expect, it } from "vitest";
import { Decimal128 } from "mongodb";
import { fromBsonDecimal, toBsonDecimal } from "@/server/db/mongodb";
import { Decimal, toMoney, toPrice, toQuantity } from "@/server/money";

describe("MongoDB Decimal128 & Money Integration", () => {
  it("converts string amounts to BSON Decimal128 without precision loss", () => {
    const raw = "123456789.99";
    const bson = toBsonDecimal(raw);
    expect(bson).toBeInstanceOf(Decimal128);
    expect(bson.toString()).toBe("123456789.99");
  });

  it("converts Decimal.js instances to BSON Decimal128", () => {
    const dec = new Decimal("987654321.50");
    const bson = toBsonDecimal(dec);
    expect(bson.toString()).toBe("987654321.50");
  });

  it("converts BSON Decimal128 back to Decimal.js with exact scale", () => {
    const bson = Decimal128.fromString("500000.25");
    const dec = fromBsonDecimal(bson);
    expect(dec).toBeInstanceOf(Decimal);
    expect(dec.toString()).toBe("500000.25");
    expect(dec.toFixed(2)).toBe("500000.25");
  });

  it("toMoney accepts BSON Decimal128 directly", () => {
    const bson = Decimal128.fromString("100.555"); // should round half-up to 100.56
    const money = toMoney(bson);
    expect(money.toString()).toBe("100.56");
  });

  it("toQuantity accepts BSON Decimal128 directly", () => {
    const bson = Decimal128.fromString("15.1234");
    const qty = toQuantity(bson);
    expect(qty.toString()).toBe("15.123");
  });

  it("toPrice accepts BSON Decimal128 directly", () => {
    const bson = Decimal128.fromString("99.9999");
    const price = toPrice(bson);
    expect(price.toString()).toBe("99.9999");
  });

  it("handles negative amounts correctly", () => {
    const bson = toBsonDecimal("-450.75");
    expect(bson.toString()).toBe("-450.75");
    const dec = fromBsonDecimal(bson);
    expect(dec.toString()).toBe("-450.75");
  });

  it("handles zero and nullish amounts safely", () => {
    expect(toBsonDecimal(0).toString()).toBe("0.00");
    expect(fromBsonDecimal(null).toFixed(2)).toBe("0.00");
    expect(fromBsonDecimal(undefined).toFixed(2)).toBe("0.00");
  });

  it("preserves exact financial calculations without IEEE 754 floating point drift", () => {
    // 0.1 + 0.2 in standard JS floats is 0.30000000000000004
    const a = toBsonDecimal("0.10");
    const b = toBsonDecimal("0.20");
    const sum = fromBsonDecimal(a).plus(fromBsonDecimal(b));
    expect(sum.toString()).toBe("0.3");
    expect(sum.toFixed(2)).toBe("0.30");
  });
});
