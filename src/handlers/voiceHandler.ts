import {
  VoiceBasedChannel,
  TextChannel,
  Message,
  GuildMember,
  Guild,
} from "discord.js";
import {
  joinVoiceChannel,
  VoiceConnection,
  VoiceConnectionStatus,
  entersState,
  getVoiceConnection,
} from "@discordjs/voice";
import { AudioPlayerService } from "../services/audioPlayerService";
import { Logger } from "../utils/logger";
import { config } from "../config";

const logger = new Logger("VoiceHandler");

// ============================================================
// Handler de canales de voz
// Gestiona conexiones por guild y el canal de texto vinculado
// ============================================================

interface GuildSession {
  connection: VoiceConnection;
  audioPlayer: AudioPlayerService;
  textChannelId: string;
  voiceChannelId: string;
  autoDisconnectTimer?: ReturnType<typeof setTimeout>;
}

export class VoiceHandler {
  // Una sesión por servidor (guild)
  private readonly sessions = new Map<string, GuildSession>();

  // ---- API pública ----

  /**
   * Une el bot al canal de voz especificado y vincula el canal de texto
   * desde donde se leerán los mensajes.
   */
  async join(
    voiceChannel: VoiceBasedChannel,
    textChannel: TextChannel
  ): Promise<void> {
    const guildId = voiceChannel.guild.id;

    // Si ya hay una sesión activa para este guild, la desconectamos primero
    await this.leave(voiceChannel.guild);

    logger.info(
      `Uniéndose al canal de voz "${voiceChannel.name}" en "${voiceChannel.guild.name}"`
    );

    const connection = joinVoiceChannel({
      channelId: voiceChannel.id,
      guildId,
      adapterCreator: voiceChannel.guild.voiceAdapterCreator,
      selfDeaf: false, // El bot necesita oír para saber si está en el canal
      selfMute: false,
    });

    const audioPlayer = new AudioPlayerService();
    audioPlayer.subscribeToConnection(connection);

    // Esperar a que la conexión esté lista
    try {
      await entersState(connection, VoiceConnectionStatus.Ready, 10_000);
      logger.success(`Conectado al canal "${voiceChannel.name}"`);
    } catch {
      connection.destroy();
      throw new Error(`No se pudo conectar al canal "${voiceChannel.name}" en 10 s`);
    }

    const session: GuildSession = {
      connection,
      audioPlayer,
      textChannelId: textChannel.id,
      voiceChannelId: voiceChannel.id,
    };

    this.sessions.set(guildId, session);
    this.setupConnectionHandlers(guildId, connection);
    this.resetAutoDisconnect(guildId);

    // Mensaje de bienvenida
    audioPlayer.enqueue(
      `Hola! Estoy en el canal ${voiceChannel.name}. Leeré los mensajes del chat.`,
      "Bot"
    );

    await textChannel.send(
      `🔊 Me uní a **${voiceChannel.name}**. Leeré los mensajes de este canal en voz alta.`
    );
  }

  /**
   * Desconecta el bot del canal de voz del guild indicado.
   */
  async leave(guild: Guild): Promise<boolean> {
    const session = this.sessions.get(guild.id);
    if (!session) return false;

    logger.info(`Saliendo del canal de voz en "${guild.name}"`);

    session.audioPlayer.stop();
    session.connection.destroy();
    clearTimeout(session.autoDisconnectTimer);
    this.sessions.delete(guild.id);
    return true;
  }

  /**
   * Procesa un mensaje de texto: lo encola para reproducción si el bot
   * está activo en el guild y el mensaje proviene del canal vinculado.
   */
  handleTextMessage(message: Message): void {
    if (!message.guild) return;

    const session = this.sessions.get(message.guild.id);
    if (!session) return;
    if (message.channelId !== session.textChannelId) return;

    const authorName = (message.member as GuildMember | null)?.displayName ?? message.author.username;
    const text = message.content;

    if (!text || text.startsWith(config.bot.prefix)) return;

    logger.debug(`Mensaje de "${authorName}": ${text.substring(0, 60)}`);

    session.audioPlayer.enqueue(text, authorName);
    this.resetAutoDisconnect(session.connection.joinConfig.guildId);
  }

  /**
   * Indica si el bot está activo en el guild dado.
   */
  isActiveIn(guildId: string): boolean {
    return this.sessions.has(guildId);
  }

  /**
   * Devuelve la información de la sesión activa (si existe).
   */
  getSession(guildId: string): GuildSession | undefined {
    return this.sessions.get(guildId);
  }

  // ---- Helpers privados ----

  private setupConnectionHandlers(guildId: string, connection: VoiceConnection): void {
    connection.on(VoiceConnectionStatus.Disconnected, async () => {
      try {
        // Intentar reconectar brevemente antes de destruir
        await Promise.race([
          entersState(connection, VoiceConnectionStatus.Signalling, 5_000),
          entersState(connection, VoiceConnectionStatus.Connecting, 5_000),
        ]);
      } catch {
        logger.warn(`Conexión perdida en guild ${guildId} — limpiando sesión`);
        this.cleanupSession(guildId);
      }
    });

    connection.on(VoiceConnectionStatus.Destroyed, () => {
      this.cleanupSession(guildId);
    });
  }

  private cleanupSession(guildId: string): void {
    const session = this.sessions.get(guildId);
    if (session) {
      clearTimeout(session.autoDisconnectTimer);
      session.audioPlayer.stop();
      this.sessions.delete(guildId);
      logger.info(`Sesión de guild ${guildId} eliminada`);
    }
  }

  private resetAutoDisconnect(guildId: string): void {
    const session = this.sessions.get(guildId);
    if (!session) return;

    clearTimeout(session.autoDisconnectTimer);
    session.autoDisconnectTimer = setTimeout(() => {
      logger.info(`Auto-desconexión por inactividad en guild ${guildId}`);
      session.connection.destroy();
      this.cleanupSession(guildId);
    }, config.bot.autoDisconnectMs);
  }
}
