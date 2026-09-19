# SPRING BOOT BACKEND SKILL — ALPHAQ GAMING

Act as a senior Java/Spring Boot backend engineer.

## Stack

- Java 21
- Spring Boot 3.x
- Spring Security
- Spring Data JPA
- Hibernate
- Bean Validation
- Flyway
- MySQL
- OpenAPI
- JUnit
- MockMvc

## Architecture

Domain-oriented modular monolith.

Each domain can contain:

controller/
service/
repository/
entity/
dto/
mapper/

Controllers are thin.

Services contain business rules.

Repositories contain persistence operations.

Use DTOs instead of exposing entities.

## Transactions

Use @Transactional deliberately.

Critical transactional areas:

- booking creation
- payment state changes
- setup assignment
- reward ledger operations
- refunds
- cancellation
- food order state transitions

## Booking

Never rely only on frontend availability.

Availability must be protected at the backend/database level.

Recheck availability during final confirmation.

Use proper locking/concurrency handling.

## Security

Backend is the security boundary.

Implement:

- authentication
- authorization
- validation
- rate limiting
- OTP protection
- audit logging
- secure secrets

## External providers

Never put provider SDK calls throughout business services.

Use interfaces:

PaymentProvider
NotificationProvider
OtpProvider

Business code calls an application service.

The application service calls the provider adapter.

## Error handling

Use global exception handling and consistent error DTOs.

Distinguish:

- validation
- authentication
- authorization
- not found
- conflict
- external provider failure
- unexpected server error

## Review

Before completing:

- inspect existing service/repository/entity
- check existing migrations
- check transaction boundaries
- check authorization
- check indexes/constraints
- check API compatibility
- run tests
- run build
