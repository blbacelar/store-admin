'use client';
import { useTranslation } from 'react-i18next';
import { BrazilFlag, USAFlag } from './Flags';
import { useState, useEffect } from 'react';

export default function LanguageToggle() {
    const { i18n } = useTranslation();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Helper to determine active language classes safely
    const getButtonClass = (lang: string) => {
        const isActive = mounted && i18n.language.startsWith(lang);
        // Default to English being "active" on server to match SSR if needed, 
        // but 'opacity-40' for both on server is safest to avoid mismatch.
        if (!mounted) return 'opacity-40 hover:opacity-100';

        return isActive
            ? 'bg-background shadow-sm scale-110 ring-2 ring-primary/10'
            : 'opacity-40 hover:opacity-100';
    };

    return (
        <div className="fixed top-4 right-16 z-50 flex bg-muted/50 backdrop-blur-sm p-1 rounded-full border border-border shadow-sm">
            <button
                onClick={() => i18n.changeLanguage('pt')}
                className={`w-9 h-9 flex items-center justify-center rounded-full transition-all ${getButtonClass('pt')}`}
                title="Português"
            >
                <BrazilFlag className="w-6 h-6" />
            </button>
            <button
                onClick={() => i18n.changeLanguage('en')}
                className={`w-9 h-9 flex items-center justify-center rounded-full transition-all ${getButtonClass('en')}`}
                title="English"
            >
                <USAFlag className="w-6 h-6" />
            </button>
        </div>
    );
}
