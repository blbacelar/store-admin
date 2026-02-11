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
import { Trash2, Loader2, ArrowLeft, Plus, Pencil } from 'lucide-react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/navigation';
import { useBranch } from '@/context/BranchContext';
import NavBar from '../components/NavBar';
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

interface Category {
    id: string;
    name: string;
    _count?: {
        products: number;
    };
}

export default function CategoriesPage() {
    const { t } = useTranslation();
    const router = useRouter();
    const { branches, selectedBranchId, setSelectedBranchId, fetchBranches } = useBranch();
    const [categories, setCategories] = useState<Category[]>([]);
    const [activeStore, setActiveStore] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [newCategory, setNewCategory] = useState('');
    const [addLoading, setAddLoading] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
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

    // Watch for selectedBranchId changes from context
    useEffect(() => {
        if (selectedBranchId && activeStore) {
            fetchCategories(activeStore.id, selectedBranchId);
        }
    }, [selectedBranchId, activeStore]); // Added activeStore to dependencies

    const fetchCategories = async (storeId?: string, branchId?: string) => {
        const id = storeId || activeStore?.id;
        const branch = branchId || selectedBranchId;
        if (!id) return;

        try {
            setLoading(true);
            let url = `/api/categories?storeId=${id}`;
            if (branch) {
                url += `&branchId=${branch}`;
            }
            const res = await fetch(url);
            if (!res.ok) throw new Error('Failed to fetch categories');
            const data = await res.json();
            setCategories(data);
        } catch (err) {
            setError(t('fetch_error'));
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = async () => {
        if (!newCategory.trim() || !activeStore || !selectedBranchId) return;
        setAddLoading(true);
        setError('');
        try {
            const res = await fetch('/api/categories', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: newCategory,
                    storeId: activeStore.id,
                    branchId: selectedBranchId
                })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to add category');

            setNewCategory('');
            fetchCategories(); // Refresh list
        } catch (err: any) {
            setError(err.message);
        } finally {
            setAddLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        // No confirm here, handled by UI component
        setDeleteLoading(id);
        setError('');
        try {
            const res = await fetch(`/api/categories/${id}`, {
                method: 'DELETE'
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to delete category');

            // Success
            setCategories(prev => prev.filter(c => c.id !== id));
        } catch (err: any) {
            setError(err.message);
        } finally {
            setDeleteLoading(null);
        }
    };

    const startEditing = (category: Category) => {
        setEditingId(category.id);
        setEditName(category.name);
    };

    const cancelEditing = () => {
        setEditingId(null);
        setEditName('');
    };

    const saveEditing = async (id: string) => {
        if (!editName.trim()) return;
        setEditLoading(true);
        try {
            const res = await fetch(`/api/categories/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: editName })
            });

            if (!res.ok) throw new Error('Failed to update category');

            setCategories(prev => prev.map(c => c.id === id ? { ...c, name: editName } : c));
            setEditingId(null);
            setEditName('');
        } catch (err: any) {
            setError(err.message || 'Failed to update category');
        } finally {
            setEditLoading(false);
        }
    };


    return (
        <>
            <NavBar />
            <main className="min-h-screen bg-background text-foreground py-12 px-4 md:px-8">
                <div className="max-w-4xl mx-auto space-y-8">
                    <header className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-primary">
                                {activeStore ? `${activeStore.name} - ${t('categories')}` : (mounted ? t('manage_categories') : 'Manage Categories')}
                            </h1>
                            <p className="text-muted-foreground">{mounted ? t('manage_categories_sub') : 'Add or remove product categories'}</p>
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
                                placeholder={mounted ? t('new_category_placeholder') : 'New category name...'}
                                value={newCategory}
                                onChange={(e) => setNewCategory(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                            />
                            <Button onClick={handleAdd} disabled={addLoading || !newCategory.trim()}>
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
                                        <TableHead>{mounted ? t('name_label') : 'Name'}</TableHead>
                                        <TableHead className="w-[150px] text-right">{mounted ? t('actions_label') : 'Actions'}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {categories.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={2} className="text-center text-muted-foreground h-24">
                                                {mounted ? t('no_categories') : 'No categories found.'}
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        categories.map((cat) => (
                                            <TableRow key={cat.id}>
                                                <TableCell className="font-medium">
                                                    {editingId === cat.id ? (
                                                        <div className="flex gap-2">
                                                            <Input
                                                                value={editName}
                                                                onChange={(e) => setEditName(e.target.value)}
                                                                onKeyDown={(e) => e.key === 'Enter' && saveEditing(cat.id)}
                                                                autoFocus
                                                            />
                                                        </div>
                                                    ) : (
                                                        cat.name
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    {editingId === cat.id ? (
                                                        <div className="flex justify-end gap-2">
                                                            <Button
                                                                variant="default"
                                                                size="sm"
                                                                onClick={() => saveEditing(cat.id)}
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
                                                                onClick={() => startEditing(cat)}
                                                            >
                                                                <Pencil className="h-4 w-4" />
                                                            </Button>
                                                            <AlertDialog>
                                                                <AlertDialogTrigger asChild>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        className="text-muted-foreground hover:text-destructive"
                                                                        disabled={deleteLoading === cat.id}
                                                                    >
                                                                        {deleteLoading === cat.id ? (
                                                                            <Loader2 className="h-4 w-4 animate-spin" />
                                                                        ) : (
                                                                            <Trash2 className="h-4 w-4" />
                                                                        )}
                                                                    </Button>
                                                                </AlertDialogTrigger>
                                                                <AlertDialogContent>
                                                                    <AlertDialogHeader>
                                                                        <AlertDialogTitle>{t('delete_category')}</AlertDialogTitle>
                                                                        <AlertDialogDescription>
                                                                            {t('delete_category_desc', { name: cat.name })}
                                                                        </AlertDialogDescription>
                                                                    </AlertDialogHeader>
                                                                    <AlertDialogFooter>
                                                                        <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
                                                                        <AlertDialogAction
                                                                            onClick={() => handleDelete(cat.id)}
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
        </>
    );
}
