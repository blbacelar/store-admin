/**
 * Logging utility for the application
 * Only logs debug and info messages in development mode
 */

const isDev = process.env.NODE_ENV === 'development';

export const logger = {
    /**
     * Debug level logging - only in development
     */
    debug: (...args: unknown[]) => {
        if (isDev) {
            console.log('[DEBUG]', ...args);
        }
    },

    /**
     * Info level logging - only in development
     */
    info: (...args: unknown[]) => {
        if (isDev) {
            console.info('[INFO]', ...args);
        }
    },

    /**
     * Warning level logging - always logged
     */
    warn: (...args: unknown[]) => {
        console.warn('[WARN]', ...args);
    },

    /**
     * Error level logging - always logged
     */
    error: (...args: unknown[]) => {
        console.error('[ERROR]', ...args);
    },
};
