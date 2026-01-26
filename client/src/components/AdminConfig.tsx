import { useState, useEffect } from "react";
import { Save, CheckCircle, Shield, Brain, Sliders, Send, Database, Archive, BarChart2, Eye, Palette } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { AIConfig, AIConfigSnapshot, AIDataset, AnalyticsItem, SecurityAudit } from "../types/admin";

// Modular Tabs
import {
    IdentityTab,
    BehaviorTab,
    DatasetsTab,
    AdvancedTab,
    SnapshotsTab,
    AnalyticsTab,
    SandboxTab,
    AuditTab,
    BrandingTab
} from "./admin/tabs";

export default function AdminConfig() {
    const { t, i18n } = useTranslation();
    const [config, setConfig] = useState<AIConfig>({
        business_name: "",
        business_description: "",
        tone: "",
        rules: [],
        auto_respond_threshold: 85,
        review_threshold: 60,
        forbidden_topics: [],
        language_code: "es-CR",
        translate_messages: false,
        identity_prompt: null,
        grounding_template: null,
        intent_rules: [],
        fallback_message: "I am currently having trouble processing your request.",
        preferred_model: "gpt-4-turbo",
        logo_url: null,
        primary_color: "#2563eb",
        ui_density: "comfortable"
    });
    const [activeTab, setActiveTab] = useState<"context" | "branding" | "behavior" | "sandbox" | "datasets" | "advanced" | "snapshots" | "analytics" | "audit">("context");
    const [isSaving, setIsSaving] = useState(false);
    const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">("idle");

    // Sandbox State
    const [testQuery, setTestQuery] = useState("");
    const [testResult, setTestResult] = useState<{ content: string; confidence: number; metadata: any } | null>(null);
    const [isTesting, setIsTesting] = useState(false);

    // Dataset State
    const [datasets, setDatasets] = useState<AIDataset[]>([]);
    const [selectedDataset, setSelectedDataset] = useState<AIDataset | null>(null);
    const [newDataset, setNewDataset] = useState({ name: "", data_type: "text", content: "" });

    // Snapshot State
    const [snapshots, setSnapshots] = useState<AIConfigSnapshot[]>([]);
    const [isRollingBack, setIsRollingBack] = useState(false);

    // Analytics State
    const [analytics, setAnalytics] = useState<AnalyticsItem[]>([]);
    const [audits, setAudits] = useState<SecurityAudit[]>([]);


    useEffect(() => {
        fetchConfig();
        fetchDatasets();
        fetchSnapshots();
        fetchAnalytics();
        fetchAudits();
    }, []);

    const fetchAnalytics = async () => {
        try {
            const res = await fetch("http://localhost:8000/admin/analytics/intents");
            const data = await res.json();
            setAnalytics(data);
        } catch (err) {
            console.error("Failed to load analytics", err);
        }
    };

    const fetchSnapshots = async () => {
        try {
            const res = await fetch("http://localhost:8000/admin/snapshots");
            const data = await res.json();
            setSnapshots(data);
        } catch (err) {
            console.error("Failed to load snapshots", err);
        }
    };

    const fetchDatasets = async () => {
        try {
            const res = await fetch("http://localhost:8000/admin/datasets");
            const data = await res.json();
            setDatasets(data);
        } catch (err) {
            console.error("Failed to load datasets", err);
        }
    };

    const fetchAudits = async () => {
        try {
            const res = await fetch("http://localhost:8000/admin/audits");
            const data = await res.json();
            setAudits(data);
        } catch (err) {
            console.error("Failed to load audits", err);
        }
    };

    const [hasConfig, setHasConfig] = useState(true);

    const fetchConfig = async () => {
        try {
            const res = await fetch("http://localhost:8000/admin/config");
            if (res.status === 404) {
                setHasConfig(false);
                return;
            }
            const data = await res.json();
            setConfig(data);
            setHasConfig(true);

            if (data.language_code.startsWith("en")) {
                i18n.changeLanguage("en");
            } else {
                i18n.changeLanguage("es");
            }
        } catch (err) {
            console.error("Failed to load config", err);
        }
    };

    // Inject Primary Color
    useEffect(() => {
        if (config.primary_color) {
            document.documentElement.style.setProperty('--primary-color', config.primary_color);
            // Also set a muted version for backgrounds
            document.documentElement.style.setProperty('--primary-color-muted', `${config.primary_color}1a`);
        }
    }, [config.primary_color]);

    const runTest = async () => {
        if (!testQuery.trim()) return;
        setIsTesting(true);
        try {
            const res = await fetch("http://localhost:8000/admin/test", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: testQuery })
            });
            const data = await res.json();
            setTestResult(data);
        } catch (err) {
            console.error(err);
        }
        setIsTesting(false);
    };

    const handleSave = async () => {
        setIsSaving(true);
        setSaveStatus("idle");
        try {
            const res = await fetch("http://localhost:8000/admin/config", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(config)
            });
            if (res.ok) {
                setSaveStatus("success");
                setHasConfig(true);
                if (config.language_code.startsWith("en")) {
                    i18n.changeLanguage("en");
                } else {
                    i18n.changeLanguage("es");
                }
                setTimeout(() => setSaveStatus("idle"), 3000);
                fetchSnapshots();
            } else {
                setSaveStatus("error");
            }
        } catch (err) {
            setSaveStatus("error");
        }
        setIsSaving(false);
    };

    const handleRollback = async (snapshotId: number) => {
        if (!confirm(t('admin.fields.snapshot_help'))) return;
        setIsRollingBack(true);
        try {
            const res = await fetch(`http://localhost:8000/admin/snapshots/${snapshotId}/rollback`, {
                method: "POST"
            });
            if (res.ok) {
                await fetchConfig();
                setSaveStatus("success");
                setTimeout(() => setSaveStatus("idle"), 2000);
            }
        } catch (err) {
            console.error(err);
        }
        setIsRollingBack(false);
    };

    const handleCreateDataset = async () => {
        try {
            const res = await fetch("http://localhost:8000/admin/datasets", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newDataset)
            });
            if (res.ok) {
                fetchDatasets();
                setNewDataset({ name: "", data_type: "text", content: "" });
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleUpdateDataset = async () => {
        if (!selectedDataset) return;
        try {
            const res = await fetch(`http://localhost:8000/admin/datasets/${selectedDataset.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: selectedDataset.name,
                    data_type: selectedDataset.data_type,
                    content: selectedDataset.content
                })
            });
            if (res.ok) {
                fetchDatasets();
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleDeleteDataset = async (id: number) => {
        if (!confirm(t('admin.alerts.confirm_delete_dataset'))) return;
        try {
            const res = await fetch(`http://localhost:8000/admin/datasets/${id}`, {
                method: "DELETE"
            });
            if (res.ok) {
                fetchDatasets();
                setSelectedDataset(null);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const toggleDatasetActive = async (id: number) => {
        try {
            await fetch(`http://localhost:8000/admin/datasets/${id}/toggle`, { method: "POST" });
            fetchDatasets();
        } catch (err) {
            console.error(err);
        }
    };

    const handleDeleteSnapshot = async (id: number) => {
        if (!confirm("¿Seguro que deseas eliminar esta versión? Esta acción no se puede deshacer.")) return;
        try {
            const res = await fetch(`http://localhost:8000/admin/snapshots/${id}`, { method: "DELETE" });
            if (res.ok) fetchSnapshots();
            else {
                const err = await res.json();
                alert(err.detail || "Error eliminando snapshot");
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleRenameSnapshot = async (id: number, newName: string) => {
        try {
            await fetch(`http://localhost:8000/admin/snapshots/${id}/name`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: newName })
            });
            fetchSnapshots();
        } catch (err) {
            console.error(err);
        }
    };

    const handleToggleLock = async (id: number) => {
        try {
            await fetch(`http://localhost:8000/admin/snapshots/${id}/toggle-lock`, { method: "POST" });
            fetchSnapshots();
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="flex-1 flex flex-col bg-gray-50 dark:bg-gray-950 overflow-hidden">
            <header className="p-6 border-b dark:border-gray-800 flex justify-between items-center bg-white dark:bg-gray-900/50 backdrop-blur-md">
                <div>
                    <h1 className="text-2xl font-bold dark:text-white flex items-center gap-2">
                        <Shield className="text-blue-600 w-7 h-7" /> {t('admin.sections.business_identity')}
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{t('admin.header_subtitle')}</p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold transition-all shadow-lg active:scale-95 ${saveStatus === "success" ? "bg-green-600 text-white" :
                        saveStatus === "error" ? "bg-red-600 text-white" :
                            "bg-blue-600 hover:bg-blue-700 text-white"
                        } disabled:opacity-50`}
                >
                    {isSaving ? t('common.saving') : saveStatus === "success" ? <CheckCircle className="w-5 h-5" /> : <Save className="w-5 h-5" />}
                    {saveStatus === "success" ? t('common.saved') : t('common.save')}
                </button>
            </header>

            <div className="flex-1 overflow-y-auto overflow-x-hidden p-6 space-y-8 w-full">
                {!hasConfig && (
                    <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-6 rounded-3xl flex items-start gap-4 animate-bounce">
                        <div className="p-3 bg-amber-100 dark:bg-amber-800 rounded-2xl">
                            <Shield className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-amber-900 dark:text-amber-100">{t('admin.alerts.no_config_warning').split('.')[0]}</h3>
                            <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">{t('admin.alerts.no_config_warning').split('.').slice(1).join('.')}</p>
                        </div>
                    </div>
                )}

                {/* Tab Navigation */}
                <div className="flex gap-1 p-1 bg-gray-200 dark:bg-gray-800 rounded-2xl w-fit">
                    <button
                        onClick={() => setActiveTab("context")}
                        className={`flex items-center gap-2 px-6 py-2 rounded-xl transition-all ${activeTab === "context" ? "bg-white dark:bg-gray-700 shadow-sm font-bold dark:text-white" : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"}`}
                    >
                        <Brain className="w-4 h-4" /> {t('admin.tabs.context')}
                    </button>
                    <button
                        onClick={() => setActiveTab("branding")}
                        className={`flex items-center gap-2 px-6 py-2 rounded-xl transition-all ${activeTab === "branding" ? "bg-white dark:bg-gray-700 shadow-sm font-bold dark:text-white" : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"}`}
                    >
                        <Palette className="w-4 h-4" /> {t('admin.tabs.branding') || "Branding"}
                    </button>
                    <button
                        onClick={() => setActiveTab("behavior")}
                        className={`flex items-center gap-2 px-6 py-2 rounded-xl transition-all ${activeTab === "behavior" ? "bg-white dark:bg-gray-700 shadow-sm font-bold dark:text-white" : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"}`}
                    >
                        <Sliders className="w-4 h-4" /> {t('admin.tabs.behavior')}
                    </button>
                    <button
                        onClick={() => setActiveTab("sandbox")}
                        className={`flex items-center gap-2 px-6 py-2 rounded-xl transition-all ${activeTab === "sandbox" ? "bg-white dark:bg-gray-700 shadow-sm font-bold dark:text-white" : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"}`}
                    >
                        <Send className="w-4 h-4" /> {t('admin.tabs.sandbox')}
                    </button>
                    <button
                        onClick={() => setActiveTab("datasets")}
                        className={`flex items-center gap-2 px-6 py-2 rounded-xl transition-all ${activeTab === "datasets" ? "bg-white dark:bg-gray-700 shadow-sm font-bold dark:text-white" : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"}`}
                    >
                        <Database className="w-4 h-4" /> {t('admin.tabs.datasets')}
                    </button>
                    <button
                        onClick={() => setActiveTab("advanced")}
                        className={`flex items-center gap-2 px-6 py-2 rounded-xl transition-all ${activeTab === "advanced" ? "bg-white dark:bg-gray-700 shadow-sm font-bold dark:text-white" : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"}`}
                    >
                        <Shield className="w-4 h-4" /> {t('admin.tabs.advanced')}
                    </button>
                    <button
                        onClick={() => setActiveTab("snapshots")}
                        className={`flex items-center gap-2 px-6 py-2 rounded-xl transition-all ${activeTab === "snapshots" ? "bg-white dark:bg-gray-700 shadow-sm font-bold dark:text-white" : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"}`}
                    >
                        <Archive className="w-4 h-4" /> {t('admin.tabs.snapshots')}
                    </button>
                    <button
                        onClick={() => setActiveTab("analytics")}
                        className={`flex items-center gap-2 px-6 py-2 rounded-xl transition-all ${activeTab === "analytics" ? "bg-white dark:bg-gray-700 shadow-sm font-bold dark:text-white" : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"}`}
                    >
                        <BarChart2 className="w-4 h-4" /> {t('admin.tabs.analytics')}
                    </button>
                    <button
                        onClick={() => setActiveTab("audit")}
                        className={`flex items-center gap-2 px-6 py-2 rounded-xl transition-all ${activeTab === "audit" ? "bg-white dark:bg-gray-700 shadow-sm font-bold dark:text-white" : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"}`}
                    >
                        <Eye className="w-4 h-4" /> {t('admin.tabs.audit')}
                    </button>
                </div>

                {activeTab === "context" && <IdentityTab config={config} setConfig={setConfig} />}
                {activeTab === "branding" && <BrandingTab config={config} setConfig={setConfig} />}
                {activeTab === "behavior" && <BehaviorTab config={config} setConfig={setConfig} />}
                {activeTab === "datasets" && (
                    <DatasetsTab
                        datasets={datasets}
                        selectedDataset={selectedDataset}
                        setSelectedDataset={setSelectedDataset}
                        newDataset={newDataset}
                        setNewDataset={setNewDataset}
                        handleCreateDataset={handleCreateDataset}
                        handleUpdateDataset={handleUpdateDataset}
                        handleDeleteDataset={handleDeleteDataset}
                        toggleDatasetActive={toggleDatasetActive}
                    />
                )}
                {activeTab === "advanced" && <AdvancedTab config={config} setConfig={setConfig} />}
                {activeTab === "snapshots" && (
                    <SnapshotsTab
                        snapshots={snapshots}
                        handleRollback={handleRollback}
                        isRollingBack={isRollingBack}
                        onDelete={handleDeleteSnapshot}
                        onRename={handleRenameSnapshot}
                        onToggleLock={handleToggleLock}
                    />
                )}
                {activeTab === "analytics" && <AnalyticsTab analytics={analytics} audits={audits} />}
                {activeTab === "audit" && <AuditTab audits={audits} refreshAudits={fetchAudits} />}
                {activeTab === "sandbox" && (
                    <SandboxTab
                        testQuery={testQuery}
                        setTestQuery={setTestQuery}
                        testResult={testResult}
                        isTesting={isTesting}
                        runTest={runTest}
                    />
                )}
            </div>
        </div>
    );
}
