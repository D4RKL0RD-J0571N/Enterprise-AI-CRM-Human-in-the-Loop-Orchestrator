import { useEffect, useState } from "react";
import { AnalyticsTab } from "../components/admin/tabs/AnalyticsTab";
import { useAuth } from "../context/AuthContext";
import { API_ENDPOINTS } from "../lib/api";
import type { AnalyticsItem, SecurityAudit } from "../types/admin";

export default function AnalyticsPage() {
    const { token } = useAuth();
    const [analytics, setAnalytics] = useState<AnalyticsItem[]>([]);
    const [audits, setAudits] = useState<SecurityAudit[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            await Promise.all([fetchAnalytics(), fetchAudits()]);
            setIsLoading(false);
        };
        fetchData();
    }, []);

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

    if (isLoading) {
        return <div className="p-8 text-center text-gray-500">Loading analytics...</div>;
    }

    return (
        <div className="h-full w-full">
            <AnalyticsTab analytics={analytics} audits={audits} />
        </div>
    );
}
