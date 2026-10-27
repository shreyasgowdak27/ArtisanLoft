# Review, master, 2026-10-27

**Reviewed by**: Staff Reviewer (check skill)
**Scope**: 7 files, uncommitted changes
**Verdict**: Approve

## Summary
The orders backend implementation fully implements spec `docs/specs/0002-orders-backend.md`. It satisfies all 8 acceptance criteria: atomic checkout with stock decrement and cart clear in one database transaction with rollback on failure, `SELECT ... FOR UPDATE` row locks sorted by `product_id` ASC to prevent deadlocks, strict ownership verification returning 404 for unauthorized access, BigInteger integer paise (zero floats), and snapshotting product price and name onto `order_items`.

## Strengths
- **Lock ordering**: Deterministic ascending sort on `product_id` for `SELECT ... FOR UPDATE` prevents deadlocks under concurrent checkouts.
- **Transaction boundary**: Order insertion, stock decrement, and cart deletion are bound to a single transaction with explicit rollback on error.
- **Ownership isolation**: Ownership is checked immediately upon order retrieval, returning 404 to avoid leaking order existence.
- **Money representation**: Enforces BigInteger integer paise throughout models, schemas, and queries.

## Test coverage
30 tests passing across auth, cart, and orders:
- Unauthenticated access returns 401 across all orders endpoints.
- Empty cart at checkout returns 400.
- Insufficient stock returns 400 with descriptive error message and triggers rollback.
- Concurrent checkout between two users for the last unit results in 1 success and 1 clean 400 with zero oversell.
- Ownership checks return 404 for other users' orders.
- SQL compilation confirms `ORDER BY products.id ASC` and `FOR UPDATE` on PostgreSQL dialect.
