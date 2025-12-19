/**
 * Structured logging utility for the Mandarin SRS platform
 *
 * Provides environment-aware logging that:
 * - Outputs structured JSON in production for log aggregation
 * - Outputs readable console format in development
 * - Supports log levels (debug, info, warn, error)
 * - Includes context metadata for debugging
 *
 * Dependencies: none
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogContext {
  [key: string]: unknown
}

interface LogEntry {
  level: LogLevel
  message: string
  timestamp: string
  context?: LogContext
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
}

/**
 * Get the minimum log level based on environment
 * In production, only warn and error are logged
 * In development, all levels are logged
 */
function getMinLogLevel(): LogLevel {
  if (process.env.NODE_ENV === 'production') {
    return 'warn'
  }
  return 'debug'
}

/**
 * Check if a log level should be output
 */
function shouldLog(level: LogLevel): boolean {
  const minLevel = getMinLogLevel()
  return LOG_LEVELS[level] >= LOG_LEVELS[minLevel]
}

/**
 * Format log entry for output
 */
function formatLogEntry(entry: LogEntry): string {
  if (process.env.NODE_ENV === 'production') {
    // JSON format for production log aggregation
    return JSON.stringify(entry)
  }

  // Readable format for development
  const contextStr = entry.context ? ` ${JSON.stringify(entry.context)}` : ''
  return `[${entry.level.toUpperCase()}] ${entry.message}${contextStr}`
}

/**
 * Create a log entry and output it
 */
function log(level: LogLevel, message: string, context?: LogContext): void {
  if (!shouldLog(level)) {
    return
  }

  const entry: LogEntry = {
    level,
    message,
    timestamp: new Date().toISOString(),
    context,
  }

  const formatted = formatLogEntry(entry)

  switch (level) {
    case 'debug':
    case 'info':
      // eslint-disable-next-line no-console
      console.log(formatted)
      break
    case 'warn':
      // eslint-disable-next-line no-console
      console.warn(formatted)
      break
    case 'error':
      // eslint-disable-next-line no-console
      console.error(formatted)
      break
  }
}

/**
 * Logger instance with methods for each log level
 *
 * @example
 * ```ts
 * import { logger } from '@/lib/utils/logger';
 *
 * logger.info('User logged in', { userId: '123' });
 * logger.error('Failed to fetch data', { error: err.message, endpoint: '/api/data' });
 * ```
 */
export const logger = {
  /**
   * Log debug information (development only)
   * @param message - Log message
   * @param context - Optional context metadata
   */
  debug: (message: string, context?: LogContext): void => {
    log('debug', message, context)
  },

  /**
   * Log informational messages (development only)
   * @param message - Log message
   * @param context - Optional context metadata
   */
  info: (message: string, context?: LogContext): void => {
    log('info', message, context)
  },

  /**
   * Log warning messages (always logged)
   * @param message - Log message
   * @param context - Optional context metadata
   */
  warn: (message: string, context?: LogContext): void => {
    log('warn', message, context)
  },

  /**
   * Log error messages (always logged)
   * @param message - Log message
   * @param context - Optional context metadata
   */
  error: (message: string, context?: LogContext): void => {
    log('error', message, context)
  },
}
