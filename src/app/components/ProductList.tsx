'use client';
import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
    DragStartEvent,
    DragOverEvent,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
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
} from '@/components/ui/alert-dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Trash2, Edit, EyeOff, Eye, ChevronLeft, ChevronRight, Search, ChevronDown, ChevronRight as ChevronRightIcon, Layers, GripVertical } from 'lucide-react';
import type { Product } from '@/types';

interface ProductListProps {
    products: Product[];
    onDelete: (id: string) => void;
    onRefresh: (storeId?: string, branchId?: string, silent?: boolean) => void;
}

export default function ProductList({ products, onDelete: _onDelete, onRefresh }: ProductListProps) {
    const { t } = useTranslation();
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'archived'>('active');
    const [filterCategory, setFilterCategory] = useState<string>(() => {
        if (typeof window !== 'undefined') {
            return sessionStorage.getItem('productList_filterCategory') || 'all';
        }
        return 'all';
    });
    const [isGrouped, setIsGrouped] = useState(true);
    const [collapsedCategories, setCollapsedCategories] = useState<string[]>([]);
    const [localProducts, setLocalProducts] = useState<Product[]>(products);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [productToDelete, setProductToDelete] = useState<Product | null>(null);
    const [activeId, setActiveId] = useState<string | null>(null);
    const [mounted, setMounted] = useState(false);
    const itemsPerPage = isGrouped ? 1000 : 10; // When grouped, show all or very large number to keep categories together

    // Sync local products with props and set mounted
    React.useEffect(() => {
        setMounted(true);
        setLocalProducts(products);
    }, [products]);

    // Persist filterCategory to sessionStorage whenever it changes
    React.useEffect(() => {
        sessionStorage.setItem('productList_filterCategory', filterCategory);
    }, [filterCategory]);

    // Get unique categories
    const categories = useMemo(() => {
        const uniqueCategories = Array.from(new Set(localProducts.map(p => p.category)));
        return uniqueCategories.sort();
    }, [localProducts]);

    // Filter products based on search query, status, and category
    const filteredProducts = useMemo(() => {
        let result = [...localProducts];

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

        // Sorting for Grouping
        if (isGrouped) {
            result.sort((a, b) => {
                const catA = a.category || '';
                const catB = b.category || '';
                if (catA !== catB) return catA.localeCompare(catB);
                return (a.order ?? 0) - (b.order ?? 0) || a.title.localeCompare(b.title);
            });
        }

        return result;
    }, [localProducts, searchQuery, filterStatus, filterCategory, isGrouped]);

    // Pagination
    const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
    const paginatedProducts = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filteredProducts.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredProducts, currentPage, itemsPerPage]);

    // Toggle collapse
    const toggleCategory = (category: string) => {
        setCollapsedCategories(prev =>
            prev.includes(category)
                ? prev.filter(c => c !== category)
                : [...prev, category]
        );
    };

    // Reset to page 1 when search or grouping changes
    React.useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, isGrouped]);

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
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.error || 'archive_error');
            }

            // Silently refresh in background to ensure sync
            setTimeout(() => onRefresh(), 1000);
        } catch (error: any) {
            console.error('Archive error:', error);
            // Revert the optimistic update on error
            setLocalProducts(prevProducts =>
                prevProducts.map(p =>
                    p.id === id ? { ...p, archived: currentArchived } : p
                )
            );
            toast.error(t(error.message) || t('archive_error'));
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
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.error || 'delete_error');
            }

            // Silently refresh in background to ensure sync
            setTimeout(() => onRefresh(), 500);
        } catch (error: any) {
            console.error('Delete error:', error);
            // Revert the optimistic update on error
            // Re-insert the product at its original position
            setLocalProducts(prevProducts => {
                return [...prevProducts, deletedProduct];
            });
            toast.error(t(error.message) || t('delete_error'));
        }
    };

    // --- DnD Implementation ---
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8, // Avoid accidental drags when clicking buttons
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as string);
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveId(null);

        if (!over || active.id === over.id) return;

        const activeItem = localProducts.find(p => p.id === active.id);
        const overItem = localProducts.find(p => p.id === over.id);

        if (!activeItem || !overItem) return;

        const oldIndex = localProducts.findIndex(p => p.id === active.id);
        const newIndex = localProducts.findIndex(p => p.id === over.id);

        // Optimistic update
        const updatedProducts = [...localProducts];
        const movedItem = { ...activeItem };

        // If moving to a different category
        if (activeItem.category !== overItem.category) {
            movedItem.category = overItem.category;
            movedItem.categoryId = overItem.categoryId;
        }

        const newProducts = arrayMove(updatedProducts.map(p => p.id === active.id ? movedItem : p), oldIndex, newIndex);

        // Final logic for sequence orders: 
        // We need to re-assign orders for items in the affected categories to ensure consistency.
        // For simplicity, we just update the moved product's order based on its new neighbors.
        let newOrder = overItem.order ?? 1;
        if (newIndex > oldIndex) {
            // Dragged down
            newOrder = overItem.order ?? 1;
        } else {
            // Dragged up
            newOrder = Math.max(1, (overItem.order ?? 1) - 1);
        }

        setLocalProducts(newProducts);

        try {
            const res = await fetch(`/api/products/${activeItem.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: activeItem.title,
                    categoryId: movedItem.categoryId,
                    order: newOrder
                })
            });

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.error || 'error_update_failed');
            }

            // Truly silent background sync
            onRefresh(undefined, undefined, true);
        } catch (error: any) {
            toast.error(t(error.message) || t('error_update_failed'));
            onRefresh(); // Revert with full loading state if it fails
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

    const renderTableContent = () => {
        if (paginatedProducts.length === 0) {
            return (
                <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                        {t('no_products')}
                    </TableCell>
                </TableRow>
            );
        }

        const items = paginatedProducts.map(p => {
            const category = p.category || t('uncategorized');
            return { ...p, categoryKey: category };
        });

        if (!isGrouped) {
            return (
                <SortableContext items={items.map(p => p.id)} strategy={verticalListSortingStrategy}>
                    {items.map(p => (
                        <SortableProductRow key={p.id} product={p} />
                    ))}
                </SortableContext>
            );
        }

        let lastCategory = '';
        const rows: React.ReactNode[] = [];

        items.forEach(p => {
            const category = p.categoryKey;
            if (category !== lastCategory) {
                const isCollapsed = collapsedCategories.includes(category);
                rows.push(
                    <TableRow
                        key={`header-${category}`}
                        className="bg-muted/50 hover:bg-muted/70 cursor-pointer font-semibold select-none group"
                        onClick={() => toggleCategory(category)}
                    >
                        <TableCell colSpan={8} className="py-2 px-4">
                            <div className="flex items-center gap-2">
                                {isCollapsed ? <ChevronRightIcon className="h-4 w-4 text-primary" /> : <ChevronDown className="h-4 w-4 text-primary" />}
                                <span className="text-primary uppercase tracking-wider text-xs font-bold">{category}</span>
                                <Badge variant="secondary" className="ml-2 bg-background border h-5 px-1.5 text-[10px]">
                                    {filteredProducts.filter(item => (item.category || t('uncategorized')) === category).length}
                                </Badge>
                                <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity text-[10px] text-muted-foreground font-normal">
                                    {isCollapsed ? t('click_to_expand') : t('click_to_collapse')}
                                </div>
                            </div>
                        </TableCell>
                    </TableRow>
                );
                lastCategory = category;
            }

            if (!collapsedCategories.includes(category)) {
                rows.push(<SortableProductRow key={p.id} product={p} />);
            }
        });

        return (
            <SortableContext items={items.map(p => p.id)} strategy={verticalListSortingStrategy}>
                {rows}
            </SortableContext>
        );
    };

    const SortableProductRow = ({ product: p }: { product: Product }) => {
        const {
            attributes,
            listeners,
            setNodeRef,
            transform,
            transition,
            isDragging,
        } = useSortable({ id: p.id });

        const style = {
            transform: CSS.Transform.toString(transform),
            transition,
            zIndex: isDragging ? 10 : 1,
            position: 'relative' as const,
        };

        return (
            <TableRow
                ref={setNodeRef}
                style={style}
                className={`${p.archived ? 'opacity-50' : ''} transition-colors ${isDragging ? 'bg-primary/5 shadow-inner' : ''} hover:bg-muted/30 group`}
            >
                <TableCell className="w-[40px] pl-4">
                    <div
                        {...attributes}
                        {...listeners}
                        className="cursor-grab active:cursor-grabbing p-1 hover:bg-secondary rounded flex items-center justify-center"
                    >
                        <GripVertical className="h-4 w-4 text-muted-foreground" />
                    </div>
                </TableCell>
                <TableCell className="font-medium text-xs font-mono">{p.sheetId}</TableCell>
                <TableCell>
                    <div className="w-12 h-12 bg-white rounded-md flex items-center justify-center p-1 border shadow-sm group-hover:shadow-md transition-shadow">
                        {p.image ? (
                            <img src={p.image} alt="Product" className="max-w-full max-h-full object-contain pointer-events-none" />
                        ) : (
                            <div className="w-full h-full bg-muted rounded-sm" />
                        )}
                    </div>
                </TableCell>
                <TableCell className="max-w-[300px]">
                    <span className="truncate block font-medium group-hover:text-primary transition-colors" title={p.title}>
                        {p.title || 'No Title'}
                    </span>
                </TableCell>
                <TableCell className="text-center">
                    <Badge variant="secondary" className="font-normal whitespace-nowrap text-[10px]">
                        {p.category || t('uncategorized')}
                    </Badge>
                </TableCell>
                <TableCell className="text-center">
                    <span className="font-mono text-sm text-muted-foreground">{p.order ?? '—'}</span>
                </TableCell>
                <TableCell>
                    {p.archived ? (
                        <Badge variant="outline" className="text-muted-foreground border-muted-foreground/30 px-1.5 py-0 text-[10px] uppercase font-bold tracking-wider">
                            {t('archived')}
                        </Badge>
                    ) : (
                        <Badge variant="outline" className="text-green-600 dark:text-green-400 border-green-600/30 px-1.5 py-0 text-[10px] uppercase font-bold tracking-wider bg-green-500/5">
                            {t('active')}
                        </Badge>
                    )}
                </TableCell>
                <TableCell>
                    <div className="flex items-center justify-end gap-2" onMouseDown={(e) => e.stopPropagation()}>
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => router.push(`/products/${p.id}`)}
                            className="h-8 w-8 hover:border-primary hover:text-primary transition-all"
                            title={t('edit')}
                        >
                            <Edit className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                            variant={p.archived ? "default" : "outline"}
                            size="icon"
                            onClick={() => handleArchive(p.id, p.archived)}
                            className="h-8 w-8 transition-all"
                            title={p.archived ? "Unarchive" : "Archive"}
                        >
                            {p.archived ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                        </Button>
                        <Button
                            variant="destructive"
                            size="icon"
                            onClick={() => handleDeleteClick(p)}
                            className="h-8 w-8 hover:bg-destructive shadow-sm hover:shadow-md transition-all"
                            title={t('delete')}
                        >
                            <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                    </div>
                </TableCell>
            </TableRow>
        );
    };

    return (
        <>
            <Card className="mt-8 border-primary/10 shadow-lg overflow-hidden">
                <CardHeader className="bg-muted/30 pb-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <CardTitle className="text-xl font-bold text-primary flex items-center gap-2">
                                <Layers className="h-5 w-5" />
                                {mounted ? t('product_list_title') : 'Managed Products'}
                                <span className="text-muted-foreground font-normal text-sm ml-1">({filteredProducts.length})</span>
                            </CardTitle>
                            <div className="flex items-center bg-background border rounded-md p-1 shadow-sm">
                                <Button
                                    variant={filterStatus === 'all' ? 'default' : 'ghost'}
                                    size="sm"
                                    onClick={() => setFilterStatus('all')}
                                    className="h-7 text-[10px] px-2 uppercase font-bold tracking-tighter"
                                >
                                    {mounted ? t('all') : 'All'}
                                </Button>
                                <Button
                                    variant={filterStatus === 'active' ? 'default' : 'ghost'}
                                    size="sm"
                                    onClick={() => setFilterStatus('active')}
                                    className="h-7 text-[10px] px-2 uppercase font-bold tracking-tighter"
                                >
                                    {mounted ? t('active') : 'Active'}
                                </Button>
                                <Button
                                    variant={filterStatus === 'archived' ? 'default' : 'ghost'}
                                    size="sm"
                                    onClick={() => setFilterStatus('archived')}
                                    className="h-7 text-[10px] px-2 uppercase font-bold tracking-tighter"
                                >
                                    {mounted ? t('archived') : 'Archived'}
                                </Button>
                            </div>
                            <Button
                                variant={isGrouped ? "default" : "outline"}
                                size="sm"
                                onClick={() => setIsGrouped(!isGrouped)}
                                className="h-9 px-3 gap-2 border-primary/20"
                            >
                                <Layers className="h-4 w-4" />
                                <span className="text-xs font-semibold">{isGrouped ? (mounted ? t('grouped') : 'Grouped') : (mounted ? t('list_view') : 'List View')}</span>
                            </Button>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="relative group">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                <Input
                                    type="text"
                                    placeholder={mounted ? t('search_placeholder') : 'Search products...'}
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-9 w-64 h-10 bg-background/50 border-primary/10 transition-all focus:w-80"
                                />
                            </div>
                            <Select value={filterCategory} onValueChange={setFilterCategory}>
                                <SelectTrigger className="w-[180px] h-10 bg-background/50 border-primary/10">
                                    <SelectValue placeholder={mounted ? t('all') : 'All Categories'} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">
                                        <div className="flex items-center gap-2">
                                            <Layers className="h-3 w-3" />
                                            <span>{mounted ? t('all_categories') : 'All Categories'}</span>
                                        </div>
                                    </SelectItem>
                                    {categories.map((category) => (
                                        <SelectItem key={category} value={category}>
                                            {category}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="border-t border-primary/5">
                        <DndContext
                            sensors={sensors}
                            collisionDetection={closestCenter}
                            onDragStart={handleDragStart}
                            onDragEnd={handleDragEnd}
                        >
                            <Table>
                                <TableHeader className="bg-muted/20">
                                    <TableRow>
                                        <TableHead className="w-[40px] pl-4"></TableHead>
                                        <TableHead className="w-[80px] text-[10px] uppercase font-bold tracking-widest">ID</TableHead>
                                        <TableHead className="w-[100px] text-[10px] uppercase font-bold tracking-widest">{mounted ? t('image_label') : 'Image'}</TableHead>
                                        <TableHead className="text-[10px] uppercase font-bold tracking-widest">{mounted ? t('name_label') : 'Name'}</TableHead>
                                        <TableHead className="w-[120px] text-center text-[10px] uppercase font-bold tracking-widest">{mounted ? t('category_label') : 'Category'}</TableHead>
                                        <TableHead className="w-[70px] text-center text-[10px] uppercase font-bold tracking-widest">{mounted ? t('order_label') : 'Order'}</TableHead>
                                        <TableHead className="w-[100px] text-[10px] uppercase font-bold tracking-widest">{mounted ? t('status_label') : 'Status'}</TableHead>
                                        <TableHead className="w-[160px] text-right text-[10px] uppercase font-bold tracking-widest pr-6">{mounted ? t('actions_label') : 'Actions'}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {renderTableContent()}
                                </TableBody>
                            </Table>
                        </DndContext>
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
