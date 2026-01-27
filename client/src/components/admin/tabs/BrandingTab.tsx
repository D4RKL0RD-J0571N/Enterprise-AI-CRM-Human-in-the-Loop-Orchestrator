import { useEffect } from "react";
import { Palette, Image as ImageIcon, Layout, CheckCircle, Shield } from "lucide-react";
import type { AIConfig } from "../../../types/admin";

interface Props {
    config: AIConfig;
    setConfig: (config: AIConfig) => void;
}

export const BrandingTab = ({ config, setConfig }: Props) => {
    // const { t } = useTranslation(); // useTranslation is imported but t is currently unused.

    // Force real-time CSS variable update for Preview
    useEffect(() => {
        if (config.primary_color) {
            document.documentElement.style.setProperty('--primary-color', config.primary_color);
        }
    }, [config.primary_color]);

    const colors = [
        { name: "SaaS Blue", value: "#2563eb" },
        { name: "Medical Green", value: "#10b981" },
        { name: "Professional Navy", value: "#1e3a8a" },
        { name: "Luxury Gold", value: "#d4af37" },
        { name: "Cyber Purple", value: "#7c3aed" },
        { name: "Energy Orange", value: "#f59e0b" },
    ];

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="bg-white dark:bg-gray-950 p-8 rounded-3xl border dark:border-gray-800 shadow-xl">
                <h2 className="text-xl font-bold dark:text-white flex items-center gap-3">
                    <Palette className="w-6 h-6 text-indigo-500" /> Branding & Estilo UI
                </h2>
                <p className="text-sm text-gray-500 mt-2 mb-8">Personaliza la identidad visual de tu asistente para que coincida con tu marca B2B.</p>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                    {/* Color Picker */}
                    <div className="space-y-6">
                        <label className="text-sm font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                            <Palette className="w-4 h-4" /> Color Primario de Marca
                        </label>
                        <div className="grid grid-cols-3 gap-3">
                            {colors.map((c) => (
                                <button
                                    key={c.value}
                                    onClick={() => setConfig({ ...config, primary_color: c.value })}
                                    className={`relative h-16 rounded-2xl transition-all hover:scale-105 flex items-center justify-center border-4 ${config.primary_color === c.value ? "border-blue-500/50 scale-105 shadow-lg" : "border-transparent"
                                        }`}
                                    style={{ backgroundColor: c.value }}
                                >
                                    {config.primary_color === c.value && <CheckCircle className="text-white w-6 h-6 drop-shadow-md" />}
                                    <span className="absolute bottom-1 right-2 text-[8px] font-black text-white/50 uppercase">{c.name}</span>
                                </button>
                            ))}
                            <div className="relative h-16 rounded-2xl bg-gray-100 dark:bg-gray-800 border-2 border-dashed border-gray-300 dark:border-gray-700 flex items-center justify-center group overflow-hidden">
                                <input
                                    type="color"
                                    value={config.primary_color}
                                    onChange={(e) => setConfig({ ...config, primary_color: e.target.value })}
                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                />
                                <span className="text-[10px] font-bold text-gray-400 group-hover:text-blue-500 transition-colors">Personalizado</span>
                            </div>
                        </div>
                    </div>

                    {/* Logo & Icons */}
                    <div className="space-y-6">
                        <label className="text-sm font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                            <ImageIcon className="w-4 h-4" /> Identidad Logotipo (URL)
                        </label>
                        <div className="space-y-4">
                            <input
                                type="text"
                                value={config.logo_url || ""}
                                onChange={(e) => setConfig({ ...config, logo_url: e.target.value })}
                                placeholder="https://tu-marca.com/logo.png"
                                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border-none rounded-2xl text-sm focus:ring-2 focus:ring-blue-500 dark:text-white outline-none shadow-inner"
                            />
                            <div className="h-32 bg-gray-50 dark:bg-gray-900 rounded-3xl border-2 border-dashed border-gray-200 dark:border-gray-800 flex items-center justify-center relative overflow-hidden group">
                                {config.logo_url ? (
                                    <img src={config.logo_url} alt="Logo Preview" className="max-h-20 object-contain transition-transform group-hover:scale-110" />
                                ) : (
                                    <div className="text-center space-y-2">
                                        <ImageIcon className="w-8 h-8 text-gray-300 mx-auto" />
                                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">Vista previa del logo</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-12 pt-8 border-t dark:border-gray-800 space-y-6">
                    <label className="text-sm font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                        <Layout className="w-4 h-4" /> Densidad de la Interfaz
                    </label>
                    <div className="flex gap-4">
                        {[
                            { id: "comfortable", label: "Cómodo", desc: "Espaciado generoso para baja carga cognitiva." },
                            { id: "compact", label: "Compacto", desc: "Maximiza la visibilidad para altos volúmenes de chats." }
                        ].map((opt) => (
                            <button
                                key={opt.id}
                                onClick={() => setConfig({ ...config, ui_density: opt.id as any })}
                                className={`flex-1 p-6 rounded-3xl border-2 transition-all text-left group ${config.ui_density === opt.id
                                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/10"
                                    : "border-gray-100 dark:border-gray-800 hover:border-blue-200 dark:hover:border-blue-700 bg-white dark:bg-gray-950"
                                    }`}
                            >
                                <h4 className={`font-black text-sm uppercase tracking-widest ${config.ui_density === opt.id ? "text-blue-600" : "text-gray-400 group-hover:text-gray-200"}`}>{opt.label}</h4>
                                <p className="text-xs text-gray-500 mt-2 font-medium">{opt.desc}</p>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Premium Preview Card */}
            <div className="bg-white dark:bg-gray-950 p-8 rounded-3xl border dark:border-gray-800 shadow-2xl relative overflow-hidden group">
                <div
                    className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-transparent to-transparent blur-3xl pointer-events-none"
                    style={{
                        background: `linear-gradient(to bottom right, ${config.primary_color}1a, transparent)`
                    }}
                ></div>
                <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-6">Vista Previa de Marca</h3>
                <div className="flex items-center gap-6">
                    <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center p-2 shadow-inner">
                        {config.logo_url ? <img src={config.logo_url} className="max-h-full object-contain" /> : <Shield className="text-blue-600 w-8 h-8" />}
                    </div>
                    <div>
                        <h4 className="text-2xl font-black dark:text-white uppercase tracking-tighter" style={{ color: config.primary_color }}>{config.business_name || "Tu Negocio"}</h4>
                        <p className="text-xs text-gray-500 font-bold uppercase tracking-widest opacity-60">Security Governance Platform</p>
                    </div>
                </div>
            </div>
        </div>
    );
};
