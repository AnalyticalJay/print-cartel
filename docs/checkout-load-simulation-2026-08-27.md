# Isolated Checkout and Payment Callback Load Simulation

**Date:** 27 August 2026  
**Scope:** Current `main` worktree, isolated in-process test harness  
**Purpose:** Exercise the real checkout mutation and PayFast callback handler under high concurrent demand while preserving a payment-free, non-production test boundary.

## Test design

The load suite issues 200 concurrent calls to the live `orders.create` procedure and 400 concurrent calls to the live PayFast callback handler. The checkout scenario uses a deliberately spoofed browser total, a two-unit order, a scaled A4 artwork layer, and a real shared DTF calculation. The callback scenario delivers matching successful provider notifications against the same stored checkout estimate.

Persistence, e-mail, notification, invoice, and PayFast-signature dependencies are replaced with deterministic in-memory test doubles. Therefore, this test exercises routing, validation, calculation, mutation orchestration, and callback state transitions; it does **not** exercise HTTP sockets, a real MySQL connection pool, object storage, e-mail delivery, a payment gateway, or the deployed production infrastructure.

## Results

| Scenario | Concurrent operations | Completion | Batch duration | p50 operation latency | p95 operation latency | Maximum operation latency | Integrity assertions |
|---|---:|---:|---:|---:|---:|---:|---|
| Checkout mutation | 200 | 200 / 200 | 27.79 ms | 26.82 ms | 27.14 ms | 27.56 ms | 200 unique order IDs, 200 artwork records, and every stored total matched the server-calculated DTF estimate. |
| PayFast callback | 400 | 400 / 400 | 64.08 ms | 47.98 ms | 61.91 ms | 64.02 ms | The original checkout estimate remained `R258.72`; every callback returned HTTP 200 and no update payload contained `totalPriceEstimate`. |

The complete Vitest process took 807 ms, including transform, collection, and test-framework startup. The timing table reports handler work measured inside the concurrent test body, not client-to-server network timing.

## Interpretation

The current in-process handlers retained price integrity and completed all 600 simulated operations without failed assertions. This is positive evidence that the new price-preservation and mutation orchestration logic do not introduce an immediate single-process concurrency defect under the tested profile.

> The timings are **not production capacity figures**. A production checkout request includes the database, authentication, object storage, e-mail, payment-provider round trips, deployment resource limits, and network scheduling, all of which were intentionally excluded to keep the simulation safe and repeatable.

## Remaining performance and reliability boundary

The next level of validation should use a disposable non-production MySQL database and an authenticated staging deployment, with a controlled request ramp, database connection-pool metrics, 5xx/timeout rate, and rate-limit observations. That test should remain outside the public production environment until an explicit maintenance window, traffic cap, monitoring plan, and rollback owner are established.

## Automation

`server/checkout-load-simulation.test.ts` is included in the **Checkout pricing** GitHub Actions workflow. Every push and pull request now checks the calculator, order mutations, callback-preservation logic, and this isolated concurrency regression before TypeScript validation and the production build.

## References

[1]: ../server/checkout-load-simulation.test.ts "Isolated checkout and payment callback load test"
[2]: ../server/order-pricing-e2e.test.ts "Checkout mutation pricing test suite"
[3]: ../server/_core/payfast-callback.ts "PayFast callback handler"
