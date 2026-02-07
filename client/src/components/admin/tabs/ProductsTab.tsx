import { useState } from 'react';
import { ShoppingBag, Plus } from "lucide-react";
import ProductTable from "../ProductTable";
import ProductForm from "../ProductForm";
import type { Product } from "../../../types/admin";
import { useTranslation } from "react-i18next";

export function ProductsTab() {
    const { t } = useTranslation();
    const [isEditing, setIsEditing] = useState(false);
    const [editItem, setEditItem] = useState<Product | null>(null);
    const [refreshKey, setRefreshKey] = useState(0);

    const handleEdit = (product: Product) => {
        setEditItem(product);
        setIsEditing(true);
    };

    const handleCreate = () => {
        setEditItem(null);
        setIsEditing(true);
    };

    const handleSuccess = () => {
        setIsEditing(false);
        setEditItem(null);
        setRefreshKey(prev => prev + 1);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-white dark:bg-gray-900 p-6 rounded-lg shadow-sm border border-gray-100 dark:border-gray-800">
                <div>
                    <h3 className="text-lg font-bold flex items-center gap-2 dark:text-white">
                        <ShoppingBag className="w-5 h-5 text-purple-600" />
                        {t('admin.menu.products')}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">{t('admin.products.desc')}</p>
                </div>

                <button
                    onClick={handleCreate}
                    className="flex items-center gap-2 px-4 py-2 bg-black dark:bg-white dark:text-black text-white rounded-lg hover:opacity-80 transition-all text-sm font-medium"
                >
                    <Plus className="w-4 h-4" />
                    {t('product.create')}
                </button>
            </div>

            <ProductTable
                key={refreshKey}
                onEdit={handleEdit}
                onRefresh={() => setRefreshKey(prev => prev + 1)}
            />

            {isEditing && (
                <ProductForm
                    initialData={editItem}
                    onSuccess={handleSuccess}
                    onCancel={() => setIsEditing(false)}
                />
            )}
        </div>
    );
}
