'use client';

import BranchSelector from './BranchSelector';
import ThemeToggle from './ThemeToggle';
import LanguageToggle from './LanguageToggle';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';
import { signOut } from 'next-auth/react';
import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';

export default function NavBar() {
    const { t } = useTranslation();
    const [mounted, setMounted] = useState(false);
    const pathname = usePathname();

    useEffect(() => {
        setMounted(true);
    }, []);

    const hiddenRoutes = ['/login', '/register'];
    if (hiddenRoutes.includes(pathname)) {
        return null;
    }

    return (
        <nav className="border-b bg-card">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex min-h-16 flex-col gap-3 py-3 sm:h-16 sm:flex-row sm:items-center sm:justify-between sm:py-0">
                    <div className="flex min-w-0 items-center gap-4">
                        <BranchSelector />
                    </div>
                    <div className="flex w-full flex-wrap items-center justify-end gap-2 sm:w-auto sm:flex-nowrap">
                        <ThemeToggle />
                        <LanguageToggle />
                        <Button
                            variant="outline"
                            size="sm"
                            className="shrink-0"
                            onClick={() => signOut({ callbackUrl: '/login' })}
                        >
                            <LogOut className="mr-2 h-4 w-4" />
                            {mounted ? t('sign_out') : 'Sign Out'}
                        </Button>
                    </div>
                </div>
            </div>
        </nav>
    );
}
