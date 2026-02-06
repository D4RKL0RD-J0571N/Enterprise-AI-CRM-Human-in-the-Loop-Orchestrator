import { Palette, Image as ImageIcon, Layout, CheckCircle, Shield } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { AIConfig } from "../../../types/admin";

interface Props {
    config: AIConfig;
    setConfig: (config: AIConfig) => void;
}

export const BrandingTab = ({ config, setConfig }: Props) => {
    const { t } = useTranslation();
    // Helper to update workspace config
    const updateWorkspace = (key: string, value: any) => {
        const currentWS = typeof config.workspace_config === 'string'
            ? JSON.parse(config.workspace_config || "{}")
            : (config.workspace_config || {});

        const newWS = { ...currentWS, [key]: value };
        setConfig({ ...config, workspace_config: JSON.stringify(newWS) });
    };

    const getWorkspace = () => {
        try {
            return typeof config.workspace_config === 'string'
                ? JSON.parse(config.workspace_config || "{}")
                : (config.workspace_config || {});
        } catch (e) { return {}; }
    };

    const ws = getWorkspace();

    const colors = [
        { name: t('admin.branding.colors.blue'), value: "#2563eb" },
        { name: t('admin.branding.colors.green'), value: "#10b981" },
        { name: t('admin.branding.colors.navy'), value: "#1e3a8a" },
        { name: t('admin.branding.colors.gold'), value: "#d4af37" },
        { name: t('admin.branding.colors.purple'), value: "#7c3aed" },
        { name: t('admin.branding.colors.orange'), value: "#f59e0b" },
    ];

    const bgColors = [
        { name: t('admin.branding.bg_colors.slate'), value: "#030712" },
        { name: t('admin.branding.bg_colors.midnight'), value: "#020617" },
        { name: t('admin.branding.bg_colors.ocean'), value: "#080c1d" },
        { name: t('admin.branding.bg_colors.forest'), value: "#06130b" },
        { name: t('admin.branding.bg_colors.pure'), value: "#000000" },
    ];

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="bg-white dark:bg-gray-950 p-8 rounded-3xl border dark:border-gray-800 shadow-xl transition-all">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h2 className="text-xl font-bold dark:text-white flex items-center gap-3">
                            <Palette className="w-6 h-6 text-brand-primary" style={{ color: 'var(--brand-primary)' }} /> {t('admin.branding.title')}
                        </h2>
                        <p className="text-sm text-gray-500">{t('admin.branding.desc')}</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                    {/* Primary Color */}
                    <div className="space-y-6">
                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                            {t('admin.branding.primary_color')}
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                            {colors.map((c) => (
                                <button
                                    key={c.value}
                                    onClick={() => setConfig({ ...config, primary_color: c.value })}
                                    aria-label={`Select ${c.name} as primary color`}
                                    className={`relative h-12 rounded-xl transition-all hover:scale-105 flex items-center justify-center border-2 select-none hover-premium ${config.primary_color === c.value ? "border-white shadow-lg ring-2" : "border-transparent"}`}
                                    style={{ backgroundColor: c.value, outlineColor: config.primary_color === c.value ? c.value : undefined }}
                                >
                                    {config.primary_color === c.value && <CheckCircle className="text-white w-4 h-4 shadow-sm" />}
                                </button>
                            ))}
                            <div className="relative h-12 rounded-xl bg-gray-100 dark:bg-gray-800 border-2 border-dashed border-gray-300 dark:border-gray-700 flex items-center justify-center group overflow-hidden cursor-pointer"
                                onClick={() => document.getElementById('primary-picker')?.click()}>
                                <input
                                    id="primary-picker"
                                    type="color"
                                    value={config.primary_color}
                                    onChange={(e) => setConfig({ ...config, primary_color: e.target.value })}
                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                />
                                <span className="text-[9px] font-bold text-gray-400 group-hover:text-brand-primary" style={{ color: config.primary_color === config.primary_color ? undefined : 'var(--brand-primary)' }}>{t('admin.branding.custom')}</span>
                            </div>
                        </div>
                    </div>

                    {/* Secondary Color */}
                    <div className="space-y-6">
                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                            {t('admin.branding.secondary_color')}
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                            {colors.map((c) => (
                                <button
                                    key={c.value}
                                    onClick={() => updateWorkspace('secondary_color', c.value)}
                                    aria-label={`Select ${c.name} as secondary color`}
                                    className={`relative h-12 rounded-xl transition-all hover:scale-105 flex items-center justify-center border-2 select-none hover-premium ${ws.secondary_color === c.value ? "border-white shadow-lg ring-2 ring-brand-secondary" : "border-transparent"}`}
                                    style={{ backgroundColor: c.value }}
                                >
                                    {ws.secondary_color === c.value && <CheckCircle className="text-white w-4 h-4 shadow-sm" />}
                                </button>
                            ))}
                            <div className="relative h-12 rounded-xl bg-gray-100 dark:bg-gray-800 border-2 border-dashed border-gray-300 dark:border-gray-700 flex items-center justify-center group overflow-hidden cursor-pointer"
                                onClick={() => document.getElementById('secondary-picker')?.click()}>
                                <input
                                    id="secondary-picker"
                                    type="color"
                                    value={ws.secondary_color || "#6366f1"}
                                    onChange={(e) => updateWorkspace('secondary_color', e.target.value)}
                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                />
                                <span className="text-[9px] font-bold text-gray-400 group-hover:text-brand-secondary" style={{ color: 'var(--brand-secondary)' }}>{t('admin.branding.custom')}</span>
                            </div>
                        </div>
                    </div>

                    {/* Dark Mode Background Color */}
                    <div className="space-y-6">
                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                            {t('admin.branding.bg_color_dark')}
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                            {bgColors.map((c) => (
                                <button
                                    key={c.value}
                                    onClick={() => updateWorkspace('bg_color', c.value)}
                                    aria-label={`Select ${c.name} as dark background`}
                                    className={`relative h-12 rounded-xl transition-all hover:scale-105 flex items-center justify-center border-2 select-none hover-premium ${ws.bg_color === c.value ? "border-white shadow-lg ring-2 ring-gray-400" : "border-transparent"}`}
                                    style={{ backgroundColor: c.value }}
                                >
                                    {ws.bg_color === c.value && <CheckCircle className="text-white w-4 h-4" />}
                                </button>
                            ))}
                            <div className="relative h-12 rounded-xl bg-gray-100 dark:bg-gray-800 border-2 border-dashed border-gray-300 dark:border-gray-700 flex items-center justify-center group overflow-hidden cursor-pointer"
                                onClick={() => document.getElementById('bg-picker')?.click()}>
                                <input
                                    id="bg-picker"
                                    type="color"
                                    value={ws.bg_color || "#030712"}
                                    onChange={(e) => updateWorkspace('bg_color', e.target.value)}
                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                />
                                <span className="text-[9px] font-bold text-gray-400 group-hover:text-gray-200">{t('admin.branding.custom')}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-12 pt-8 border-t dark:border-gray-800 grid grid-cols-1 lg:grid-cols-2 gap-12">
                    {/* Interface Roundness */}
                    <div className="space-y-6">
                        <div className="flex justify-between items-center">
                            <label className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2 select-none">
                                <Layout className="w-4 h-4" /> {t('admin.branding.border_radius')}
                            </label>
                            <span className="text-xs font-bold dark:text-gray-400 tabular-nums">{ws.border_radius ?? 12}px</span>
                        </div>
                        <input
                            type="range"
                            min="0" max="32"
                            value={ws.border_radius ?? 12}
                            onChange={(e) => updateWorkspace('border_radius', parseInt(e.target.value))}
                            className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
                            style={{ accentColor: 'var(--brand-primary)' }}
                        />
                        <div className="flex justify-between text-[10px] text-gray-500 uppercase font-black tracking-tighter">
                            <span>{t('admin.branding.roundness_sharp')}</span>
                            <span>{t('admin.branding.roundness_standard')}</span>
                            <span>{t('admin.branding.roundness_rounded')}</span>
                        </div>
                    </div>

                    {/* UI Density */}
                    <div className="space-y-6">
                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                            <Layout className="w-4 h-4" /> {t('admin.branding.ui_density')}
                        </label>
                        <div className="flex gap-4">
                            {[
                                { id: "comfortable", label: t('admin.branding.density_comfortable') },
                                { id: "compact", label: t('admin.branding.density_compact') }
                            ].map((opt) => (
                                <button
                                    key={opt.id}
                                    onClick={() => setConfig({ ...config, ui_density: opt.id as any })}
                                    aria-label={`Set density to ${opt.label}`}
                                    className={`flex-1 py-4 transition-all font-black text-xs uppercase tracking-widest border-2 select-none hover-premium ${config.ui_density === opt.id
                                        ? "border-brand-primary bg-brand-primary-muted text-brand-primary shadow-md"
                                        : "border-gray-100 dark:border-gray-800 text-gray-400 hover:border-gray-300 dark:hover:border-gray-700"
                                        }`}
                                    style={{ borderRadius: 'var(--brand-radius)', borderColor: config.ui_density === opt.id ? 'var(--brand-primary)' : undefined, color: config.ui_density === opt.id ? 'var(--brand-primary)' : undefined }}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                        <p className="text-[10px] text-gray-500 italic">{t('admin.branding.density_hint')}</p>
                    </div>
                </div>

                <div className="mt-8 pt-8 border-t dark:border-gray-800">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2 mb-4">
                        <ImageIcon className="w-4 h-4" /> {t('admin.branding.logo_favicon_url')}
                    </label>
                    <div className="flex gap-4 items-center">
                        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 flex items-center justify-center overflow-hidden flex-shrink-0 border dark:border-gray-700 shadow-inner" style={{ borderRadius: 'calc(var(--brand-radius) / 2)' }}>
                            {config.logo_url ? <img src={config.logo_url} className="max-h-full object-contain" /> : <ImageIcon className="w-6 h-6 text-gray-400" />}
                        </div>
                        <div className="flex-1">
                            <input
                                id="logo-url"
                                type="text"
                                value={config.logo_url || ""}
                                onChange={(e) => setConfig({ ...config, logo_url: e.target.value })}
                                placeholder={t('admin.branding.logo_placeholder')}
                                spellCheck={false}
                                autoComplete="off"
                                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border-none text-base focus:ring-2 focus:ring-blue-500 dark:text-white outline-none shadow-inner"
                                style={{ borderRadius: 'var(--brand-radius)' }}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Premium Live Preview */}
            <div className="p-8 border dark:border-gray-800 shadow-2xl relative overflow-hidden group transition-all"
                style={{ backgroundColor: 'var(--brand-bg)', borderRadius: 'var(--brand-radius)' }}>
                <div
                    className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br blur-3xl pointer-events-none opacity-20"
                    style={{
                        background: `linear-gradient(to bottom right, ${config.primary_color}, ${ws.secondary_color || config.primary_color})`
                    }}
                ></div>

                <div className="relative flex items-center justify-between gap-6 mb-10">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white dark:bg-gray-800 flex items-center justify-center p-2 shadow-xl border dark:border-gray-700" style={{ borderRadius: `${ws.border_radius ?? 12}px` }}>
                            {config.logo_url ? <img src={config.logo_url} className="max-h-full object-contain" /> : <Shield className="w-6 h-6" style={{ color: config.primary_color }} />}
                        </div>
                        <div>
                            <h4 className="text-xl font-black dark:text-white uppercase tracking-tighter" style={{ color: config.primary_color }}>{config.business_name || t('admin.fields.business_name')}</h4>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: ws.secondary_color || config.primary_color }}></span>
                                <span className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">{t('admin.branding.live_engine')}</span>
                            </div>
                        </div>
                    </div>
                    <div className="px-4 py-2 rounded-full text-[10px] font-black uppercase text-white shadow-lg" style={{ backgroundColor: config.primary_color, borderRadius: `${(ws.border_radius ?? 12) * 2}px` }}>
                        {t('admin.branding.preview_active')}
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="h-2 rounded-full bg-gray-100 dark:bg-gray-800 w-full" style={{ borderRadius: `${ws.border_radius ?? 4}px` }}></div>
                    <div className="h-2 rounded-full bg-gray-100 dark:bg-gray-800 w-2/3" style={{ borderRadius: `${ws.border_radius ?? 4}px` }}></div>
                    <div className="h-2 rounded-full bg-gray-100 dark:bg-gray-800 w-3/4" style={{ borderRadius: `${ws.border_radius ?? 4}px` }}></div>
                </div>
            </div>
        </div>
    );
};
