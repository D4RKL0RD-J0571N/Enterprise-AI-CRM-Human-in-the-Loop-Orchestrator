import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../context/AuthContext";
import { useBrandingContext } from "../../context/BrandingContext";
import { API_ENDPOINTS } from "../../lib/api";
import { IdentityTab, BrandingTab } from "../../components/admin/tabs";
import { Save, CheckCircle, Fingerprint, Palette } from "lucide-react";
import { SecondaryTabs } from "../../components/dashboard/SecondaryTabs";
import type { AIConfig } from "../../types/admin";

export default function OrganizationSettings() {
    const { t, i18n } = useTranslation();
    const { token } = useAuth();
    const { refreshBranding } = useBrandingContext();
    const [config, setConfig] = useState<AIConfig>({} as AIConfig);
    const [activeTab, setActiveTab] = useState("identity");
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">("idle");

    const TABS = [
        { id: "identity", label: t('admin.tabs.context') || "Business Identity", icon: Fingerprint },
        { id: "branding", label: t('admin.tabs.branding') || "Visual Branding", icon: Palette },
    ];

    // ... fetch logic remains ...
    useEffect(() => {
        fetchConfig();
    }, []);

    const fetchConfig = async () => {
        try {
            const res = await fetch(API_ENDPOINTS.admin.config, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setConfig(data);

                if (data.language_code?.startsWith("en")) {
                    i18n.changeLanguage("en");
                } else {
                    i18n.changeLanguage("es");
                }
            }
        } catch (err) {
            console.error("Failed to load config", err);
        } finally {
            setIsLoading(false);
        }
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
                refreshBranding();
                setTimeout(() => setSaveStatus("idle"), 3000);
            } else {
                setSaveStatus("error");
            }
        } catch (err) {
            setSaveStatus("error");
        }
        setIsSaving(false);
    };

    if (isLoading) return <div className="p-8 text-center text-gray-500">{t('common.loading') || "Loading settings..."}</div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold dark:text-white">{t('admin.sections.general') || "Organization Settings"}</h2>
                    <p className="text-sm text-gray-500">{t('admin.organization.desc') || "Manage your business identity and visual presence."}</p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition-all text-sm ${saveStatus === "success" ? "bg-emerald-600 text-white" :
                        saveStatus === "error" ? "bg-red-600 text-white" :
                            "bg-[var(--brand-primary)] text-white hover:opacity-90"
                        } disabled:opacity-50 shadow-lg shadow-[var(--brand-primary)]/20`}
                >
                    {isSaving ? t('common.saving') : saveStatus === "success" ? <CheckCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                    {saveStatus === "success" ? t('common.saved') : t('admin.actions.save_changes')}
                </button>
            </div>

            <SecondaryTabs tabs={TABS} activeTab={activeTab} onChange={setActiveTab} />

            <div className="animate-in fade-in duration-500">
                {activeTab === "identity" && <IdentityTab config={config} setConfig={setConfig} />}
                {activeTab === "branding" && <BrandingTab config={config} setConfig={setConfig} />}
            </div>
        </div>
    );
}
