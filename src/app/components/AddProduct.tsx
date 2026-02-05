
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
            setPreview(data);
        } catch (err: any) {
            setError(err.message || t('fetch_error'));
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!preview) return;
        setLoading(true);
        await onAdd(preview);
        setLoading(false);
        setPreview(null);
        setUrl('');
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
                        placeholder={mounted ? t('url_placeholder') : 'Paste Amazon Product URL...'}
                        className="flex-1"
                    />
                    <Button onClick={handleScrape} disabled={loading} className="min-w-[100px]">
                        {loading && !preview ? <Loader2 className="animate-spin h-4 w-4" /> : (mounted ? t('add_button') : 'Add Product')}
                    </Button>
                </div>

                {error && <div className="text-destructive mt-4 text-sm font-medium">{error}</div>}

                {preview && (
                    <div className="mt-6 flex gap-6 items-center border rounded-lg p-4 bg-muted/50">
                        <div className="flex-shrink-0 bg-white p-2 rounded-md">
                            {preview.image && <img src={preview.image} alt="Preview" className="w-20 h-20 object-contain" />}
                        </div>
                        <div className="flex-grow min-w-0">
                            <h4 className="font-semibold text-sm line-clamp-2 mb-1">{preview.title}</h4>
                            <div className="text-muted-foreground text-sm mb-2">{preview.price}</div>
                            <a href={preview.url} target="_blank" className="text-xs text-primary underline hover:text-primary/80">{t('view_page')}</a>
                        </div>
                        <Button onClick={handleSave} disabled={loading}>
                            {loading ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : null}
                            {loading ? t('saving') : t('save')}
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
