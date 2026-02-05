'use client';
import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
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
    id: number;
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
    onDelete: (id: number) => void;
    onRefresh: () => void;
}

export default function ProductList({ products, onDelete, onRefresh }: ProductListProps) {
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [localProducts, setLocalProducts] = useState<Product[]>(products);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [productToDelete, setProductToDelete] = useState<Product | null>(null);
    const itemsPerPage = 10;

    // Sync local products with props
    React.useEffect(() => {
        setLocalProducts(products);
    }, [products]);

    // Filter products based on search query
    const filteredProducts = useMemo(() => {
        if (!searchQuery.trim()) return localProducts;

        const query = searchQuery.toLowerCase();
        return localProducts.filter(p =>
            p.title.toLowerCase().includes(query) ||
            p.category.toLowerCase().includes(query) ||
            p.sheetId.toLowerCase().includes(query)
        );
    }, [localProducts, searchQuery]);

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

    const handleArchive = async (id: number, currentArchived: boolean) => {
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
            alert('Failed to update archive status');
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
            const res = await fetch(`/api/products?index=${deletedProduct.id}`, {
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
            setLocalProducts(prevProducts => {
                // Re-insert the product at its original position
                const newProducts = [...prevProducts];
                newProducts.splice(deletedProduct.id, 0, deletedProduct);
                return newProducts;
            });
            alert('Failed to delete product. Please try again.');
        }
    };

    if (!products || products.length === 0) {
        return (
            <Card className="mt-8">
                <CardContent className="flex flex-col items-center justify-center p-12 text-muted-foreground">
                    <p>No products found yet.</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <>
            <Card className="mt-8">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle>Managed Products ({filteredProducts.length})</CardTitle>
                        <div className="flex items-center gap-2">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search products..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-9 w-64"
                                />
                            </div>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[80px]">ID</TableHead>
                                    <TableHead className="w-[100px]">Image</TableHead>
                                    <TableHead>Title</TableHead>
                                    <TableHead className="w-[120px]">Price</TableHead>
                                    <TableHead className="w-[150px] text-center">Category</TableHead>
                                    <TableHead className="w-[100px]">Status</TableHead>
                                    <TableHead className="w-[200px] text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {paginatedProducts.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                                            No products match your search.
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
                                            <TableCell>{p.price || 'N/A'}</TableCell>
                                            <TableCell className="text-center">
                                                <span className="inline-flex items-center justify-center px-2 py-1 rounded-full text-xs bg-secondary">
                                                    {p.category || 'Uncategorized'}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                {p.archived ? (
                                                    <span className="text-xs text-muted-foreground">Archived</span>
                                                ) : (
                                                    <span className="text-xs text-green-600 dark:text-green-400">Active</span>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center justify-end gap-2">
                                                    <Button
                                                        variant="outline"
                                                        size="icon"
                                                        onClick={() => router.push(`/products/${p.id}`)}
                                                        className="h-8 w-8"
                                                        title="Edit Product"
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
                                                        title="Delete Product"
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
                                Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredProducts.length)} of {filteredProducts.length} products
                            </div>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                >
                                    <ChevronLeft className="h-4 w-4 mr-1" />
                                    Previous
                                </Button>
                                <div className="text-sm">
                                    Page {currentPage} of {totalPages}
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                >
                                    Next
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
                        <AlertDialogTitle>Delete Product</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete "{productToDelete?.title}"? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleConfirmDelete}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
