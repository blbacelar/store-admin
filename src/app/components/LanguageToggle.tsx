'use client';
import { useTranslation } from 'react-i18next';
import { BrazilFlag, USAFlag } from './Flags';

export default function LanguageToggle() {
    const { i18n, t } = useTranslation();

    return (
        <div className="fixed top-4 right-16 z-50 flex bg-muted/50 backdrop-blur-sm p-1 rounded-full border border-border shadow-sm">
            <button
                onClick={() => i18n.changeLanguage('pt')}
                className={`w-9 h-9 flex items-center justify-center rounded-full transition-all ${i18n.language.startsWith('pt') ? 'bg-background shadow-sm scale-110 ring-2 ring-primary/10' : 'opacity-40 hover:opacity-100'}`}
                title="Português"
            >
                <BrazilFlag className="w-6 h-6" />
            </button>
            <button
                onClick={() => i18n.changeLanguage('en')}
                className={`w-9 h-9 flex items-center justify-center rounded-full transition-all ${i18n.language.startsWith('en') ? 'bg-background shadow-sm scale-110 ring-2 ring-primary/10' : 'opacity-40 hover:opacity-100'}`}
                title="English"
            >
                <USAFlag className="w-6 h-6" />
            </button>
        </div>
    );
}
