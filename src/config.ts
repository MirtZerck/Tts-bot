import * as dotenv from "dotenv";
dotenv.config();

// ============================================================
// Módulo de configuración central del bot
// Lee variables de entorno y exporta configuración tipada
// ============================================================

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(
      `❌ Variable de entorno requerida no encontrada: ${key}\n` +
        `   Copia .env.example a .env y completa los valores.`
    );
  }
  return value;
}

export const config = {
  // Credenciales del bot
  discord: {
    token: requireEnv("DISCORD_TOKEN"),
    clientId: requireEnv("CLIENT_ID"),
    guildId: process.env.GUILD_ID ?? null,
  },

  // Configuración de Text-to-Speech
  tts: {
    language: process.env.TTS_LANGUAGE ?? "es",
    volume: parseFloat(process.env.BOT_VOLUME ?? "1.0"),
    maxChars: parseInt(process.env.MAX_CHARS ?? "200", 10),
  },

  // Configuración general
  bot: {
    prefix: process.env.BOT_PREFIX ?? "!",
    // Tiempo en ms que el bot espera en silencio antes de desconectarse (5 min)
    autoDisconnectMs: 5 * 60 * 1000,
  },
} as const;

export type Config = typeof config;
