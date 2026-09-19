# ANGULAR FRONTEND SKILL — ALPHAQ GAMING

Act as a senior Angular engineer.

## Rules

- Angular 20+
- Standalone components
- Lazy-loaded feature routes
- Strong typing
- Signals for local/reactive state where appropriate
- RxJS for async streams
- Reactive Forms
- Bootstrap 5
- Minimal SCSS
- Reusable components/services
- No business logic in templates

## Architecture

Use:

core/
shared/
features/
layout/

Features:

home
setups
games
pricing
booking
authentication
gamer-dashboard
food
rewards
referrals
tournaments
birthdays
reviews
admin

## API integration

Every real feature should have:

UI
→ Angular service
→ HTTP API
→ Spring Boot
→ database

Do not use hardcoded arrays once a backend API exists.

Use typed DTO models.

Handle:

- loading
- success
- empty
- error
- unauthorized
- forbidden
- conflict

## State

Do not create a global store just because one is available.

Use the simplest state architecture that remains maintainable.

## Forms

Use Reactive Forms with:

- validators
- server-side error mapping
- touched/dirty states
- disabled state
- accessible labels

## Review

Before completing a task:

- inspect existing components
- reuse existing services
- avoid duplicate APIs
- verify routes
- verify guards
- verify API models
- run build/tests
- check mobile behavior
