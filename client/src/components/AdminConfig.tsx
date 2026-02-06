import { useState, useEffect } from "react";
import { Save, CheckCircle, Shield, Brain, Sliders, Send, Database, Archive, BarChart2, Eye, Palette, Lock, Globe, Settings, ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import { API_ENDPOINTS } from "../lib/api";
import type { AIConfig, AIConfigSnapshot, AIDataset, AnalyticsItem, SecurityAudit, AuditLogItem } from "../types/admin";

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

const DEFAULT_CONFIG: AIConfig = {
    business_name: "",
    business_description: "",
    tone: "friendly, concise, and professional",
    rules: [],
    auto_respond_threshold: 85,
    review_threshold: 60,
    forbidden_topics: [],
    language_code: "es-CR",
    translate_messages: false,
    identity_prompt: "",
    grounding_template: "",
    intent_rules: [],
    fallback_message: "I am currently having trouble processing your request.",
    preferred_model: "gpt-4-turbo",
    logo_url: null,
    primary_color: "#2563eb",
    ui_density: "comfortable",
    timezone: "UTC",
    suggestions_json: []
};

export default function AdminConfig({ onSave }: AdminConfigProps) {
    const { t, i18n } = useTranslation();
    const { token } = useAuth();
    const [config, setConfig] = useState<AIConfig>(DEFAULT_CONFIG);

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
    const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);


    useEffect(() => {
        fetchConfig();
        fetchDatasets();
        fetchSnapshots();
        fetchAnalytics();
        fetchAudits();
        fetchAuditLogs();
    }, []);

    const fetchAuditLogs = async () => {
        try {
            const res = await fetch(API_ENDPOINTS.admin.auditsOperational, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            const data = await res.json();
            setAuditLogs(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error("Failed to load audit logs", err);
            setAuditLogs([]);
        }
    };

    const fetchAnalytics = async () => {
        try {
            const res = await fetch(API_ENDPOINTS.admin.analytics, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            const data = await res.json();
            setAnalytics(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error("Failed to load analytics", err);
            setAnalytics([]);
        }
    };

    const fetchSnapshots = async () => {
        try {
            const res = await fetch(API_ENDPOINTS.admin.snapshots, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            const data = await res.json();
            setSnapshots(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error("Failed to load snapshots", err);
            setSnapshots([]);
        }
    };

    const fetchDatasets = async () => {
        try {
            const res = await fetch(API_ENDPOINTS.admin.datasets, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            const data = await res.json();
            setDatasets(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error("Failed to load datasets", err);
            setDatasets([]);
        }
    };

    const fetchAudits = async () => {
        try {
            const res = await fetch(API_ENDPOINTS.admin.auditsSecurity, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            const data = await res.json();
            setAudits(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error("Failed to load audits", err);
            setAudits([]);
        }
    };

    const [hasConfig, setHasConfig] = useState(true);

    const fetchConfig = async () => {
        try {
            const res = await fetch(API_ENDPOINTS.admin.config, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (res.status === 404) {
                setHasConfig(false);
                return;
            }
            const data = await res.json();

            // Ensure array fields are not null/undefined to prevent crashes
            const safeData = {
                ...DEFAULT_CONFIG,
                ...data,
                rules: Array.isArray(data.rules) ? data.rules : DEFAULT_CONFIG.rules,
                intent_rules: Array.isArray(data.intent_rules) ? data.intent_rules : DEFAULT_CONFIG.intent_rules,
                forbidden_topics: Array.isArray(data.forbidden_topics) ? data.forbidden_topics : DEFAULT_CONFIG.forbidden_topics,
                suggestions_json: Array.isArray(data.suggestions_json) ? data.suggestions_json : DEFAULT_CONFIG.suggestions_json
            };

            setConfig(safeData);
            setHasConfig(true);

            if (safeData.language_code?.startsWith("en")) {
                i18n.changeLanguage("en");
            } else {
                i18n.changeLanguage("es");
            }
        } catch (err) {
            console.error("Failed to load config", err);
        }
    };

    const runTest = async () => {
        if (!testQuery.trim()) return;
        setIsTesting(true);
        try {
            const res = await fetch(API_ENDPOINTS.admin.test, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
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
            const res = await fetch(API_ENDPOINTS.admin.config, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
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
            const res = await fetch(API_ENDPOINTS.admin.snapshotAction(snapshotId.toString(), "rollback"), {
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
            const res = await fetch(API_ENDPOINTS.admin.datasets, {
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
            const res = await fetch(API_ENDPOINTS.admin.datasetAction(selectedDataset.id), {
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
            const res = await fetch(API_ENDPOINTS.admin.datasetAction(id), {
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
            await fetch(`${API_ENDPOINTS.admin.datasets}/${id}/toggle`, { method: "POST" });
            fetchDatasets();
        } catch (err) {
            console.error(err);
        }
    };

    const handleFileUpload = async (file: File, name: string, type: string) => {
        setIsSaving(true);
        const formData = new FormData();
        formData.append("file", file);

        try {
            const res = await fetch(`${API_ENDPOINTS.admin.datasets}/upload?name=${encodeURIComponent(name)}&data_type=${type}`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`
                },
                body: formData
            });

            if (res.ok) {
                fetchDatasets();
                setSaveStatus("success");
                setTimeout(() => setSaveStatus("idle"), 2000);
            } else {
                setSaveStatus("error");
            }
        } catch (err) {
            console.error(err);
            setSaveStatus("error");
        }
        setIsSaving(false);
    };

    const handleDeleteSnapshot = async (id: number) => {
        if (!confirm(t('admin.fields.delete_snapshot_confirm'))) return;
        try {
            const res = await fetch(API_ENDPOINTS.admin.snapshotAction(id.toString(), ""), { method: "DELETE" });
            if (res.ok) fetchSnapshots();
            else {
                const err = await res.json();
                alert(err.detail || t('common.error'));
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleRenameSnapshot = async (id: number, newName: string) => {
        try {
            await fetch(API_ENDPOINTS.admin.snapshotAction(id.toString(), "name"), {
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
            await fetch(API_ENDPOINTS.admin.snapshotAction(id.toString(), "toggle-lock"), { method: "POST" });
            fetchSnapshots();
        } catch (err) {
            console.error(err);
        }
    };

    // --- NAVIGATION CONFIG ---
    const SECTIONS = [
        {
            id: "general",
            label: t('admin.sections.general'),
            icon: Globe,
            items: [
                { id: "identity", label: t('admin.tabs.context'), icon: Brain },
                { id: "branding", label: t('admin.tabs.branding'), icon: Palette },
            ]
        },
        {
            id: "intelligence",
            label: t('admin.sections.intelligence'),
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
            label: t('admin.sections.security'),
            icon: Lock,
            items: [
                { id: "secrets", label: t('admin.tabs.secrets'), icon: Lock },
                { id: "audit", label: t('admin.tabs.audit'), icon: Eye },
            ]
        },
        {
            id: "system",
            label: t('admin.sections.system'),
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

    // Keyboard Navigation for Sidebar
    useEffect(() => {
        const allTabIds = SECTIONS.flatMap(s => s.items.map(i => i.id));
        const handleKeyDown = (e: KeyboardEvent) => {
            if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') return;

            const currentIndex = allTabIds.indexOf(activeTab);
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                const nextIndex = (currentIndex + 1) % allTabIds.length;
                setActiveTab(allTabIds[nextIndex]);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                const prevIndex = (currentIndex - 1 + allTabIds.length) % allTabIds.length;
                setActiveTab(allTabIds[prevIndex]);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [activeTab]);


    return (
        <div className="flex bg-gray-50 dark:bg-[var(--brand-bg)] h-screen overflow-hidden">
            {/* SIDEBAR NAVIGATION */}
            <aside className="w-64 bg-white dark:bg-[var(--brand-surface)] border-r dark:border-[var(--brand-border)] flex flex-col shrink-0 z-20">
                <div className="p-6 border-b dark:border-[var(--brand-border)]">
                    <h1 className="text-xl font-bold dark:text-white flex items-center gap-2">
                        <Shield className="text-brand-primary w-6 h-6" style={{ color: 'var(--brand-primary)' }} />
                        <span className="tracking-tight">{t('admin.header_title')}</span>
                    </h1>
                    <p className="text-xs text-gray-400 mt-1 uppercase tracking-widest font-bold">{t('admin.admin_console')}</p>
                </div>

                <nav className="flex-1 overflow-y-auto p-4 space-y-6">
                    {SECTIONS.map(section => (
                        <div key={section.id}>
                            <h3 className="px-3 mb-2 text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2 select-none">
                                {/* <section.icon className="w-3 h-3" /> */}
                                {section.label}
                            </h3>
                            <ul className="space-y-1">
                                {section.items.map(item => (
                                    <li key={item.id}>
                                        <button
                                            onClick={() => setActiveTab(item.id)}
                                            aria-label={`Go to ${item.label} tab`}
                                            aria-selected={activeTab === item.id}
                                            role="tab"
                                            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all select-none hover-premium ${activeTab === item.id
                                                ? "text-white shadow-md transform scale-[1.02]"
                                                : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
                                                }`}
                                            style={activeTab === item.id ? { backgroundColor: 'var(--brand-primary)' } : {}}
                                        >
                                            <item.icon className={`w-4 h-4 ${activeTab === item.id ? "text-white" : "text-gray-400"}`} />
                                            {item.label}
                                            {activeTab === item.id && <ChevronRight className="w-3 h-3 ml-auto opacity-50 text-white" />}
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </nav>

                <div className="p-4 border-t dark:border-[var(--brand-border)]">
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        aria-label="Save changes"
                        className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold transition-all shadow-lg active:scale-95 select-none hover-premium ${saveStatus === "success" ? "bg-green-600 text-white" :
                            saveStatus === "error" ? "bg-red-600 text-white" :
                                "text-white"
                            } disabled:opacity-50`}
                        style={saveStatus === "idle" ? { backgroundColor: 'var(--brand-primary)' } : {}}
                    >
                        {isSaving ? t('common.saving') : saveStatus === "success" ? <CheckCircle className="w-5 h-5" /> : <Save className="w-5 h-5" />}
                        {saveStatus === "success" ? t('common.saved') : saveStatus === "error" ? t('common.error') : t('common.save')}
                    </button>
                </div>
            </aside>

            {/* MAIN CONTENT AREA */}
            <main className="flex-1 flex flex-col h-full overflow-hidden relative">
                {/* Header / Breadcrumb */}
                <header className="h-16 border-b dark:border-[var(--brand-border)] bg-white/50 dark:bg-[var(--brand-bg)]/50 backdrop-blur-md flex items-center px-8 justify-between shrink-0">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                        <span>{SECTIONS.find(s => s.id === activeSection)?.label}</span>
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
                                <h3 className="text-lg font-bold text-amber-900 dark:text-amber-100">{t('admin.alerts.no_config_warning')}</h3>
                            </div>
                        </div>
                    )}

                    <div className="w-full space-y-6">
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
                                handleFileUpload={handleFileUpload}
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
                        {activeTab === "audit" && (
                            <AuditTab audits={audits} auditLogs={auditLogs} refreshAudits={fetchAudits} />
                        )}  {activeTab === "snapshots" && (
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
