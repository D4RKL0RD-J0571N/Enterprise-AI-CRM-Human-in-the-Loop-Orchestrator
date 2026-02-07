import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../context/AuthContext";
import { API_ENDPOINTS } from "../../lib/api";
import { SecretsTab, LicenseTab, AuditTab, SnapshotsTab } from "../../components/admin/tabs";
import { Save, CheckCircle, Key, History, ShieldCheck, BadgeCheck } from "lucide-react";
import { SecondaryTabs } from "../../components/dashboard/SecondaryTabs";
import type { AIConfig, AIConfigSnapshot, AuditLogItem, SecurityAudit } from "../../types/admin";

export default function SystemSettings() {
    const { t } = useTranslation();
    const { token } = useAuth();
    const [config, setConfig] = useState<AIConfig>({} as AIConfig);
    const [snapshots, setSnapshots] = useState<AIConfigSnapshot[]>([]);
    const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
    const [audits, setAudits] = useState<SecurityAudit[]>([]);
    const [activeTab, setActiveTab] = useState("secrets");

    const TABS = [
        { id: "secrets", label: t('admin.tabs.secrets'), icon: Key },
        { id: "snapshots", label: t('admin.tabs.snapshots'), icon: History },
        { id: "audits", label: t('admin.tabs.audit'), icon: ShieldCheck },
        { id: "license", label: t('admin.tabs.license'), icon: BadgeCheck },
    ];

    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">("idle");
    const [isRollingBack, setIsRollingBack] = useState(false);

    useEffect(() => {
        const load = async () => {
            await Promise.all([fetchConfig(), fetchSnapshots(), fetchAuditLogs(), fetchAudits()]);
            setIsLoading(false);
        };
        load();
    }, []);

    const fetchConfig = async () => {
        try {
            const res = await fetch(API_ENDPOINTS.admin.config, { headers: { "Authorization": `Bearer ${token}` } });
            if (res.ok) setConfig(await res.json());
        } catch (e) { }
    };

    const fetchSnapshots = async () => {
        try {
            const res = await fetch(API_ENDPOINTS.admin.snapshots, { headers: { "Authorization": `Bearer ${token}` } });
            if (res.ok) setSnapshots(await res.json());
        } catch (e) { }
    };

    const fetchAuditLogs = async () => {
        try {
            const res = await fetch(API_ENDPOINTS.admin.auditsOperational, { headers: { "Authorization": `Bearer ${token}` } });
            if (res.ok) setAuditLogs(await res.json());
        } catch (e) { }
    };

    const fetchAudits = async () => {
        try {
            const res = await fetch(API_ENDPOINTS.admin.auditsSecurity, { headers: { "Authorization": `Bearer ${token}` } });
            if (res.ok) setAudits(await res.json());
        } catch (e) { }
    };

    // Snapshot Handlers
    const handleRollback = async (snapshotId: number) => {
        if (!confirm("Confirm rollback?")) return;
        setIsRollingBack(true);
        try {
            const res = await fetch(API_ENDPOINTS.admin.snapshotAction(snapshotId.toString(), "rollback"), { method: "POST" });
            if (res.ok) { await fetchConfig(); setSaveStatus("success"); }
        } catch (e) { console.error(e); }
        setIsRollingBack(false);
    };

    const handleDeleteSnapshot = async (id: number) => {
        if (!confirm("Delete snapshot?")) return;
        await fetch(API_ENDPOINTS.admin.snapshotAction(id.toString(), ""), { method: "DELETE" });
        fetchSnapshots();
    };

    const handleRenameSnapshot = async (id: number, newName: string) => {
        await fetch(API_ENDPOINTS.admin.snapshotAction(id.toString(), "name"), {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: newName })
        });
        fetchSnapshots();
    };

    const handleToggleLock = async (id: number) => {
        await fetch(API_ENDPOINTS.admin.snapshotAction(id.toString(), "toggle-lock"), { method: "POST" });
        fetchSnapshots();
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const res = await fetch(API_ENDPOINTS.admin.config, {
                method: "POST",
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
                body: JSON.stringify(config)
            });
            if (res.ok) { setSaveStatus("success"); setTimeout(() => setSaveStatus("idle"), 2000); fetchSnapshots(); }
            else setSaveStatus("error");
        } catch (e) { setSaveStatus("error"); }
        setIsSaving(false);
    };

    if (isLoading) return <div className="p-8 text-center text-gray-500">Loading system data...</div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold dark:text-white">{t('admin.sections.system')}</h2>
                    <p className="text-sm text-gray-500">{t('admin.sections.system_desc')}</p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition-all text-sm ${saveStatus === "success" ? "bg-emerald-600 text-white" : "bg-[var(--brand-primary)] text-white hover:opacity-90 shadow-lg shadow-[var(--brand-primary)]/20"
                        }`}
                >
                    {isSaving ? t('common.saving') : saveStatus === "success" ? <CheckCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                    {saveStatus === "success" ? t('common.saved') : t('common.save')}
                </button>
            </div>

            <SecondaryTabs tabs={TABS} activeTab={activeTab} onChange={setActiveTab} />

            <div className="animate-in fade-in duration-500">
                {activeTab === "secrets" && <SecretsTab config={config} setConfig={setConfig} />}
                {activeTab === "snapshots" && (
                    <SnapshotsTab
                        snapshots={snapshots}
                        isRollingBack={isRollingBack}
                        handleRollback={handleRollback}
                        onDelete={handleDeleteSnapshot}
                        onRename={handleRenameSnapshot}
                        onToggleLock={handleToggleLock}
                    />
                )}
                {activeTab === "audits" && <AuditTab audits={audits} auditLogs={auditLogs} refreshAudits={() => { fetchAuditLogs(); fetchAudits(); }} />}
                {activeTab === "license" && <LicenseTab />}
            </div>
        </div>
    );
}
