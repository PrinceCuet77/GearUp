# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

GearUp is a backend REST API (Express + TypeScript + Prisma/PostgreSQL) for a sports/outdoor equipment rental service. Three roles: CUSTOMER (browse gear, place rentals, pay, review), PROVIDER (manage own gear inventory, fulfill orders), ADMIN (manage users, categories, view all gear/rentals).

## Commands

```bash
npm run dev      # tsx watch src/server.ts — dev server with hot reload
npm run build    # tsup — bundles src/server.ts to dist/ (esm + cjs)
npm start        # node dist/server.js — run production build
npm run seed     # tsx prisma/seed.ts — seed the database
```

There is no test suite (`npm test` is a stub) and no lint script configured.

Prisma:
```bash
npx prisma migrate dev --name <name>   # create + apply a migration (schema lives in prisma/schema/*.prisma, split by model)
npx prisma migrate deploy              # apply migrations (production)
npx prisma generate                    # regenerate client into generated/prisma (custom output path, not node_modules)
```

Prisma config is in `prisma.config.ts` (not `schema.prisma`'s datasource block) — schema files are split per-model under `prisma/schema/` (`schema.prisma`, `enums.prisma`, `user.prisma`, `category.prisma`, `gearItem.prisma`, `rentalOrder.prisma`, `rentalOrderItem.prisma`, `payment.prisma`, `review.prisma`) and Prisma merges them automatically. The generated client lives at `generated/prisma` — import types/enums from `../../generated/prisma/client` and `../../generated/prisma/enums` (path depth varies by file location), never from `@prisma/client`.

There's no `.env` checked in; copy `.env.example` and fill in `DATABASE_URL`, JWT secrets, and SSLCommerz credentials before running anything that touches the DB or payments.

## Architecture

### Module pattern

Every feature lives under `src/modules/<name>/` with a consistent file split — follow this exactly when adding or modifying a module:

- `*.routes.ts` — Express `Router`, wires `auth(...roles)` + `validate(schema, source)` middleware, then the controller handler. No logic here.
- `*.controller.ts` — thin: extract `req.user`/`req.params`/`req.query`/`req.body`, call the service, call `sendResponse`. Always wrapped in `catchAsync`.
- `*.service.ts` — all business logic and Prisma calls live here. Exported as a single object (e.g. `export const rentalService = { createRental, ... }`), not individual named exports.
- `*.validation.ts` — Zod schemas per endpoint (body/query/params separately).
- `*.interface.ts` — TypeScript types for payloads/queries (not every module has one, e.g. `categories`).

Routes are mounted in `src/app.ts` under `/api/<module>` (note: reviews' route file is `review.route.ts`, singular, unlike every other module's `*.routes.ts`).

### Request flow

`auth(...roles)` (src/middleware/auth.ts) reads the JWT from the `accessToken` cookie or `Authorization: Bearer` header, verifies it, re-fetches the user from the DB to check `status !== SUSPENDED`, and attaches `req.user = { userId, email, role }`. Passing no roles means "any authenticated user"; passing roles enforces RBAC.

`validate(schema, source)` (src/middleware/validate.ts) runs a Zod `safeParse` against `body` (default), `query`, `params`, or `cookies`, throws `BadRequestError` on failure, and replaces `req[source]` with the parsed/coerced data — so read validated values from `req.body`/`req.query`/`req.params` in controllers, not raw values.

Errors thrown anywhere in the chain (including inside `catchAsync`-wrapped handlers) are caught by `globalErrorHandler` (src/middleware/globalErrorHandler.ts), which maps `ApiError` subclasses (`ConflictError`, `NotFoundError`, `UnauthorizedError`, `ForbiddenError`, `BadRequestError` — src/errors/ApiError.ts) and known Prisma error codes (P2002, P2003, P2025, P1000, P1001) to HTTP responses. Always throw one of the `ApiError` subclasses from services rather than returning error objects.

All responses go through `sendResponse` (src/utils/sendResponse.ts) for a consistent shape: `{ success, statusCode, message, data, meta? }`, where `meta` (`page/limit/total/totalPages`) is used on paginated list endpoints.

### Domain flow worth understanding before touching rentals/payments

`RentalOrder` → `RentalOrderItem` → `GearItem` and `RentalOrder` → `Payment` are the core relations. Status lifecycle: `PLACED → CONFIRMED → PAID → PICKED_UP → RETURNED`, with `CANCELLED` only reachable from `PLACED`. Valid customer-initiated transitions are enforced via a lookup table (`CUSTOMER_STATUS_TRANSITIONS` in rental.service.ts) — extend that table rather than adding ad-hoc status checks if you add new transitions.

Stock (`GearItem.stock`) is decremented on rental creation and incremented back on cancel/return — always inside a `prisma.$transaction`, since stock mutation and order/status mutation must be atomic. Follow this pattern for any new flow that touches stock.

Payments go through SSLCommerz sandbox (src/modules/payments/payment.service.ts): `createPaymentInDB` posts to SSLCommerz's `api.php` and stores a `Payment` row keyed by a locally generated `transactionId`; the gateway later redirects to `/api/payments/confirm` (no auth — it's a public gateway callback), which validates via SSLCommerz's `validationserverAPI.php` and, on `VALID`, atomically marks the `Payment` COMPLETED and the `RentalOrder` PAID in one `$transaction`.

### Pagination/filtering convention

List endpoints (gears, provider gears, rentals, payments, reviews) share the same query shape: `page`, `limit`, `sortBy`, `sortOrder`, plus entity-specific filters — validated with Zod's `z.coerce.number()` and defaults (see gear.validation.ts), then applied as `skip`/`take`/`orderBy` in the service, with a `Promise.all([findMany, count])` to compute `meta.totalPages`.

### Reference docs in the repo

- `README.md` — full endpoint reference, ER diagram, DB schema tables, response format.
- `USER_API.md` / `DASHBOARD_API_SPEC.md` — additional API notes for specific areas.
- `GearUp.postman_collection.json` / `GearUp - Local.postman_environment.json` — Postman collection and local env for manual API testing.
