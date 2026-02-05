import { io } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3002';
const socket = io(SOCKET_URL, {
    autoConnect: false,
});

export const notifyStoreService = () => {
    try {
        if (!socket.connected) {
            console.log('Socket not connected, connecting...');
            socket.once('connect', () => {
                console.log('Socket connected, emitting products_updated...');
                socket.emit('products_updated');
            });
            socket.connect();
        } else {
            console.log('Socket already connected, emitting products_updated...');
            socket.emit('products_updated');
        }
    } catch (error) {
        console.error('Failed to notify store service via socket:', error);
    }
};
