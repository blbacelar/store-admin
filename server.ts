import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { Server } from 'socket.io';
import { initializeEnv } from './src/app/lib/env';

// Validate environment variables before starting
initializeEnv();

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = 3002;

// Initialize Next.js app
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
    const server = createServer(async (req, res) => {
        try {
            // Be sure to pass `true` as the second argument to `url.parse`.
            // This tells it to parse the query portion of the URL.
            const parsedUrl = parse(req.url!, true);

            // Let Next.js handle the request
            await handle(req, res, parsedUrl);
        } catch (err) {
            console.error('Error occurred handling', req.url, err);
            res.statusCode = 500;
            res.end('internal server error');
        }
    });

    // Initialize Socket.IO
    const io = new Server(server, {
        cors: {
            origin: process.env.NODE_ENV === 'production'
                ? [process.env.NEXT_PUBLIC_APP_URL || 'https://yourdomain.com']
                : ["http://localhost:3000", "http://localhost:3002", "http://localhost:3005"],
            methods: ["GET", "POST"],
            credentials: true
        }
    });

    io.on('connection', (socket) => {
        console.log('Client connected to socket:', socket.id);

        // Listen for products_updated event
        socket.on('products_updated', () => {
            console.log('Products updated! Broadcasting refresh...');
            io.emit('refresh_products');
        });

        socket.on('disconnect', () => {
            console.log('Client disconnected:', socket.id);
        });
    });

    server.listen(port, () => {
        console.log(`> Ready on http://${hostname}:${port}`);
        console.log(`> Socket.IO server running on port ${port}`);
    });
});
