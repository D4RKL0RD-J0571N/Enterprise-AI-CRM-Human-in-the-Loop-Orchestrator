import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Archive, Lock, Unlock, Edit2, Trash2, RotateCcw } from "lucide-react";
import type { AIConfigSnapshot } from "../../../types/admin";

interface Props {
    snapshots: AIConfigSnapshot[];
    handleRollback: (id: number) => void;
    isRollingBack: boolean;
    onDelete?: (id: number) => void;
    onRename?: (id: number, name: string) => void;
    onToggleLock?: (id: number) => void;
}

export const SnapshotsTab = ({
    snapshots,
    handleRollback,
    isRollingBack,
    onDelete,
    onRename,
    onToggleLock
}: Props) => {
    const { t } = useTranslation();
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editName, setEditName] = useState("");

    const startEdit = (snapshot: AIConfigSnapshot) => {
        setEditingId(snapshot.id);
        setEditName(snapshot.version_name || snapshot.version_label || "");
    };

    const saveEdit = (id: number) => {
        if (onRename && editName.trim()) {
            onRename(id, editName.trim());
        }
        setEditingId(null);
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="bg-white dark:bg-gray-950 p-8 rounded-3xl border dark:border-gray-800 shadow-xl">
                <h2 className="text-xl font-bold dark:text-white flex items-center gap-3">
                    <Archive className="w-6 h-6 text-amber-500" /> {t('admin.sections.config_history')}
                </h2>
                <p className="text-sm text-gray-500 mt-2 mb-8">
                    Gestiona versiones de configuración. Las versiones bloqueadas no pueden ser eliminadas.
                </p>

                <div className="space-y-3">
                    {snapshots.length === 0 && (
                        <div className="text-center py-20 text-gray-400 border-2 border-dashed rounded-3xl dark:border-gray-800">
                            <Archive className="w-12 h-12 mx-auto mb-4 opacity-30" />
                            <p className="font-bold">No hay historial disponible</p>
                            <p className="text-xs mt-2">Guarda cambios para crear versiones automáticas</p>
                        </div>
                    )}

                    {snapshots.map((ss) => (
                        <div
                            key={ss.id}
                            className={`flex items-center justify-between p-5 rounded-3xl border transition-all group ${ss.is_locked
                                    ? "bg-amber-50/50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800"
                                    : "bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800 hover:border-blue-300 dark:hover:border-blue-700"
                                }`}
                        >
                            <div className="flex items-center gap-4 flex-1">
                                <div className={`p-3 rounded-2xl ${ss.is_locked ? "bg-amber-100 dark:bg-amber-900/30" : "bg-blue-100 dark:bg-blue-900/30"}`}>
                                    {ss.is_locked ? (
                                        <Lock className="w-5 h-5 text-amber-600" />
                                    ) : (
                                        <Archive className="w-5 h-5 text-blue-600" />
                                    )}
                                </div>
                                <div className="flex-1">
                                    {editingId === ss.id ? (
                                        <input
                                            type="text"
                                            value={editName}
                                            onChange={(e) => setEditName(e.target.value)}
                                            onBlur={() => saveEdit(ss.id)}
                                            onKeyDown={(e) => e.key === "Enter" && saveEdit(ss.id)}
                                            className="w-full px-3 py-1 bg-white dark:bg-gray-800 border-2 border-blue-500 rounded-xl text-sm font-bold dark:text-white outline-none"
                                            autoFocus
                                        />
                                    ) : (
                                        <p className="font-bold text-sm dark:text-white flex items-center gap-2">
                                            {ss.version_name || ss.version_label}
                                            {ss.is_locked && (
                                                <span className="bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-400 text-[8px] px-2 py-0.5 rounded-full font-black uppercase tracking-wider">
                                                    Protegido
                                                </span>
                                            )}
                                        </p>
                                    )}
                                    <p className="text-[10px] text-gray-500 uppercase tracking-widest font-mono mt-1">
                                        {new Date(ss.created_at).toLocaleString('es-CR')}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                {onRename && (
                                    <button
                                        onClick={() => startEdit(ss)}
                                        className="p-2 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-xl transition-colors opacity-0 group-hover:opacity-100"
                                        title="Renombrar"
                                    >
                                        <Edit2 className="w-4 h-4 text-blue-600" />
                                    </button>
                                )}

                                {onToggleLock && (
                                    <button
                                        onClick={() => onToggleLock(ss.id)}
                                        className="p-2 hover:bg-amber-100 dark:hover:bg-amber-900/30 rounded-xl transition-colors"
                                        title={ss.is_locked ? "Desbloquear" : "Bloquear"}
                                    >
                                        {ss.is_locked ? (
                                            <Unlock className="w-4 h-4 text-amber-600" />
                                        ) : (
                                            <Lock className="w-4 h-4 text-gray-400" />
                                        )}
                                    </button>
                                )}

                                <button
                                    onClick={() => handleRollback(ss.id)}
                                    disabled={isRollingBack}
                                    className="px-4 py-2 bg-white dark:bg-gray-800 border-2 border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 font-bold text-xs rounded-xl shadow-sm hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all disabled:opacity-50 flex items-center gap-2"
                                >
                                    <RotateCcw className="w-3.5 h-3.5" />
                                    {t('admin.fields.rollback')}
                                </button>

                                {onDelete && !ss.is_locked && (
                                    <button
                                        onClick={() => onDelete(ss.id)}
                                        className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-xl transition-colors opacity-0 group-hover:opacity-100"
                                        title="Eliminar"
                                    >
                                        <Trash2 className="w-4 h-4 text-red-600" />
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Professional Guidance Card */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 p-6 rounded-3xl border border-blue-200 dark:border-blue-900">
                <h3 className="text-sm font-black text-blue-900 dark:text-blue-100 uppercase tracking-widest mb-3">
                    💼 Gestión Profesional de Versiones
                </h3>
                <ul className="space-y-2 text-xs text-blue-800 dark:text-blue-200">
                    <li className="flex items-start gap-2">
                        <span className="text-blue-500 font-black">•</span>
                        <span><strong>Bloquear:</strong> Protege versiones críticas de eliminación accidental</span>
                    </li>
                    <li className="flex items-start gap-2">
                        <span className="text-blue-500 font-black">•</span>
                        <span><strong>Renombrar:</strong> Etiqueta versiones con nombres descriptivos (ej: "Compliance v2.1")</span>
                    </li>
                    <li className="flex items-start gap-2">
                        <span className="text-blue-500 font-black">•</span>
                        <span><strong>Rollback:</strong> Restaura configuraciones anteriores en caso de error</span>
                    </li>
                </ul>
            </div>
        </div>
    );
};
