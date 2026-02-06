import { useTranslation } from "react-i18next";
import { Shield, Brain, Plus, X, RefreshCw, Sparkles, Clock, Globe } from "lucide-react";
import type { AIConfig } from "../../../types/admin";
import { useState, useEffect } from "react";
import { API_ENDPOINTS } from "../../../lib/api";

interface Props {
    config: AIConfig;
    setConfig: (config: AIConfig) => void;
}

export const AdvancedTab = ({ config, setConfig }: Props) => {
    const { t } = useTranslation();
    const [newIntent, setNewIntent] = useState({ keywords: "", intent: "", suggestions: "" });
    const [availableModels, setAvailableModels] = useState<string[]>([]);
    const [isLoadingModels, setIsLoadingModels] = useState(false);
    const [availableTimezones, setAvailableTimezones] = useState<string[]>([]);
    const [newGlobalSug, setNewGlobalSug] = useState("");

    // Fetch Timezones
    useEffect(() => {
        const loadTimezones = async () => {
            try {
                // Try to get all system timezones first (Modern browsers)
                if ((Intl as any).supportedValuesOf) {
                    const systemTzs = (Intl as any).supportedValuesOf('timeZone');
                    if (systemTzs && systemTzs.length > 0) {
                        setAvailableTimezones(systemTzs);
                        return;
                    }
                }

                // Try API
                const res = await fetch(`${API_ENDPOINTS.admin.models.replace('/models', '')}/timezones`);
                if (res.ok) {
                    const data = await res.json();
                    if (Array.isArray(data) && data.length > 0) {
                        setAvailableTimezones(data);
                        return;
                    }
                }
            } catch (e) {
                console.error("Failed to load timezones", e);
            }

            // Final Fallback
            setAvailableTimezones([
                "UTC", "America/Costa_Rica", "America/New_York", "America/Los_Angeles",
                "America/Mexico_City", "America/Bogota", "America/Argentina/Buenos_Aires",
                "Europe/London", "Europe/Madrid", "Europe/Paris", "Europe/Berlin",
                "Asia/Tokyo", "Asia/Shanghai", "Asia/Dubai", "Australia/Sydney"
            ]);
        };

        loadTimezones();

        // AUTO-DETECT if not set
        if (!config.timezone) {
            const systemTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
            setConfig({ ...config, timezone: systemTz });
        }
    }, []);

    const fetchModels = async () => {
        setIsLoadingModels(true);
        try {
            const res = await fetch(API_ENDPOINTS.admin.models);
            const data = await res.json();
            if (Array.isArray(data)) {
                setAvailableModels(data);
            }
        } catch (e) {
            console.error("Failed to fetch models", e);
        }
        setIsLoadingModels(false);
    };

    useEffect(() => {
        if (availableModels.length === 0) fetchModels();
    }, []);

    const addGlobalSug = () => {
        if (!newGlobalSug.trim()) return;
        const current = config.suggestions_json || [];
        if (!current.includes(newGlobalSug.trim())) {
            setConfig({ ...config, suggestions_json: [...current, newGlobalSug.trim()] });
        }
        setNewGlobalSug("");
    };

    const removeGlobalSug = (sug: string) => {
        const current = config.suggestions_json || [];
        setConfig({ ...config, suggestions_json: current.filter(s => s !== sug) });
    };

    return (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {/* Grounding Section */}
            <div className="bg-white dark:bg-gray-900 p-8 rounded-3xl border dark:border-gray-800 shadow-sm space-y-6">
                <h2 className="text-lg font-bold dark:text-white border-b dark:border-gray-800 pb-3 flex items-center gap-2">
                    <Brain className="w-5 h-5 text-emerald-500" /> {t('admin.sections.grounding_identity')}
                </h2>
                <div className="space-y-4">
                    <div className="space-y-2 relative">
                        <div className="flex justify-between items-center">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">{t('admin.fields.grounding_instructions')}</label>
                            <span className="text-[10px] font-bold text-emerald-500">{(config.grounding_template?.length || 0)} chars</span>
                        </div>
                        <textarea
                            value={config.grounding_template || ""}
                            onChange={(e) => setConfig({ ...config, grounding_template: e.target.value })}
                            className="w-full bg-gray-50 dark:bg-gray-800 p-6 rounded-3xl border-none focus:ring-2 focus:ring-emerald-500 dark:text-white outline-none h-64 resize-none font-mono text-sm leading-relaxed shadow-inner"
                            placeholder={t('admin.fields.grounding_placeholder')}
                        />
                    </div>
                </div>

                <div className="p-4 bg-emerald-50 dark:bg-emerald-900/10 rounded-2xl border border-emerald-100 dark:border-emerald-900/30">
                    <h4 className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase mb-2">{t('admin.fields.fallback_error_title')}</h4>
                    <input
                        type="text"
                        value={config.fallback_message}
                        onChange={(e) => setConfig({ ...config, fallback_message: e.target.value })}
                        className="w-full bg-white dark:bg-gray-900/50 p-3 rounded-xl border dark:border-gray-700 dark:text-white text-sm"
                        placeholder={t('admin.fields.fallback_error_placeholder')}
                    />
                </div>
            </div>

            <div className="space-y-8">
                {/* Global Smart Templates */}
                <div className="bg-white dark:bg-gray-900 p-8 rounded-3xl border dark:border-gray-800 shadow-sm space-y-6">
                    <h2 className="text-lg font-bold dark:text-white border-b dark:border-gray-800 pb-3 flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-amber-500" /> {t('admin.sections.global_templates')}
                    </h2>
                    <p className="text-xs text-gray-500">{t('admin.fields.global_templates_desc')}</p>

                    <div className="flex flex-wrap gap-2">
                        {(config.suggestions_json || []).map((sug, i) => (
                            <span key={i} className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 text-xs font-bold rounded-full border border-amber-200 dark:border-amber-900/50 group">
                                {sug}
                                <button onClick={() => removeGlobalSug(sug)} className="hover:text-amber-500 transition-colors">
                                    <X className="w-3 h-3" />
                                </button>
                            </span>
                        ))}
                    </div>

                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={newGlobalSug}
                            onChange={(e) => setNewGlobalSug(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && addGlobalSug()}
                            placeholder={t('admin.fields.global_template_placeholder')}
                            className="flex-1 bg-gray-50 dark:bg-gray-800 p-3 rounded-xl border-none focus:ring-2 focus:ring-amber-500 dark:text-white text-sm"
                        />
                        <button onClick={addGlobalSug} className="p-3 bg-amber-500 text-white rounded-xl hover:bg-amber-600 transition-all">
                            <Plus className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* System & Localization */}
                <div className="bg-white dark:bg-gray-900 p-8 rounded-3xl border dark:border-gray-800 shadow-sm space-y-6">
                    <h2 className="text-lg font-bold dark:text-white border-b dark:border-gray-800 pb-3 flex items-center gap-2">
                        <Globe className="w-5 h-5 text-indigo-500" /> {t('admin.sections.system_localization')}
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                <Plus className="w-3 h-3" /> {t('admin.fields.model_engine')}
                            </label>
                            <div className="relative">
                                <select
                                    value={config.preferred_model || "gpt-4-turbo"}
                                    onChange={(e) => setConfig({ ...config, preferred_model: e.target.value })}
                                    className="w-full bg-gray-50 dark:bg-gray-800 p-3.5 rounded-xl border-none focus:ring-2 focus:ring-indigo-500 dark:text-white text-sm appearance-none"
                                >
                                    <option value="gpt-4-turbo">{t('admin.models.gpt_4_turbo')}</option>
                                    <option value="lm-studio">{t('admin.models.lm_studio')}</option>
                                    {availableModels.map(m => (
                                        <option key={m} value={m}>{m}</option>
                                    ))}
                                </select>
                                <button onClick={fetchModels} className="absolute right-3 top-1/2 -translate-y-1/2">
                                    <RefreshCw className={`w-4 h-4 text-indigo-500 ${isLoadingModels ? 'animate-spin' : ''}`} />
                                </button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <label className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                    <Clock className="w-3 h-3" /> {t('admin.fields.timezone')}
                                </label>
                                <button
                                    onClick={async (e) => {
                                        const btn = e.currentTarget;
                                        btn.classList.add('animate-pulse');
                                        try {
                                            // 1. Try Internet First
                                            const res = await fetch("http://worldtimeapi.org/api/ip");
                                            if (res.ok) {
                                                const data = await res.json();
                                                if (data.timezone) {
                                                    setConfig({ ...config, timezone: data.timezone });
                                                    return;
                                                }
                                            }
                                        } catch (e) {
                                            console.warn("Internet timezone fetch failed, falling back to system.", e);
                                        } finally {
                                            btn.classList.remove('animate-pulse');
                                        }
                                        // 2. Fallback to System
                                        const systemTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
                                        setConfig({ ...config, timezone: systemTz });
                                    }}
                                    className="px-2 py-1 bg-indigo-50 dark:bg-indigo-900/20 text-[9px] font-black text-indigo-500 uppercase rounded-lg hover:bg-indigo-100 transition-all flex items-center gap-1 border border-indigo-200/50"
                                >
                                    <Globe className="w-2.5 h-2.5" /> {t('admin.fields.sync_auto')}
                                </button>
                            </div>
                            <select
                                value={config.timezone || ""}
                                onChange={(e) => setConfig({ ...config, timezone: e.target.value })}
                                className="w-full bg-gray-50 dark:bg-gray-800 p-3.5 rounded-xl border-none focus:ring-2 focus:ring-indigo-500 dark:text-white text-sm cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                            >
                                <option value="" disabled>{t('admin.fields.timezone_placeholder')}</option>
                                {availableTimezones.length > 0 ? (
                                    availableTimezones.map(tz => (
                                        <option key={tz} value={tz}>{tz}</option>
                                    ))
                                ) : (
                                    <option value={config.timezone}>{config.timezone || "Detectando..."}</option>
                                )}
                            </select>
                            <p className="text-[9px] text-gray-500 italic px-1">{t('admin.fields.timezone_hint')}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Intent Mapping (Span Full Width) */}
            <div className="xl:col-span-2 bg-white dark:bg-gray-900 p-8 rounded-3xl border dark:border-gray-800 shadow-sm space-y-6">
                <h2 className="text-lg font-bold dark:text-white border-b dark:border-gray-800 pb-3 flex items-center gap-2">
                    <Shield className="w-5 h-5 text-orange-500" /> {t('admin.sections.high_confidence_mapping')}
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {(config.intent_rules || []).map((rule, i) => (
                        <div key={i} className="p-5 bg-gray-50 dark:bg-gray-800 rounded-3xl border dark:border-gray-700 relative group transition-all hover:shadow-md">
                            <button
                                onClick={() => {
                                    const updated = (config.intent_rules || []).filter((_, idx) => idx !== i);
                                    setConfig({ ...config, intent_rules: updated });
                                }}
                                className="absolute top-4 right-4 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                            >
                                <X className="w-4 h-4" />
                            </button>
                            <span className="text-[10px] font-black text-orange-600 dark:text-orange-400 uppercase tracking-widest block mb-2">{rule.intent}</span>
                            <div className="flex flex-wrap gap-1.5 mb-3">
                                {rule.keywords.map((kw, ki) => (
                                    <span key={ki} className="text-[9px] font-bold bg-white dark:bg-gray-700 px-2 py-1 rounded-lg border dark:border-gray-600 dark:text-gray-300 shadow-sm">{kw}</span>
                                ))}
                            </div>
                            {rule.suggestions && rule.suggestions.length > 0 && (
                                <div className="pt-2 border-t dark:border-gray-700">
                                    <p className="text-[8px] font-black text-gray-400 uppercase mb-1">{t('admin.fields.reply_templates')}</p>
                                    <div className="flex flex-wrap gap-1">
                                        {rule.suggestions.map((s, si) => (
                                            <span key={si} className="text-[9px] text-indigo-500 dark:text-indigo-400 italic">"{s}"{si < rule.suggestions!.length - 1 ? "," : ""}</span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}

                    {/* Add New Intent Card */}
                    <div className="p-6 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-3xl flex flex-col gap-3 justify-center">
                        <input
                            type="text"
                            value={newIntent.intent}
                            onChange={(e) => setNewIntent({ ...newIntent, intent: e.target.value })}
                            className="w-full bg-gray-50 dark:bg-gray-800 p-2.5 rounded-xl border-none text-xs dark:text-white"
                            placeholder={t('admin.fields.intent_label_placeholder')}
                        />
                        <input
                            type="text"
                            value={newIntent.keywords}
                            onChange={(e) => setNewIntent({ ...newIntent, keywords: e.target.value })}
                            className="w-full bg-gray-50 dark:bg-gray-800 p-2.5 rounded-xl border-none text-xs dark:text-white"
                            placeholder={t('admin.fields.keywords_placeholder')}
                        />
                        <button
                            onClick={() => {
                                if (newIntent.intent && newIntent.keywords) {
                                    const kws = newIntent.keywords.split(",").map(k => k.trim()).filter(k => k);
                                    const sugs = newIntent.suggestions.split(",").map(k => k.trim()).filter(k => k);
                                    setConfig({ ...config, intent_rules: [...config.intent_rules, { intent: newIntent.intent, keywords: kws, suggestions: sugs }] });
                                    setNewIntent({ keywords: "", intent: "", suggestions: "" });
                                }
                            }}
                            className="w-full py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl text-xs transition-all active:scale-95"
                        >
                            {t('admin.actions.create_mapping')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
