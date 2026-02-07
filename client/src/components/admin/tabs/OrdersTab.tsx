// import React from 'react'; // Not using default import
import { ShoppingCart } from "lucide-react";
import OrderList from "../OrderList";
import { useTranslation } from "react-i18next";

export function OrdersTab() {
    const { t } = useTranslation();

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-white dark:bg-gray-900 p-6 rounded-lg shadow-sm border border-gray-100 dark:border-gray-800">
                <div>
                    <h3 className="text-lg font-bold flex items-center gap-2 dark:text-white">
                        <ShoppingCart className="w-5 h-5 text-blue-600" />
                        {t('admin.menu.orders')}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">{t('admin.orders.desc')}</p>
                </div>
            </div>

            <OrderList />
        </div>
    );
}
