# ============================================================
# Stage 1: Builder — instala deps y compila TypeScript
# ============================================================
FROM node:20-alpine AS builder

WORKDIR /app

# Instalar dependencias del sistema necesarias para compilar módulos nativos
RUN apk add --no-cache python3 make g++

# Copiar manifiestos primero (mejor cache de capas)
COPY package*.json ./
COPY tsconfig.json ./

# Instalar TODAS las dependencias (incluyendo devDependencies para compilar)
RUN npm ci

# Copiar código fuente y compilar
COPY src/ ./src/
RUN npm run build

# ============================================================
# Stage 2: Production — imagen final mínima
# ============================================================
FROM node:20-alpine AS production

WORKDIR /app

# FFmpeg es requerido por @discordjs/voice para procesar audio
# python3 y make son necesarios para compilar @discordjs/opus en tiempo de instalación
RUN apk add --no-cache \
    ffmpeg \
    python3 \
    make \
    g++ \
    && rm -rf /var/cache/apk/*

# Copiar manifiestos e instalar SOLO dependencias de producción
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Copiar el build compilado desde el stage anterior
COPY --from=builder /app/dist ./dist

# Usuario no-root por seguridad
RUN addgroup -S botgroup && adduser -S botuser -G botgroup
USER botuser

# Directorio temporal para archivos de audio TTS (writable por botuser)
VOLUME ["/tmp"]

# Healthcheck: verifica que el proceso de Node sigue corriendo
HEALTHCHECK --interval=30s --timeout=10s --start-period=20s --retries=3 \
    CMD pgrep -f "node dist/index.js" > /dev/null || exit 1

CMD ["node", "dist/index.js"]
