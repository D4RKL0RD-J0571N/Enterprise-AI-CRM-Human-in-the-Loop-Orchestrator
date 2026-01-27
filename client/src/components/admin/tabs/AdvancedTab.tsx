import { useTranslation } from "react-i18next";
import { Shield, Brain, Plus, X, RefreshCw } from "lucide-react";
import type { AIConfig } from "../../../types/admin";
import { useState, useEffect } from "react";

interface Props {
    config: AIConfig;
    setConfig: (config: AIConfig) => void;
}

export const AdvancedTab = ({ config, setConfig }: Props) => {
    const { t } = useTranslation();
    const [newIntent, setNewIntent] = useState({ keywords: "", intent: "" });
    const [availableModels, setAvailableModels] = useState<string[]>([]);
    const [isLoadingModels, setIsLoadingModels] = useState(false);
    const [availableTimezones, setAvailableTimezones] = useState<string[]>([]);

    // Fetch Timezones
    useEffect(() => {
        fetch("http://localhost:8000/admin/timezones")
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) setAvailableTimezones(data);
            })
            .catch(err => console.error("Failed to fetch timezones", err));
    }, []);

    const fetchModels = async () => {
        setIsLoadingModels(true);
        try {
            const res = await fetch("http://localhost:8000/admin/models");
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
        // Initial fetch if empty
        if (availableModels.length === 0) fetchModels();
    }, []);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {/* Grounding Section */}
            <div className="bg-white dark:bg-gray-900 p-8 rounded-3xl border dark:border-gray-800 shadow-sm space-y-6">
                <h2 className="text-lg font-bold dark:text-white border-b dark:border-gray-800 pb-3 flex items-center gap-2">
                    <Brain className="w-5 h-5 text-emerald-500" /> {t('admin.sections.grounding_mode')}
                </h2>
                <div className="space-y-4">
                    <div className="space-y-2 relative">
                        <div className="flex justify-between items-center">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">{t('admin.fields.grounding_instructions')}</label>
                            <div className="flex items-center gap-2">
                                <span className={`text-[10px] font-bold ${(config.grounding_template?.length || 0) > 100 ? 'text-emerald-500' : 'text-amber-500'}`}>
                                    {(config.grounding_template?.length || 0)} chars
                                </span>
                                <div className={`w-2 h-2 rounded-full ${(config.grounding_template?.length || 0) > 100 ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]' : 'bg-amber-500'}`}></div>
                            </div>
                        </div>
                        <textarea
                            value={config.grounding_template || ""}
                            onChange={(e) => setConfig({ ...config, grounding_template: e.target.value })}
                            className="w-full bg-gray-50 dark:bg-gray-800 p-6 rounded-3xl border-none focus:ring-2 focus:ring-emerald-500 dark:text-white outline-none h-48 resize-none font-mono text-sm leading-relaxed shadow-inner"
                            placeholder={t('admin.fields.grounding_placeholder')}
                        />
                    </div>
                </div>

                <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl border border-emerald-100 dark:border-emerald-900/30">
                    <h4 className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase mb-2">{t('admin.fields.system_fallback_title')}</h4>
                    <input
                        type="text"
                        value={config.fallback_message}
                        onChange={(e) => setConfig({ ...config, fallback_message: e.target.value })}
                        className="w-full bg-white dark:bg-gray-800 p-3 rounded-xl border-none dark:text-white text-sm"
                        placeholder={t('admin.fields.system_fallback_placeholder')}
                    />
                </div>
            </div>

            {/* Intent Mapping */}
            <div className="bg-white dark:bg-gray-900 p-8 rounded-3xl border dark:border-gray-800 shadow-sm space-y-6">
                <h2 className="text-lg font-bold dark:text-white border-b dark:border-gray-800 pb-3 flex items-center gap-2">
                    <Shield className="w-5 h-5 text-orange-500" /> {t('admin.sections.intent_rules')}
                </h2>

                <div className="space-y-3">
                    {config.intent_rules.map((rule, i) => (
                        <div key={i} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl border dark:border-gray-700 group hover:border-orange-500/30 transition-all">
                            <div className="flex-1">
                                <span className="text-xs font-black text-orange-600 dark:text-orange-400 uppercase tracking-widest block mb-1">{rule.intent}</span>
                                <div className="flex flex-wrap gap-1">
                                    {rule.keywords.map((kw, ki) => (
                                        <span key={ki} className="text-[10px] bg-white dark:bg-gray-700 px-2 py-0.5 rounded border dark:border-gray-600 dark:text-gray-300">{kw}</span>
                                    ))}
                                </div>
                            </div>
                            <button
                                onClick={() => {
                                    const updated = config.intent_rules.filter((_, idx) => idx !== i);
                                    setConfig({ ...config, intent_rules: updated });
                                }}
                                className="opacity-0 group-hover:opacity-100 text-red-500 p-1 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                </div>
                <div className="space-y-3 pt-4 border-t dark:border-gray-800">
                    <input
                        type="text"
                        value={newIntent.intent}
                        onChange={(e) => setNewIntent({ ...newIntent, intent: e.target.value })}
                        className="w-full bg-gray-50 dark:bg-gray-800 p-3 rounded-xl border-none focus:ring-2 focus:ring-orange-500 dark:text-white text-sm"
                        placeholder={t('admin.fields.intent_name_placeholder')}
                    />
                    <input
                        type="text"
                        value={newIntent.keywords}
                        onChange={(e) => setNewIntent({ ...newIntent, keywords: e.target.value })}
                        className="w-full bg-gray-50 dark:bg-gray-800 p-3 rounded-xl border-none focus:ring-2 focus:ring-orange-500 dark:text-white text-sm"
                        placeholder={t('admin.fields.keywords_placeholder')}
                    />
                    <button
                        onClick={() => {
                            if (newIntent.intent && newIntent.keywords) {
                                const kws = newIntent.keywords.split(",").map(k => k.trim()).filter(k => k);
                                setConfig({ ...config, intent_rules: [...config.intent_rules, { intent: newIntent.intent, keywords: kws }] });
                                setNewIntent({ keywords: "", intent: "" });
                            }
                        }}
                        className="w-full py-3 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-transform active:scale-95"
                    >
                        <Plus className="w-4 h-4" /> {t('admin.fields.add_intent_rule')}
                    </button>
                </div>
            </div>
            {/* Model Control Section */}
            <div className="bg-white dark:bg-gray-900 p-8 rounded-3xl border dark:border-gray-800 shadow-sm space-y-6 lg:col-span-2">
                <h2 className="text-lg font-bold dark:text-white border-b dark:border-gray-800 pb-3 flex items-center gap-2">
                    <Shield className="w-5 h-5 text-indigo-500" /> {t('admin.sections.model_control')}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">{t('admin.fields.preferred_model')}</label>
                            <button onClick={fetchModels} className="text-[10px] flex items-center gap-1 text-indigo-500 hover:underline">
                                <RefreshCw className={`w-3 h-3 ${isLoadingModels ? 'animate-spin' : ''}`} /> Refresh
                            </button>
                        </div>
                        <select
                            value={config.preferred_model || "gpt-4-turbo"}
                            onChange={(e) => setConfig({ ...config, preferred_model: e.target.value })}
                            className="w-full bg-gray-50 dark:bg-gray-800 p-4 rounded-2xl border-none focus:ring-2 focus:ring-indigo-500 dark:text-white text-sm"
                        >
                            <option value="gpt-4-turbo">GPT-4 Turbo (Default)</option>
                            <option value="lm-studio">Locally Hosted (Override)</option>
                            {availableModels.map(m => (
                                <option key={m} value={m}>{m}</option>
                            ))}
                        </select>
                        <p className="text-[10px] text-gray-500 italic mt-1">{t('admin.fields.model_hint')}</p>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">{t('admin.fields.timezone') || "Timezone"}</label>
                        <select
                            value={config.timezone || "UTC"}
                            onChange={(e) => setConfig({ ...config, timezone: e.target.value })}
                            className="w-full bg-gray-50 dark:bg-gray-800 p-4 rounded-2xl border-none focus:ring-2 focus:ring-indigo-500 dark:text-white text-sm"
                        >
                            <option value="UTC">UTC (Universal)</option>
                            {availableTimezones.map(tz => (
                                <option key={tz} value={tz}>{tz}</option>
                            ))}
                        </select>
                        <p className="text-[10px] text-gray-500 italic mt-1">System logs will use this timezone.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};
