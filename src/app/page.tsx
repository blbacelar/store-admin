'use client';
import { useState, useEffect } from 'react';
import AddProduct from './components/AddProduct';
import ProductList from './components/ProductList';
import ThemeToggle from './components/ThemeToggle';
import LanguageToggle from './components/LanguageToggle';
import { Loader2, Package } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';

export default function Home() {
  const { t } = useTranslation();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetchProducts();
  }, []);

  // Fetch products
  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/products', {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache'
        }
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        setProducts(data);
      }
    } catch (error) {
      console.error('Failed to fetch products', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (product: any) => {
    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(product)
      });
      if (res.ok) {
        fetchProducts();
      } else {
        alert('Failed to save product to database. Please check the console for details.');
      }
    } catch (e) {
      console.error(e);
      alert('Error saving product');
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
        alert('Failed to delete. Check console.');
      }
    } catch (e) {
      console.error(e);
      alert('Error deleting product');
    }
  };

  return (
    <>
      <ThemeToggle />
      <LanguageToggle />
      <main className="min-h-screen bg-background text-foreground py-12 px-4 md:px-8">
        <div className="max-w-7xl mx-auto space-y-8">

          <header className="flex flex-col items-center text-center space-y-4">
            <div className="bg-primary/10 p-3 rounded-full">
              <Package className="w-12 h-12 text-primary" />
            </div>
            <div>
              <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl text-primary">
                {mounted ? t('dashboard_title') : 'Amazon Admin'}
              </h1>
              <p className="text-muted-foreground text-lg mt-2 font-medium">
                {mounted ? t('dashboard_sub') : 'Automate your product tracking workflow'}
              </p>
              <div className="mt-6">
                <Link href="/categories">
                  <Button variant="outline">{mounted ? t('manage_categories') : 'Manage Categories'}</Button>
                </Link>
              </div>
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
