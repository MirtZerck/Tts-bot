# 🤖 Discord TTS Bot

Bot de Discord en **TypeScript** que lee automáticamente los mensajes del canal de texto en voz alta al unirse a un canal de voz.

---

## 📁 Estructura del proyecto

```
discord-tts-bot/
├── src/
│   ├── index.ts                      # Punto de entrada
│   ├── bot.ts                        # Cliente Discord + registro de eventos
│   ├── config.ts                     # Variables de entorno tipadas
│   ├── handlers/
│   │   ├── voiceHandler.ts           # Gestión de canales de voz
│   │   └── commandHandler.ts         # Comandos slash y de prefijo
│   ├── services/
│   │   ├── ttsService.ts             # Text-to-Speech con Google TTS
│   │   └── audioPlayerService.ts     # Cola de reproducción de audio
│   ├── utils/
│   │   └── logger.ts                 # Logger con colores y timestamps
│   └── scripts/
│       └── deployCommands.ts         # Registro de slash commands
├── .env.example
├── package.json
└── tsconfig.json
```

---

## 🚀 Instalación

### 1. Clonar e instalar dependencias

```bash
npm install
```

### 2. Configurar variables de entorno

```bash
cp .env.example .env
```

Edita `.env` con tus valores:

| Variable        | Descripción                                      | Ejemplo         |
|-----------------|--------------------------------------------------|-----------------|
| `DISCORD_TOKEN` | Token de tu bot (Discord Developer Portal)       | `MTI3...`       |
| `CLIENT_ID`     | ID de la aplicación del bot                      | `1234567890`    |
| `GUILD_ID`      | ID del servidor (solo para desarrollo)           | `9876543210`    |
| `TTS_LANGUAGE`  | Idioma del TTS                                   | `es`            |
| `BOT_VOLUME`    | Volumen (0.0 - 2.0)                              | `1.0`           |
| `MAX_CHARS`     | Máximo de caracteres leídos por mensaje          | `200`           |

### 3. Crear el bot en Discord

1. Ve a [discord.com/developers/applications](https://discord.com/developers/applications)
2. **New Application** → ponle nombre
3. Sección **Bot**:
   - Activa **Message Content Intent** (imprescindible)
   - Activa **Server Members Intent**
   - Copia el **Token** → `DISCORD_TOKEN`
4. Sección **General Information** → copia **Application ID** → `CLIENT_ID`
5. Sección **OAuth2 → URL Generator**:
   - Scopes: `bot`, `applications.commands`
   - Permisos: `Connect`, `Speak`, `Read Messages`, `Send Messages`
   - Invita el bot con la URL generada

### 4. Registrar los Slash Commands

```bash
npx ts-node src/scripts/deployCommands.ts
```

> Si tienes `GUILD_ID` configurado los comandos aparecen al instante.
> Sin `GUILD_ID`, se registran globalmente (puede tardar hasta 1 hora).

### 5. Iniciar el bot

```bash
# Desarrollo (sin compilar)
npm run dev

# Producción (compilar primero)
npm run build
npm start
```

---

## 💬 Comandos

| Comando         | Alias prefijo      | Descripción                                   |
|-----------------|--------------------|-----------------------------------------------|
| `/unirse`       | `!unirse`, `!join` | Entra al canal de voz y empieza a leer        |
| `/salir`        | `!salir`, `!leave` | Sale del canal de voz                         |
| `/estado`       | `!estado`          | Muestra si el bot está activo en el servidor  |

---

## ⚙️ Funcionamiento

```
Usuario escribe en #general
        │
        ▼
 MessageCreate event
        │
        ▼
  VoiceHandler.handleTextMessage()
        │
  ¿El canal es el vinculado?
        │ sí
        ▼
  AudioPlayerService.enqueue()
        │
        ▼
  TTSService.textToAudioFile()   ← Google TTS genera MP3
        │
        ▼
  createAudioResource() → reproduce en el canal de voz
```

---

## 🐳 Deploy con Docker

### Estructura de archivos Docker

```
discord-tts-bot/
├── Dockerfile            ← Imagen producción (multi-stage)
├── Dockerfile.dev        ← Imagen desarrollo con hot-reload
├── docker-compose.yml    ← Orquestación de servicios
├── .dockerignore         ← Excluye archivos del build context
├── Makefile              ← Atajos de comandos
└── .github/
    └── workflows/
        └── deploy.yml    ← CI/CD con GitHub Actions
```

### Deploy rápido

```bash
# 1. Copiar y configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales

# 2. Build + iniciar (usando Make)
make deploy

# 3. Ver logs
make logs

# 4. Registrar slash commands
make register-commands
```

### Comandos Make disponibles

| Comando              | Descripción                              |
|----------------------|------------------------------------------|
| `make deploy`        | Build + iniciar en producción            |
| `make up`            | Iniciar (sin rebuild)                    |
| `make down`          | Detener y eliminar contenedores          |
| `make restart`       | Reiniciar el bot                         |
| `make logs`          | Ver logs en tiempo real                  |
| `make dev`           | Modo desarrollo con hot-reload           |
| `make shell`         | Abrir shell dentro del contenedor        |
| `make status`        | Ver estado y uso de recursos             |
| `make clean`         | Limpiar imágenes y volúmenes             |

### Sin Make (Docker Compose directo)

```bash
# Producción
docker compose up -d --build

# Desarrollo con hot-reload
docker compose --profile dev up bot-dev

# Logs
docker compose logs -f bot

# Detener
docker compose down
```

### CI/CD con GitHub Actions

El workflow `.github/workflows/deploy.yml` hace automáticamente:
1. **TypeScript check** en cada PR
2. **Build y push** de la imagen a GitHub Container Registry
3. **Deploy SSH** al servidor cuando se hace merge a `main`

Secrets necesarios en GitHub → Settings → Secrets:

| Secret           | Descripción                        |
|------------------|------------------------------------|
| `SERVER_HOST`    | IP o dominio del servidor          |
| `SERVER_USER`    | Usuario SSH                        |
| `SERVER_SSH_KEY` | Clave privada SSH                  |

---

## 🔧 Requisitos del sistema

- **Node.js** ≥ 18
- **FFmpeg** instalado y en el PATH (necesario para `@discordjs/voice`)
  - Linux: `sudo apt install ffmpeg`
  - macOS: `brew install ffmpeg`
  - Windows: Descargar de [ffmpeg.org](https://ffmpeg.org/download.html)

---

## 🛠 Dependencias principales

| Paquete              | Uso                                        |
|----------------------|--------------------------------------------|
| `discord.js`         | API de Discord                             |
| `@discordjs/voice`   | Conexión y reproducción en canales de voz  |
| `@discordjs/opus`    | Codec de audio para Discord                |
| `node-gtts`          | Google Text-to-Speech                      |
| `dotenv`             | Variables de entorno                       |
