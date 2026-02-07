import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import type { Order, Product, Client } from '../../types/admin';
import { CreditCard, Clock, CheckCircle, XCircle, Plus, ShoppingCart, User, X, Trash2, Package } from 'lucide-react';
import { useTranslation } from "react-i18next";
import { API_ENDPOINTS } from '../../lib/api';

export default function OrderList() {
    const { t } = useTranslation();
    const { token } = useAuth();
    const [searchParams] = useSearchParams();
    const clientIdParam = searchParams.get('clientId');

    const [orders, setOrders] = useState<Order[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [clients, setClients] = useState<Client[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [generatingLink, setGeneratingLink] = useState<number | null>(null);

    // New Order Modal State
    const [showModal, setShowModal] = useState(false);
    const [newOrder, setNewOrder] = useState({
        client_id: 0,
        items: [] as { product_id: number; quantity: number; name: string; price: number }[]
    });

    const fetchData = async () => {
        try {
            setLoading(true);
            const [ordersRes, productsRes, clientsRes] = await Promise.all([
                fetch(API_ENDPOINTS.ecommerce.orders, { headers: { Authorization: `Bearer ${token}` } }),
                fetch(API_ENDPOINTS.ecommerce.products, { headers: { Authorization: `Bearer ${token}` } }),
                fetch(API_ENDPOINTS.clients.base, { headers: { Authorization: `Bearer ${token}` } })
            ]);

            if (!ordersRes.ok || !productsRes.ok || !clientsRes.ok) {
                if (ordersRes.status === 402 || ordersRes.status === 403) throw new Error("Plan restriction or invalid license.");
                throw new Error('Failed to fetch data');
            }

            const [ordersData, productsData, clientsData] = await Promise.all([
                ordersRes.json(),
                productsRes.json(),
                clientsRes.json()
            ]);

            setOrders(Array.isArray(ordersData) ? ordersData : []);
            setProducts(Array.isArray(productsData) ? productsData : []);
            setClients(Array.isArray(clientsData) ? clientsData : []);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [token]);

    const generatePaymentLink = async (orderId: number) => {
        setGeneratingLink(orderId);
        try {
            const res = await fetch(API_ENDPOINTS.ecommerce.paymentLink(orderId), {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.ok) {
                const data = await res.json();
                if (data.url) {
                    window.open(data.url, '_blank');
                }
            } else {
                alert('Failed to generate link');
            }
        } catch (err) {
            console.error(err);
        } finally {
            setGeneratingLink(null);
        }
    };

    const handleCreateOrder = async () => {
        if (!newOrder.client_id || newOrder.items.length === 0) {
            alert(t('orders.modal.error_select'));
            return;
        }

        try {
            const res = await fetch(API_ENDPOINTS.ecommerce.orders, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    client_id: newOrder.client_id,
                    items: newOrder.items.map(i => ({ product_id: i.product_id, quantity: i.quantity })),
                    currency: "CRC"
                })
            });

            if (res.ok) {
                setShowModal(false);
                setNewOrder({ client_id: 0, items: [] });
                fetchData();
            } else {
                const err = await res.json();
                alert(err.detail || t('orders.modal.error_create'));
            }
        } catch (err) {
            alert(t('orders.modal.error_create'));
        }
    };

    const addProductToOrder = (productId: number) => {
        const product = products.find(p => p.id === productId);
        if (!product) return;

        const existing = newOrder.items.find(i => i.product_id === productId);
        if (existing) {
            setNewOrder({
                ...newOrder,
                items: newOrder.items.map(i => i.product_id === productId ? { ...i, quantity: i.quantity + 1 } : i)
            });
        } else {
            setNewOrder({
                ...newOrder,
                items: [...newOrder.items, { product_id: product.id, name: product.name, price: product.price, quantity: 1 }]
            });
        }
    };

    const filteredOrders = orders.filter(o => {
        const matchesStatus = statusFilter === 'all' || o.status === statusFilter;
        const matchesClient = !clientIdParam || o.client_id.toString() === clientIdParam;
        return matchesStatus && matchesClient;
    });

    const StatusBadge = ({ status }: { status: string }) => {
        const config = {
            pending: { color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400', icon: Clock },
            paid: { color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400', icon: CheckCircle },
            failed: { color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400', icon: XCircle },
        }[status.toLowerCase()] || { color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400', icon: Clock };

        const Icon = config.icon;

        return (
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${config.color}`}>
                <Icon className="w-3 h-3" />
                {t(`orders.filter.${status}`)}
            </span>
        );
    };

    if (loading && orders.length === 0) return (
        <div className="flex flex-col items-center justify-center p-20 space-y-4">
            <div className="w-12 h-12 border-4 border-[var(--brand-primary)] border-t-transparent rounded-full animate-spin" />
            <p className="text-gray-500 font-bold text-sm animate-pulse">{t('orders.syncing')}</p>
        </div>
    );

    if (error && orders.length === 0) return (
        <div className="p-12 text-center bg-white dark:bg-gray-900 rounded-3xl border border-red-100 dark:border-red-900/20">
            <div className="text-red-500 text-4xl mb-4">⚠️</div>
            <h3 className="text-lg font-bold dark:text-white mb-2">{error}</h3>
            <p className="text-sm text-gray-500 max-w-md mx-auto">This usually means your Enterprise License is not active or you need to enable Dev Mode.</p>
        </div>
    );

    const totalNewOrder = newOrder.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header Actions */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex gap-2 p-1 bg-gray-100 dark:bg-gray-900 rounded-xl">
                    {['all', 'pending', 'paid', 'failed'].map(status => (
                        <button
                            key={status}
                            onClick={() => setStatusFilter(status)}
                            className={`px-4 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${statusFilter === status
                                ? 'bg-white dark:bg-white/10 text-[var(--brand-primary)] dark:text-white shadow-sm'
                                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                                }`}
                        >
                            {t(`orders.filter.${status}`)}
                        </button>
                    ))}
                </div>

                <button
                    onClick={() => setShowModal(true)}
                    className="flex items-center gap-2 px-6 py-2.5 bg-[var(--brand-primary)] text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-500/20 hover:scale-105 active:scale-95 transition-all"
                >
                    <Plus className="w-4 h-4" /> {t('orders.create')}
                </button>
            </div>

            {/* List Table */}
            <div className="bg-white dark:bg-[var(--brand-surface)] rounded-3xl border dark:border-[var(--brand-border)] shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-[10px] uppercase font-black text-gray-400 border-b dark:border-[var(--brand-border)]">
                            <tr>
                                <th className="px-6 py-4">{t('orders.ref')}</th>
                                <th className="px-6 py-4">{t('orders.client')}</th>
                                <th className="px-6 py-4">{t('orders.products')}</th>
                                <th className="px-6 py-4">{t('orders.total')}</th>
                                <th className="px-6 py-4">{t('orders.status')}</th>
                                <th className="px-6 py-4 text-right">{t('orders.actions')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y dark:divide-[var(--brand-border)]">
                            {filteredOrders.map((o) => {
                                const items = JSON.parse(o.items_json || '[]');
                                return (
                                    <tr key={o.id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors group">
                                        <td className="px-6 py-6 border-l-2 border-transparent group-hover:border-[var(--brand-primary)]">
                                            <span className="font-mono text-[10px] text-gray-400">#ORD-{o.id}</span>
                                        </td>
                                        <td className="px-6 py-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                                                    <User className="w-4 h-4 text-blue-500" />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-gray-900 dark:text-white">{t('orders.client')} #{o.client_id}</p>
                                                    <p className="text-[10px] text-gray-500">{new Date(o.created_at).toLocaleDateString()}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-6">
                                            <div className="flex flex-wrap gap-1 max-w-[200px]">
                                                {items.slice(0, 2).map((item: any, i: number) => (
                                                    <span key={i} className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-[9px] font-medium">
                                                        {item.quantity}x {item.name}
                                                    </span>
                                                ))}
                                                {items.length > 2 && <span className="text-[9px] text-gray-400">{t('orders.more_items', { count: items.length - 2 })}</span>}
                                            </div>
                                        </td>
                                        <td className="px-6 py-6 font-black text-gray-900 dark:text-white">
                                            {(o.total_amount / 100).toLocaleString('es-CR', { style: 'currency', currency: o.currency })}
                                        </td>
                                        <td className="px-6 py-6">
                                            <StatusBadge status={o.status} />
                                        </td>
                                        <td className="px-6 py-6 text-right">
                                            <div className="flex justify-end gap-2">
                                                {o.status === 'pending' && (
                                                    <button
                                                        onClick={() => generatePaymentLink(o.id)}
                                                        disabled={generatingLink === o.id}
                                                        className="px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg font-bold text-[10px] flex items-center gap-2 hover:bg-blue-100 transition-all disabled:opacity-50"
                                                    >
                                                        {generatingLink === o.id ? <Clock className="w-3 h-3 animate-spin" /> : <CreditCard className="w-3 h-3" />}
                                                        {t('orders.generate_link')}
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Create Order Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-gray-950 w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden border dark:border-gray-800 animate-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between p-8 border-b dark:border-gray-800">
                            <h2 className="text-xl font-bold dark:text-white flex items-center gap-3">
                                <ShoppingCart className="text-[var(--brand-primary)]" />
                                {t('orders.modal.title')}
                            </h2>
                            <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>

                        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8 max-h-[70vh] overflow-y-auto">
                            <div className="space-y-6">
                                <div>
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">{t('orders.modal.select_client')}</label>
                                    <select
                                        className="w-full bg-gray-50 dark:bg-gray-900 p-4 rounded-2xl border-none text-sm font-bold dark:text-white focus:ring-2 focus:ring-[var(--brand-primary)]"
                                        value={newOrder.client_id}
                                        onChange={(e) => setNewOrder({ ...newOrder, client_id: Number(e.target.value) })}
                                    >
                                        <option value="0">{t('orders.modal.choose_client')}</option>
                                        {clients.map(c => (
                                            <option key={c.id} value={c.id}>{c.name} ({c.phone_number})</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">{t('orders.modal.add_products')}</label>
                                    <div className="grid grid-cols-1 gap-2">
                                        {products.map(p => (
                                            <button
                                                key={p.id}
                                                onClick={() => addProductToOrder(p.id)}
                                                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 hover:bg-white dark:hover:bg-gray-800 border dark:border-gray-800 rounded-xl transition-all group"
                                            >
                                                <div className="text-left">
                                                    <p className="font-bold text-sm dark:text-white">{p.name}</p>
                                                    <p className="text-[10px] text-gray-500">{(p.price / 100)} {p.currency}</p>
                                                </div>
                                                <Plus className="w-4 h-4 text-gray-400 group-hover:text-[var(--brand-primary)]" />
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="bg-blue-50/50 dark:bg-blue-900/10 p-6 rounded-3xl border border-blue-100 dark:border-blue-900/20 flex flex-col">
                                <label className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-4 block">{t('orders.modal.summary')}</label>
                                <div className="flex-1 space-y-3 overflow-y-auto mb-6">
                                    {newOrder.items.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center h-40 text-center space-y-2 opacity-50">
                                            <Package className="w-10 h-10 text-blue-200" />
                                            <p className="text-xs text-blue-800 dark:text-blue-300">{t('orders.modal.no_items')}</p>
                                        </div>
                                    ) : (
                                        newOrder.items.map((item, idx) => (
                                            <div key={idx} className="flex items-center justify-between text-xs p-2 bg-white dark:bg-gray-900 rounded-xl shadow-sm">
                                                <div className="flex-1">
                                                    <p className="font-bold dark:text-white">{item.name}</p>
                                                    <p className="text-[10px] text-gray-500">{item.quantity}x @ {(item.price / 100)}</p>
                                                </div>
                                                <button
                                                    onClick={() => setNewOrder({ ...newOrder, items: newOrder.items.filter((_, i) => i !== idx) })}
                                                    className="text-red-500 p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        ))
                                    )}
                                </div>

                                <div className="border-t border-blue-100 dark:border-blue-900/20 pt-4 space-y-4">
                                    <div className="flex justify-between items-end">
                                        <p className="text-xs font-bold text-blue-800 dark:text-blue-300">{t('orders.modal.net_total')}</p>
                                        <p className="text-2xl font-black text-blue-600 dark:text-blue-400">
                                            {(totalNewOrder / 100).toLocaleString('es-CR', { style: 'currency', currency: 'CRC' })}
                                        </p>
                                    </div>
                                    <button
                                        onClick={handleCreateOrder}
                                        disabled={newOrder.items.length === 0 || !newOrder.client_id}
                                        className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-blue-500/30 hover:bg-blue-700 active:scale-95 transition-all disabled:opacity-50 disabled:grayscale"
                                    >
                                        {t('orders.modal.place_order')}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

