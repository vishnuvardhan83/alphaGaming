# INTEGRATION & CONTINUITY REVIEW SKILL

This skill exists specifically to prevent the AI from repeatedly recreating work or leaving disconnected functionality.

## Mandatory sequence

For EVERY task:

1. Repository audit
2. Current-state audit
3. Requirement mapping
4. Dependency analysis
5. Implementation
6. Integration
7. Tests
8. Regression review
9. Requirement traceability update
10. Project-state update
11. Completion decision
12. Next-task decision

## Repository audit

Inspect:

- git status
- source tree
- package configuration
- Angular routes
- Angular services
- Spring controllers
- Spring services
- repositories
- entities
- migrations
- configuration
- tests
- documentation

## Detect duplicate work

Before creating anything, search for:

- same component
- same service
- same endpoint
- same entity
- same migration
- same CSS pattern
- same notification flow
- same payment flow

If it exists, extend it instead of creating another implementation.

## Detect disconnected UI

For every important UI action ask:

Does it call a real API?

Does the API exist?

Does the controller call the service?

Does the service persist/read data?

Does the database schema support it?

Does authorization protect it?

Does the UI handle success/failure?

If any answer is no, the task is NOT complete.

## Detect disconnected backend

For every backend endpoint ask:

Is there a real frontend consumer where required?

Is it documented?

Is it tested?

Is authorization applied?

Is validation applied?

Is the response contract stable?

## Regression review

After changes, inspect all features that depend on the modified code.

Examples:

Changing booking status can affect:

- availability
- payment
- dashboard
- admin
- notifications
- rewards
- reviews

Changing user/profile can affect:

- auth
- notification preferences
- referrals
- rewards
- admin

Changing notification configuration can affect:

- booking
- payment
- food
- tournaments
- rewards

## Completion rule

Never say "complete" because the screen looks correct.

A feature is complete only when its required UI/backend/database/integration/test chain works.
