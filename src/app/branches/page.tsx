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
import { Trash2, Loader2, ArrowLeft, Plus, Copy, Check, Pencil } from 'lucide-react';
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

    const [editingId, setEditingId] = useState<string | null>(null);
    const [editName, setEditName] = useState('');
    const [editLoading, setEditLoading] = useState(false);

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
        setDeleteLoading(id);
        setError('');
        try {
            const res = await fetch(`/api/branches/${id}`, {
                method: 'DELETE'
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to delete branch');

            // Success
            setBranches(prev => prev.filter(b => b.id !== id));
        } catch (err: any) {
            setError(err.message);
        } finally {
            setDeleteLoading(null);
        }
    };

    const handleCopy = (id: string) => {
        navigator.clipboard.writeText(id);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const startEditing = (branch: Branch) => {
        setEditingId(branch.id);
        setEditName(branch.name);
    };

    const cancelEditing = () => {
        setEditingId(null);
        setEditName('');
    };

    const saveEditing = async (id: string) => {
        if (!editName.trim()) return;
        setEditLoading(true);
        try {
            const res = await fetch(`/api/branches/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: editName })
            });

            if (!res.ok) throw new Error('Failed to update branch');

            setBranches(prev => prev.map(b => b.id === id ? { ...b, name: editName } : b));
            setEditingId(null);
            setEditName('');
        } catch (err: any) {
            setError(err.message || 'Failed to update branch');
        } finally {
            setEditLoading(false);
        }
    };

    return (
        <main className="min-h-screen bg-background text-foreground py-12 px-4 md:px-8">
            <div className="max-w-4xl mx-auto space-y-8">
                <header className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-primary">
                            {activeStore ? `${activeStore.name} - ${t('manage_branches')}` : t('manage_branches')}
                        </h1>
                        <p className="text-muted-foreground">{mounted ? t('manage_branches_sub') : t('loading')}</p>
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
                            placeholder={mounted ? t('new_branch_placeholder') : 'New branch name...'}
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
                                    <TableHead className="w-[150px] text-right">{mounted ? t('actions_label') : 'Actions'}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {branches.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={3} className="text-center text-muted-foreground h-24">
                                            {mounted ? t('no_branches') : 'No branches found.'}
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
                                            <TableCell className="font-medium">
                                                {editingId === branch.id ? (
                                                    <div className="flex gap-2">
                                                        <Input
                                                            value={editName}
                                                            onChange={(e) => setEditName(e.target.value)}
                                                            onKeyDown={(e) => e.key === 'Enter' && saveEditing(branch.id)}
                                                            autoFocus
                                                        />
                                                    </div>
                                                ) : (
                                                    branch.name
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {editingId === branch.id ? (
                                                    <div className="flex justify-end gap-2">
                                                        <Button
                                                            variant="default"
                                                            size="sm"
                                                            onClick={() => saveEditing(branch.id)}
                                                            disabled={editLoading}
                                                        >
                                                            {editLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : t('save')}
                                                        </Button>
                                                        <Button
                                                            variant="secondary"
                                                            size="sm"
                                                            onClick={cancelEditing}
                                                            disabled={editLoading}
                                                        >
                                                            {t('cancel')}
                                                        </Button>
                                                    </div>
                                                ) : (
                                                    <div className="flex justify-end gap-2">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => startEditing(branch)}
                                                        >
                                                            <Pencil className="h-4 w-4" />
                                                        </Button>
                                                        <AlertDialog>
                                                            <AlertDialogTrigger asChild>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="text-muted-foreground hover:text-destructive"
                                                                    disabled={deleteLoading === branch.id}
                                                                >
                                                                    {deleteLoading === branch.id ? (
                                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                                    ) : (
                                                                        <Trash2 className="h-4 w-4" />
                                                                    )}
                                                                </Button>
                                                            </AlertDialogTrigger>
                                                            <AlertDialogContent>
                                                                <AlertDialogHeader>
                                                                    <AlertDialogTitle>{t('delete_branch')}</AlertDialogTitle>
                                                                    <AlertDialogDescription>
                                                                        {t('delete_branch_desc', { name: branch.name })}
                                                                    </AlertDialogDescription>
                                                                </AlertDialogHeader>
                                                                <AlertDialogFooter>
                                                                    <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
                                                                    <AlertDialogAction
                                                                        onClick={() => handleDelete(branch.id)}
                                                                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                                                    >
                                                                        {t('delete')}
                                                                    </AlertDialogAction>
                                                                </AlertDialogFooter>
                                                            </AlertDialogContent>
                                                        </AlertDialog>
                                                    </div>
                                                )}
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
