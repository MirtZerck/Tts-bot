import {
  AudioPlayer,
  AudioPlayerStatus,
  createAudioPlayer,
  createAudioResource,
  VoiceConnection,
  VoiceConnectionStatus,
  entersState,
} from "@discordjs/voice";
import { TTSService } from "./ttsService";
import { Logger } from "../utils/logger";
import { config } from "../config";

const logger = new Logger("AudioPlayer");

// ============================================================
// Servicio de reproducción de audio en canales de voz
// Mantiene una cola FIFO para no superponer mensajes
// ============================================================

interface QueueItem {
  text: string;
  authorName: string;
}

export class AudioPlayerService {
  private readonly player: AudioPlayer;
  private readonly ttsService: TTSService;
  private readonly queue: QueueItem[] = [];
  private isPlaying = false;

  constructor() {
    this.player = createAudioPlayer();
    this.ttsService = new TTSService();
    this.setupPlayerListeners();
  }

  /** Devuelve el AudioPlayer interno para suscribir la conexión */
  getPlayer(): AudioPlayer {
    return this.player;
  }

  /** Añade un texto a la cola y comienza a reproducir si está libre */
  enqueue(text: string, authorName: string): void {
    this.queue.push({ text, authorName });
    logger.debug(`Encolado mensaje de "${authorName}" — cola: ${this.queue.length}`);

    if (!this.isPlaying) {
      void this.processQueue();
    }
  }

  /** Detiene la reproducción y vacía la cola */
  stop(): void {
    this.queue.length = 0;
    this.isPlaying = false;
    this.player.stop(true);
    logger.info("Reproducción detenida y cola vaciada");
  }

  /** Suscribe esta instancia a una conexión de voz */
  subscribeToConnection(connection: VoiceConnection): void {
    connection.subscribe(this.player);
    logger.info("AudioPlayer suscrito a la conexión de voz");
  }

  // ------ helpers privados ------

  private async processQueue(): Promise<void> {
    if (this.queue.length === 0) {
      this.isPlaying = false;
      return;
    }

    this.isPlaying = true;
    const item = this.queue.shift()!;

    logger.debug(`Reproduciendo mensaje de "${item.authorName}": "${item.text.substring(0, 40)}..."`);

    try {
      const ttsResult = await this.ttsService.textToAudioFile(
        `${item.authorName} dice: ${item.text}`
      );

      const resource = createAudioResource(ttsResult.audioPath, {
        inlineVolume: true,
      });

      resource.volume?.setVolume(config.tts.volume);
      this.player.play(resource);

      // Esperamos a que termine para limpiar el archivo y procesar el siguiente
      await entersState(this.player, AudioPlayerStatus.Idle, 60_000);
      ttsResult.cleanup();
    } catch (err) {
      logger.error("Error reproduciendo audio", err);
      this.isPlaying = false;
    }
  }

  private setupPlayerListeners(): void {
    this.player.on(AudioPlayerStatus.Idle, () => {
      if (this.queue.length > 0) {
        void this.processQueue();
      } else {
        this.isPlaying = false;
      }
    });

    this.player.on("error", (err) => {
      logger.error("Error en AudioPlayer", err);
      this.isPlaying = false;
      void this.processQueue(); // intenta con el siguiente
    });
  }
}
