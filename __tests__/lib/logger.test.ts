import Logger from '../../lib/logger';

describe('Logger', () => {
  const originalConsoleLog = console.log;
  const originalConsoleInfo = console.info;
  const originalConsoleWarn = console.warn;
  const originalConsoleError = console.error;

  beforeEach(() => {
    console.log = jest.fn();
    console.info = jest.fn();
    console.warn = jest.fn();
    console.error = jest.fn();
    Logger.setLevel(Logger.LogLevel.DEBUG);
  });

  afterEach(() => {
    console.log = originalConsoleLog;
    console.info = originalConsoleInfo;
    console.warn = originalConsoleWarn;
    console.error = originalConsoleError;
  });

  describe('debug', () => {
    it('should log debug messages when level is DEBUG', () => {
      Logger.debug('test message', { data: 'test' });
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('[DEBUG] test message'),
        { data: 'test' }
      );
    });

    it('should not log debug messages when level is INFO', () => {
      Logger.setLevel(Logger.LogLevel.INFO);
      Logger.debug('test message');
      expect(console.log).not.toHaveBeenCalled();
    });
  });

  describe('info', () => {
    it('should log info messages when level is INFO', () => {
      Logger.info('test message');
      expect(console.info).toHaveBeenCalledWith(
        expect.stringContaining('[INFO] test message')
      );
    });

    it('should not log info messages when level is WARN', () => {
      Logger.setLevel(Logger.LogLevel.WARN);
      Logger.info('test message');
      expect(console.info).not.toHaveBeenCalled();
    });
  });

  describe('warn', () => {
    it('should log warning messages when level is WARN', () => {
      Logger.warn('test message');
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('[WARN] test message')
      );
    });

    it('should not log warning messages when level is ERROR', () => {
      Logger.setLevel(Logger.LogLevel.ERROR);
      Logger.warn('test message');
      expect(console.warn).not.toHaveBeenCalled();
    });
  });

  describe('error', () => {
    it('should always log error messages', () => {
      Logger.setLevel(Logger.LogLevel.NONE);
      Logger.error('test message');
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('[ERROR] test message')
      );
    });
  });
});
