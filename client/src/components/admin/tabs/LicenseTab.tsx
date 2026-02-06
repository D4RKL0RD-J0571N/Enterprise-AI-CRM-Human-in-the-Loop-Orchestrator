
import { useState, useEffect } from "react";
import { API_ENDPOINTS } from "../../../lib/api";
import { useAuth } from "../../../context/AuthContext";
import { Key, CheckCircle, AlertTriangle, Loader2 } from "lucide-react";

interface LicensePayload {
    business_name: string;
    plan: string;
    features: string[];
    max_seats: number;
    expires_at: string;
}

export function LicenseTab() {
    const { token } = useAuth();

    const [status, setStatus] = useState<"loading" | "active" | "missing" | "invalid">("loading");
    const [payload, setPayload] = useState<LicensePayload | null>(null);
    const [licenseKey, setLicenseKey] = useState("");
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        fetchStatus();
    }, []);

    const fetchStatus = async () => {
        try {
            const res = await fetch(API_ENDPOINTS.admin.license, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            setStatus(data.status);
            if (data.payload) setPayload(data.payload);
            if (data.error) setError(data.error);
        } catch (err) {
            console.error(err);
            setStatus("invalid");
        }
    };

    const handleUpload = async () => {
        if (!licenseKey.trim()) return;
        setIsSubmitting(true);
        setError("");
        setMessage("");

        try {
            const res = await fetch(API_ENDPOINTS.admin.license, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ license_key: licenseKey.trim() })
            });
            const data = await res.json();

            if (!res.ok) throw new Error(data.detail || "Failed to activate license");

            setMessage("License activated successfully!");
            setPayload(data.payload);
            setStatus("active");
            setLicenseKey("");
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold dark:text-white flex items-center gap-2">
                    <Key className="w-5 h-5 text-[var(--brand-primary)]" />
                    License Management
                </h2>
                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${status === "active" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" :
                    "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                    }`}>
                    {status}
                </span>
            </div>

            {/* Status Card */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border dark:border-gray-700">
                {status === "loading" ? (
                    <div className="flex items-center justify-center p-6">
                        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                    </div>
                ) : status === "active" && payload ? (
                    <div className="space-y-4">
                        <div className="flex items-start gap-4">
                            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-full">
                                <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold dark:text-white">{payload.business_name}</h3>
                                <p className="text-sm text-gray-500 mb-2">Plan: <span className="uppercase font-semibold">{payload.plan}</span></p>
                                <p className="text-xs text-gray-400">Expires: {new Date(payload.expires_at).toLocaleDateString()}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
                            <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded border dark:border-gray-700">
                                <span className="block text-gray-500 text-xs uppercase">Max Seats</span>
                                <span className="font-mono font-bold dark:text-gray-200">{payload.max_seats}</span>
                            </div>
                            <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded border dark:border-gray-700">
                                <span className="block text-gray-500 text-xs uppercase">Features</span>
                                <div className="flex flex-wrap gap-1 mt-1">
                                    {payload.features.map(f => (
                                        <span key={f} className="px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded text-[10px]">
                                            {f}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-6">
                        <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto mb-3" />
                        <h3 className="text-lg font-medium dark:text-white">Action Required</h3>
                        <p className="text-gray-500 text-sm max-w-md mx-auto">
                            No active license found. Please verify your subscription or contact sales to activate your product.
                        </p>
                    </div>
                )}
            </div>

            {/* Upload Form */}
            <div className="bg-gray-50 dark:bg-[var(--brand-surface)] p-6 rounded-lg border dark:border-[var(--brand-border)]">
                <h3 className="text-sm font-semibold mb-3 dark:text-gray-200">Update License Key</h3>
                <textarea
                    value={licenseKey}
                    onChange={(e) => setLicenseKey(e.target.value)}
                    placeholder="Paste your standard license key (starts with eyJ...)"
                    className="w-full h-24 p-3 text-xs font-mono bg-white dark:bg-gray-900 border dark:border-gray-700 rounded-md focus:ring-2 focus:ring-[var(--brand-primary)] outline-none mb-3 resize-none"
                    spellCheck={false}
                />

                {error && <p className="text-red-500 text-xs mb-3">{error}</p>}
                {message && <p className="text-green-500 text-xs mb-3">{message}</p>}

                <button
                    onClick={handleUpload}
                    disabled={isSubmitting || !licenseKey}
                    className="px-4 py-2 bg-[var(--brand-primary)] text-white text-sm font-medium rounded-md hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                    {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                    Activate License
                </button>
            </div>
        </div>
    );
}
