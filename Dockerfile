FROM oven/bun:1.3.13 AS base

WORKDIR /app

FROM base AS deps

COPY package.json bun.lock tsconfig.json next.config.ts postcss.config.mjs eslint.config.mjs next-env.d.ts ./
COPY src ./src

RUN bun install --frozen-lockfile

FROM deps AS builder

ARG NEXT_PUBLIC_APP_VERSION=0.1.0
ARG NEXT_PUBLIC_APP_COMMIT=Unavailable
ARG NEXT_PUBLIC_APP_BUILD_TIME=Unavailable

ENV NEXT_PUBLIC_APP_VERSION=${NEXT_PUBLIC_APP_VERSION}
ENV NEXT_PUBLIC_APP_COMMIT=${NEXT_PUBLIC_APP_COMMIT}
ENV NEXT_PUBLIC_APP_BUILD_TIME=${NEXT_PUBLIC_APP_BUILD_TIME}
ENV NODE_ENV=production

RUN bun run build

FROM oven/bun:1.3.13 AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=::

COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

EXPOSE 3000

CMD ["bun", "server.js"]
