/**
 * Enhanced environment variable validation utility
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
        'NEXT_PUBLIC_SOCKET_URL',
        'BRAZIL_BRANCH_ID',
        'USA_BRANCH_ID'
    ];

    const missingRecommended = recommended.filter(key => !process.env[key]);

    if (missingRecommended.length > 0) {
        console.warn(
            `Warning: Missing recommended environment variables:\n${missingRecommended.join('\n')}`
        );
    }

    // Validate URL formats
    try {
        new URL(process.env.NEXTAUTH_URL!);
    } catch {
        throw new Error('NEXTAUTH_URL must be a valid URL');
    }

    // Validate MongoDB connection string
    if (!process.env.DATABASE_URL!.startsWith('mongodb')) {
        throw new Error('DATABASE_URL must be a valid MongoDB connection string');
    }

    console.log('✓ Environment variables validated successfully');
}

/**
 * Call this function at the root of your application
 * Only runs on server-side
 */
export function initializeEnv() {
    if (typeof window === 'undefined') {
        validateEnv();
    }
}
