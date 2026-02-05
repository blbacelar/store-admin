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
import { Trash2, Loader2, ArrowLeft, Plus } from 'lucide-react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
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
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [newCategory, setNewCategory] = useState('');
    const [addLoading, setAddLoading] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState<string | null>(null);

    const fetchCategories = async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/categories');
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

    useEffect(() => {
        fetchCategories();
    }, []);

    const handleAdd = async () => {
        if (!newCategory.trim()) return;
        setAddLoading(true);
        setError('');
        try {
            const res = await fetch('/api/categories', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newCategory })
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

    return (
        <main className="min-h-screen bg-background text-foreground py-12 px-4 md:px-8">
            <div className="max-w-4xl mx-auto space-y-8">
                <header className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-primary">{t('manage_categories')}</h1>
                        <p className="text-muted-foreground">{t('manage_categories_sub')}</p>
                    </div>
                    <Link href="/">
                        <Button variant="outline">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            {t('back_dashboard')}
                        </Button>
                    </Link>
                </header>

                <div className="bg-card rounded-lg border shadow-sm p-6">
                    <div className="flex gap-4 mb-8">
                        <Input
                            placeholder={t('new_category_placeholder')}
                            value={newCategory}
                            onChange={(e) => setNewCategory(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                        />
                        <Button onClick={handleAdd} disabled={addLoading || !newCategory.trim()}>
                            {addLoading ? <Loader2 className="animate-spin h-4 w-4" /> : <Plus className="h-4 w-4 mr-2" />}
                            {t('add')}
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
                                    <TableHead>{t('name_label')}</TableHead>
                                    <TableHead className="w-[100px] text-right">{t('actions_label')}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {categories.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={2} className="text-center text-muted-foreground h-24">
                                            {t('no_categories')}
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    categories.map((cat) => (
                                        <TableRow key={cat.id}>
                                            <TableCell className="font-medium">{cat.name}</TableCell>
                                            <TableCell className="text-right">
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
