# Security Specification - RestoFlow

## 1. Data Invariants
- An order must have at least one item.
- Stock cannot be negative.
- Queue numbers must be positive and increment daily.
- Promo codes must be active and not expired to be valid.
- Only admins can modify menu items, categories, and promo codes.
- Only admins can update order status (except for the initial creation).

## 2. The "Dirty Dozen" Payloads (Deny Cases)
1. Creating an order with a manual queue number that skips the sequence.
2. Updating an order status from 'pending' to 'completed' as a non-admin.
3. Modifying the `price` of a menu item as an unauthorized user.
4. Setting a negative stock value for a menu item.
5. Creating an order with a total that doesn't match the sum of item prices.
6. Deleting the `settings/queue` document.
7. Overwriting an existing order with malicious content.
8. Accessing another user's PII in orders (if any).
9. Applying an expired promo code.
10. Bypassing the stock check when creating an order.
11. Injecting a massive string into menu item descriptions.
12. Creating a promo code without admin rights.

## 3. Test Runner (Conceptual)
All the above must return `PERMISSION_DENIED` for non-admins or if invariants are breached.
