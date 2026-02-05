'use client';
import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, ExternalLink, Loader2, Tag, Package, Edit, Save, X } from 'lucide-react';

interface Category {
    id: string;
    name: string;
}

interface Product {
    id: string;
    sheetId: string;
    title: string;
    price: string;
    category: string;
    categoryId?: string; // Add categoryId
    image: string;
    url: string;
}

export default function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter();
    const resolvedParams = use(params);
    const [product, setProduct] = useState<Product | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [editedTitle, setEditedTitle] = useState('');
    const [editedCategoryId, setEditedCategoryId] = useState('');
    const [categories, setCategories] = useState<Category[]>([]);
    const [isCreatingCategory, setIsCreatingCategory] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [creatingCategoryLoading, setCreatingCategoryLoading] = useState(false);

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                const res = await fetch(`/api/products/${resolvedParams.id}`);
                if (!res.ok) {
                    throw new Error('Product not found');
                }
                const data = await res.json();
                setProduct(data);
                setEditedTitle(data.title);
                setEditedCategoryId(data.categoryId || '');
            } catch (err: any) {
                setError(err.message || 'Failed to load product');
            } finally {
                setLoading(false);
            }
        };

        const fetchCategories = async () => {
            try {
                const res = await fetch('/api/categories');
                if (res.ok) {
                    const data = await res.json();
                    setCategories(data);
                }
            } catch (err) {
                console.error('Failed to load categories', err);
            }
        };

        fetchProduct();
        fetchCategories();
    }, [resolvedParams.id]);

    const handleEdit = () => {
        setIsEditing(true);
    };

    const handleCancel = () => {
        setIsEditing(false);
        if (product) {
            setEditedTitle(product.title);
            setEditedCategoryId(product.categoryId || '');
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
                    categoryId: editedCategoryId // Send categoryId
                })
            });

            if (!res.ok) {
                throw new Error('Failed to update product');
            }

            // Find category name for display logic update
            const newCategoryName = categories.find(c => c.id === editedCategoryId)?.name || 'Uncategorized';

            // Update local state
            setProduct({
                ...product,
                title: editedTitle,
                categoryId: editedCategoryId,
                category: newCategoryName
            });
            setIsEditing(false);
        } catch (err: any) {
            alert(err.message || 'Failed to save changes');
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
                        <p>Loading product...</p>
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
                        Back to Dashboard
                    </Button>
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center p-12 text-muted-foreground">
                            <p className="text-destructive">{error || 'Product not found'}</p>
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
                        Back to Dashboard
                    </Button>

                    {!isEditing ? (
                        <Button onClick={handleEdit} variant="outline">
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                        </Button>
                    ) : (
                        <div className="flex gap-2">
                            <Button onClick={handleCancel} variant="outline" disabled={saving}>
                                <X className="mr-2 h-4 w-4" />
                                Cancel
                            </Button>
                            <Button onClick={handleSave} disabled={saving}>
                                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                Save
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
                                            <label className="text-sm font-medium text-muted-foreground mb-2 block">Title</label>
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
                                            <span>Product ID: {product.sheetId}</span>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid md:grid-cols-2 gap-8">
                            {/* Image Section */}
                            <div className="flex items-center justify-center bg-white rounded-lg border p-8">
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
                                <div>
                                    <h3 className="text-sm font-medium text-muted-foreground mb-2">Price</h3>
                                    <p className="text-3xl font-bold">{product.price || 'N/A'}</p>
                                </div>

                                <div>
                                    <h3 className="text-sm font-medium text-muted-foreground mb-2">Category</h3>
                                    {isEditing ? (
                                        <div className="space-y-2">
                                            {isCreatingCategory ? (
                                                <div className="flex gap-2">
                                                    <Input
                                                        value={newCategoryName}
                                                        onChange={(e) => setNewCategoryName(e.target.value)}
                                                        placeholder="New Category Name"
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
                                                                    body: JSON.stringify({ name: newCategoryName })
                                                                });
                                                                if (res.ok) {
                                                                    const newCat = await res.json();
                                                                    setCategories(prev => [...prev, newCat]);
                                                                    setEditedCategoryId(newCat.id);
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
                                                    <select
                                                        className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                                        value={editedCategoryId}
                                                        onChange={(e) => setEditedCategoryId(e.target.value)}
                                                    >
                                                        <option value="">Select Category...</option>
                                                        {categories.map(c => (
                                                            <option key={c.id} value={c.id}>{c.name}</option>
                                                        ))}
                                                    </select>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => setIsCreatingCategory(true)}
                                                        title="Create New Category"
                                                    >
                                                        <Tag className="h-4 w-4 mr-1" />
                                                        New
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-secondary rounded-full">
                                            <Tag className="h-4 w-4" />
                                            <span>{product.category || 'Uncategorized'}</span>
                                        </div>
                                    )}
                                </div>

                                <div className="pt-4">
                                    {product.url && product.url !== '#' && (
                                        <Button
                                            variant="default"
                                            className="w-full"
                                            onClick={() => window.open(product.url, '_blank')}
                                        >
                                            <ExternalLink className="mr-2 h-4 w-4" />
                                            View on Amazon
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Additional Info */}
                        <div className="border-t pt-6">
                            <h3 className="text-lg font-semibold mb-4">Product Information</h3>
                            <div className="grid gap-4">
                                <div className="flex justify-between items-center py-2 border-b">
                                    <span className="text-muted-foreground">Title</span>
                                    <span className="font-medium text-right max-w-md">{isEditing ? editedTitle : product.title}</span>
                                </div>
                                <div className="flex justify-between items-center py-2 border-b">
                                    <span className="text-muted-foreground">Price</span>
                                    <span className="font-medium">{product.price || 'N/A'}</span>
                                </div>
                                <div className="flex justify-between items-center py-2 border-b">
                                    <span className="text-muted-foreground">Category</span>
                                    <span className="font-medium">
                                        {isEditing
                                            ? (categories.find(c => c.id === editedCategoryId)?.name || 'Uncategorized')
                                            : (product.category || 'Uncategorized')
                                        }
                                    </span>
                                </div>
                                <div className="flex justify-between items-center py-2">
                                    <span className="text-muted-foreground">Product ID</span>
                                    <span className="font-medium">{product.sheetId}</span>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </main>
    );
}
