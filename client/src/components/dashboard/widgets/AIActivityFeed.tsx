import { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useTranslation } from "react-i18next";
import { API_ENDPOINTS } from '../../../lib/api';
import { Zap, MessageSquare, Shield, Activity } from 'lucide-react';

export default function AIActivityFeed() {
    const { t } = useTranslation();
    const { token } = useAuth();
    const [activities, setActivities] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const formatTimestamp = (ts: string) => {
        const date = new Date(ts);
        const now = new Date();
        const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
        if (diffInSeconds < 60) return t('common.just_now');
        if (diffInSeconds < 3600) return t('common.time_ago', { time: `${Math.floor(diffInSeconds / 60)}m` });
        if (diffInSeconds < 86400) return t('common.time_ago', { time: `${Math.floor(diffInSeconds / 3600)}h` });
        return date.toLocaleDateString();
    };

    const getIcon = (action: string) => {
        if (action.includes('MESSAGE')) return MessageSquare;
        if (action.includes('SECURITY')) return Shield;
        if (action.includes('AI')) return Zap;
        return Activity;
    };

    useEffect(() => {
        const fetchActivity = async () => {
            try {
                const res = await fetch(API_ENDPOINTS.dashboard.activity, {
                    headers: { "Authorization": `Bearer ${token}` }
                });
                if (res.ok) setActivities(await res.json());
            } catch (err) { console.error(err); }
            finally { setIsLoading(false); }
        };
        if (token) fetchActivity();
    }, [token]);

    return (
        <div className="col-span-4 rounded-xl border bg-card text-card-foreground shadow-sm">
            <div className="p-6">
                <h3 className="font-semibold leading-none tracking-tight">{t('dashboard.activity.title')}</h3>
                <p className="text-sm text-muted-foreground mt-1">{t('dashboard.activity.subtitle')}</p>

                <div className="mt-4 space-y-4">
                    {isLoading ? (
                        [1, 2, 3].map(i => <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />)
                    ) : activities.length === 0 ? (
                        <p className="text-xs text-muted-foreground italic text-center py-8">{t('dashboard.activity.empty')}</p>
                    ) : activities.map((log) => {
                        const Icon = getIcon(log.action);
                        return (
                            <div key={log.id} className="flex items-start gap-4 pb-4 mb-4 border-b last:border-0 last:mb-0 last:pb-0">
                                <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
                                    <Icon className="w-4 h-4 text-indigo-500" />
                                </div>
                                <div className="space-y-1">
                                    <p className="text-sm font-medium leading-none">
                                        {log.action.replace(/_/g, ' ')}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        {log.resource}: {log.details || t('dashboard.activity.no_details')}
                                    </p>
                                    <p className="text-[10px] text-muted-foreground font-bold uppercase">{formatTimestamp(log.timestamp)}</p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
