import { Outlet, NavLink, useLocation } from "react-router-dom";
import { Brain, Globe, Settings, ChevronRight, ShieldCheck } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function SettingsLayout() {
    const { t } = useTranslation();
    const location = useLocation();

    const SECTIONS = [
        {
            id: "organization",
            label: t('admin.sections.general'),
            icon: Globe,
            items: [
                { id: "general", label: t('admin.sections.business_identity'), path: "/dashboard/settings/organization", icon: Globe },
            ]
        },
        {
            id: "intelligence",
            label: t('admin.sections.intelligence'),
            icon: Brain,
            items: [
                { id: "ai", label: t('admin.tabs.behavior'), path: "/dashboard/settings/intelligence", icon: Brain },
            ]
        },
        {
            id: "integrations",
            label: t('common.integrations'),
            icon: Settings,
            items: [
                { id: "channels", label: t('admin.sections.data_integration'), path: "/dashboard/settings/channels", icon: Settings },
            ]
        },
        {
            id: "system",
            label: t('admin.sections.system'),
            icon: Settings,
            items: [
                { id: "developers", label: t('admin.tabs.audit'), path: "/dashboard/settings/developers", icon: ShieldCheck },
            ]
        }
    ];

    // Find current active section title for header
    const activeRoute = SECTIONS.flatMap(s => s.items).find(i => location.pathname === i.path || location.pathname.startsWith(i.path));

    return (
        <div className="flex h-full w-full bg-slate-50 dark:bg-[var(--brand-bg)] overflow-hidden">
            {/* SETTINGS SIDEBAR */}
            <aside className="w-64 bg-white/50 dark:bg-[var(--brand-surface)]/50 backdrop-blur border-r dark:border-[var(--brand-border)] flex flex-col shrink-0 z-20">
                <div className="p-6 border-b dark:border-[var(--brand-border)]">
                    <h1 className="text-lg font-bold dark:text-white flex items-center gap-2">
                        <Settings className="w-5 h-5 text-[var(--brand-primary)]" />
                        {t('common.settings')}
                    </h1>
                </div>

                <nav className="flex-1 overflow-y-auto p-4 space-y-6">
                    {SECTIONS.map(section => (
                        <div key={section.id}>
                            <h3 className="px-3 mb-2 text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2 select-none">
                                {section.label}
                            </h3>
                            <ul className="space-y-0.5">
                                {section.items.map(item => (
                                    <li key={item.id}>
                                        <NavLink
                                            to={item.path}
                                            className={({ isActive }) => `w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all select-none ${isActive
                                                ? "bg-white dark:bg-white/10 text-[var(--brand-primary)] shadow-sm dark:text-white"
                                                : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                                                }`}
                                        >
                                            {item.icon && <item.icon className="w-3.5 h-3.5" />}
                                            <span className="truncate">{item.label}</span>
                                            {location.pathname === item.path && <ChevronRight className="w-3 h-3 ml-auto opacity-50" />}
                                        </NavLink>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </nav>
            </aside>

            {/* MAIN CONTENT */}
            <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-white dark:bg-[var(--brand-bg)]">
                {/* Header */}
                <header className="h-14 border-b dark:border-[var(--brand-border)] bg-white/80 dark:bg-[var(--brand-surface)]/80 backdrop-blur-sm flex items-center px-8 justify-between shrink-0 sticky top-0 z-10">
                    <div className="flex items-center gap-2 text-xs font-medium text-gray-500">
                        <span className="uppercase tracking-wider">{t('common.settings')}</span>
                        <ChevronRight className="w-3 h-3" />
                        <span className="font-bold text-gray-900 dark:text-white">
                            {activeRoute?.label || t('admin.sections.general')}
                        </span>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto px-8 pb-8 pt-0 scroll-smooth">
                    <div className="max-w-[1600px] mx-auto pb-20 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <Outlet />
                    </div>
                </div>
            </main>
        </div>
    );
}
