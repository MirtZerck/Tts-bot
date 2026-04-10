import {
  Client,
  GatewayIntentBits,
  Events,
  Message,
  ChatInputCommandInteraction,
  ActivityType,
} from "discord.js";
import { VoiceHandler } from "./handlers/voiceHandler";
import { CommandHandler } from "./handlers/commandHandler";
import { Logger } from "./utils/logger";
import { config } from "./config";

const logger = new Logger("Bot");

// ============================================================
// Clase principal del Bot — conecta todos los módulos
// ============================================================

export class DiscordTTSBot {
  private readonly client: Client;
  private readonly voiceHandler: VoiceHandler;
  private readonly commandHandler: CommandHandler;

  constructor() {
    this.client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.MessageContent, // Requiere privilegio en Portal
      ],
    });

    this.voiceHandler = new VoiceHandler();
    this.commandHandler = new CommandHandler(this.voiceHandler);

    this.registerEvents();
  }

  /** Inicia el bot y lo conecta a Discord */
  async start(): Promise<void> {
    logger.info("Iniciando bot...");
    await this.client.login(config.discord.token);
  }

  // ---- Registro de eventos ----

  private registerEvents(): void {
    this.client.once(Events.ClientReady, (c) => this.onReady(c));
    this.client.on(Events.MessageCreate, (msg) => this.onMessage(msg));
    this.client.on(Events.InteractionCreate, (i) => {
      if (i.isChatInputCommand()) this.onSlashCommand(i);
    });

    // Manejo de errores no capturados del cliente
    this.client.on("error", (err) => {
      logger.error("Error en el cliente de Discord", err);
    });
  }

  // ---- Handlers de eventos ----

  private onReady(client: Client<true>): void {
    logger.success(`Bot listo — conectado como ${client.user.tag}`);

    client.user.setPresence({
      activities: [
        {
          name: "mensajes de voz | /unirse",
          type: ActivityType.Listening,
        },
      ],
      status: "online",
    });

    logger.info(
      `Comandos disponibles:\n` +
        `  Slash:  /unirse  /salir  /estado\n` +
        `  Prefix: ${config.bot.prefix}unirse  ${config.bot.prefix}salir  ${config.bot.prefix}estado`
    );
  }

  private onMessage(message: Message): void {
    // Ignorar mensajes de bots
    if (message.author.bot) return;

    // Intentar procesar como comando con prefijo
    if (message.content.startsWith(config.bot.prefix)) {
      void this.commandHandler.handlePrefixCommand(message, config.bot.prefix);
      return;
    }

    // Si no es comando, pasar al lector de mensajes de voz
    this.voiceHandler.handleTextMessage(message);
  }

  private onSlashCommand(interaction: ChatInputCommandInteraction): void {
    void this.commandHandler.handleSlashCommand(interaction);
  }
}
