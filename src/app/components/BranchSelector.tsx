'use client';

import { useBranch } from '@/context/BranchContext';
import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

export default function BranchSelector() {
    const { branches, selectedBranchId, setSelectedBranchId } = useBranch();
    const { t } = useTranslation();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (branches.length === 0) return null;

    return (
        <div className="flex items-center gap-3">
            <Label htmlFor="nav-branch-select" className="text-sm font-medium text-muted-foreground whitespace-nowrap">
                {mounted ? t('branch_label') : 'Branch'}:
            </Label>
            <Select value={selectedBranchId} onValueChange={setSelectedBranchId}>
                <SelectTrigger id="nav-branch-select" className="w-[180px] h-9">
                    <SelectValue placeholder={mounted ? t('select_branch') : 'Select branch'} />
                </SelectTrigger>
                <SelectContent>
                    {branches.map((branch) => (
                        <SelectItem key={branch.id} value={branch.id}>
                            {branch.name}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
}
