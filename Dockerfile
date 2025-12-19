# Multi-stage build for optimal performance
FROM node:20-alpine AS base

# Enable corepack for pnpm in base so it's available in all stages
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate

# Builder stage: Install dependencies and build
FROM base AS builder
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy all files
COPY . .

# Install dependencies
RUN pnpm install --frozen-lockfile

# Build the application
# We prune development dependencies after build to keep the image small
RUN pnpm run build && pnpm prune --prod

# Production image
FROM base AS runner
RUN apk add --no-cache openssl
WORKDIR /app

ENV NODE_ENV production

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy only necessary files
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/public ./apps/web/public

# Copy other necessary services (if they are not standalone)
# For api-gateway and telegram-service, we might need a different approach or separate containers
# Assuming monorepo structure, we copy built artifacts for other services too
COPY --from=builder --chown=nextjs:nodejs /app/apps/api-gateway/dist ./apps/api-gateway/dist
COPY --from=builder --chown=nextjs:nodejs /app/apps/api-gateway/package.json ./apps/api-gateway/package.json
COPY --from=builder --chown=nextjs:nodejs /app/apps/telegram-service/dist ./apps/telegram-service/dist
COPY --from=builder --chown=nextjs:nodejs /app/apps/telegram-service/package.json ./apps/telegram-service/package.json

# Copy shared packages
COPY --from=builder --chown=nextjs:nodejs /app/packages/utils/dist ./packages/utils/dist
COPY --from=builder --chown=nextjs:nodejs /app/packages/utils/package.json ./packages/utils/package.json
COPY --from=builder --chown=nextjs:nodejs /app/packages/api/dist ./packages/api/dist
COPY --from=builder --chown=nextjs:nodejs /app/packages/api/package.json ./packages/api/package.json
COPY --from=builder --chown=nextjs:nodejs /app/packages/stores/dist ./packages/stores/dist
COPY --from=builder --chown=nextjs:nodejs /app/packages/stores/package.json ./packages/stores/package.json
COPY --from=builder --chown=nextjs:nodejs /app/packages/ui/dist ./packages/ui/dist
COPY --from=builder --chown=nextjs:nodejs /app/packages/ui/package.json ./packages/ui/package.json

COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json
COPY --from=builder --chown=nextjs:nodejs /app/scripts ./scripts
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules

# Use non-root user
USER nextjs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:${PORT:-3000}/api/health || exit 1

# Start command
CMD ["npm", "run", "start:prod"]
