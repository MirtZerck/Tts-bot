import {
  ChatInputCommandInteraction,
  Message,
  SlashCommandBuilder,
  VoiceBasedChannel,
  TextChannel,
  GuildMember,
  PermissionFlagsBits,
} from "discord.js";
import { VoiceHandler } from "./voiceHandler";
import { Logger } from "../utils/logger";

const logger = new Logger("CommandHandler");

// ============================================================
// Handler de comandos (slash + prefijo)
// ============================================================

export class CommandHandler {
  constructor(private readonly voiceHandler: VoiceHandler) {}

  // ---- Definiciones de Slash Commands para registro ----

  static getSlashCommands(): SlashCommandBuilder[] {
    return [
      new SlashCommandBuilder()
        .setName("unirse")
        .setDescription("El bot se une a tu canal de voz y lee los mensajes")
        .setDefaultMemberPermissions(PermissionFlagsBits.Connect),

      new SlashCommandBuilder()
        .setName("salir")
        .setDescription("El bot sale del canal de voz"),

      new SlashCommandBuilder()
        .setName("estado")
        .setDescription("Muestra si el bot está activo en este servidor"),
    ] as SlashCommandBuilder[];
  }

  // ---- Procesamiento de Slash Commands ----

  async handleSlashCommand(interaction: ChatInputCommandInteraction): Promise<void> {
    if (!interaction.guild) {
      await interaction.reply({ content: "❌ Solo funciona en servidores.", ephemeral: true });
      return;
    }

    switch (interaction.commandName) {
      case "unirse":
        await this.handleJoin(interaction);
        break;
      case "salir":
        await this.handleLeave(interaction);
        break;
      case "estado":
        await this.handleStatus(interaction);
        break;
      default:
        await interaction.reply({ content: "❓ Comando desconocido.", ephemeral: true });
    }
  }

  // ---- Procesamiento de Comandos con Prefijo ----

  async handlePrefixCommand(message: Message, prefix: string): Promise<void> {
    if (!message.guild || !message.content.startsWith(prefix)) return;

    const args = message.content.slice(prefix.length).trim().split(/\s+/);
    const command = args[0]?.toLowerCase();

    switch (command) {
      case "unirse":
      case "join":
        await this.handleJoinMessage(message);
        break;
      case "salir":
      case "leave":
        await this.handleLeaveMessage(message);
        break;
      case "estado":
      case "status":
        await this.handleStatusMessage(message);
        break;
    }
  }

  // ---- Handlers de join ----

  private async handleJoin(interaction: ChatInputCommandInteraction): Promise<void> {
    await interaction.deferReply();

    const member = interaction.member as GuildMember | null;
    const voiceChannel = member?.voice.channel as VoiceBasedChannel | null;

    if (!voiceChannel) {
      await interaction.editReply("❌ Debes estar en un canal de voz para usar este comando.");
      return;
    }

    const textChannel = interaction.channel as TextChannel;

    try {
      await this.voiceHandler.join(voiceChannel, textChannel);
      await interaction.editReply(
        `✅ Listo! Leyendo mensajes de **#${textChannel.name}** en **${voiceChannel.name}**.`
      );
    } catch (err) {
      logger.error("Error al unirse al canal", err);
      await interaction.editReply("❌ No pude unirme al canal de voz. Verifica los permisos.");
    }
  }

  private async handleJoinMessage(message: Message): Promise<void> {
    const member = message.member as GuildMember | null;
    const voiceChannel = member?.voice.channel as VoiceBasedChannel | null;

    if (!voiceChannel) {
      await message.reply("❌ Debes estar en un canal de voz.");
      return;
    }

    const textChannel = message.channel as TextChannel;

    try {
      await this.voiceHandler.join(voiceChannel, textChannel);
    } catch (err) {
      logger.error("Error al unirse al canal", err);
      await message.reply("❌ No pude unirme al canal de voz.");
    }
  }

  // ---- Handlers de leave ----

  private async handleLeave(interaction: ChatInputCommandInteraction): Promise<void> {
    const left = await this.voiceHandler.leave(interaction.guild!);
    if (left) {
      await interaction.reply("👋 Me desconecté del canal de voz.");
    } else {
      await interaction.reply({ content: "❌ No estoy en ningún canal de voz.", ephemeral: true });
    }
  }

  private async handleLeaveMessage(message: Message): Promise<void> {
    const left = await this.voiceHandler.leave(message.guild!);
    if (left) {
      await message.reply("👋 Me desconecté del canal de voz.");
    } else {
      await message.reply("❌ No estoy en ningún canal de voz.");
    }
  }

  // ---- Handlers de status ----

  private async handleStatus(interaction: ChatInputCommandInteraction): Promise<void> {
    const active = this.voiceHandler.isActiveIn(interaction.guild!.id);
    const session = this.voiceHandler.getSession(interaction.guild!.id);

    if (active && session) {
      await interaction.reply(
        `✅ Activo en <#${session.voiceChannelId}>, leyendo <#${session.textChannelId}>.`
      );
    } else {
      await interaction.reply("💤 No estoy en ningún canal de voz ahora mismo.");
    }
  }

  private async handleStatusMessage(message: Message): Promise<void> {
    const active = this.voiceHandler.isActiveIn(message.guild!.id);
    const session = this.voiceHandler.getSession(message.guild!.id);

    if (active && session) {
      await message.reply(
        `✅ Activo en <#${session.voiceChannelId}>, leyendo <#${session.textChannelId}>.`
      );
    } else {
      await message.reply("💤 No estoy en ningún canal de voz ahora mismo.");
    }
  }
}
