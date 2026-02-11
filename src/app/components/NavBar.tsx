'use client';

import BranchSelector from './BranchSelector';
import ThemeToggle from './ThemeToggle';
import LanguageToggle from './LanguageToggle';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';
import { signOut } from 'next-auth/react';
import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';

export default function NavBar() {
    const { t } = useTranslation();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    return (
        <nav className="border-b bg-card">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    <div className="flex items-center gap-4">
                        <BranchSelector />
                    </div>
                    <div className="flex items-center gap-2">
                        <ThemeToggle />
                        <LanguageToggle />
                        <Button
                            variant="outline"
                            size="sm"
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
