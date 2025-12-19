# Comprehensive Logging and Monitoring Fix Plan

To ensure full error monitoring and logging coverage across the system, I will implement the following changes:

## 1. Fix `packages/utils` Dependencies
The utilities package is missing key dependencies required for logging and caching.
- **Action**: Update `packages/utils/package.json` to include:
  - `@sentry/node` & `@sentry/profiling-node` (for monitoring)
  - `ioredis` (for caching)

## 2. Setup `apps/telegram-service`
The Telegram service is missing its project configuration files.
- **Action**: Create `package.json` with dependencies (`telegraf`, `ioredis`, `@prompt-master-pro/utils`).
- **Action**: Create `tsconfig.json` for TypeScript configuration.

## 3. Integrate Monitoring in `apps/api-gateway`
The API Gateway currently lacks Sentry integration.
- **Action**: Add `@prompt-master-pro/utils` dependency.
- **Action**: Update `src/index.ts` to:
  - Initialize Sentry on startup.
  - Add Sentry middleware for request tracing.
  - Add Sentry error handler for capturing exceptions.

## 4. Integrate Monitoring in `apps/web`
The Next.js web application needs specific Sentry configuration.
- **Action**: Add `@sentry/nextjs` dependency.
- **Action**: Create Sentry configuration files:
  - `sentry.client.config.ts`
  - `sentry.server.config.ts`
  - `sentry.edge.config.ts`
- **Action**: Update `next.config.js` to enable Sentry build plugins.

## 5. Verification
- **Action**: Run `pnpm install` to link all packages.
- **Action**: Run `pnpm build` to verify that all services compile correctly with the new monitoring integrations.
