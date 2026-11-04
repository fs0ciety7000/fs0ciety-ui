# Build context: repository root (monorepo). Build: docker build -f apps/docs/Dockerfile .
FROM node:22-alpine AS build
RUN corepack enable
WORKDIR /repo
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm turbo run build --filter=@fs0lab/docs...

FROM caddy:2-alpine
COPY apps/docs/Caddyfile /etc/caddy/Caddyfile
COPY --from=build /repo/apps/docs/dist /srv
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s CMD wget -qO- http://127.0.0.1:8080/health || exit 1
