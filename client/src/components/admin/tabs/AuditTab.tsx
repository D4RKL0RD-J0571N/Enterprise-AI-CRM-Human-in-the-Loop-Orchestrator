import { useState, useEffect } from "react";
import { Shield, Clock, Brain, AlertTriangle, CheckCircle, Activity } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { SecurityAudit, AuditLogItem } from "../../../types/admin";

interface Props {
    audits: SecurityAudit[];
    auditLogs: AuditLogItem[];
    refreshAudits: () => void;
}

export const AuditTab = ({ audits, auditLogs, refreshAudits }: Props) => {
    const { t } = useTranslation();
    const [view, setView] = useState<"security" | "operational">("security");

    useEffect(() => {
        const interval = setInterval(refreshAudits, 10000);
        return () => clearInterval(interval);
    }, [refreshAudits]);

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {/* View Switcher */}
            <div className="flex gap-2 p-1 bg-gray-100 dark:bg-gray-800 w-fit rounded-2xl border dark:border-gray-700">
                <button
                    onClick={() => setView("security")}
                    className={`flex items-center gap-2 px-6 py-2 rounded-xl text-xs font-black transition-all ${view === "security" ? "bg-white dark:bg-gray-700 shadow-md text-blue-500" : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"}`}
                >
                    <Shield className="w-4 h-4" /> {t('admin.audit.security_scans') || "AI SECURITY SCANS"}
                </button>
                <button
                    onClick={() => setView("operational")}
                    className={`flex items-center gap-2 px-6 py-2 rounded-xl text-xs font-black transition-all ${view === "operational" ? "bg-white dark:bg-gray-700 shadow-md text-indigo-500" : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"}`}
                >
                    <Activity className="w-4 h-4" /> {t('admin.audit.operational_registry') || "OPERATIONAL REGISTRY"}
                </button>
            </div>

            {view === "security" ? (
                <>
                    {/* KPI Overview */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl border dark:border-gray-800 shadow-sm">
                            <div className="flex items-center gap-3 mb-2">
                                <Shield className="w-5 h-5 text-blue-500" />
                                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{t('admin.audit.total_scans') || "Total Scans"}</span>
                            </div>
                            <div className="text-3xl font-black dark:text-white">{(audits || []).length}</div>
                        </div>
                        <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl border dark:border-gray-800 shadow-sm">
                            <div className="flex items-center gap-3 mb-2">
                                <AlertTriangle className="w-5 h-5 text-red-500" />
                                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{t('admin.audit.blocked') || "Blocked"}</span>
                            </div>
                            <div className="text-3xl font-black text-red-500">{(audits || []).filter(a => a.status === 'Blocked').length}</div>
                        </div>
                        <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl border dark:border-gray-800 shadow-sm">
                            <div className="flex items-center gap-3 mb-2">
                                <Clock className="w-5 h-5 text-amber-500" />
                                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{t('admin.audit.avg_latency') || "Avg. Latency"}</span>
                            </div>
                            <div className="text-3xl font-black dark:text-white">
                                {(audits || []).length > 0 ? Math.round((audits || []).reduce((acc, current) => acc + (current.latency_ms || 0), 0) / (audits || []).length) : 0}ms
                            </div>
                        </div>
                        <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl border dark:border-gray-800 shadow-sm">
                            <div className="flex items-center gap-3 mb-2">
                                <Brain className="w-5 h-5 text-purple-500" />
                                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{t('admin.audit.total_tokens') || "Total Tokens"}</span>
                            </div>
                            <div className="text-3xl font-black dark:text-white">
                                {(audits || []).reduce((acc, current) => acc + (current.tokens_used || 0), 0)}
                            </div>
                        </div>
                    </div>

                    {/* Security Table */}
                    <div className="bg-white dark:bg-gray-900 rounded-3xl border dark:border-gray-800 shadow-sm overflow-hidden">
                        <div className="p-6 border-b dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-gray-900/50">
                            <div>
                                <h2 className="text-lg font-black dark:text-white flex items-center gap-2">
                                    <Shield className="w-5 h-5 text-blue-500" /> {t('admin.audit.security_logs_title') || "Security Audit Logs"}
                                </h2>
                                <p className="text-xs text-gray-500 mt-1">{t('admin.audit.security_logs_desc') || "Real-time monitoring of AI domains and safety policies"}</p>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-gray-50/50 dark:bg-gray-800/50 text-[10px] uppercase font-black text-gray-400 tracking-widest border-b dark:border-gray-800">
                                        <th className="px-6 py-4">{t('common.timestamp') || "Timestamp"}</th>
                                        <th className="px-6 py-4">{t('admin.audit.message') || "Input Message"}</th>
                                        <th className="px-6 py-4">{t('admin.audit.domain_intent') || "Domain / Intent"}</th>
                                        <th className="px-6 py-4">{t('common.status') || "Status"}</th>
                                        <th className="px-6 py-4">{t('admin.audit.latency') || "Latency"}</th>
                                        <th className="px-6 py-4">{t('admin.audit.model') || "Model"}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y dark:divide-gray-800">
                                    {audits.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="px-6 py-12 text-center text-gray-400 italic font-medium">{t('admin.audit.no_scans') || "No security scans found"}</td>
                                        </tr>
                                    ) : audits.map((audit) => (
                                        <tr key={audit.id} className="group hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="text-[10px] text-gray-400 font-mono">
                                                    {new Date(audit.timestamp).toLocaleString()}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-xs font-medium dark:text-white max-w-xs truncate" title={audit.input_message}>
                                                    {audit.input_message}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="space-y-1">
                                                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-black uppercase ${audit.domain === 'Commercial/Logistics' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                                                        {audit.domain}
                                                    </span>
                                                    <div className="text-[10px] text-gray-500 font-bold">{audit.intent} ({audit.confidence}%)</div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    {audit.status === 'Passed' ? <CheckCircle className="w-4 h-4 text-emerald-500" /> : <Shield className="w-4 h-4 text-red-500" />}
                                                    <span className={`text-[10px] font-black uppercase ${audit.status === 'Passed' ? 'text-emerald-500' : 'text-red-500'}`}>
                                                        {audit.status === 'Passed' ? (t('admin.audit.status_passed') || "Passed") : (t('admin.audit.status_blocked') || "Blocked")}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className={`text-xs font-mono font-bold ${audit.latency_ms > 2000 ? 'text-amber-500' : 'text-gray-500'}`}>
                                                    {audit.latency_ms}ms
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
                                                    {audit.model_name}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            ) : (
                <>
                    {/* Operational Registry Table */}
                    <div className="bg-white dark:bg-gray-900 rounded-3xl border dark:border-gray-800 shadow-sm overflow-hidden">
                        <div className="p-6 border-b dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-gray-900/50">
                            <div>
                                <h2 className="text-lg font-black dark:text-white flex items-center gap-2">
                                    <Activity className="w-5 h-5 text-indigo-500" /> {t('admin.audit.operational_logs_title') || "Operational Action Registry"}
                                </h2>
                                <p className="text-xs text-gray-500 mt-1">{t('admin.audit.operational_logs_desc') || "Immutable log of operator actions and system changes"}</p>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-gray-50/50 dark:bg-gray-800/50 text-[10px] uppercase font-black text-gray-400 tracking-widest border-b dark:border-gray-800">
                                        <th className="px-6 py-4">{t('common.timestamp') || "Timestamp"}</th>
                                        <th className="px-6 py-4">{t('admin.audit.operator') || "Operator"}</th>
                                        <th className="px-6 py-4">{t('admin.audit.action') || "Action"}</th>
                                        <th className="px-6 py-4">{t('admin.audit.resource') || "Resource"}</th>
                                        <th className="px-6 py-4">{t('admin.audit.details') || "Details"}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y dark:divide-gray-800">
                                    {auditLogs.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-12 text-center text-gray-400 italic font-medium">{t('admin.audit.no_operational_logs') || "No operational logs found"}</td>
                                        </tr>
                                    ) : auditLogs.map((log) => (
                                        <tr key={log.id} className="group hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="text-[10px] text-gray-400 font-mono">
                                                    {new Date(log.timestamp).toLocaleString()}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-6 h-6 rounded-full bg-indigo-500/10 flex items-center justify-center text-[10px] font-black text-indigo-500">
                                                        {log.user?.username?.substring(0, 2).toUpperCase() || "SYS"}
                                                    </div>
                                                    <span className="text-xs font-bold dark:text-white">{log.user?.username || "System"}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-[10px] font-black uppercase text-indigo-500 tracking-widest leading-none">
                                                    {log.action}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-xs font-bold text-gray-500 dark:text-gray-400">
                                                    {log.resource}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="text-xs text-gray-600 dark:text-gray-400 max-w-sm truncate" title={log.details}>
                                                    {log.details}
                                                </p>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};
