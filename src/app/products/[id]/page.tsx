'use client';
import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, ExternalLink, Loader2, Tag, Package, Edit, Save, X, MapPin, Eye, EyeOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

interface Category {
    id: string;
    name: string;
}

interface Branch {
    id: string;
    name: string;
}

interface Product {
    id: string;
    sheetId: string;
    title: string;
    price: string;
    order: number;
    category: string;
    categoryId?: string;
    branchId?: string;
    branchName?: string;
    image: string;
    url: string;
    description?: string;
    archived: boolean;
}

export default function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { t } = useTranslation();
    const router = useRouter();
    const resolvedParams = use(params);
    const [product, setProduct] = useState<Product | null>(null);
    const [stores, setStores] = useState<any[]>([]);
    const [activeStore, setActiveStore] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [saving, setSaving] = useState(false);

    // Edit states
    const [editedTitle, setEditedTitle] = useState('');
    const [editedDescription, setEditedDescription] = useState('');
    const [editedCategoryId, setEditedCategoryId] = useState('');
    const [editedBranchId, setEditedBranchId] = useState('');
    const [editedOrder, setEditedOrder] = useState<number | ''>('');

    // Data lists
    const [categories, setCategories] = useState<Category[]>([]);
    const [branches, setBranches] = useState<Branch[]>([]);

    // Category creation
    const [isCreatingCategory, setIsCreatingCategory] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [creatingCategoryLoading, setCreatingCategoryLoading] = useState(false);

    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        setMounted(true);
        checkStores();
        fetchProduct();
    }, [resolvedParams.id]);

    // Fetch categories when product and activeStore are both available
    useEffect(() => {
        if (product && activeStore) {
            fetchCategories(activeStore.id, product.branchId);
        }
    }, [product, activeStore]);

    const checkStores = async () => {
        try {
            const res = await fetch('/api/stores');
            const data = await res.json();

            if (Array.isArray(data) && data.length > 0) {
                setActiveStore(data[0]);
                // Don't fetch categories here - wait for product to load with branchId
                fetchBranches(data[0].id);
            } else {
                router.push('/setup-store');
            }
        } catch (error) {
            console.error('Failed to check stores', error);
        }
    };

    const fetchProduct = async () => {
        try {
            const res = await fetch(`/api/products/${resolvedParams.id}`);
            if (res.ok) {
                const data = await res.json();
                setProduct(data);
                setEditedTitle(data.title);
                setEditedDescription(data.description || '');
                setEditedCategoryId(data.categoryId || '');
                setEditedBranchId(data.branchId || '');
                setEditedOrder(data.order ?? '');
            } else {
                setError('Product not found');
            }
        } catch (err) {
            setError('Failed to load product');
        } finally {
            setLoading(false);
        }
    };

    const fetchCategories = async (storeId?: string, branchId?: string) => {
        const id = storeId || activeStore?.id;
        const branch = branchId || product?.branchId;
        if (!id) return;

        try {
            let url = `/api/categories?storeId=${id}`;
            if (branch) {
                url += `&branchId=${branch}`;
            }
            const res = await fetch(url);
            if (res.ok) {
                const data = await res.json();
                setCategories(data);
            }
        } catch (err) {
            console.error('Failed to load categories', err);
        }
    };

    const fetchBranches = async (storeId?: string) => {
        const id = storeId || activeStore?.id;
        if (!id) return;

        try {
            const res = await fetch(`/api/branches?storeId=${id}`);
            if (res.ok) {
                const data = await res.json();
                setBranches(data);
            }
        } catch (err) {
            console.error('Failed to load branches', err);
        }
    };

    const handleArchive = async () => {
        if (!product) return;
        const newArchivedState = !product.archived;

        // Optimistic update
        setProduct({ ...product, archived: newArchivedState });

        try {
            const res = await fetch(`/api/products/${product.id}/archive`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ archived: newArchivedState })
            });

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.error || `Failed to update archive status: ${res.status}`);
            }
        } catch (err: any) {
            console.error('Archive error:', err);
            // Revert on error
            setProduct({ ...product, archived: !newArchivedState });
            toast.error(err.message || 'Failed to update archive status');
        }
    };

    const handleEdit = () => {
        setIsEditing(true);
    };

    const handleCancel = () => {
        setIsEditing(false);
        if (product) {
            setEditedTitle(product.title);
            setEditedDescription(product.description || '');
            setEditedCategoryId(product.categoryId || '');
            setEditedBranchId(product.branchId || '');
            setEditedOrder(product.order ?? '');
            setIsCreatingCategory(false);
            setNewCategoryName('');
        }
    };

    const handleSave = async () => {
        if (!product) return;

        setSaving(true);
        try {
            const res = await fetch(`/api/products/${resolvedParams.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: editedTitle,
                    description: editedDescription,
                    categoryId: editedCategoryId,
                    branchId: editedBranchId,
                    order: editedOrder !== '' ? Number(editedOrder) : undefined
                })
            });

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                const errorKey = errorData.error || 'error_update_failed';
                throw new Error(t(errorKey));
            }

            // Find names for display
            const newCategoryName = categories.find(c => c.id === editedCategoryId)?.name || t('uncategorized');
            const newBranchName = branches.find(b => b.id === editedBranchId)?.name;

            // Update local state
            setProduct({
                ...product,
                title: editedTitle,
                description: editedDescription,
                categoryId: editedCategoryId,
                category: newCategoryName,
                branchId: editedBranchId,
                branchName: newBranchName,
                order: editedOrder !== '' ? Number(editedOrder) : product.order
            });
            setIsEditing(false);
            toast.success(t('product_updated_success') || 'Product updated successfully');
        } catch (err: any) {
            toast.error(err.message || t('fetch_error'));
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <main className="min-h-screen bg-background text-foreground py-12 px-4 md:px-8">
                <div className="max-w-4xl mx-auto">
                    <div className="flex flex-col items-center justify-center p-12 space-y-4 text-muted-foreground">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <p>{mounted ? t('loading_products') : 'Loading products...'}</p>
                    </div>
                </div>
            </main>
        );
    }

    if (error || !product) {
        return (
            <main className="min-h-screen bg-background text-foreground py-12 px-4 md:px-8">
                <div className="max-w-4xl mx-auto">
                    <Button
                        variant="ghost"
                        onClick={() => router.push('/')}
                        className="mb-6"
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        {mounted ? t('back_dashboard') : 'Back to Dashboard'}
                    </Button>
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center p-12 text-muted-foreground">
                            <p className="text-destructive">{error || (mounted ? t('no_products') : 'Product not found')}</p>
                        </CardContent>
                    </Card>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-background text-foreground py-12 px-4 md:px-8">
            <div className="max-w-4xl mx-auto space-y-6">
                <div className="flex items-center justify-between">
                    <Button
                        variant="ghost"
                        onClick={() => router.push('/')}
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        {mounted ? t('back_dashboard') : 'Back to Dashboard'}
                    </Button>

                    {!isEditing && (
                        <div className="flex gap-2">
                            <Button
                                onClick={handleArchive}
                                variant={product.archived ? "default" : "outline"}
                                title={product.archived ? "Unarchive Product" : "Archive Product"}
                            >
                                {product.archived ? <Eye className="mr-2 h-4 w-4" /> : <EyeOff className="mr-2 h-4 w-4" />}
                                {product.archived ? (mounted ? t('unarchive') : 'Unarchive') : (mounted ? t('archive') : 'Archive')}
                            </Button>
                            <Button onClick={handleEdit} variant="outline">
                                <Edit className="mr-2 h-4 w-4" />
                                {mounted ? t('edit') : 'Edit'}
                            </Button>
                        </div>
                    )}
                </div>

                <Card>
                    <CardHeader>
                        <div className="flex items-start justify-between">
                            <div className="flex-1">
                                {isEditing ? (
                                    <div className="space-y-4">
                                        <div>
                                            <Label className="text-sm font-medium text-muted-foreground mb-2 block">{mounted ? t('name_label') : 'Title'}</Label>
                                            <Input
                                                value={editedTitle}
                                                onChange={(e) => setEditedTitle(e.target.value)}
                                                className="text-xl font-semibold"
                                            />
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <CardTitle className="text-2xl mb-2">{product.title}</CardTitle>
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <Package className="h-4 w-4" />
                                            <span>{mounted ? t('product_id') : 'Product ID'}: {product.sheetId}</span>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid md:grid-cols-2 gap-8">
                            {/* Image Section */}
                            <div className="flex items-center justify-center bg-white rounded-lg border p-8 shadow-sm">
                                {product.image ? (
                                    <img
                                        src={product.image}
                                        alt={product.title}
                                        className="max-w-full max-h-96 object-contain"
                                    />
                                ) : (
                                    <div className="w-full h-64 bg-muted rounded-md flex items-center justify-center">
                                        <Package className="h-16 w-16 text-muted-foreground" />
                                    </div>
                                )}
                            </div>

                            {/* Details Section */}
                            <div className="space-y-6">
                                {/* Description Section */}
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium text-muted-foreground">{mounted ? t('description_label') : 'Description'}</Label>
                                    {isEditing ? (
                                        <Textarea
                                            value={editedDescription}
                                            onChange={(e) => setEditedDescription(e.target.value)}
                                            className="min-h-[120px] resize-none"
                                            rows={4}
                                        />
                                    ) : (
                                        <p className="text-sm leading-relaxed text-foreground/80 whitespace-pre-wrap min-h-[40px]">
                                            {product.description || 'No description available.'}
                                        </p>
                                    )}
                                </div>

                                <Separator className="opacity-50" />

                                {/* Category Section */}
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium text-muted-foreground">{mounted ? t('category_label') : 'Category'}</Label>
                                    {isEditing ? (
                                        <div className="space-y-2">
                                            {isCreatingCategory ? (
                                                <div className="flex gap-2">
                                                    <Input
                                                        value={newCategoryName}
                                                        onChange={(e) => setNewCategoryName(e.target.value)}
                                                        placeholder={mounted ? t('new_category_label') : 'New Category Name'}
                                                        className="h-9"
                                                    />
                                                    <Button
                                                        size="sm"
                                                        onClick={async () => {
                                                            if (!newCategoryName.trim()) return;
                                                            setCreatingCategoryLoading(true);
                                                            try {
                                                                const res = await fetch('/api/categories', {
                                                                    method: 'POST',
                                                                    headers: { 'Content-Type': 'application/json' },
                                                                    body: JSON.stringify({ name: newCategoryName, storeId: activeStore.id })
                                                                });
                                                                if (res.ok) {
                                                                    const newCat = await res.json();
                                                                    setCategories(prev => [...prev, newCat]);
                                                                    setEditedCategoryId(newCat.id);
                                                                    setEditedOrder(''); // Reset order to trigger backend auto-append
                                                                    setIsCreatingCategory(false);
                                                                    setNewCategoryName('');
                                                                }
                                                            } catch (e) {
                                                                console.error("Failed to create category", e);
                                                            } finally {
                                                                setCreatingCategoryLoading(false);
                                                            }
                                                        }}
                                                        disabled={creatingCategoryLoading}
                                                    >
                                                        {creatingCategoryLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => setIsCreatingCategory(false)}
                                                    >
                                                        <X className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            ) : (
                                                <div className="flex gap-2">
                                                    <Select
                                                        value={editedCategoryId}
                                                        onValueChange={(val) => {
                                                            setEditedCategoryId(val);
                                                            setEditedOrder(''); // Reset order to trigger backend auto-append
                                                        }}
                                                    >
                                                        <SelectTrigger className="w-full h-9">
                                                            <SelectValue placeholder={mounted ? t('select_category') : 'Select Category...'} />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {categories.map(c => (
                                                                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => setIsCreatingCategory(true)}
                                                        title={mounted ? t('add') : 'Create New Category'}
                                                        className="h-9"
                                                    >
                                                        <Tag className="h-4 w-4 mr-1" />
                                                        {mounted ? t('add') : 'Add'}
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="flex flex-wrap gap-2">
                                            <Badge variant="secondary" className="px-3 py-1 text-xs font-medium">
                                                <Tag className="h-3 w-3 mr-1.5" />
                                                {product.category || (mounted ? t('uncategorized') : 'Uncategorized')}
                                            </Badge>
                                        </div>
                                    )}
                                </div>

                                {/* Branch Section */}
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium text-muted-foreground">{mounted ? t('branch_label') : 'Branch'}</Label>
                                    {isEditing ? (
                                        <div className="space-y-2">
                                            <Select value={editedBranchId} onValueChange={setEditedBranchId} disabled={true}>
                                                <SelectTrigger className="w-full h-9">
                                                    <SelectValue placeholder={mounted ? 'Select Branch...' : 'Select Branch...'} />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {branches.map(b => (
                                                        <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    ) : (
                                        <div className="flex flex-wrap gap-2">
                                            <Badge variant="outline" className="px-3 py-1 text-xs font-medium">
                                                <MapPin className="h-3 w-3 mr-1.5" />
                                                {product.branchName || 'No Branch'}
                                            </Badge>
                                        </div>
                                    )}
                                </div>

                                {/* Order Section */}
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium text-muted-foreground">{mounted ? t('order_label') : 'Order'}</Label>
                                    <div className="flex items-center gap-2">
                                        {isEditing ? (
                                            <Input
                                                type="number"
                                                value={editedOrder}
                                                onChange={(e) => setEditedOrder(e.target.value === '' ? '' : Number(e.target.value))}
                                                className="w-24 h-9"
                                                min={1}
                                                placeholder="Auto"
                                            />
                                        ) : (
                                            <Badge variant="outline" className="px-3 py-1 text-xs font-mono font-medium">
                                                {product.order ?? '—'}
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                                <div className="pt-4 space-y-2">
                                    {isEditing && (
                                        <div className="flex gap-2 mb-2">
                                            <Button onClick={handleCancel} variant="outline" disabled={saving} className="flex-1">
                                                <X className="mr-2 h-4 w-4" />
                                                {mounted ? t('cancel') : 'Cancel'}
                                            </Button>
                                            <Button onClick={handleSave} disabled={saving} className="flex-1">
                                                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                                {mounted ? t('save') : 'Save'}
                                            </Button>
                                        </div>
                                    )}
                                    {product.url && product.url !== '#' && (
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-muted-foreground">
                                                {mounted ? t('url_label') : 'Product URL'}
                                            </label>
                                            <div className="flex gap-2">
                                                <Input
                                                    value={product.url}
                                                    disabled
                                                    className="flex-1 text-sm"
                                                />
                                                <Button
                                                    variant="default"
                                                    size="sm"
                                                    onClick={() => window.open(product.url, '_blank')}
                                                >
                                                    <ExternalLink className="mr-1 h-3 w-3" />
                                                    {mounted ? t('product_view') : 'View'}
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Additional Info */}
                        <div className="space-y-4 pt-4">
                            <div className="flex items-center gap-2">
                                <h3 className="text-lg font-semibold">{mounted ? t('product_info') : 'Product Information'}</h3>
                            </div>
                            <Separator />
                            <div className="grid gap-4">
                                <div className="flex justify-between items-center py-1 border-b border-muted/50">
                                    <Label className="text-muted-foreground font-normal">{mounted ? t('name_label') : 'Title'}</Label>
                                    <span className="font-medium text-right max-w-md text-sm">{isEditing ? editedTitle : product.title}</span>
                                </div>
                                <div className="flex justify-between items-center py-1 border-b border-muted/50">
                                    <Label className="text-muted-foreground font-normal">{mounted ? t('category_label') : 'Category'}</Label>
                                    <Badge variant="secondary" className="font-medium">
                                        {isEditing
                                            ? (categories.find(c => c.id === editedCategoryId)?.name || (mounted ? t('uncategorized') : 'Uncategorized'))
                                            : (product.category || (mounted ? t('uncategorized') : 'Uncategorized'))
                                        }
                                    </Badge>
                                </div>
                                <div className="flex justify-between items-center py-1 border-b border-muted/50">
                                    <Label className="text-muted-foreground font-normal">{mounted ? t('branch_label') : 'Branch'}</Label>
                                    <Badge variant="outline" className="font-medium">
                                        {isEditing
                                            ? (branches.find(b => b.id === editedBranchId)?.name || 'No Branch')
                                            : (product.branchName || 'No Branch')
                                        }
                                    </Badge>
                                </div>
                                <div className="flex justify-between items-center py-1 border-b border-muted/50 gap-4">
                                    <Label className="text-muted-foreground font-normal">{mounted ? t('order_label') : 'Order'}</Label>
                                    <span className="font-mono text-sm text-right pl-4">
                                        {isEditing
                                            ? (editedOrder !== '' ? editedOrder : 'Auto')
                                            : product.order
                                        }
                                    </span>
                                </div>
                                <div className="flex justify-between items-center py-1">
                                    <Label className="text-muted-foreground font-normal">{mounted ? t('product_id') : 'Product ID'}</Label>
                                    <span className="font-mono text-sm">{product.sheetId}</span>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </main>
    );
}
