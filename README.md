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
