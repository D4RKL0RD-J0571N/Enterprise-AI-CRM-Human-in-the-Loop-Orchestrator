import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Shield, Clock, Brain, FileText, Download, AlertTriangle, CheckCircle } from "lucide-react";
import type { SecurityAudit } from "../../../types/admin";

interface Props {
    audits: SecurityAudit[];
    refreshAudits: () => void;
}

export const AuditTab = ({ audits, refreshAudits }: Props) => {
    const { t } = useTranslation();

    useEffect(() => {
        const interval = setInterval(refreshAudits, 10000); // Auto-refresh every 10s
        return () => clearInterval(interval);
    }, [refreshAudits]);

    const exportToPDF = () => {
        // Simulated export
        alert("Generando Reporte de Auditoría de Seguridad... El PDF estará disponible en breve.");
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {/* KPI Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl border dark:border-gray-800 shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                        <Shield className="w-5 h-5 text-blue-500" />
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{t('admin.audit.total_scans')}</span>
                    </div>
                    <div className="text-3xl font-black dark:text-white">{audits.length}</div>
                </div>
                <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl border dark:border-gray-800 shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                        <AlertTriangle className="w-5 h-5 text-red-500" />
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{t('admin.audit.blocked')}</span>
                    </div>
                    <div className="text-3xl font-black text-red-500">{audits.filter(a => a.status === 'Blocked').length}</div>
                </div>
                <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl border dark:border-gray-800 shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                        <Clock className="w-5 h-5 text-amber-500" />
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{t('admin.audit.avg_latency')}</span>
                    </div>
                    <div className="text-3xl font-black dark:text-white">
                        {audits.length > 0 ? Math.round(audits.reduce((acc, current) => acc + current.latency_ms, 0) / audits.length) : 0}ms
                    </div>
                </div>
                <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl border dark:border-gray-800 shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                        <Brain className="w-5 h-5 text-purple-500" />
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{t('admin.audit.total_tokens')}</span>
                    </div>
                    <div className="text-3xl font-black dark:text-white">
                        {audits.reduce((acc, current) => acc + (current.tokens_used || 0), 0)}
                    </div>
                </div>
            </div>

            {/* Audit Table */}
            <div className="bg-white dark:bg-gray-900 rounded-3xl border dark:border-gray-800 shadow-sm overflow-hidden">
                <div className="p-6 border-b dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-gray-900/50">
                    <div>
                        <h2 className="text-lg font-black dark:text-white flex items-center gap-2">
                            <FileText className="w-5 h-5 text-blue-500" /> Registro de Auditoría de Seguridad
                        </h2>
                        <p className="text-xs text-gray-500 mt-1">Monitoreo en tiempo real de dominios y políticas</p>
                    </div>
                    <button
                        onClick={exportToPDF}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-900 dark:bg-blue-600 text-white rounded-xl text-xs font-bold hover:scale-105 transition-all shadow-lg shadow-blue-500/10"
                    >
                        <Download className="w-4 h-4" /> Exportar Reporte PDF
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/50 dark:bg-gray-800/50 text-[10px] uppercase font-black text-gray-400 tracking-widest border-b dark:border-gray-800">
                                <th className="px-6 py-4">Timestamp (UTC)</th>
                                <th className="px-6 py-4">Mensaje / Entrada</th>
                                <th className="px-6 py-4">Dominio / Intención</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">Latencia</th>
                                <th className="px-6 py-4">Modelo</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y dark:divide-gray-800">
                            {audits.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-gray-400 italic">No se han encontrado registros de seguridad</td>
                                </tr>
                            ) : audits.map((audit) => (
                                <tr key={audit.id} className="group hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="text-[10px] text-gray-400 font-mono">
                                            {new Date(audit.timestamp).toLocaleString('es-CR')}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-xs font-medium dark:text-white max-w-xs truncate" title={audit.input_message}>
                                            {audit.input_message}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="space-y-1">
                                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-black uppercase ${audit.domain === 'Commercial/Logistics' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                                }`}>
                                                {audit.domain}
                                            </span>
                                            <div className="text-[10px] text-gray-500 font-bold">{audit.intent} ({audit.confidence}%)</div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            {audit.status === 'Passed' ? (
                                                <CheckCircle className="w-4 h-4 text-emerald-500" />
                                            ) : (
                                                <Shield className="w-4 h-4 text-red-500" />
                                            )}
                                            <span className={`text-[10px] font-black uppercase ${audit.status === 'Passed' ? 'text-emerald-500' : 'text-red-500'
                                                }`}>{audit.status}</span>
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
        </div>
    );
};
