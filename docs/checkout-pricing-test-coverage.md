# Checkout Pricing Test Coverage Report

**Scope.** This report covers the shared area-based DTF price calculator and the server-side order creation paths that pass an estimate into checkout. It does not claim code-coverage percentages because the repository does not yet collect instrumentation coverage; it records executable scenario coverage and the remaining decision-critical gaps instead.

## Current test architecture

The pricing suite has two layers. The pure calculator tests validate physical print-area calculations without infrastructure dependencies. The mutation suite then invokes the real `orders.create` and `orders.createMultiItem` procedures through an in-process tRPC caller, replacing persistence, e-mail, invoice, and notification side effects with deterministic test doubles. This verifies the same server mutation code used by checkout while ensuring the suite never creates payment records, calls a payment provider, or sends external messages.[1] [2]

| Test layer | Test file | Executed scenarios | Primary assertion |
|---|---|---:|---|
| Calculator unit tests | `server/dtfPricing.test.ts` | 5 | A4 physical area, reduced scale, the 10-unit discount threshold, Pocket/A6 aliasing, and unknown-size rejection are calculated correctly. |
| Checkout mutation tests | `server/order-pricing-e2e.test.ts` | 3 | Single-item and cart mutations replace a spoofed browser total with the server-calculated estimate and persist that value; unsupported sizes return a safe validation error without creating an order. |
| Payment callback tests | `server/payfast-callback-persistence.test.ts` | 2 | Matching payments mark the order paid without overwriting its checkout estimate; mismatches are flagged for manual review. |
| Legacy pricing-service tests | `server/pricing.test.ts` | 14 | The earlier database-backed fixed-tier price service, its product lookup, and discount thresholds are covered independently. |

## Verified DTF price behavior

| Behavior | Unit coverage | Mutation coverage | Status |
|---|---|---|---|
| Garment base price × quantity | Yes | Single and cart order paths | Verified |
| A4 transfer area | Yes | Single and cart order paths | Verified |
| Reduced artwork scale | Yes | Single and cart order paths | Verified |
| Multiple print layers | No direct unit case | Cart order with three persisted artwork layers | Partially verified |
| Browser subtotal tampering | Not applicable | `0` and `1` client values are replaced by server calculation | Verified |
| Persisted order total | Not applicable | Single and cart order paths | Verified |
| Persisted cart line-item subtotal and unit price | Not applicable | Cart order path | Verified |
| Two-decimal line-item rounding | Indirectly | Cart order path | Verified |
| 10-unit bulk threshold | Yes | Cart order path | Verified |
| No payment record at order creation | Not applicable | Single and cart order paths | Verified |
| No outbound notification execution | Not applicable | Side-effect modules are mocked in mutation tests | Verified |

## Known untested or partially covered edge cases

The following items are intentionally visible rather than hidden behind a generic “all tests passed” statement. Priorities describe potential commercial or accounting impact, not an assessment of a live incident.

| Priority | Edge case | Current behavior or risk | Recommended next automated test / control |
|---|---|---|---|
| Resolved | Payment callback replaces `totalPriceEstimate` with a provider-supplied gross amount | Successful callbacks now leave the checkout estimate unchanged. Matching totals set payment verification to verified; mismatches remain pending for manual review. | Add a production integration test with a disposable database before changing payment-provider logic further. |
| Resolved | Unknown print-size labels receive a fallback 20 × 20 cm physical area | Approved Pocket/A6, A5, A4, and A3 labels are normalised; unknown labels are rejected in the shared calculator and returned as a `BAD_REQUEST` order validation error. | Define a separate reviewed custom-size workflow if custom dimensions are offered commercially. |
| P1 | Discount qualification in a mixed cart | `createMultiItem` calculates quantity discounts per line item. The commercial policy may instead require discounting based on the aggregate number of garments in the cart. | Confirm the intended policy and add a cart-level 9 + 1, 49 + 1, and 99 + 1 boundary suite. |
| P1 | Discount thresholds at 50 and 100 | The shared calculator contains 20% and 30% tiers, but the new DTF tests exercise only the 10-unit threshold. | Add exact-boundary tests for 9/10, 49/50, and 99/100 across unit and mutation paths. |
| P1 | Scale and quantity normalization | The calculator clamps artwork scale to `[0,1]` and converts quantity to a positive integer, but the behavior is not currently specified in tests. | Add table-driven tests for `undefined`, negative, zero, fractional, `NaN`, and values above one. |
| P1 | Rounding sequence | Transfer prices round per artwork layer before multiplication, while line-item unit price rounds after discount allocation. Small differences can accumulate in high-volume multi-layer carts. | Document one monetary-rounding policy and add multi-layer precision and large-quantity assertions. |
| P1 | Duplicate layer semantics | Each artwork layer incurs its own physical-area price. A duplicated layer may be a real extra placement or an editing artifact. | Test intentional duplicate placements and add a user-facing confirmation or deduplication rule if business policy requires it. |
| P2 | Placement-specific commercial rules | The current DTF rate is area-based; placement names do not alter price. Sleeve, neck label, or oversized print premiums are not modelled. | Centralise approved placement modifiers and test each rule only after the production rate card defines it. |
| P2 | Delivery, VAT, reseller terms, and special services | These are intentionally excluded from the shared DTF estimate, so the calculator should not be treated as a final tax-inclusive invoice total. | Connect a versioned checkout-rate service and add integration tests once those authoritative inputs are available. |
| P2 | Rate-card and catalogue changes mid-checkout | The server recomputes prices, but the current schema does not persist a pricing-rule version or component snapshot alongside the order. | Store a price breakdown and rate-card version, then test that later catalogue edits do not make historical orders ambiguous. |
| P2 | Database lookup failure and unsupported print-option ID | The mutation suite mocks the price lookup; it does not yet exercise real database error mapping. | Add a disposable database integration suite or test container for invalid product and print-option IDs. |

## Continuous integration boundary

The accompanying GitHub Actions workflow runs the **deterministic** DTF calculator, checkout-mutation, and payment-callback persistence suites, TypeScript validation, and the production build on `push` and `pull_request`. It does not run the full repository test suite because several older tests depend on an external database and would require a separately configured disposable test database. The workflow contains no payment credentials and never starts the application’s payment path.

The first hosted run exposed a duplicate pnpm-version declaration between the workflow and `package.json`; the workflow was corrected to use the repository’s pinned package-manager declaration. The corrected hosted run completed successfully in 42 seconds: [GitHub Actions run 33045619117](https://github.com/AnalyticalJay/print-cartel/actions/runs/33045619117).

## Recommended next coverage increment

The next highest-value coverage increment is exact 50/100 discount thresholds, scale and quantity normalisation, aggregate-cart discount policy, and duplicate-layer handling. A disposable MySQL test database should be introduced only after these deterministic contract tests are stable, so that database lookup and migration behavior can be tested without connecting CI to production data.

## References

[1]: ../shared/dtfPricing.ts "Shared DTF pricing contract"
[2]: ../server/order-pricing-e2e.test.ts "Checkout pricing mutation test suite"
[3]: ../server/_core/payfast-callback.ts "PayFast callback handler"
