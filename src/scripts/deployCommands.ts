import { REST, Routes } from "discord.js";
import { config } from "../config";
import { CommandHandler } from "../handlers/commandHandler";
import { Logger } from "../utils/logger";

const logger = new Logger("DeployCommands");

// ============================================================
// Script de registro de Slash Commands en la API de Discord
// Ejecutar una vez o cuando se agreguen nuevos comandos:
//   npx ts-node src/scripts/deployCommands.ts
// ============================================================

async function deploy(): Promise<void> {
  const commands = CommandHandler.getSlashCommands().map((cmd) => cmd.toJSON());

  const rest = new REST({ version: "10" }).setToken(config.discord.token);

  logger.info(`Registrando ${commands.length} comandos slash...`);

  try {
    if (config.discord.guildId) {
      // Registro en un servidor específico (instantáneo, útil para desarrollo)
      await rest.put(
        Routes.applicationGuildCommands(config.discord.clientId, config.discord.guildId),
        { body: commands }
      );
      logger.success(`Comandos registrados en guild ${config.discord.guildId}`);
    } else {
      // Registro global (puede tardar hasta 1 hora en propagarse)
      await rest.put(Routes.applicationCommands(config.discord.clientId), {
        body: commands,
      });
      logger.success("Comandos registrados globalmente");
    }
  } catch (err) {
    logger.error("Error registrando comandos", err);
    process.exit(1);
  }
}

deploy();
