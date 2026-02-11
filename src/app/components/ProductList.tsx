'use client';
import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
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
import { Trash2, Edit, EyeOff, Eye, ChevronLeft, ChevronRight, Search } from 'lucide-react';

interface Product {
    id: string;
    sheetId: string;
    title: string;
    price: string;
    category: string;
    image: string;
    url: string;
    archived: boolean;
}

interface ProductListProps {
    products: Product[];
    onDelete: (id: string) => void;
    onRefresh: () => void;
}

export default function ProductList({ products, onDelete, onRefresh }: ProductListProps) {
    const { t } = useTranslation();
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'archived'>('active');
    const [filterCategory, setFilterCategory] = useState<string>('all');
    const [localProducts, setLocalProducts] = useState<Product[]>(products);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [productToDelete, setProductToDelete] = useState<Product | null>(null);
    const [mounted, setMounted] = useState(false);
    const itemsPerPage = 10;

    // Sync local products with props and set mounted
    React.useEffect(() => {
        setMounted(true);
        setLocalProducts(products);
    }, [products]);

    // Get unique categories
    const categories = useMemo(() => {
        const uniqueCategories = Array.from(new Set(localProducts.map(p => p.category)));
        return uniqueCategories.sort();
    }, [localProducts]);

    // Filter products based on search query, status, and category
    const filteredProducts = useMemo(() => {
        let result = localProducts;

        // Status Filter
        if (filterStatus === 'active') {
            result = result.filter(p => !p.archived);
        } else if (filterStatus === 'archived') {
            result = result.filter(p => p.archived);
        }

        // Category Filter
        if (filterCategory !== 'all') {
            result = result.filter(p => p.category === filterCategory);
        }

        // Search Filter
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            result = result.filter(p =>
                p.title.toLowerCase().includes(query) ||
                p.category.toLowerCase().includes(query) ||
                p.sheetId.toLowerCase().includes(query)
            );
        }

        return result;
    }, [localProducts, searchQuery, filterStatus, filterCategory]);

    // Pagination
    const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
    const paginatedProducts = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filteredProducts.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredProducts, currentPage]);

    // Reset to page 1 when search changes
    React.useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery]);

    const handleArchive = async (id: string, currentArchived: boolean) => {
        const newArchivedState = !currentArchived;

        // Optimistic update - update UI immediately
        setLocalProducts(prevProducts =>
            prevProducts.map(p =>
                p.id === id ? { ...p, archived: newArchivedState } : p
            )
        );

        // Archive in background
        try {
            const res = await fetch(`/api/products/${id}/archive`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ archived: newArchivedState })
            });

            if (!res.ok) {
                throw new Error('Failed to archive product');
            }

            // Silently refresh in background to ensure sync
            setTimeout(() => onRefresh(), 1000);
        } catch (error) {
            console.error('Archive error:', error);
            // Revert the optimistic update on error
            setLocalProducts(prevProducts =>
                prevProducts.map(p =>
                    p.id === id ? { ...p, archived: currentArchived } : p
                )
            );
            toast.error(t('archive_error') || 'Failed to update archive status');
        }
    };

    const handleDeleteClick = (product: Product) => {
        setProductToDelete(product);
        setDeleteDialogOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!productToDelete) return;

        const deletedProduct = productToDelete;

        // Close dialog and clear state
        setDeleteDialogOpen(false);
        setProductToDelete(null);

        // Optimistic update - remove from UI immediately
        setLocalProducts(prevProducts =>
            prevProducts.filter(p => p.id !== deletedProduct.id)
        );

        // Delete in background
        try {
            const res = await fetch(`/api/products?id=${deletedProduct.id}`, {
                method: 'DELETE',
            });

            if (!res.ok) {
                throw new Error('Failed to delete product');
            }

            // Silently refresh in background to ensure sync
            setTimeout(() => onRefresh(), 500);
        } catch (error) {
            console.error('Delete error:', error);
            // Revert the optimistic update on error
            // Re-insert the product at its original position
            setLocalProducts(prevProducts => {
                return [...prevProducts, deletedProduct];
            });
            toast.error(t('delete_error') || 'Failed to delete product. Please try again.');
        }
    };

    if (!products || products.length === 0) {
        return (
            <Card className="mt-8">
                <CardContent className="flex flex-col items-center justify-center p-12 text-muted-foreground">
                    <p>{t('no_products')}</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <>
            <Card className="mt-8">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <CardTitle>{mounted ? t('product_list_title') : 'Managed Products'} ({filteredProducts.length})</CardTitle>
                            <div className="flex items-center bg-secondary rounded-md p-1 gap-1">
                                <Button
                                    variant={filterStatus === 'all' ? 'default' : 'ghost'}
                                    size="sm"
                                    onClick={() => setFilterStatus('all')}
                                    className="h-7 text-xs px-2"
                                >
                                    {mounted ? t('all') : 'All'}
                                </Button>
                                <Button
                                    variant={filterStatus === 'active' ? 'default' : 'ghost'}
                                    size="sm"
                                    onClick={() => setFilterStatus('active')}
                                    className="h-7 text-xs px-2"
                                >
                                    {mounted ? t('active') : 'Active'}
                                </Button>
                                <Button
                                    variant={filterStatus === 'archived' ? 'default' : 'ghost'}
                                    size="sm"
                                    onClick={() => setFilterStatus('archived')}
                                    className="h-7 text-xs px-2"
                                >
                                    {mounted ? t('archived') : 'Archived'}
                                </Button>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="relative">
                                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    type="text"
                                    placeholder={mounted ? t('search_placeholder') : 'Search products...'}
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-8 w-64"
                                />
                            </div>
                            <select
                                value={filterCategory}
                                onChange={(e) => setFilterCategory(e.target.value)}
                                className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                            >
                                <option value="all">{mounted ? t('all') : 'All'} {mounted ? t('category_label') : 'Categories'}</option>
                                {categories.map((category) => (
                                    <option key={category} value={category}>
                                        {category}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[80px]">ID</TableHead>
                                    <TableHead className="w-[100px]">{mounted ? t('image_label') : 'Image'}</TableHead>
                                    <TableHead>{mounted ? t('name_label') : 'Name'}</TableHead>
                                    <TableHead className="w-[150px] text-center">{mounted ? t('category_label') : 'Category'}</TableHead>
                                    <TableHead className="w-[100px]">{mounted ? t('status_label') : 'Status'}</TableHead>
                                    <TableHead className="w-[200px] text-right">{mounted ? t('actions_label') : 'Actions'}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {paginatedProducts.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                                            {t('no_products')}
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    paginatedProducts.map((p) => (
                                        <TableRow key={p.id} className={p.archived ? 'opacity-50' : ''}>
                                            <TableCell className="font-medium">{p.sheetId}</TableCell>
                                            <TableCell>
                                                <div className="w-12 h-12 bg-white rounded-md flex items-center justify-center p-1 border">
                                                    {p.image ? (
                                                        <img src={p.image} alt="Product" className="max-w-full max-h-full object-contain" />
                                                    ) : (
                                                        <div className="w-full h-full bg-muted rounded-sm" />
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="max-w-[300px]">
                                                <span className="truncate block" title={p.title}>
                                                    {p.title || 'No Title'}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <span className="inline-flex items-center justify-center px-2 py-1 rounded-full text-xs bg-secondary">
                                                    {p.category || t('uncategorized')}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                {p.archived ? (
                                                    <span className="text-xs text-muted-foreground">{t('archived')}</span>
                                                ) : (
                                                    <span className="text-xs text-green-600 dark:text-green-400">{t('active')}</span>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center justify-end gap-2">
                                                    <Button
                                                        variant="outline"
                                                        size="icon"
                                                        onClick={() => router.push(`/products/${p.id}`)}
                                                        className="h-8 w-8"
                                                        title={t('edit')}
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant={p.archived ? "default" : "outline"}
                                                        size="icon"
                                                        onClick={() => handleArchive(p.id, p.archived)}
                                                        className="h-8 w-8"
                                                        title={p.archived ? "Unarchive" : "Archive"}
                                                    >
                                                        {p.archived ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                                                    </Button>
                                                    <Button
                                                        variant="destructive"
                                                        size="icon"
                                                        onClick={() => handleDeleteClick(p)}
                                                        className="h-8 w-8"
                                                        title={t('delete')}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between mt-4">
                            <div className="text-sm text-muted-foreground">
                                {t('page_info', {
                                    start: ((currentPage - 1) * itemsPerPage) + 1,
                                    end: Math.min(currentPage * itemsPerPage, filteredProducts.length),
                                    total: filteredProducts.length
                                })}
                            </div>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                >
                                    <ChevronLeft className="h-4 w-4 mr-1" />
                                    {t('previous')}
                                </Button>
                                <div className="text-sm">
                                    {t('page_current', { current: currentPage, total: totalPages })}
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                >
                                    {t('next')}
                                    <ChevronRight className="h-4 w-4 ml-1" />
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{t('delete_product')}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {t('delete_desc', { title: productToDelete?.title })}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleConfirmDelete}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {t('delete')}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
