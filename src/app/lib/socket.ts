import { io } from 'socket.io-client';
import { logger } from './logger';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3002';
const socket = io(SOCKET_URL, {
    autoConnect: false,
});

export const notifyStoreService = () => {
    try {
        if (!socket.connected) {
            logger.debug('Socket not connected, connecting...');

            // Add connection timeout
            const timeout = setTimeout(() => {
                logger.warn('Socket connection timeout, continuing without real-time sync');
                socket.off('connect'); // Remove listener
            }, 5000);

            socket.once('connect', () => {
                clearTimeout(timeout);
                logger.debug('Socket connected, emitting products_updated...');
                socket.emit('products_updated');
            });

            socket.once('connect_error', (error) => {
                clearTimeout(timeout);
                logger.error('Socket connection failed:', error);
                // Application continues to work without real-time sync
            });

            socket.connect();
        } else {
            logger.debug('Socket already connected, emitting products_updated...');
            socket.emit('products_updated');
        }
    } catch (error) {
        logger.error('Failed to notify store service via socket:', error);
        // Graceful degradation - app still works without real-time updates
    }
};
