import { useTranslation } from "react-i18next";
import { BarChart2, Shield } from "lucide-react";
import type { AnalyticsItem, SecurityAudit } from "../../../types/admin";

interface Props {
    analytics: AnalyticsItem[];
    audits: SecurityAudit[];
}

export const AnalyticsTab = ({ analytics, audits }: Props) => {
    const { t } = useTranslation();

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300 h-full">
            <div className="bg-white dark:bg-gray-950 p-8 rounded-3xl border dark:border-gray-800 shadow-xl h-full min-h-[500px]">
                <h2 className="text-xl font-bold dark:text-white flex items-center gap-3">
                    <BarChart2 className="w-6 h-6 text-indigo-500" /> {t('admin.sections.intent_analytics')}
                </h2>
                <p className="text-sm text-gray-500 mt-2 mb-8">{t('admin.fields.analytics_help') || "Understanding what your customers are asking about."}</p>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                    <div className="space-y-6">
                        <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                            <BarChart2 className="w-4 h-4" /> {t('admin.audit_logs') || "Intenciones Detectadas"}
                        </h3>
                        {analytics.length === 0 ? (
                            <div className="text-center py-20 text-gray-400 border-2 border-dashed rounded-3xl dark:border-gray-800 font-medium">
                                {t('admin.fields.analytics_no_data')}
                            </div>
                        ) : (
                            analytics.map((item, idx) => {
                                const maxCount = Math.max(...analytics.map(a => a.count));
                                const ratio = item.count / maxCount;
                                const colorClass = ratio > 0.7
                                    ? "from-orange-500 to-red-600"
                                    : ratio > 0.3
                                        ? "from-indigo-500 to-purple-600"
                                        : "from-blue-400 to-indigo-500";

                                return (
                                    <div key={idx} className="space-y-2 group">
                                        <div className="flex justify-between items-center px-1">
                                            <span className="font-bold text-sm dark:text-gray-300 group-hover:text-indigo-500 transition-colors">{item.intent}</span>
                                            <span className={`text-[10px] ${ratio > 0.7 ? 'bg-red-50 dark:bg-red-900/30 text-red-600' : 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600'} px-2 py-0.5 rounded-full font-black tracking-tighter`}>
                                                {item.count} {t('admin.fields.items_count')}
                                            </span>
                                        </div>
                                        <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded-2xl overflow-hidden shadow-inner">
                                            <div
                                                className={`h-full bg-gradient-to-r ${colorClass} rounded-2xl transition-all duration-1000 ease-out`}
                                                style={{ width: `${Math.min(100, ratio * 100)}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>

                    <div className="space-y-8">
                        {/* Safety Funnel */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                <Shield className="w-4 h-4" /> Embudo de Seguridad
                            </h3>
                            <div className="space-y-2">
                                {[
                                    { label: "Total Consultas", count: audits.length, color: "bg-blue-500" },
                                    { label: "Dominio Comercial", count: audits.filter(a => a.domain === 'Commercial/Logistics').length, color: "bg-indigo-500" },
                                    { label: "Aprobado Auto", count: audits.filter(a => a.status === 'Passed').length, color: "bg-emerald-500" },
                                    { label: "Violación Bloqueada", count: audits.filter(a => a.status === 'Blocked').length, color: "bg-red-500" }
                                ].map((step, i) => {
                                    const percentage = audits.length > 0 ? (step.count / audits.length) * 100 : 0;
                                    return (
                                        <div key={i} className="relative">
                                            <div className="flex justify-between text-[10px] font-bold mb-1 dark:text-gray-400">
                                                <span>{step.label}</span>
                                                <span>{step.count} ({Math.round(percentage)}%)</span>
                                            </div>
                                            <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                                                <div className={`h-full ${step.color} transition-all duration-1000`} style={{ width: `${percentage}%` }}></div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Summary Cards */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-6 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-3xl text-white shadow-lg shadow-indigo-500/20">
                                <p className="text-indigo-100 text-[10px] uppercase font-black tracking-widest">{t('admin.fields.total_ai_interactions')}</p>
                                <p className="text-4xl font-black mt-2">{analytics.reduce((acc, curr) => acc + curr.count, 0)}</p>
                            </div>
                            <div className="p-6 bg-gray-50 dark:bg-gray-900 rounded-3xl border dark:border-gray-800 shadow-sm">
                                <p className="text-gray-500 text-[10px] uppercase font-black tracking-widest">{t('admin.fields.primary_intent')}</p>
                                <p className="text-2xl font-black mt-2 text-indigo-500 truncate">{analytics[0]?.intent || t('admin.fields.none')}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
