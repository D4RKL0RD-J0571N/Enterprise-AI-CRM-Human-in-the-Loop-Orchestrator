import { Sliders, X, Plus, AlertTriangle } from "lucide-react";
import type { AIConfig } from "../../../types/admin";
import { useState } from "react";
import { useTranslation } from "react-i18next";

interface Props {
    config: AIConfig;
    setConfig: (config: AIConfig) => void;
}

export const BehaviorTab = ({ config, setConfig }: Props) => {
    const { t } = useTranslation();
    const [newRule, setNewRule] = useState("");
    const [newTopic, setNewTopic] = useState("");

    const SUGGESTED_TOPICS = [
        "Politics", "Adult Content", "Financial Advice", "Medical Diagnoses", "Competitor Pricing", "Passwords/Credentials"
    ];

    return (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {/* Rules Section */}
            <div className="bg-white dark:bg-gray-900 p-8 rounded-3xl border dark:border-gray-800 shadow-sm space-y-6 flex flex-col h-fit">
                <h2 className="text-lg font-bold dark:text-white border-b dark:border-gray-800 pb-3 flex items-center gap-2">
                    <Sliders className="w-5 h-5 text-blue-500" /> {t('admin.sections.operational_rules') || "Operational Rules"}
                </h2>
                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                    {(config.rules || []).map((rule, i) => (
                        <div key={i} className="flex items-start justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl group transition-all hover:bg-white dark:hover:bg-gray-700 hover:shadow-sm border dark:border-gray-700">
                            <span className="text-sm dark:text-gray-300 leading-relaxed break-words flex-1 pr-4">{rule}</span>
                            <button
                                onClick={() => setConfig({ ...config, rules: (config.rules || []).filter((_, idx) => idx !== i) })}
                                className="opacity-0 group-hover:opacity-100 text-red-500 p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-opacity flex-shrink-0"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                </div>
                <div className="flex gap-2 pt-4 border-t dark:border-gray-800 mt-auto">
                    <input
                        type="text"
                        value={newRule}
                        onChange={(e) => setNewRule(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && newRule && (setConfig({ ...config, rules: [...(config.rules || []), newRule] }), setNewRule(""))}
                        className="flex-1 bg-gray-50 dark:bg-gray-800 p-4 rounded-2xl border-none focus:ring-2 focus:ring-blue-500 dark:text-white text-sm"
                        placeholder={t('admin.fields.operational_rules_placeholder') || "e.g. Always ask for order number..."}
                    />
                    <button
                        onClick={() => { if (newRule) { setConfig({ ...config, rules: [...(config.rules || []), newRule] }); setNewRule(""); } }}
                        className="p-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl shadow-lg transition-transform active:scale-95"
                    >
                        <Plus className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Thresholds & Topics */}
            <div className="space-y-8 h-fit">
                <div className="bg-white dark:bg-gray-900 p-8 rounded-3xl border dark:border-gray-800 shadow-sm space-y-8">
                    <h2 className="text-lg font-bold dark:text-white border-b dark:border-gray-800 pb-3 flex items-center gap-2">
                        <Sliders className="w-5 h-5 text-indigo-500" /> {t('admin.sections.thresholds') || "Confidence Thresholds"}
                    </h2>
                    <div className="space-y-10">
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <label className="text-sm font-bold dark:text-gray-300">{t('admin.fields.auto_respond') || "Auto-Response Threshold (%)"}</label>
                                <span className="text-indigo-600 dark:text-indigo-400 font-black text-xl">{config.auto_respond_threshold}%</span>
                            </div>
                            <input
                                type="range"
                                min="0" max="100"
                                value={config.auto_respond_threshold}
                                onChange={(e) => setConfig({ ...config, auto_respond_threshold: parseInt(e.target.value) })}
                                style={{ accentColor: 'var(--brand-primary)' }}
                            />
                            <p className="text-[10px] text-gray-500 leading-relaxed uppercase tracking-widest leading-4">{t('admin.fields.auto_respond_help') || "AI will respond autonomously..."}</p>
                            <p className="text-[10px] text-indigo-500 font-bold italic">{t('admin.fields.auto_respond_hint') || "AI will respond automatically..."}</p>
                        </div>

                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <label className="text-sm font-bold dark:text-gray-300">{t('admin.fields.manual_review') || "Manual Review Threshold (%)"}</label>
                                <span className="text-indigo-600 dark:text-indigo-400 font-black text-xl">{config.review_threshold}%</span>
                            </div>
                            <input
                                type="range"
                                min="0" max="100"
                                value={config.review_threshold}
                                onChange={(e) => setConfig({ ...config, review_threshold: parseInt(e.target.value) })}
                                style={{ accentColor: 'var(--brand-primary)' }}
                            />
                            <p className="text-[10px] text-gray-500 leading-relaxed uppercase tracking-widest leading-4">{t('admin.fields.manual_review_help') || "AI will require approval..."}</p>
                            <p className="text-[10px] text-amber-500 font-bold italic">{t('admin.fields.review_hint') || "Messages with confidence below this % will require human review"}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-900 p-8 rounded-3xl border dark:border-gray-800 shadow-sm space-y-6">
                    <h2 className="text-lg font-bold dark:text-white border-b dark:border-gray-800 pb-3 flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-red-500" /> {t('admin.sections.forbidden_topics') || "Forbidden Topics"}
                    </h2>
                    <p className="text-xs text-gray-500">{t('admin.fields.forbidden_topics_help') || "Topics the AI is strictly forbidden from discussing or judging."}</p>
                    <div className="flex flex-wrap gap-2">
                        {config.forbidden_topics?.map((topic, i) => (
                            <span key={i} className="px-4 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl text-xs font-bold flex items-center gap-2 group transition-all hover:bg-red-100 border border-red-100 dark:border-red-900/30">
                                {topic}
                                <button onClick={() => setConfig({ ...config, forbidden_topics: config.forbidden_topics.filter((_, idx) => idx !== i) })}>
                                    <X className="w-3 h-3 hover:scale-125 transition-transform" />
                                </button>
                            </span>
                        ))}
                    </div>
                    <div className="flex gap-2 pt-4">
                        <input
                            type="text"
                            value={newTopic}
                            onChange={(e) => setNewTopic(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && newTopic && (setConfig({ ...config, forbidden_topics: [...(config.forbidden_topics || []), newTopic] }), setNewTopic(""))}
                            className="flex-1 bg-gray-50 dark:bg-gray-800 p-4 rounded-2xl border-none focus:ring-2 focus:ring-red-500 dark:text-white text-sm"
                            placeholder={t('admin.fields.forbidden_topics_placeholder') || "e.g. Politics, religion..."}
                        />
                        <button
                            onClick={() => { if (newTopic) { setConfig({ ...config, forbidden_topics: [...(config.forbidden_topics || []), newTopic] }); setNewTopic(""); } }}
                            className={`p-4 rounded-2xl shadow-lg transition-all active:scale-95 ${newTopic ? 'bg-red-600 animate-pulse scale-110 shadow-red-500/50' : 'bg-gray-900 dark:bg-gray-800'} text-white`}
                        >
                            <Plus className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="pt-4 border-t dark:border-gray-800">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Suggested Guardrails</p>
                        <div className="flex flex-wrap gap-2">
                            {SUGGESTED_TOPICS.filter(t => !(config.forbidden_topics || []).includes(t)).map((topic) => (
                                <button
                                    key={topic}
                                    onClick={() => setConfig({ ...config, forbidden_topics: [...(config.forbidden_topics || []), topic] })}
                                    className="px-3 py-1.5 border border-dashed border-gray-300 dark:border-gray-700 rounded-full text-[10px] font-bold text-gray-500 hover:border-red-500 hover:text-red-500 transition-all"
                                >
                                    + {topic}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
