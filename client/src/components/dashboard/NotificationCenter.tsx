import { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
    Bell,
    X,
    ShieldAlert,
    ShoppingCart,
    MessageSquare,
    Package,
    ChevronRight,
    CheckCircle2
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { API_ENDPOINTS } from '../../lib/api';

export interface Notification {
    id: string;
    type: 'ai' | 'sales' | 'system' | 'inventory';
    severity: 'info' | 'warning' | 'critical';
    title: string;
    description: string;
    timestamp: string;
    isRead: boolean;
}

export default function NotificationCenter() {
    const { t } = useTranslation();
    const { token } = useAuth();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const location = useLocation();
    const navigate = useNavigate();
    const [retryCount, setRetryCount] = useState(0);

    const fetchNotifications = async () => {
        try {
            const res = await fetch(API_ENDPOINTS.notifications.base, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setNotifications(data.map((n: any) => ({
                    ...n,
                    isRead: n.is_read,
                    timestamp: formatTimestamp(n.timestamp)
                })));
            }
        } catch (err) {
            console.error("Failed to fetch notifications", err);
        } finally {
            setIsLoading(false);
        }
    };

    const formatTimestamp = (ts: string) => {
        const date = new Date(ts);
        const now = new Date();
        const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

        if (diffInSeconds < 60) return t('common.just_now') || 'Just now';
        if (diffInSeconds < 3600) return t('common.time_ago', { time: Math.floor(diffInSeconds / 60) + 'm' }) || `${Math.floor(diffInSeconds / 60)}m ago`;
        if (diffInSeconds < 86400) return t('common.time_ago', { time: Math.floor(diffInSeconds / 3600) + 'h' }) || `${Math.floor(diffInSeconds / 3600)}h ago`;
        return date.toLocaleDateString();
    };

    useEffect(() => {
        if (token) fetchNotifications();
    }, [token]);

    // WebSocket Integration
    useEffect(() => {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const socket = new WebSocket(`${protocol}//${window.location.hostname}:8000/ws/chat`);

        socket.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (data.type === 'notification') {
                    const newNotif: Notification = {
                        id: Math.random().toString(36).substr(2, 9),
                        type: data.data.type || 'ai',
                        severity: data.data.severity || 'info',
                        title: data.data.title,
                        description: data.data.description,
                        timestamp: 'Just now',
                        isRead: false
                    };
                    setNotifications(prev => [newNotif, ...prev]);

                    if (newNotif.severity === 'critical') {
                        const audio = new Audio('/assets/sounds/alert.mp3');
                        audio.play().catch(() => { });
                    }
                }
            } catch (e) {
                console.error('WS Notification Error', e);
            }
        };

        socket.onclose = () => {
            const timeout = Math.min(1000 * Math.pow(2, retryCount), 10000);
            setTimeout(() => setRetryCount(prev => prev + 1), timeout);
        };

        return () => socket.close();
    }, [retryCount]);

    // Close notifications when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    // Close on navigation
    useEffect(() => { setIsOpen(false); }, [location.pathname]);

    const unreadCount = notifications.filter(n => !n.isRead).length;

    const markAllRead = async () => {
        try {
            await fetch(API_ENDPOINTS.notifications.readAll, {
                method: "POST",
                headers: { "Authorization": `Bearer ${token}` }
            });
            setNotifications(notifications.map(n => ({ ...n, isRead: true })));
        } catch (err) {
            console.error("Failed to mark all as read", err);
        }
    };

    const handleAction = (n: Notification) => {
        // Mark as read when clicking action
        setNotifications(prev => prev.map(notif => notif.id === n.id ? { ...notif, isRead: true } : notif));

        switch (n.type) {
            case 'ai':
                navigate('/dashboard/settings/intelligence');
                break;
            case 'sales':
                navigate('/dashboard/orders');
                break;
            case 'inventory':
                navigate('/dashboard/products');
                break;
            case 'system':
                navigate('/dashboard/settings/developers');
                break;
            default:
                navigate('/dashboard');
        }
        setIsOpen(false);
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'ai': return <ShieldAlert className="h-4 w-4" />;
            case 'sales': return <ShoppingCart className="h-4 w-4" />;
            case 'inventory': return <Package className="h-4 w-4" />;
            default: return <MessageSquare className="h-4 w-4" />;
        }
    };

    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case 'critical': return 'text-red-500 bg-red-500/10';
            case 'warning': return 'text-orange-500 bg-orange-500/10';
            default: return 'text-blue-500 bg-blue-500/10';
        }
    };

    return (
        <div className="relative" ref={containerRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 rounded-full hover:bg-accent hover:text-accent-foreground transition-colors"
                title={t('common.notifications') || "Notifications"}
            >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 border-2 border-background text-[8px] font-bold text-white">
                        {unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-3 w-80 md:w-96 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl z-[100] animate-in fade-in zoom-in-95 duration-200">
                    <div className="flex items-center justify-between p-4 border-b">
                        <div className="flex items-center gap-2">
                            <h3 className="font-bold text-sm">{t('common.notifications') || "Notifications"}</h3>
                            <span className="px-1.5 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold">
                                {unreadCount} {t('common.new') || "New"}
                            </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                            <button
                                onClick={markAllRead}
                                className="text-primary hover:underline font-medium"
                            >
                                {t('common.mark_all_read') || "Mark all as read"}
                            </button>
                            <button onClick={() => setIsOpen(false)} className="text-muted-foreground hover:text-foreground">
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                    </div>

                    <div className="max-h-[400px] overflow-y-auto">
                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center py-12 space-y-3">
                                <div className="w-8 h-8 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 animate-pulse">{t('common.synchronizing') || "Synchronizing..."}</p>
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className="p-8 text-center text-muted-foreground space-y-2">
                                <CheckCircle2 className="h-8 w-8 mx-auto opacity-20" />
                                <p className="text-sm italic">{t('common.all_caught_up') || "All caught up!"}</p>
                            </div>
                        ) : (
                            <div className="divide-y dark:divide-slate-800">
                                {notifications.map((n) => (
                                    <div
                                        key={n.id}
                                        onClick={() => handleAction(n)}
                                        className={`p-4 flex gap-3 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors group relative cursor-pointer ${!n.isRead ? 'bg-indigo-50/10 dark:bg-indigo-500/5' : ''}`}
                                    >
                                        <div className={`mt-1 p-2 rounded-lg h-fit ${getSeverityColor(n.severity)}`}>
                                            {getIcon(n.type)}
                                        </div>
                                        <div className="flex-1 space-y-1">
                                            <div className="flex items-center justify-between">
                                                <p className={`text-xs font-bold leading-none ${!n.isRead ? 'text-foreground' : 'text-muted-foreground'}`}>
                                                    {n.title}
                                                </p>
                                                <span className="text-[10px] text-muted-foreground">{n.timestamp}</span>
                                            </div>
                                            <p className="text-xs text-muted-foreground line-clamp-2">
                                                {n.description}
                                            </p>
                                            <div className="flex items-center gap-1 text-[10px] font-bold text-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity uppercase tracking-widest pt-1">
                                                {t('common.take_action') || "Take Action"} <ChevronRight className="h-3 w-3" />
                                            </div>
                                        </div>
                                        {!n.isRead && (
                                            <div className="absolute right-2 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-indigo-500" />
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="p-3 border-t bg-muted/30 rounded-b-xl text-center">
                        <button
                            onClick={() => {
                                navigate('/dashboard/settings/developers');
                                setIsOpen(false);
                            }}
                            className="text-xs font-bold text-muted-foreground hover:text-foreground transition-colors uppercase tracking-widest"
                        >
                            {t('common.view_all_logs') || "View All Activity Log"}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
