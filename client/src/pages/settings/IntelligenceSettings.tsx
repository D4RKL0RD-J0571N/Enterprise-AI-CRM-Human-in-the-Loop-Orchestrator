import { useState, useEffect } from "react";
import { useTranslation } from 'react-i18next';
import { useAuth } from "../../context/AuthContext";
import { API_ENDPOINTS } from "../../lib/api";
import { BehaviorTab, AdvancedTab, DatasetsTab, SandboxTab } from "../../components/admin/tabs";
import { Save, CheckCircle, Brain, Database, TestTube2, Zap } from "lucide-react";
import { SecondaryTabs } from "../../components/dashboard/SecondaryTabs";
import type { AIConfig, AIDataset } from "../../types/admin";

export default function IntelligenceSettings() {
    const { t } = useTranslation();
    const { token } = useAuth();
    const [config, setConfig] = useState<AIConfig>({} as AIConfig);
    const [datasets, setDatasets] = useState<AIDataset[]>([]);
    const [activeTab, setActiveTab] = useState("behavior");

    const TABS = [
        { id: "behavior", label: t('admin.tabs.behavior') || "Core Behavior", icon: Brain },
        { id: "advanced", label: t('admin.tabs.advanced') || "Advanced Logic", icon: Zap },
        { id: "knowledge", label: t('admin.tabs.knowledge') || "Knowledge Base", icon: Database },
        { id: "sandbox", label: t('admin.tabs.sandbox') || "AI Sandbox", icon: TestTube2 },
    ];

    // Sandbox State
    // ... rest of logic ...
    const [testQuery, setTestQuery] = useState("");
    const [testResult, setTestResult] = useState<any>(null);
    const [isTesting, setIsTesting] = useState(false);

    // Dataset State
    const [selectedDataset, setSelectedDataset] = useState<AIDataset | null>(null);
    const [newDataset, setNewDataset] = useState({ name: "", data_type: "text", content: "" });

    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">("idle");

    useEffect(() => {
        const load = async () => {
            await Promise.all([fetchConfig(), fetchDatasets()]);
            setIsLoading(false);
        };
        load();
    }, []);

    const fetchConfig = async () => {
        try {
            const res = await fetch(API_ENDPOINTS.admin.config, { headers: { "Authorization": `Bearer ${token}` } });
            if (res.ok) setConfig(await res.json());
        } catch (err) { console.error(err); }
    };

    const fetchDatasets = async () => {
        try {
            const res = await fetch(API_ENDPOINTS.admin.datasets, { headers: { "Authorization": `Bearer ${token}` } });
            if (res.ok) setDatasets(await res.json());
        } catch (err) { console.error(err); }
    };

    const handleSave = async () => {
        setIsSaving(true);
        setSaveStatus("idle");
        try {
            const res = await fetch(API_ENDPOINTS.admin.config, {
                method: "POST",
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
                body: JSON.stringify(config)
            });
            if (res.ok) {
                setSaveStatus("success");
                setTimeout(() => setSaveStatus("idle"), 3000);
            } else setSaveStatus("error");
        } catch (err) { setSaveStatus("error"); }
        setIsSaving(false);
    };

    // Dataset Handlers
    const handleCreateDataset = async () => {
        try {
            const res = await fetch(API_ENDPOINTS.admin.datasets, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newDataset)
            });
            if (res.ok) { fetchDatasets(); setNewDataset({ name: "", data_type: "text", content: "" }); }
        } catch (err) { console.error(err); }
    };

    const handleUpdateDataset = async () => {
        if (!selectedDataset) return;
        try {
            const res = await fetch(API_ENDPOINTS.admin.datasetAction(selectedDataset.id), {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: selectedDataset.name, data_type: selectedDataset.data_type, content: selectedDataset.content })
            });
            if (res.ok) fetchDatasets();
        } catch (err) { console.error(err); }
    };

    const handleDeleteDataset = async (id: number) => {
        if (!confirm("Are you sure?")) return;
        try {
            const res = await fetch(API_ENDPOINTS.admin.datasetAction(id), { method: "DELETE" });
            if (res.ok) { fetchDatasets(); setSelectedDataset(null); }
        } catch (err) { console.error(err); }
    };

    const toggleDatasetActive = async (id: number) => {
        try {
            await fetch(`${API_ENDPOINTS.admin.datasets}/${id}/toggle`, { method: "POST" });
            fetchDatasets();
        } catch (err) { console.error(err); }
    };

    const handleFileUpload = async (file: File, name: string, type: string) => {
        const formData = new FormData();
        formData.append("file", file);
        await fetch(`${API_ENDPOINTS.admin.datasets}/upload?name=${encodeURIComponent(name)}&data_type=${type}`, {
            method: "POST", headers: { "Authorization": `Bearer ${token}` }, body: formData
        });
        fetchDatasets();
    };

    // Sandbox Handlers
    const runTest = async () => {
        if (!testQuery.trim()) return;
        setIsTesting(true);
        try {
            const res = await fetch(API_ENDPOINTS.admin.test, {
                method: "POST",
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
                body: JSON.stringify({ message: testQuery })
            });
            setTestResult(await res.json());
        } catch (err) { console.error(err); }
        setIsTesting(false);
    };

    if (isLoading) return <div className="p-8 text-center text-gray-500">Loading intelligence...</div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold dark:text-white">AI Intelligence</h2>
                    <p className="text-sm text-gray-500">Configure behavior, knowledge, and test your agent.</p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition-all text-sm ${saveStatus === "success" ? "bg-emerald-600 text-white" : "bg-[var(--brand-primary)] text-white hover:opacity-90 shadow-lg shadow-[var(--brand-primary)]/20"
                        }`}
                >
                    {isSaving ? "Saving..." : saveStatus === "success" ? <CheckCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                    {saveStatus === "success" ? "Saved" : "Save Changes"}
                </button>
            </div>

            <SecondaryTabs tabs={TABS} activeTab={activeTab} onChange={setActiveTab} />

            <div className="animate-in fade-in duration-500">
                {activeTab === "behavior" && <BehaviorTab config={config} setConfig={setConfig} />}
                {activeTab === "advanced" && <AdvancedTab config={config} setConfig={setConfig} />}
                {activeTab === "knowledge" && (
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
            </div>
        </div>
    );
}
