import { useState, useEffect } from "react";
import { Save, CheckCircle, Shield, Brain, Sliders, Send, Database, Archive, BarChart2, Eye, Palette, Lock, Globe, Settings, ChevronRight } from "lucide-react";
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
    BrandingTab,
    SecretsTab
} from "./admin/tabs";

interface AdminConfigProps {
    onSave?: () => void;
}

export default function AdminConfig({ onSave }: AdminConfigProps) {
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
        ui_density: "comfortable",
        timezone: "UTC"
    });

    // Updated Navigation State
    const [activeSection, setActiveSection] = useState<"general" | "intelligence" | "security" | "system">("general");
    const [activeTab, setActiveTab] = useState<string>("identity");

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
                setTimeout(() => setSaveStatus("idle"), 3000);
                fetchSnapshots();
                if (onSave) onSave(); // Trigger branding refresh
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

    // --- NAVIGATION CONFIG ---
    const SECTIONS = [
        {
            id: "general",
            label: "General",
            icon: Globe,
            items: [
                { id: "identity", label: t('admin.tabs.context'), icon: Brain },
                { id: "branding", label: t('admin.tabs.branding') || "Branding", icon: Palette },
            ]
        },
        {
            id: "intelligence",
            label: "Intelligence",
            icon: Brain,
            items: [
                { id: "behavior", label: t('admin.tabs.behavior'), icon: Sliders },
                { id: "advanced", label: t('admin.tabs.advanced'), icon: Shield }, // Advanced contains Intents/Models
                { id: "datasets", label: t('admin.tabs.datasets'), icon: Database },
                { id: "sandbox", label: t('admin.tabs.sandbox'), icon: Send },
            ]
        },
        {
            id: "security",
            label: "Security",
            icon: Lock,
            items: [
                { id: "secrets", label: t('admin.tabs.secrets') || "Secrets", icon: Lock },
                { id: "audit", label: t('admin.tabs.audit'), icon: Eye },
            ]
        },
        {
            id: "system",
            label: "System",
            icon: Settings,
            items: [
                { id: "snapshots", label: t('admin.tabs.snapshots'), icon: Archive },
                { id: "analytics", label: t('admin.tabs.analytics'), icon: BarChart2 },
            ]
        }
    ];

    // Helper to find current section active item
    const getCurrentSection = () => SECTIONS.find(s => s.items.some(i => i.id === activeTab));

    // Auto-update section based on tab (if programmatically changed)
    useEffect(() => {
        const sec = getCurrentSection();
        if (sec && sec.id !== activeSection) setActiveSection(sec.id as any);
    }, [activeTab]);


    return (
        <div className="flex bg-gray-50 dark:bg-gray-950 h-screen overflow-hidden">
            {/* SIDEBAR NAVIGATION */}
            <aside className="w-64 bg-white dark:bg-gray-900 border-r dark:border-gray-800 flex flex-col shrink-0 z-20">
                <div className="p-6 border-b dark:border-gray-800">
                    <h1 className="text-xl font-bold dark:text-white flex items-center gap-2">
                        <Shield className="text-blue-600 w-6 h-6" />
                        <span className="tracking-tight">Governance</span>
                    </h1>
                    <p className="text-xs text-gray-400 mt-1 uppercase tracking-widest font-bold">Admin Console</p>
                </div>

                <nav className="flex-1 overflow-y-auto p-4 space-y-6">
                    {SECTIONS.map(section => (
                        <div key={section.id}>
                            <h3 className="px-3 mb-2 text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                {/* <section.icon className="w-3 h-3" /> */}
                                {section.label}
                            </h3>
                            <ul className="space-y-1">
                                {section.items.map(item => (
                                    <li key={item.id}>
                                        <button
                                            onClick={() => setActiveTab(item.id)}
                                            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all ${activeTab === item.id
                                                ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                                                : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
                                                }`}
                                        >
                                            <item.icon className={`w-4 h-4 ${activeTab === item.id ? "text-blue-500" : "text-gray-400"}`} />
                                            {item.label}
                                            {activeTab === item.id && <ChevronRight className="w-3 h-3 ml-auto opacity-50" />}
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </nav>

                <div className="p-4 border-t dark:border-gray-800">
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold transition-all shadow-lg active:scale-95 ${saveStatus === "success" ? "bg-green-600 text-white" :
                            saveStatus === "error" ? "bg-red-600 text-white" :
                                "bg-blue-600 hover:bg-blue-700 text-white"
                            } disabled:opacity-50`}
                    >
                        {isSaving ? "Saving..." : saveStatus === "success" ? <CheckCircle className="w-5 h-5" /> : <Save className="w-5 h-5" />}
                        {saveStatus === "success" ? "Saved" : saveStatus === "error" ? "Error" : "Save Changes"}
                    </button>
                </div>
            </aside>

            {/* MAIN CONTENT AREA */}
            <main className="flex-1 flex flex-col h-full overflow-hidden relative">
                {/* Header / Breadcrumb */}
                <header className="h-16 border-b dark:border-gray-800 bg-white/50 dark:bg-gray-900/50 backdrop-blur-md flex items-center px-8 justify-between shrink-0">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                        <span className="capitalize">{activeSection}</span>
                        <ChevronRight className="w-4 h-4" />
                        <span className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            {SECTIONS.find(s => s.id === activeSection)?.items.find(i => i.id === activeTab)?.label}
                        </span>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto p-8">
                    {!hasConfig && (
                        <div className="mb-6 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-6 rounded-3xl flex items-start gap-4 animate-bounce">
                            <Shield className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                            <div>
                                <h3 className="text-lg font-bold text-amber-900 dark:text-amber-100">{t('admin.alerts.no_config_warning').split('.')[0]}</h3>
                                <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">{t('admin.alerts.no_config_warning').split('.').slice(1).join('.')}</p>
                            </div>
                        </div>
                    )}

                    <div className="max-w-7xl mx-auto space-y-6">
                        {activeTab === "identity" && <IdentityTab config={config} setConfig={setConfig} />}
                        {activeTab === "branding" && <BrandingTab config={config} setConfig={setConfig} />}

                        {activeTab === "behavior" && <BehaviorTab config={config} setConfig={setConfig} />}
                        {activeTab === "advanced" && <AdvancedTab config={config} setConfig={setConfig} />}
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
                        {activeTab === "sandbox" && (
                            <SandboxTab
                                testQuery={testQuery}
                                setTestQuery={setTestQuery}
                                testResult={testResult}
                                isTesting={isTesting}
                                runTest={runTest}
                            />
                        )}

                        {activeTab === "secrets" && <SecretsTab config={config} setConfig={setConfig} />}
                        {activeTab === "audit" && <AuditTab audits={audits} refreshAudits={fetchAudits} />}

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
                    </div>
                </div>
            </main>
        </div>
    );
}
