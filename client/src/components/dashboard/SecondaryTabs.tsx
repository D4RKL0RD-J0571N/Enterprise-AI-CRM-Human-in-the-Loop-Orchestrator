import React from 'react';

interface Tab {
    id: string;
    label: string;
    icon?: React.ElementType;
}

interface SecondaryTabsProps {
    tabs: Tab[];
    activeTab: string;
    onChange: (id: string) => void;
}

export const SecondaryTabs: React.FC<SecondaryTabsProps> = ({ tabs, activeTab, onChange }) => {
    return (
        <div className="flex gap-1 border-b dark:border-gray-800 mb-6 sticky top-0 bg-white/90 dark:bg-[var(--brand-bg)]/90 backdrop-blur-md z-10 py-2 pt-4">
            {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                    <button
                        key={tab.id}
                        onClick={() => onChange(tab.id)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all relative
                            ${isActive
                                ? "text-[var(--brand-primary)] bg-[var(--brand-primary)]/5"
                                : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5"
                            }
                        `}
                    >
                        {Icon && <Icon className={`w-4 h-4 ${isActive ? "text-[var(--brand-primary)]" : "text-gray-400"}`} />}
                        {tab.label}
                        {isActive && (
                            <div className="absolute bottom-0 left-2 right-2 h-0.5 bg-[var(--brand-primary)] rounded-full" />
                        )}
                    </button>
                );
            })}
        </div>
    );
};
