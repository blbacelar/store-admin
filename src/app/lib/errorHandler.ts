/**
 * Centralized error handler for API routes
 */

import { NextResponse } from 'next/server';
import { AppError } from './errors';
import { logger } from './logger';

/**
 * Handle errors in API routes consistently
 */
export function handleApiError(error: unknown): NextResponse {
    logger.error('API Error:', error);

    // Handle custom AppError instances
    if (error instanceof AppError) {
        const responseBody: Record<string, unknown> = {
            error: error.message,
        };

        if (error.code) {
            responseBody.code = error.code;
        }

        if (error.details) {
            responseBody.details = error.details;
        }

        return NextResponse.json(responseBody, { status: error.statusCode });
    }

    // Handle Prisma errors
    if (error && typeof error === 'object' && 'code' in error) {
        const prismaError = error as { code: string; meta?: unknown };

        // Common Prisma error codes
        switch (prismaError.code) {
            case 'P2002':
                return NextResponse.json(
                    { error: 'A record with this value already exists', code: 'DUPLICATE_ENTRY' },
                    { status: 409 }
                );
            case 'P2025':
                return NextResponse.json(
                    { error: 'Record not found', code: 'NOT_FOUND' },
                    { status: 404 }
                );
            case 'P2003':
                return NextResponse.json(
                    { error: 'Foreign key constraint failed', code: 'CONSTRAINT_FAILED' },
                    { status: 400 }
                );
        }
    }

    // Don't leak internal errors in production
    const isDev = process.env.NODE_ENV === 'development';
    return NextResponse.json(
        {
            error: isDev && error instanceof Error ? error.message : 'An unexpected error occurred',
            code: 'INTERNAL_ERROR',
        },
        { status: 500 }
    );
}
