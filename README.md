# AlphaQ Gaming — AI Development Skills & Master Prompt

This package is designed for an AI coding agent that must build AlphaQ Gaming incrementally without repeatedly recreating work, losing functionality, or breaking previous phases.

## Stack

- Angular 20+
- TypeScript
- Standalone components
- Bootstrap 5 for layout/UI utilities
- SCSS only for project-specific styling that Bootstrap cannot reasonably provide
- Three.js for the premium 3D experience
- GSAP only where useful
- Java 21
- Spring Boot 3.x
- Spring Security
- Spring Data JPA / Hibernate
- Flyway
- MySQL 8+
- REST APIs
- Jest
- JUnit / Spring Boot Test / MockMvc
- Playwright

## Important product rules

- Use the supplied AlphaQ business blueprint/master requirements as the source of truth.
- Payment success does not automatically confirm a booking; admin approval is required.
- Do not hardcode business prices/rules in Angular.
- Customers select PC/PS5 and quantity; admin assigns physical setups.
- Never allow overlapping bookings.
- Expired payment holds must release availability.
- Backend authorization is mandatory.
- Notifications must be provider-independent.
- Payment must be provider-independent.
- Use mock providers for local development.
- Production WhatsApp must use a legitimate authorized integration; do not build an unofficial WhatsApp automation service.
- Email should support configurable SMTP.
- Admin must be able to configure/change notification provider settings without changing business modules.
- 3D must never block booking or core functionality.
- Do not create fake production functionality.

## Files

- `MASTER_AGENT_PROMPT.md` — the main prompt to give the coding agent.
- `skills/ui-ux-design/SKILL.md` — UI/UX rules.
- `skills/frontend-angular/SKILL.md` — Angular implementation rules.
- `skills/backend-springboot/SKILL.md` — Spring Boot/backend rules.
- `skills/integration-review/SKILL.md` — mandatory phase-by-phase review/continuity protocol.
- `skills/3d-experience/SKILL.md` — Three.js/3D rules.

## How to use

Give the agent `MASTER_AGENT_PROMPT.md` plus the original AlphaQ blueprint/specification.

The agent must work in phases. It must finish and verify one task before moving to the next. At the end of every task it must review the entire affected feature, update the project state, and identify the next dependency-safe task.

Do not ask the agent to generate the whole application in one response.
