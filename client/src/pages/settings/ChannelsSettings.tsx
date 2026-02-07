import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { API_ENDPOINTS } from "../../lib/api";
import { ChannelsTab } from "../../components/admin/tabs";
import { Save, CheckCircle } from "lucide-react";
import type { AIConfig } from "../../types/admin";

export default function ChannelsSettings() {
    const { token } = useAuth();
    const [config, setConfig] = useState<AIConfig>({} as AIConfig);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">("idle");

    useEffect(() => {
        const fetchConfig = async () => {
            try {
                const res = await fetch(API_ENDPOINTS.admin.config, { headers: { "Authorization": `Bearer ${token}` } });
                if (res.ok) setConfig(await res.json());
            } catch (err) { console.error(err); }
            setIsLoading(false);
        };
        fetchConfig();
    }, [token]);

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

    if (isLoading) return <div className="p-8 text-center text-gray-500">Loading channels...</div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold dark:text-white">Communication Channels</h2>
                    <p className="text-sm text-gray-500">Manage how your AI communicates with clients across platforms.</p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold transition-all text-sm ${saveStatus === "success" ? "bg-emerald-600 text-white" : "bg-[var(--brand-primary)] text-white hover:opacity-90 shadow-lg shadow-[var(--brand-primary)]/20"
                        }`}
                >
                    {isSaving ? "Saving..." : saveStatus === "success" ? <CheckCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                    {saveStatus === "success" ? "Saved" : "Save Changes"}
                </button>
            </div>

            <div className="animate-in fade-in duration-500">
                <ChannelsTab config={config} setConfig={setConfig} />
            </div>
        </div>
    );
}
