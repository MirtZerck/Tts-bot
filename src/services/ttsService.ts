import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { Readable } from "stream";
import { config } from "../config";
import { Logger } from "../utils/logger";

const logger = new Logger("TTSService");

// ============================================================
// Servicio de Text-to-Speech
// Genera audio MP3 desde texto usando Google TTS (node-gtts)
// ============================================================

// Lazy import para evitar problemas de tipos con node-gtts
// eslint-disable-next-line @typescript-eslint/no-var-requires
const gTTS = require("node-gtts");

export interface TTSResult {
  audioPath: string;
  cleanup: () => void;
}

export class TTSService {
  private readonly language: string;
  private readonly tempDir: string;
  private readonly tts: { stream: (text: string) => Readable };

  constructor(language?: string) {
    this.language = language ?? config.tts.language;
    this.tempDir = os.tmpdir();
    this.tts = gTTS(this.language);
    logger.info(`TTSService inicializado — idioma: ${this.language}`);
  }

  /**
   * Convierte texto a un archivo MP3 temporal.
   * El caller debe llamar a cleanup() después de reproducir.
   */
  async textToAudioFile(text: string): Promise<TTSResult> {
    const sanitized = this.sanitizeText(text);
    const fileName = `tts_${Date.now()}_${Math.random().toString(36).slice(2)}.mp3`;
    const audioPath = path.join(this.tempDir, fileName);

    logger.debug(`Generando TTS para: "${sanitized.substring(0, 50)}..."`);

    await this.saveToFile(sanitized, audioPath);

    return {
      audioPath,
      cleanup: () => this.deleteFile(audioPath),
    };
  }

  /**
   * Devuelve un stream de audio directamente (sin archivo temporal)
   */
  textToStream(text: string): Readable {
    const sanitized = this.sanitizeText(text);
    return this.tts.stream(sanitized) as Readable;
  }

  // ------ helpers privados ------

  private sanitizeText(text: string): string {
    // Limitar longitud
    let sanitized = text.slice(0, config.tts.maxChars);

    // Eliminar menciones @usuario, #canal, emojis personalizados
    sanitized = sanitized
      .replace(/<@!?\d+>/g, "alguien")           // menciones de usuario
      .replace(/<#\d+>/g, "un canal")             // menciones de canal
      .replace(/<a?:\w+:\d+>/g, "")               // emojis personalizados
      .replace(/https?:\/\/\S+/gi, "un enlace")   // URLs
      .replace(/[*_`~|>]/g, "")                   // markdown
      .trim();

    if (!sanitized) sanitized = "mensaje vacío";
    return sanitized;
  }

  private saveToFile(text: string, filePath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const stream = this.tts.stream(text) as Readable;
      const writeStream = fs.createWriteStream(filePath);

      stream.pipe(writeStream);
      writeStream.on("finish", resolve);
      writeStream.on("error", reject);
      stream.on("error", reject);
    });
  }

  private deleteFile(filePath: string): void {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        logger.debug(`Archivo temporal eliminado: ${filePath}`);
      }
    } catch (err) {
      logger.warn(`No se pudo eliminar archivo temporal: ${filePath}`);
    }
  }
}
