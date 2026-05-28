# Firebase Security Specification - Household Bookkeeping System

## 1. Data Invariants
1. A record input can only be stored if it specifies a correct category (e.g., 公費收入, 水電網路天然氣, 生活雜費).
2. For all expenses and income entries, the `createdBy` property must strictly match the authenticated user (`request.auth.uid`).
3. Members can only insert/modify their own metadata index in the `/members/` subcollection.
4. Timestamps and transaction date format must be structurally secure (`YYYY-MM-DD`).
5. Transaction amount must never be negative.

## 2. Dirty Dozen Payloads (Target Rejections)
All of the following must result in `PERMISSION_DENIED`:
1. **Identity Spoofing**: Inserting a transaction where `createdBy` is `attack_user` but auth is `normal_user`.
2. **Value Poisoning**: Negative transaction amount: `{ amount: -150 }`.
3. **Impersonator Member**: Adding database profile info claiming `userId` is `other_user`.
4. **Invalid Date Format**: `{ date: "yesterday" }` instead of ISO `YYYY-MM-DD`.
5. **No Auth Access**: Attempting to read entries when not authenticated at all.
6. **Path Injection**: Attempting to create a ledger with non-alphanumeric code, e.g. path injection characters.
7. **Cross-Household Sabotage**: User A attempting to delete or overwrite user B's bookkeeping records.
8. **Malicious Long Category**: Injecting a 1MB category string.
9. **Spamming Record ID**: Enforcing `isValidId` on document routes to prevent denial of wallet attacks.
10. **Shadow Key Exploit**: Overwriting a record while introducing fields not validated in the master function.
11. **Illegal Type Change**: Forcing amount to be a boolean value instead of a number.
12. **Tampering with System Fields**: Non-owner trying to mutate other ledger settings.

## 3. Red Team Alignment Matrix
* **Identity Spoofing**: Handled by matching `incoming().createdBy == request.auth.uid`
* **Resource Poisoning**: Standardized constraint `.size() <= 100` and validation filters.
* **Query Safety**: Client must specify specific household code queries which require auth context.
