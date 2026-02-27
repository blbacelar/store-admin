'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { useBranch } from '@/context/BranchContext';
import AddProduct from './components/AddProduct';
import ProductList from './components/ProductList';
import { Button } from '@/components/ui/button';
import { Loader2, Settings } from 'lucide-react';
import Link from 'next/link';
import type { Store, Product, ScrapedProductData } from '@/types';

export default function Home() {
  const { t } = useTranslation();
  const router = useRouter();
  const { branches, selectedBranchId, setSelectedBranchId, fetchBranches } = useBranch();
  const [stores, setStores] = useState<Store[]>([]);
  const [activeStore, setActiveStore] = useState<Store | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
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
        setStores(data);
        setActiveStore(data[0]); // Default to first store
        // Don't fetch products here - fetchBranches will do it after selecting first branch
        fetchBranches(data[0].id);
      } else {
        // Auto-assign user to default store
        try {
          const assignRes = await fetch('/api/stores/auto-assign', {
            method: 'POST'
          });

          if (assignRes.ok) {
            // Retry fetching stores after assignment
            const retryRes = await fetch('/api/stores');
            const retryData = await retryRes.json();

            if (Array.isArray(retryData) && retryData.length > 0) {
              setStores(retryData);
              setActiveStore(retryData[0]);
              fetchBranches(retryData[0].id);
            } else {
              toast.error('Failed to access store. Please contact support.');
              setLoading(false);
            }
          } else {
            toast.error('Failed to assign store. Please contact support.');
            setLoading(false);
          }
        } catch (assignError) {
          console.error('Failed to auto-assign store', assignError);
          toast.error('Failed to setup your account. Please contact support.');
          setLoading(false);
        }
      }
    } catch (error) {
      console.error('Failed to check stores', error);
      setLoading(false);
    }
  };

  // Fetch products
  const fetchProducts = async (storeId?: string, branchId?: string, silent = false) => {
    const id = storeId || activeStore?.id;
    const branch = branchId || selectedBranchId;
    if (!id) return;

    try {
      if (!silent) setLoading(true);
      let url = `/api/products?storeId=${id}`;
      if (branch) {
        url += `&branchId=${branch}`;
      }
      const res = await fetch(url);
      const data = await res.json();
      if (Array.isArray(data)) {
        setProducts(data);
      }
    } catch (error) {
      console.error('Failed to fetch products', error);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  // Watch for selectedBranchId changes from context
  useEffect(() => {
    if (selectedBranchId && activeStore) {
      fetchProducts(activeStore.id, selectedBranchId);
    }
  }, [selectedBranchId, activeStore]);

  const handleAdd = async (product: ScrapedProductData) => {
    if (!activeStore) return;
    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...product,
          image: product.images?.[0] || '', // Map images array to single image field
          storeId: activeStore.id,
          branchId: selectedBranchId || undefined
        })
      });
      if (res.ok) {
        const newProduct = await res.json();
        // Redirect to product detail page to assign category/branch
        router.push(`/products/${newProduct.id}`);
        toast.success(t('product_saved') || 'Product saved successfully');
      } else {
        toast.error(t('save_error') || 'Failed to save product to database.');
      }
    } catch (e) {
      console.error(e);
      toast.error(t('save_error') || 'Error saving product');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/products?id=${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        fetchProducts();
      } else {
        toast.error(t('delete_error') || 'Failed to delete. Check console.');
      }
    } catch (e) {
      console.error(e);
      toast.error(t('delete_error') || 'Error deleting product');
    }
  };

  return (
    <>
      <main className="min-h-screen bg-background text-foreground py-12 px-4 md:px-8">
        <div className="max-w-6xl mx-auto space-y-8">
          <header className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-primary">
                {activeStore ? activeStore.name : (mounted ? t('dashboard_title') : 'Dashboard')}
              </h1>
              <p className="text-muted-foreground">{mounted ? t('dashboard_subtitle') : 'Manage your products'}</p>
            </div>
            <div className="flex items-center gap-2">
              <Link href="/categories">
                <Button variant="outline">
                  <Settings className="mr-2 h-4 w-4" />
                  {mounted ? t('categories') : 'Categories'}
                </Button>
              </Link>
              <Link href="/branches">
                <Button variant="outline">
                  <Settings className="mr-2 h-4 w-4" />
                  {mounted ? t('branches') : 'Branches'}
                </Button>
              </Link>
            </div>
          </header>

          <div className="grid gap-8">
            <AddProduct onAdd={handleAdd} />

            {loading ? (
              <div className="flex flex-col items-center justify-center p-12 space-y-4 text-muted-foreground">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p>{mounted ? t('loading_products') : 'Loading products...'}</p>
              </div>
            ) : (
              <ProductList products={products} onDelete={handleDelete} onRefresh={fetchProducts} />
            )}
          </div>

        </div>
      </main>
    </>
  );
}
