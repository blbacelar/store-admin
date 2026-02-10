'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Trash2, Loader2, ArrowLeft, Plus, Copy, Check } from 'lucide-react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/navigation';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface Branch {
    id: string;
    name: string;
}

export default function BranchesPage() {
    const { t } = useTranslation();
    const router = useRouter();
    const [branches, setBranches] = useState<Branch[]>([]);
    const [activeStore, setActiveStore] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [newBranch, setNewBranch] = useState('');
    const [addLoading, setAddLoading] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        checkStores();
    }, []);

    const checkStores = async () => {
        try {
            const res = await fetch('/api/stores');
            const data = await res.json();

            if (Array.isArray(data) && data.length > 0) {
                setActiveStore(data[0]);
                fetchBranches(data[0].id);
            } else {
                router.push('/setup-store');
            }
        } catch (error) {
            console.error('Failed to check stores', error);
            setLoading(false);
        }
    };

    const fetchBranches = async (storeId?: string) => {
        const id = storeId || activeStore?.id;
        if (!id) return;

        try {
            setLoading(true);
            const res = await fetch(`/api/branches?storeId=${id}`);
            if (!res.ok) throw new Error('Failed to fetch branches');
            const data = await res.json();
            setBranches(data);
        } catch (err) {
            setError(t('fetch_error') || 'Failed to fetch data');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = async () => {
        if (!newBranch.trim() || !activeStore) return;
        setAddLoading(true);
        setError('');
        try {
            const res = await fetch('/api/branches', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newBranch, storeId: activeStore.id })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to add branch');

            setNewBranch('');
            fetchBranches(); // Refresh list
        } catch (err: any) {
            setError(err.message);
        } finally {
            setAddLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        // Placeholder for delete functionality if we add it to API later
        // For now, API only has GET and POST based on previous step
        // I will add Client-side optimism or just alert not implemented if API is missing DELETE
        // Note: I implemented GET and POST in route.ts. DELETE is missing in route.ts. 
        // I'll skip DELETE implementation in UI for now or add it to API.
        // Let's add DELETE to API in a subsequent step if critical, but user didn't explicitly ask for Delete.
        // I'll leave the button but make it do nothing or show "Not implemented"
        alert("Delete not implemented yet");
    };

    const handleCopy = (id: string) => {
        navigator.clipboard.writeText(id);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    return (
        <main className="min-h-screen bg-background text-foreground py-12 px-4 md:px-8">
            <div className="max-w-4xl mx-auto space-y-8">
                <header className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-primary">
                            {activeStore ? `${activeStore.name} - Branches` : 'Manage Branches'}
                        </h1>
                        <p className="text-muted-foreground">{mounted ? 'Add or remove store branches' : 'Loading...'}</p>
                    </div>
                    <Link href="/">
                        <Button variant="outline">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            {mounted ? t('back_dashboard') : 'Back to Dashboard'}
                        </Button>
                    </Link>
                </header>

                <div className="bg-card rounded-lg border shadow-sm p-6">
                    <div className="flex gap-4 mb-8">
                        <Input
                            placeholder={mounted ? 'New branch name...' : 'New branch name...'}
                            value={newBranch}
                            onChange={(e) => setNewBranch(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                        />
                        <Button onClick={handleAdd} disabled={addLoading || !newBranch.trim()}>
                            {addLoading ? <Loader2 className="animate-spin h-4 w-4" /> : <Plus className="h-4 w-4 mr-2" />}
                            {mounted ? t('add') : 'Add'}
                        </Button>
                    </div>

                    {error && (
                        <div className="bg-destructive/15 text-destructive px-4 py-3 rounded-md mb-6 font-medium border border-destructive/20">
                            {error}
                        </div>
                    )}

                    {loading ? (
                        <div className="flex justify-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>ID</TableHead>
                                    <TableHead>{mounted ? t('name_label') : 'Name'}</TableHead>
                                    <TableHead className="w-[100px] text-right">{mounted ? t('actions_label') : 'Actions'}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {branches.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={2} className="text-center text-muted-foreground h-24">
                                            {mounted ? 'No branches found.' : 'No branches found.'}
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    branches.map((branch) => (
                                        <TableRow key={branch.id}>
                                            <TableCell className="font-mono text-xs">
                                                <div className="flex items-center gap-2">
                                                    {branch.id}
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-6 w-6"
                                                        onClick={() => handleCopy(branch.id)}
                                                        title="Copy ID"
                                                    >
                                                        {copiedId === branch.id ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                                                    </Button>
                                                </div>
                                            </TableCell>
                                            <TableCell className="font-medium">{branch.name}</TableCell>
                                            <TableCell className="text-right">
                                                {/* 
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="text-muted-foreground hover:text-destructive"
                                                    onClick={() => handleDelete(branch.id)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                                */}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    )}
                </div>
            </div>
        </main>
    );
}
