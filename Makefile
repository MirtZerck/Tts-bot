# ============================================================
# Makefile — Atajos para operaciones comunes de Docker
# Uso: make <target>
# ============================================================

IMAGE_NAME  := discord-tts-bot
CONTAINER   := discord-tts-bot
COMPOSE     := docker compose

.PHONY: help build up down restart logs shell deploy clean dev

## Muestra esta ayuda
help:
	@echo ""
	@echo "  Discord TTS Bot — Comandos disponibles"
	@echo "  ────────────────────────────────────────"
	@grep -E '^## .+' Makefile | sed 's/## /  /'
	@echo ""

## Construir la imagen de producción
build:
	$(COMPOSE) build bot

## Iniciar el bot en producción (background)
up:
	$(COMPOSE) up -d bot
	@echo "✅ Bot iniciado. Usa 'make logs' para ver los logs."

## Detener y eliminar contenedores
down:
	$(COMPOSE) down

## Reiniciar el bot
restart:
	$(COMPOSE) restart bot

## Ver logs en tiempo real
logs:
	$(COMPOSE) logs -f bot

## Abrir shell dentro del contenedor
shell:
	docker exec -it $(CONTAINER) /bin/sh

## Deploy completo: build + up
deploy: build up

## Iniciar en modo desarrollo con hot-reload
dev:
	$(COMPOSE) --profile dev up bot-dev

## Registrar slash commands (requiere que .env esté configurado)
register-commands:
	docker run --rm --env-file .env $(IMAGE_NAME):latest \
		node -e "require('./dist/scripts/deployCommands')"

## Ver estado y recursos del contenedor
status:
	@docker ps --filter "name=$(CONTAINER)" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
	@echo ""
	@docker stats $(CONTAINER) --no-stream 2>/dev/null || true

## Limpiar imágenes y volúmenes no usados
clean:
	$(COMPOSE) down --rmi local --volumes
	docker image prune -f
