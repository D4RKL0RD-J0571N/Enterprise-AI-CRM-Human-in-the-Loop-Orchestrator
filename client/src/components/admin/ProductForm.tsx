import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import type { Product } from '../../types/admin';
import { API_ENDPOINTS } from '../../lib/api';

interface ProductFormProps {
    initialData?: Product | null;
    onSuccess: () => void;
    onCancel: () => void;
}

export default function ProductForm({ initialData, onSuccess, onCancel }: ProductFormProps) {
    const { t } = useTranslation();
    const { token } = useAuth();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        price_regular: 0,
        currency: 'CRC',
        stock_quantity: 0,
        is_active: true
    });

    useEffect(() => {
        if (initialData) {
            setFormData({
                name: initialData.name,
                description: initialData.description,
                price_regular: initialData.price / 100, // Convert cents to units
                currency: initialData.currency,
                stock_quantity: initialData.stock_quantity,
                is_active: initialData.is_active
            });
        }
    }, [initialData]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const payload = {
                ...formData,
                price: Math.round(formData.price_regular * 100) // Convert back to cents
            };

            const url = initialData
                ? `${API_ENDPOINTS.ecommerce.products}/${initialData.id}`
                : API_ENDPOINTS.ecommerce.products;

            const method = initialData ? 'PUT' : 'POST'; // Defaulting to POST/PUT

            const res = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (!res.ok) throw new Error('Failed to save product');

            onSuccess();
        } catch (err) {
            console.error(err);
            alert('Error saving product');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-md p-6">
                <h2 className="text-lg font-bold mb-4 dark:text-white">
                    {initialData ? t('product.edit') : t('product.create')}
                </h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">{t('product.name')}</label>
                        <input
                            type="text"
                            required
                            className="w-full rounded border-gray-300 dark:border-gray-700 dark:bg-gray-800 text-sm p-2"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">{t('product.price')}</label>
                            <input
                                type="number"
                                required
                                min="0"
                                step="0.01"
                                className="w-full rounded border-gray-300 dark:border-gray-700 dark:bg-gray-800 text-sm p-2"
                                value={formData.price_regular}
                                onChange={(e) => setFormData({ ...formData, price_regular: parseFloat(e.target.value) })}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">{t('product.currency')}</label>
                            <select
                                className="w-full rounded border-gray-300 dark:border-gray-700 dark:bg-gray-800 text-sm p-2"
                                value={formData.currency}
                                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                            >
                                <option value="CRC">CRC</option>
                                <option value="USD">USD</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">{t('product.description')}</label>
                        <textarea
                            className="w-full rounded border-gray-300 dark:border-gray-700 dark:bg-gray-800 text-sm p-2"
                            rows={3}
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">{t('product.stock')}</label>
                        <input
                            type="number"
                            required
                            className="w-full rounded border-gray-300 dark:border-gray-700 dark:bg-gray-800 text-sm p-2"
                            value={formData.stock_quantity}
                            onChange={(e) => setFormData({ ...formData, stock_quantity: parseInt(e.target.value) })}
                        />
                    </div>

                    <div className="flex justify-end gap-3 mt-6">
                        <button
                            type="button"
                            onClick={onCancel}
                            className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded"
                        >
                            {t('common.cancel')}
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                        >
                            {loading ? t('common.saving') : t('common.save')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
