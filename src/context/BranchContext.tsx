'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface Branch {
    id: string;
    name: string;
}

interface BranchContextType {
    branches: Branch[];
    selectedBranchId: string;
    setSelectedBranchId: (id: string) => void;
    fetchBranches: (storeId: string) => Promise<void>;
}

const BranchContext = createContext<BranchContextType | undefined>(undefined);

export function BranchProvider({ children }: { children: ReactNode }) {
    const [branches, setBranches] = useState<Branch[]>([]);
    const [selectedBranchId, setSelectedBranchId] = useState<string>('');

    const fetchBranches = async (storeId: string) => {
        try {
            const res = await fetch(`/api/branches?storeId=${storeId}`);
            if (res.ok) {
                const data = await res.json();
                setBranches(data);
                if (data.length > 0) {
                    // Try to restore previously selected branch from localStorage
                    const savedBranchId = localStorage.getItem('selectedBranchId');
                    const branchExists = savedBranchId && data.some((b: Branch) => b.id === savedBranchId);

                    const firstBranchId = branchExists ? savedBranchId : data[0].id;
                    setSelectedBranchId(firstBranchId);
                }
            }
        } catch (error) {
            console.error('Failed to fetch branches', error);
        }
    };

    const handleSetSelectedBranchId = (id: string) => {
        setSelectedBranchId(id);
        localStorage.setItem('selectedBranchId', id);
    };

    return (
        <BranchContext.Provider value={{
            branches,
            selectedBranchId,
            setSelectedBranchId: handleSetSelectedBranchId,
            fetchBranches
        }}>
            {children}
        </BranchContext.Provider>
    );
}

export function useBranch() {
    const context = useContext(BranchContext);
    if (context === undefined) {
        throw new Error('useBranch must be used within a BranchProvider');
    }
    return context;
}
