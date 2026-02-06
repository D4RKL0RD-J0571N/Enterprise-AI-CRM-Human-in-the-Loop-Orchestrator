import { useState, useEffect, useCallback } from "react";
import { API_ENDPOINTS } from "../lib/api";

interface BrandingConfig {
    business_name?: string;
    primary_color?: string;
    logo_url?: string;
}

export function useBranding() {
    const [config, setConfig] = useState<BrandingConfig>({});

    // Helper to inject CSS variables
    const applyBranding = (data: BrandingConfig) => {
        if (data.primary_color) {
            document.documentElement.style.setProperty('--brand-primary', data.primary_color);
            // Calculate a muted version (opacity 10%)
            const hex = data.primary_color.replace('#', '');
            const r = parseInt(hex.substring(0, 2), 16);
            const g = parseInt(hex.substring(2, 4), 16);
            const b = parseInt(hex.substring(4, 6), 16);
            document.documentElement.style.setProperty('--brand-primary-muted', `rgba(${r}, ${g}, ${b}, 0.1)`);
        }

        if (data.business_name) {
            document.title = `${data.business_name} | Support Console`;
        }

        if (data.logo_url) {
            const link: HTMLLinkElement | null = document.querySelector("link[rel~='icon']");
            if (link) {
                link.href = data.logo_url;
            } else {
                const newLink = document.createElement('link');
                newLink.rel = 'icon';
                newLink.href = data.logo_url;
                document.head.appendChild(newLink);
            }
        }
    };

    const refreshBranding = useCallback(async () => {
        try {
            const res = await fetch(API_ENDPOINTS.admin.config);
            if (res.ok) {
                const data = await res.json();
                setConfig(data);
                applyBranding(data);
            }
        } catch (error) {
            console.error("Failed to fetch branding", error);
        }
    }, []);

    useEffect(() => {
        refreshBranding();
    }, [refreshBranding]);

    return { config, refreshBranding };
}
