
import { logger } from './logger';

export function isEmailAllowed(email: string | null | undefined): boolean {
    if (!email) {
        return false;
    }

    const allowedEmailsEnv = process.env.ALLOWED_EMAILS;

    // If ALLOWED_EMAILS is not set or empty, NO ONE is allowed.
    // This is safer than failing open (allowing everyone).
    if (!allowedEmailsEnv || allowedEmailsEnv.trim() === '') {
        logger.warn('ALLOWED_EMAILS environment variable is not set or empty. All registrations/logins will be blocked.');
        return false;
    }

    const allowedEmails = allowedEmailsEnv.split(',').map(e => e.trim().toLowerCase());
    const normalizedEmail = email.trim().toLowerCase();

    const isAllowed = allowedEmails.includes(normalizedEmail);

    if (!isAllowed) {
        logger.warn(`Access denied for email: ${email}`);
    }

    return isAllowed;
}
