# ============================================================
# Stage 1: Builder
# ============================================================
FROM node:20-alpine AS builder

WORKDIR /app

RUN apk add --no-cache python3 make g++

COPY package.json tsconfig.json ./

RUN npm install --ignore-scripts --legacy-peer-deps

COPY src/ ./src/
RUN npm run build

# ============================================================
# Stage 2: Production
# ============================================================
FROM node:20-alpine AS production

WORKDIR /app

RUN apk add --no-cache ffmpeg && rm -rf /var/cache/apk/*

COPY package.json ./
RUN npm install --omit=dev --ignore-scripts --legacy-peer-deps && npm cache clean --force

COPY --from=builder /app/dist ./dist

RUN addgroup -S botgroup && adduser -S botuser -G botgroup
USER botuser

VOLUME ["/tmp"]

HEALTHCHECK --interval=30s --timeout=10s --start-period=20s --retries=3 \
    CMD pgrep -f "node dist/index.js" > /dev/null || exit 1

CMD ["node", "dist/index.js"]
