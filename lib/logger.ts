enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  NONE = 4,
}

class Logger {
  private static currentLevel: LogLevel = __DEV__ ? LogLevel.DEBUG : LogLevel.WARN;

  private static formatMessage(level: string, message: string, ...args: any[]): string {
    const timestamp = new Date().toISOString();
    return `[${timestamp}] [${level}] ${message}`;
  }

  static debug(message: string, ...args: any[]): void {
    if (this.currentLevel <= LogLevel.DEBUG) {
      console.log(this.formatMessage('DEBUG', message), ...args);
    }
  }

  static info(message: string, ...args: any[]): void {
    if (this.currentLevel <= LogLevel.INFO) {
      console.info(this.formatMessage('INFO', message), ...args);
    }
  }

  static warn(message: string, ...args: any[]): void {
    if (this.currentLevel <= LogLevel.WARN) {
      console.warn(this.formatMessage('WARN', message), ...args);
    }
  }

  static error(message: string, ...args: any[]): void {
    if (this.currentLevel <= LogLevel.ERROR) {
      console.error(this.formatMessage('ERROR', message), ...args);
    }
  }

  static setLevel(level: LogLevel): void {
    this.currentLevel = level;
  }
}

export default Logger;
