import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Search, Menu, ShoppingCart, User as UserIcon } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from 'react-i18next';
import NotificationCenter from './NotificationCenter';
import { API_ENDPOINTS } from '../../lib/api';

interface TopBarProps {
    onToggleSidebar: () => void;
}

export default function TopBar({ onToggleSidebar }: TopBarProps) {
    const { t } = useTranslation();
    const { user, logout, token } = useAuth();
    const navigate = useNavigate();

    const [searchQuery, setSearchQuery] = useState("");
    const [results, setResults] = useState<{ clients: any[], orders: any[], products: any[] } | null>(null);
    const [isSearching, setIsSearching] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            if (searchQuery.length >= 2) {
                performSearch();
            } else {
                setResults(null);
            }
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [searchQuery]);

    const performSearch = async () => {
        setIsSearching(true);
        try {
            const res = await fetch(`${API_ENDPOINTS.admin.config.replace('/admin/config', '/search')}?q=${encodeURIComponent(searchQuery)}`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (res.ok) setResults(await res.json());
        } catch (err) {
            console.error("Search error", err);
        } finally {
            setIsSearching(false);
        }
    };

    // Close on click outside
    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(e.target as Node)) setResults(null);
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <header className="h-16 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-6 flex items-center justify-between gap-4 z-50">
            <div className="flex items-center gap-4 flex-1">
                <button
                    onClick={onToggleSidebar}
                    className="p-2 rounded-md hover:bg-accent transition-colors shrink-0"
                    title="Toggle Sidebar"
                >
                    <Menu className="h-5 w-5" />
                </button>

                <div className="flex-1 flex max-w-md gap-2 items-center relative" ref={searchRef}>
                    <div className="relative w-full">
                        <Search className={`absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground ${isSearching ? 'animate-pulse text-[var(--brand-primary)]' : ''}`} />
                        <input
                            type="search"
                            placeholder={t('common.search_placeholder')}
                            className="w-full bg-background pl-9 pr-4 h-9 rounded-md border border-input text-sm outline-none focus:ring-1 focus:ring-[var(--brand-primary)] transition-all"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    {results && (results.clients.length > 0 || results.orders.length > 0 || results.products.length > 0) && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-950 border dark:border-slate-800 rounded-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 z-[100]">
                            <div className="max-h-[400px] overflow-y-auto p-2 space-y-4">
                                {results.clients.length > 0 && (
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 px-3 py-2">{t('sidebar.clients')}</p>
                                        <div className="space-y-1">
                                            {results.clients.map(c => (
                                                <button key={c.id} onClick={() => { navigate(`/dashboard/clients`); setResults(null); }} className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors flex items-center justify-between group">
                                                    <div className="flex items-center gap-2">
                                                        <UserIcon className="w-3 h-3 text-slate-400" />
                                                        <span className="text-xs font-bold">{c.name}</span>
                                                    </div>
                                                    <span className="text-[10px] text-slate-500 font-mono">{c.phone}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {results.orders.length > 0 && (
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 px-3 py-2">{t('sidebar.orders')}</p>
                                        <div className="space-y-1">
                                            {results.orders.map(o => (
                                                <button key={o.id} onClick={() => { navigate(`/dashboard/orders`); setResults(null); }} className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <ShoppingCart className="w-3 h-3 text-slate-400" />
                                                        <span className="text-xs font-bold">#{o.external_id || o.id}</span>
                                                    </div>
                                                    <span className={`text-[10px] font-black uppercase px-1.5 py-0.5 rounded ${o.status === 'paid' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-500/10 text-slate-500'}`}>{o.status}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {(!results.clients.length && !results.orders.length && !results.products.length) && (
                                    <div className="p-4 text-center text-sm text-slate-500 italic">{t('common.no_results')} "{searchQuery}"</div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="flex items-center gap-4">
                <NotificationCenter />

                <div className="flex items-center gap-3 pl-4 border-l">
                    <div className="flex flex-col items-end hidden sm:flex">
                        <span className="text-sm font-medium leading-none">{user?.username}</span>
                        <span className="text-xs text-muted-foreground font-bold uppercase tracking-tighter">{user?.role || t('common.admin_role')}</span>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="p-2 rounded-full hover:bg-red-50 hover:text-red-600 transition-colors"
                        title={t('common.logout')}
                    >
                        <LogOut className="h-5 w-5" />
                    </button>
                </div>
            </div>
        </header>
    );
}
