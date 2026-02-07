import { useTranslation } from 'react-i18next';
import { NavLink } from 'react-router-dom';
import {
    LayoutDashboard,
    MessageSquare,
    ShoppingCart,
    Users,
    BarChart3,
    Settings,
    Package
} from 'lucide-react';
import { useBrandingContext } from '../../context/BrandingContext';

interface SidebarProps {
    isCollapsed: boolean;
}

export default function Sidebar({ isCollapsed }: SidebarProps) {
    const { t } = useTranslation();
    const { config } = useBrandingContext();

    const navItems = [
        { title: t('sidebar.dashboard'), href: '/dashboard', icon: LayoutDashboard, end: true },
        { title: t('sidebar.messages'), href: '/dashboard/chat', icon: MessageSquare },
        { title: t('sidebar.products'), href: '/dashboard/products', icon: Package },
        { title: t('sidebar.orders'), href: '/dashboard/orders', icon: ShoppingCart },
        { title: t('sidebar.clients'), href: '/dashboard/clients', icon: Users },
        { title: t('sidebar.analytics'), href: '/dashboard/analytics', icon: BarChart3 },
        { title: t('sidebar.settings'), href: '/dashboard/settings', icon: Settings },
    ];

    return (
        <aside className={`${isCollapsed ? 'w-20' : 'w-64'} border-r border-border bg-card/50 hidden md:flex flex-col h-full transition-all duration-300 ease-in-out`}>
            <div className={`h-16 flex items-center border-b border-border transition-all ${isCollapsed ? 'justify-center px-0' : 'px-6'}`}>
                {config.logo_url ? (
                    <img src={config.logo_url} alt="Logo" className={`${isCollapsed ? 'h-6 w-6' : 'h-8 max-w-[150px]'} object-contain`} />
                ) : (
                    !isCollapsed && (
                        <span className="text-xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent truncate">
                            {config.business_name || 'AI CRM'}
                        </span>
                    )
                )}
            </div>

            <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1 custom-scrollbar">
                {navItems.map((item) => (
                    <NavLink
                        key={item.href}
                        to={item.href}
                        end={item.end}
                        title={isCollapsed ? item.title : undefined}
                        className={({ isActive }: any) => `
                            flex items-center rounded-lg text-sm font-semibold transition-all duration-200 relative group
                            ${isCollapsed ? 'justify-center p-2.5' : 'gap-3 px-4 py-2.5'}
                            ${isActive
                                ? 'bg-primary/10 text-primary shadow-[inset_0_0_0_1px_rgba(var(--brand-primary-rgb),0.1)]'
                                : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                            }
                        `}
                    >
                        {({ isActive }: { isActive: boolean }) => (
                            <>
                                {/* Active Indicator Bar */}
                                {isActive && (
                                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-r-full shadow-[0_0_8px_rgba(var(--brand-primary-rgb),0.4)] transition-all duration-300 animate-in fade-in zoom-in" />
                                )}

                                <item.icon className={`h-4.5 w-4.5 shrink-0 transition-all duration-200 ${isActive ? 'scale-110 drop-shadow-[0_0_3px_rgba(var(--brand-primary-rgb),0.5)]' : 'group-hover:scale-110'}`} />
                                {!isCollapsed && <span className="truncate">{item.title}</span>}
                            </>
                        )}
                    </NavLink>
                ))}
            </nav>

            <div className={`p-4 border-t border-border transition-all ${isCollapsed ? 'flex justify-center' : ''}`}>
                {isCollapsed ? (
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">
                        <Package className="w-4 h-4" />
                    </div>
                ) : (
                    <div className="rounded-lg bg-primary/5 p-3">
                        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                            {t('sidebar.enterprise_plan')}
                        </h4>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 mb-2">
                            <div className="bg-primary h-1.5 rounded-full" style={{ width: '100%' }}></div>
                        </div>
                        <p className="text-xs text-muted-foreground">{t('sidebar.unlimited_messages')}</p>
                    </div>
                )}
            </div>
        </aside>
    );
}
