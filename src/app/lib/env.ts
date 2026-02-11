/**
 * Environment variable validation utility
 * Call this at application startup to ensure all required environment variables are set
 */

export function validateEnv() {
    const required = [
        'DATABASE_URL',
        'NEXTAUTH_SECRET',
        'NEXTAUTH_URL',
        'GOOGLE_CLIENT_ID',
        'GOOGLE_CLIENT_SECRET'
    ];

    const missing = required.filter(key => !process.env[key]);

    if (missing.length > 0) {
        throw new Error(
            `Missing required environment variables:\n${missing.join('\n')}\n\nPlease check your .env file.`
        );
    }

    // Warn about optional but recommended variables
    const recommended = [
        'NEXT_PUBLIC_APP_URL',
        'NEXT_PUBLIC_SOCKET_URL'
    ];

    const missingRecommended = recommended.filter(key => !process.env[key]);

    if (missingRecommended.length > 0) {
        console.warn(
            `Warning: Missing recommended environment variables:\n${missingRecommended.join('\n')}`
        );
    }
}
