// ============================================================
// Módulo de logging simple con colores y timestamp
// ============================================================

enum LogLevel {
  INFO = "INFO",
  WARN = "WARN",
  ERROR = "ERROR",
  DEBUG = "DEBUG",
  SUCCESS = "SUCCESS",
}

const COLORS = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  cyan: "\x1b[36m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  blue: "\x1b[34m",
  gray: "\x1b[90m",
};

function formatTimestamp(): string {
  return new Date().toISOString().replace("T", " ").substring(0, 19);
}

function formatMessage(level: LogLevel, module: string, message: string): string {
  const ts = `${COLORS.gray}[${formatTimestamp()}]${COLORS.reset}`;
  const mod = `${COLORS.blue}[${module}]${COLORS.reset}`;

  let levelTag: string;
  switch (level) {
    case LogLevel.INFO:
      levelTag = `${COLORS.cyan}[INFO]${COLORS.reset}`;
      break;
    case LogLevel.WARN:
      levelTag = `${COLORS.yellow}[WARN]${COLORS.reset}`;
      break;
    case LogLevel.ERROR:
      levelTag = `${COLORS.red}[ERROR]${COLORS.reset}`;
      break;
    case LogLevel.DEBUG:
      levelTag = `${COLORS.gray}[DEBUG]${COLORS.reset}`;
      break;
    case LogLevel.SUCCESS:
      levelTag = `${COLORS.green}[OK]${COLORS.reset}`;
      break;
  }

  return `${ts} ${levelTag} ${mod} ${message}`;
}

export class Logger {
  constructor(private readonly module: string) {}

  info(message: string): void {
    console.log(formatMessage(LogLevel.INFO, this.module, message));
  }

  warn(message: string): void {
    console.warn(formatMessage(LogLevel.WARN, this.module, message));
  }

  error(message: string, error?: unknown): void {
    console.error(formatMessage(LogLevel.ERROR, this.module, message));
    if (error instanceof Error) {
      console.error(`${COLORS.red}  └─ ${error.message}${COLORS.reset}`);
      if (error.stack) {
        console.error(`${COLORS.gray}${error.stack}${COLORS.reset}`);
      }
    }
  }

  debug(message: string): void {
    if (process.env.DEBUG === "true") {
      console.log(formatMessage(LogLevel.DEBUG, this.module, message));
    }
  }

  success(message: string): void {
    console.log(formatMessage(LogLevel.SUCCESS, this.module, message));
  }
}
