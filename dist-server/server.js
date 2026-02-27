"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const http_1 = require("http");
const url_1 = require("url");
const next_1 = __importDefault(require("next"));
const socket_io_1 = require("socket.io");
const env_1 = require("./src/app/lib/env");
// Validate environment variables before starting
(0, env_1.initializeEnv)();
const dev = process.env.NODE_ENV !== 'production';
const hostname = '0.0.0.0';
const port = Number(process.env.PORT) || 3005;
// Initialize Next.js app
const app = (0, next_1.default)({ dev, hostname, port });
const handle = app.getRequestHandler();
app.prepare().then(() => {
    const server = (0, http_1.createServer)(async (req, res) => {
        try {
            // Be sure to pass `true` as the second argument to `url.parse`.
            // This tells it to parse the query portion of the URL.
            const parsedUrl = (0, url_1.parse)(req.url, true);
            // Let Next.js handle the request
            await handle(req, res, parsedUrl);
        }
        catch (err) {
            console.error('Error occurred handling', req.url, err);
            res.statusCode = 500;
            res.end('internal server error');
        }
    });
    // Initialize Socket.IO
    const io = new socket_io_1.Server(server, {
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
