# Security Specification for AI Text Wizard

## 1. Data Invariants
- A `User` profile must be created by the user themselves and be immutable except for `displayName`.
- A `Document` must belong to a `User`.
- `Document` analysis results should only be written by the owner (normally would be a server, but for this app it's from the client, so we protect it via ownership).
- Documents are private to the owner.

## 2. Dirty Dozen Payloads (to be blocked)
1. Creating a user profile for someone else (`userId != auth.uid`).
2. Overwriting someone else's document.
3. Reading someone else's document.
4. Saving a document with a 10MB string (resource exhaustion).
5. Injecting script tags in the `content` field.
6. Changing the `userId` of an existing document (transferring ownership).
7. Setting a custom role like `admin: true` on the user profile.
8. Listing all documents without a `userId` filter.
9. Deleting another user's document.
10. Creating a document with an invalid `id` (path poisoning).
11. Updating `createdAt` timestamp.
12. Creating a user profile with an unverified email (if we enforce verification).

## 3. Implementation Plan
- `isValidId(id)` helper.
- `isValidUser(data)` helper.
- `isValidDocument(data)` helper.
- Strict ownership checks.
