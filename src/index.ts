import { DiscordTTSBot } from "./bot";
import { Logger } from "./utils/logger";

const logger = new Logger("Main");

// ============================================================
// Punto de entrada de la aplicación
// ============================================================

async function main(): Promise<void> {
  logger.info("=== Discord TTS Bot ===");

  // Manejo global de errores no capturados
  process.on("unhandledRejection", (err) => {
    logger.error("Promesa rechazada no capturada", err);
  });

  process.on("uncaughtException", (err) => {
    logger.error("Excepción no capturada — cerrando", err);
    process.exit(1);
  });

  // Cierre limpio con Ctrl+C
  process.on("SIGINT", () => {
    logger.info("Señal SIGINT recibida — apagando bot...");
    process.exit(0);
  });

  const bot = new DiscordTTSBot();

  try {
    await bot.start();
  } catch (err) {
    logger.error("Error fatal al iniciar el bot", err);
    process.exit(1);
  }
}

void main();
