# ============================================================
# Stage 1: Builder — instala deps y compila TypeScript
# ============================================================
FROM node:20-alpine AS builder

WORKDIR /app

# python3/make/g++ para módulos nativos (prism-media, opusscript)
RUN apk add --no-cache python3 make g++

COPY package.json tsconfig.json ./

RUN npm install --ignore-scripts

COPY src/ ./src/
RUN npm run build

# ============================================================
# Stage 2: Production — imagen final mínima
# ============================================================
FROM node:20-alpine AS production

WORKDIR /app

RUN apk add --no-cache \
    ffmpeg \
    python3 \
    make \
    g++ \
    && rm -rf /var/cache/apk/*

COPY package.json ./
RUN npm install --omit=dev --ignore-scripts && npm cache clean --force

COPY --from=builder /app/dist ./dist

RUN addgroup -S botgroup && adduser -S botuser -G botgroup
USER botuser

VOLUME ["/tmp"]

HEALTHCHECK --interval=30s --timeout=10s --start-period=20s --retries=3 \
    CMD pgrep -f "node dist/index.js" > /dev/null || exit 1

CMD ["node", "dist/index.js"]
