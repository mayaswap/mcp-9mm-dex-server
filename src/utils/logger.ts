/**
 * Logger utility for 9MM MCP Server
 */

export interface ILogger {
  info(message: string, ...args: any[]): void;
  warn(message: string, ...args: any[]): void;
  error(message: string, ...args: any[]): void;
  debug(message: string, ...args: any[]): void;
}

class SimpleLogger implements ILogger {
  private getTimestamp(): string {
    return new Date().toISOString();
  }

  info(message: string, ...args: any[]): void {
    console.log(`[${this.getTimestamp()}] INFO: ${message}`, ...args);
  }

  warn(message: string, ...args: any[]): void {
    console.warn(`[${this.getTimestamp()}] WARN: ${message}`, ...args);
  }

  error(message: string, ...args: any[]): void {
    console.error(`[${this.getTimestamp()}] ERROR: ${message}`, ...args);
  }

  debug(message: string, ...args: any[]): void {
    if (process.env.NODE_ENV === 'development' || process.env.DEBUG) {
      console.debug(`[${this.getTimestamp()}] DEBUG: ${message}`, ...args);
    }
  }
}

export const logger: ILogger = new SimpleLogger();

/**
 * Logger Utility
 * Winston-based logging system for the MCP EVM DEX server
 */

import winston from 'winston';
import { config } from '../config/environment.js';

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define colors for each level
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'blue',
};

// Tell winston about the colors
winston.addColors(colors);

// Define format for logs
const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`
  )
);

// Define different transports based on environment
const transports: winston.transport[] = [
  // Console transport for all environments
  new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    ),
  }),
];

// Add file transports for production
if (config.nodeEnv === 'production') {
  transports.push(
    // Error log file
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
    }),
    // Combined log file
    new winston.transports.File({
      filename: 'logs/combined.log',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
    })
  );
}

// Create the logger
export const loggerWinston = winston.createLogger({
  level: config.nodeEnv === 'development' ? 'debug' : 'info',
  levels,
  format,
  transports,
  exitOnError: false,
});

// Create a stream object for Morgan HTTP logging
export const morganStream = {
  write: (message: string) => {
    loggerWinston.http(message.trim());
  },
};

/**
 * Log EVM transaction details
 */
export function logEvmTransaction(
  chainId: number,
  txHash: string,
  action: string,
  details?: Record<string, any>
): void {
  loggerWinston.info(`EVM Transaction [Chain: ${chainId}] ${action}: ${txHash}`, {
    chainId,
    txHash,
    action,
    ...details,
  });
}

/**
 * Log EVM error with context
 */
export function logEvmError(
  chainId: number,
  error: Error,
  context?: Record<string, any>
): void {
  loggerWinston.error(`EVM Error [Chain: ${chainId}]: ${error.message}`, {
    chainId,
    error: error.stack,
    ...context,
  });
}

/**
 * Log API call performance
 */
export function logApiCall(
  endpoint: string,
  duration: number,
  status: number,
  details?: Record<string, any>
): void {
  const level = status >= 400 ? 'error' : status >= 300 ? 'warn' : 'info';
  
  loggerWinston.log(level, `API Call ${endpoint} - ${status} (${duration}ms)`, {
    endpoint,
    duration,
    status,
    ...details,
  });
} 