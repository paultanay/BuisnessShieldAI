# syntax=docker/dockerfile:1
# Build context must be the monorepo root: docker build -f apps/api/Dockerfile .

FROM node:24-slim AS build
RUN corepack enable
WORKDIR /workspace

COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm run typecheck:libs
RUN pnpm --filter @business-shield/api run build

FROM node:24-slim AS runtime
RUN corepack enable
WORKDIR /workspace

COPY --from=build /workspace .

ENV NODE_ENV=production
EXPOSE 8080

WORKDIR /workspace/apps/api
CMD ["node", "--enable-source-maps", "./dist/index.mjs"]
