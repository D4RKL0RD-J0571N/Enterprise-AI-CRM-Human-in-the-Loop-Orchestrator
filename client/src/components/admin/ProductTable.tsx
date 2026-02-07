import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import type { Product } from '../../types/admin';
import { Edit, Trash2 } from 'lucide-react';
import { API_ENDPOINTS } from '../../lib/api';

interface ProductTableProps {
    onEdit: (product: Product) => void;
    onRefresh: () => void;
}

export default function ProductTable({ onEdit, onRefresh }: ProductTableProps) {
    const { t, i18n } = useTranslation();
    const { token } = useAuth();
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchProducts = async () => {
        try {
            setLoading(true);
            const res = await fetch(API_ENDPOINTS.ecommerce.products, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            if (!res.ok) {
                if (res.status === 402 || res.status === 403) throw new Error("Plan restriction or invalid license.");
                throw new Error('Failed to fetch products');
            }

            const data = await res.json();
            setProducts(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    const deleteProduct = async (id: number) => {
        if (!confirm(t('common.confirm_delete'))) return;
        try {
            const res = await fetch(`${API_ENDPOINTS.ecommerce.products}/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                fetchProducts();
                onRefresh?.();
            }
        } catch (err) {
            console.error(err);
        }
    };

    if (loading && products.length === 0) return (
        <div className="flex flex-col items-center justify-center p-20 space-y-4">
            <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-gray-500 font-bold text-sm animate-pulse">{t('product.syncing')}</p>
        </div>
    );

    if (error && products.length === 0) return (
        <div className="p-12 text-center bg-white dark:bg-gray-900 rounded-3xl border border-red-100 dark:border-red-900/20">
            <div className="text-red-500 text-4xl mb-4">⚠️</div>
            <h3 className="text-lg font-bold dark:text-white mb-2">{error}</h3>
            <p className="text-sm text-gray-500 max-w-md mx-auto">This usually means your Enterprise License is not active or you need to enable Dev Mode.</p>
        </div>
    );

    return (
        <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-800">
            <table className="w-full text-sm text-left">
                <thead className="text-xs uppercase bg-gray-50 dark:bg-gray-900/50 text-gray-500 dark:text-gray-400">
                    <tr>
                        <th className="px-6 py-3">{t('product.id')}</th>
                        <th className="px-6 py-3">{t('product.name')}</th>
                        <th className="px-6 py-3">{t('product.price')}</th>
                        <th className="px-6 py-3">{t('product.stock')}</th>
                        <th className="px-6 py-3">{t('product.status')}</th>
                        <th className="px-6 py-3 text-right">{t('common.actions')}</th>
                    </tr>
                </thead>
                <tbody>
                    {products.map((p) => (
                        <tr key={p.id} className="bg-white dark:bg-gray-950 border-b dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900">
                            <td className="px-6 py-4 font-mono text-xs text-gray-400">#{p.id}</td>
                            <td className="px-6 py-4 font-medium text-gray-900 dark:text-gray-100">{p.name}</td>
                            <td className="px-6 py-4">
                                {(p.price / 100).toLocaleString(i18n.language || 'en-US', { style: 'currency', currency: p.currency || 'USD' })}
                            </td>
                            <td className="px-6 py-4">
                                <span className={`px-2 py-1 rounded text-xs ${p.stock_quantity > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                    {p.stock_quantity}
                                </span>
                            </td>
                            <td className="px-6 py-4">
                                <span className={`w-2 h-2 rounded-full inline-block mr-2 ${p.is_active ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                                {p.is_active ? t('product.active') : t('product.inactive')}
                            </td>
                            <td className="px-6 py-4 text-right space-x-2">
                                <button onClick={() => onEdit(p)} className="text-blue-600 hover:text-blue-800 transition-colors" title={t('common.edit')}>
                                    <Edit className="w-4 h-4" />
                                </button>
                                <button onClick={() => deleteProduct(p.id)} className="text-red-600 hover:text-red-800 transition-colors" title={t('common.delete')}>
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {products.length === 0 && (
                <div className="p-8 text-center text-gray-400">
                    {t('product.no_products')}
                </div>
            )}
        </div>
    );
}
