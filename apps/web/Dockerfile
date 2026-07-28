# syntax=docker/dockerfile:1
# Build context must be the monorepo root: docker build -f apps/web/Dockerfile .

FROM node:24-slim AS build
RUN corepack enable
WORKDIR /workspace

COPY . .
RUN pnpm install --frozen-lockfile

# vite.config.ts requires PORT/BASE_PATH to be set even for a production build.
ARG PORT=5173
ARG BASE_PATH=/
ARG VITE_CLERK_PUBLISHABLE_KEY
ARG VITE_CLERK_PROXY_URL
ENV PORT=$PORT
ENV BASE_PATH=$BASE_PATH
ENV NODE_ENV=production
ENV VITE_CLERK_PUBLISHABLE_KEY=$VITE_CLERK_PUBLISHABLE_KEY
ENV VITE_CLERK_PROXY_URL=$VITE_CLERK_PROXY_URL

RUN pnpm run typecheck:libs
RUN pnpm --filter @business-shield/web run build

FROM nginx:1.27-alpine AS runtime
COPY --from=build /workspace/apps/web/dist/public /usr/share/nginx/html
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
