
'use client';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

export default function AddProduct({ onAdd }: { onAdd: (product: any) => Promise<void> }) {
    const { t } = useTranslation();
    const [url, setUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const [preview, setPreview] = useState<any>(null);
    const [error, setError] = useState('');
    const [mounted, setMounted] = useState(false);

    React.useEffect(() => {
        setMounted(true);
    }, []);

    const handleScrape = async () => {
        if (!url) return;
        setLoading(true);
        setError('');
        setPreview(null);
        try {
            const res = await fetch('/api/scrape', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url })
            });
            const data = await res.json();
            if (data.error) throw new Error(data.error);

            // Auto-save immediately
            await onAdd(data);
            setUrl('');
        } catch (err: any) {
            setError(err.message || t('fetch_error'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle>{mounted ? t('add_product_title') : 'Add New Product'}</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="flex gap-4 mb-4">
                    <Input
                        type="text"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        placeholder={mounted ? t('url_placeholder') : 'Paste Product URL...'}
                        className="flex-1"
                    />
                    <Button onClick={handleScrape} disabled={loading} className="min-w-[100px]">
                        {loading ? <Loader2 className="animate-spin h-4 w-4" /> : (mounted ? t('add_button') : 'Add Product')}
                    </Button>
                </div>

                {error && <div className="text-destructive mt-4 text-sm font-medium">{error}</div>}
            </CardContent>
        </Card>
    );
}
