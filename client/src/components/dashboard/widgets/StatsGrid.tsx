import { useState, useEffect } from 'react';
import {
    Users,
    ShoppingCart,
    MessageSquare,
    TrendingUp,
    ShieldAlert,
    Clock,
    CreditCard,
    Target
} from 'lucide-react';
import { useTranslation } from "react-i18next";
import { useAuth } from '../../../context/AuthContext';
import { API_ENDPOINTS } from '../../../lib/api';

export default function StatsGrid() {
    const { t } = useTranslation();
    const { token } = useAuth();
    const [statsData, setStatsData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await fetch(API_ENDPOINTS.dashboard.stats, {
                    headers: { "Authorization": `Bearer ${token}` }
                });
                if (res.ok) setStatsData(await res.json());
            } catch (err) { console.error(err); }
            finally { setIsLoading(false); }
        };
        if (token) fetchStats();
    }, [token]);

    const stats = [
        { label: t('dashboard.stats.revenue'), value: statsData ? `$${(statsData.sales.total * 15).toLocaleString()}` : '...', change: statsData?.sales.growth || '', trend: 'up', icon: TrendingUp, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
        { label: t('dashboard.stats.orders'), value: statsData?.sales.total || '0', change: statsData?.sales.growth || '', trend: 'up', icon: ShoppingCart, color: 'text-blue-500', bg: 'bg-blue-500/10' },
        { label: t('dashboard.stats.interactions'), value: statsData?.interactions.total || '0', change: statsData?.interactions.growth || '', trend: 'up', icon: MessageSquare, color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
        { label: t('dashboard.stats.confidence'), value: statsData?.ai_efficiency.value || '94%', change: statsData?.ai_efficiency.growth || '', trend: 'up', icon: Target, color: 'text-cyan-500', bg: 'bg-cyan-500/10' },
        { label: t('dashboard.stats.clients'), value: statsData?.clients.total || '0', change: statsData?.clients.growth || '', trend: 'up', icon: Users, color: 'text-purple-500', bg: 'bg-purple-500/10' },
        { label: t('dashboard.stats.payment_links'), value: '42', change: '82% paid', trend: 'up', icon: CreditCard, color: 'text-orange-500', bg: 'bg-orange-500/10' },
        { label: t('dashboard.stats.feedback'), value: '4.8', change: '+0.2', trend: 'up', icon: ShieldAlert, color: 'text-red-500', bg: 'bg-red-500/10' },
        { label: t('dashboard.stats.response_time'), value: '1.2m', change: '-15s', trend: 'up', icon: Clock, color: 'text-pink-500', bg: 'bg-pink-500/10' },
    ];

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {isLoading ? (
                [1, 2, 3, 4].map(i => (
                    <div key={i} className="h-24 rounded-xl border bg-card animate-pulse shadow-sm" />
                ))
            ) : (
                stats.map((stat, index) => (
                    <div key={index} className="rounded-xl border bg-card text-card-foreground shadow-sm p-4 hover:shadow-md transition-all duration-300">
                        <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{stat.label}</span>
                            <div className={`p-2 rounded-lg ${stat.bg}`}>
                                <stat.icon className={`h-4 w-4 ${stat.color}`} />
                            </div>
                        </div>
                        <div className="flex items-baseline gap-2">
                            <div className="text-2xl font-bold">{stat.value}</div>
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${stat.trend === 'up' ? 'bg-green-500/10 text-green-600' :
                                stat.trend === 'down' ? 'bg-red-500/10 text-red-600' :
                                    'bg-muted text-muted-foreground'
                                }`}>
                                {stat.change}
                            </span>
                        </div>
                    </div>
                ))
            )}
        </div>
    );
}
