'use client';

import { useBranch } from '@/context/BranchContext';
import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';

export default function BranchSelector() {
    const { branches, selectedBranchId, setSelectedBranchId } = useBranch();
    const { t } = useTranslation();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (branches.length === 0) return null;

    return (
        <div className="flex items-center gap-2">
            <label htmlFor="nav-branch-select" className="text-sm font-medium text-muted-foreground">
                {mounted ? t('branch_label') : 'Branch'}:
            </label>
            <select
                id="nav-branch-select"
                value={selectedBranchId}
                onChange={(e) => setSelectedBranchId(e.target.value)}
                className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
                {branches.map((branch) => (
                    <option key={branch.id} value={branch.id}>
                        {branch.name}
                    </option>
                ))}
            </select>
        </div>
    );
}
