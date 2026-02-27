"use strict";
/**
 * Enhanced environment variable validation utility
 * Call this at application startup to ensure all required environment variables are set
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateEnv = validateEnv;
exports.initializeEnv = initializeEnv;
function validateEnv() {
    const required = [
        'DATABASE_URL',
        'NEXTAUTH_SECRET',
        'NEXTAUTH_URL',
        'GOOGLE_CLIENT_ID',
        'GOOGLE_CLIENT_SECRET'
    ];
    const missing = required.filter(key => !process.env[key]);
    if (missing.length > 0) {
        throw new Error(`Missing required environment variables:\n${missing.join('\n')}\n\nPlease check your .env file.`);
    }
    // Warn about optional but recommended variables
    const recommended = [
    // Add backend-specific recommended variables here if needed
    ];
    const missingRecommended = recommended.filter(key => !process.env[key]);
    if (missingRecommended.length > 0) {
        console.warn(`Warning: Missing recommended environment variables:\n${missingRecommended.join('\n')}`);
    }
    // Validate URL formats
    try {
        new URL(process.env.NEXTAUTH_URL);
    }
    catch (_a) {
        throw new Error('NEXTAUTH_URL must be a valid URL');
    }
    // Validate MongoDB connection string
    if (!process.env.DATABASE_URL.startsWith('mongodb')) {
        throw new Error('DATABASE_URL must be a valid MongoDB connection string');
    }
    console.log('✓ Environment variables validated successfully');
}
/**
 * Call this function at the root of your application
 * Only runs on server-side
 */
function initializeEnv() {
    if (typeof window === 'undefined') {
        validateEnv();
    }
}
