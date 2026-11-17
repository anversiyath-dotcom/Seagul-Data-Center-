# Firestore Security Specification

## 1. Data Invariants
1. **Authenticated & Verified Access**: All read and write operations require a verified Firebase Authentication session (`request.auth != null && request.auth.token.email_verified == true`). Unauthenticated internet reads/writes are completely denied.
2. **No Self-Assigned Admin or Active Privileges**: A user creating their own `/users/{uid}` document without an Admin invite MUST have `role == 'Staff'` and `status == 'Pending'`, preventing privilege escalation.
3. **Immutable Account Identity**: `uid`, `email`, and `createdAt` on `/users/{uid}` cannot be changed after creation. Users can only edit their own contact profile fields (`displayName`, `phone`, `jobTitle`, `photoURL`, `updatedAt`) and cannot modify `role`, `branchAccess`, or `status`.
4. **Admin-Only User Provisioning**: Only verified Admins (`anversiyath@gmail.com` or active `role == 'Admin'` users) can create/delete `/userInvites/{inviteId}` or update another user's `role`, `branchAccess`, or `status`.
5. **Atomic Invite Claiming**: When a pre-invited user signs in and claims `/userInvites/{inviteId}`, the `/users/{uid}` creation and `/userInvites/{inviteId}` status transition (`Pending -> Claimed`) occur atomically via `existsAfter` / `getAfter` validation.
6. **Operational Records Integrity**: Tickets, visas, comments, expenses, and company settings can only be created, read, updated, or deleted by Active staff or Admins, with strict field type/size validation and immutable `id`.

## 2. The "Dirty Dozen" Adversarial Payloads (All Must Return PERMISSION_DENIED)
1. **Unauthenticated Read**: `get /tickets/tkt-1` with `auth: null` -> Denied.
2. **Unverified Email Spoof**: `create /users/u1` with `auth: { uid: 'u1', token: { email: 'anversiyath@gmail.com', email_verified: false } }` -> Denied.
3. **Self-Assigned Admin Role**: `create /users/u2` with `{ uid: 'u2', email: 'attacker@gmail.com', role: 'Admin', status: 'Active', ... }` -> Denied.
4. **Self-Activation Without Invite**: `create /users/u2` with `{ uid: 'u2', email: 'attacker@gmail.com', role: 'Staff', status: 'Active', ... }` -> Denied.
5. **Privilege Escalation on Update**: `update /users/u2` by owner `u2` changing `{ role: 'Admin' }` or `{ status: 'Active' }` -> Denied.
6. **PII Read by Non-Owner Staff**: `get /users/u1` by `u2` (non-admin Staff) -> Denied.
7. **Shadow Field Injection on User**: `create /users/u2` containing `{ isAdmin: true, extraShadow: 'x' }` -> Denied by `hasOnly`.
8. **ID Poisoning**: `create /users/bad..id!!` or 1.5KB ID string -> Denied by `isValidId`.
9. **Pending User Modifying Visa**: `update /visas/v-1` by user with `users/{uid}.status == 'Pending'` -> Denied.
10. **Non-Admin Creating User Invite**: `create /userInvites/inv1` by `Staff` user -> Denied.
11. **Invite Hijacking (Email Mismatch)**: `claim /userInvites/inv1` (`email: 'a@gmail.com'`) by `auth.token.email == 'b@gmail.com'` -> Denied.
12. **Comment Text Resource Exhaustion**: `create /comments/c1` with 50KB `text` string -> Denied by `text.size() <= 4000`.
