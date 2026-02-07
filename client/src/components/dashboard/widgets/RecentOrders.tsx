import { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useTranslation } from "react-i18next";
import { API_ENDPOINTS } from '../../../lib/api';

export default function RecentOrders() {
    const { t } = useTranslation();
    const { token } = useAuth();
    const [orders, setOrders] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                const res = await fetch(API_ENDPOINTS.dashboard.recentOrders, {
                    headers: { "Authorization": `Bearer ${token}` }
                });
                if (res.ok) setOrders(await res.json());
            } catch (err) { console.error(err); }
            finally { setIsLoading(false); }
        };
        if (token) fetchOrders();
    }, [token]);

    return (
        <div className="col-span-3 rounded-xl border bg-card text-card-foreground shadow-sm">
            <div className="p-6">
                <h3 className="font-semibold leading-none tracking-tight">{t('dashboard.recent_orders.title')}</h3>
                <div className="mt-4 space-y-4">
                    {isLoading ? (
                        [1, 2, 3].map(i => <div key={i} className="h-12 bg-muted animate-pulse rounded-lg" />)
                    ) : orders.length === 0 ? (
                        <p className="text-xs text-muted-foreground italic text-center py-8">{t('dashboard.recent_orders.empty')}</p>
                    ) : orders.map((order) => (
                        <div key={order.id} className="flex items-center justify-between border-b last:border-0 pb-3 last:pb-0">
                            <div className="space-y-1">
                                <p className="text-sm font-medium">{t('dashboard.recent_orders.order_prefix')}{order.external_id || order.id}</p>
                                <p className="text-xs text-muted-foreground">{order.client_name}</p>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                                <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-black uppercase tracking-tighter ${order.status === 'paid' ? 'bg-green-100 text-green-800 border-green-200' : 'bg-yellow-100 text-yellow-800 border-yellow-200'}`}>
                                    {order.status}
                                </span>
                                <span className="text-xs font-bold text-slate-500">₡{order.amount.toLocaleString()}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
