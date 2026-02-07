import StatsGrid from '../components/dashboard/widgets/StatsGrid';
import AIActivityFeed from '../components/dashboard/widgets/AIActivityFeed';
import RecentOrders from '../components/dashboard/widgets/RecentOrders';

import { useTranslation } from "react-i18next";

export default function DashboardHome() {
    const { t } = useTranslation();
    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">{t('dashboard.title')}</h1>
                <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">{t('dashboard.subtitle')}</span>
                </div>
            </div>

            <StatsGrid />

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <AIActivityFeed />
                <RecentOrders />
            </div>
        </div>
    );
}
