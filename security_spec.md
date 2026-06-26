# Security Specification for Pulse Tasks Firestore

This specification defines the security constraints, rules, and potential attack vectors for the Firebase Firestore backend.

## 1. Data Invariants
- **Scope Isolation**: A user can only read, write, create, or delete their own lists and tasks (i.e. under `/users/{userId}/`).
- **Owner Authenticated Constraint**: A user's UID in `request.auth.uid` must match the `{userId}` wildcard in the document path.
- **Task Integrity**: Any task document must have a valid non-empty title and positive estimated duration.

## 2. The "Dirty Dozen" Payloads
These payloads attempt to breach security boundaries and must be blocked by Firestore rules:
1. **Unauthenticated Read**: Attempting to read lists or tasks without a valid auth session.
2. **Cross-User Hijacking**: User `A` attempting to read user `B`'s tasks.
3. **Task Creation for Other User**: User `A` creating a task in User `B`'s collection path.
4. **List Deletion of Other User**: User `A` deleting User `B`'s custom list.
5. **Shadow Field Injection**: Attempting to inject unlisted properties (e.g., `attacker_field: "value"`) on task creation.
6. **Task ID Spoofing**: Creating a task with a long, malicious string identifier instead of a standard format.
7. **Negative Minutes Attack**: Creating a task with negative `estimated_minutes`.
8. **Invalid Urgency Enum**: Attempting to save a task with an urgency of `"immediate_emergency"` (not in enum).
9. **Invalid Difficulty Enum**: Attempting to save a task with difficulty `"impossible"`.
10. **Huge Priority Score**: Setting `priority_score` to `100` (must be 1-10).
11. **Checklist Overflow**: Injecting a massive checklist array with thousands of items to cause payload bloat.
12. **Malicious Title Size**: Saving a task with a title of over 500 characters.

## 3. Test Runner Definition
Verification that all unauthorized payloads return `PERMISSION_DENIED`.
All rules must enforce static schema validation and owner matching to prevent these attacks.
