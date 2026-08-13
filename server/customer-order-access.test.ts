import { describe, expect, it } from "vitest";
import { isCustomerOrderOwner } from "./customer-order-access";

describe("customer order ownership", () => {
  it("allows an order linked to the signed-in customer ID even if the order email differs", () => {
    expect(isCustomerOrderOwner(
      { userId: 42, customerEmail: "order@example.com" },
      { id: 42, email: "account@example.com" }
    )).toBe(true);
  });

  it("keeps legacy email-only orders accessible with case-insensitive matching", () => {
    expect(isCustomerOrderOwner(
      { userId: null, customerEmail: "Customer@Example.com" },
      { id: 7, email: "customer@example.com" }
    )).toBe(true);
  });

  it("rejects another customer account", () => {
    expect(isCustomerOrderOwner(
      { userId: 42, customerEmail: "customer@example.com" },
      { id: 7, email: "other@example.com" }
    )).toBe(false);
  });
});
