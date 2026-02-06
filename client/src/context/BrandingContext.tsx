import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useAuth } from "./AuthContext";
import { API_ENDPOINTS } from "../lib/api";

interface BrandingConfig {
    business_name?: string;
    primary_color?: string;
    logo_url?: string;
    timezone?: string;
    ui_density?: 'comfortable' | 'compact';
    workspace_config?: string | Record<string, any>;
}

interface BrandingContextType {
    config: BrandingConfig;
    isDarkMode: boolean;
    toggleDarkMode: () => void;
    refreshBranding: () => Promise<void>;
}

const BrandingContext = createContext<BrandingContextType | undefined>(undefined);

export function BrandingProvider({ children }: { children: React.ReactNode }) {
    const { token } = useAuth();
    const [config, setConfig] = useState<BrandingConfig>({});
    const [isDarkMode, setIsDarkMode] = useState(() => {
        if (typeof window !== "undefined") {
            const saved = localStorage.getItem("theme");
            return saved === "dark" || (!saved && window.matchMedia("(prefers-color-scheme: dark)").matches);
        }
        return false;
    });

    useEffect(() => {
        const root = document.documentElement;
        if (isDarkMode) {
            root.classList.add('dark');
            root.style.colorScheme = 'dark';
            localStorage.setItem("theme", "dark");
        } else {
            root.classList.remove('dark');
            root.style.colorScheme = 'light';
            localStorage.setItem("theme", "light");
        }
    }, [isDarkMode]);

    const applyBranding = (data: BrandingConfig) => {
        let styleTag = document.getElementById('branding-vars') as HTMLStyleElement;
        if (!styleTag) {
            styleTag = document.createElement('style');
            styleTag.id = 'branding-vars';
            document.head.appendChild(styleTag);
        }

        // Default Values
        const vars: Record<string, string> = {
            '--brand-primary': '#2563eb',
            '--brand-primary-rgb': '37, 99, 235',
            '--brand-primary-muted': 'rgba(37, 99, 235, 0.1)',
            '--brand-secondary': '#6366f1',
            '--brand-radius': '12px',
            '--brand-bg': '#030712', // Slate-950
            '--brand-surface': '#0f172a', // Slate-900
            '--brand-border': 'rgba(255,255,255,0.1)',
            '--brand-bg-light': '#f8fafc'
        };

        if (data && data.primary_color) {
            vars['--brand-primary'] = data.primary_color;
            vars['--primary-color'] = data.primary_color; // Aliased for legacy
            try {
                const hex = data.primary_color.replace('#', '');
                const r = parseInt(hex.substring(0, 2), 16);
                const g = parseInt(hex.substring(2, 4), 16);
                const b = parseInt(hex.substring(4, 6), 16);
                vars['--brand-primary-rgb'] = `${r}, ${g}, ${b}`;
                vars['--brand-primary-muted'] = `rgba(${r}, ${g}, ${b}, 0.1)`;
                vars['--brand-primary-border'] = `rgba(${r}, ${g}, ${b}, 0.3)`;
            } catch (e) {
                console.error("Failed to parse primary color", e);
            }
        }

        // Handle Workspace Config (Radius, Secondary, Dark Background)
        if (data.workspace_config) {
            try {
                const ws = typeof data.workspace_config === 'string'
                    ? JSON.parse(data.workspace_config)
                    : data.workspace_config;

                if (ws.secondary_color) vars['--brand-secondary'] = ws.secondary_color;
                if (ws.border_radius !== undefined) vars['--brand-radius'] = `${ws.border_radius}px`;

                if (ws.bg_color) {
                    vars['--brand-bg'] = ws.bg_color;
                    // Synthesize a surface color (slightly lighter than bg)
                    try {
                        const hex = ws.bg_color.replace('#', '');
                        let r = parseInt(hex.substring(0, 2), 16);
                        let g = parseInt(hex.substring(2, 4), 16);
                        let b = parseInt(hex.substring(4, 6), 16);

                        // Lighten for surface
                        const lighten = (c: number) => Math.min(255, c + 15);
                        vars['--brand-surface'] = `rgb(${lighten(r)}, ${lighten(g)}, ${lighten(b)})`;
                        vars['--brand-border'] = `rgba(${lighten(r)}, ${lighten(g)}, ${lighten(b)}, 0.5)`;
                    } catch (e) {
                        vars['--brand-surface'] = '#1e293b';
                    }
                }
            } catch (e) {
                console.error("Failed to parse workspace config", e);
            }
        }

        const cssString = Object.entries(vars).map(([k, v]) => `${k}: ${v};`).join(' ');
        styleTag.innerHTML = `:root { ${cssString} }`;

        // Update Document Title
        if (data.business_name) {
            document.title = `${data.business_name} | Support Console`;
        } else {
            document.title = "SupportHub AI Console";
        }

        // Update Favicon
        const link: HTMLLinkElement | null = document.querySelector("link[rel~='icon']");
        const iconUrl = data.logo_url || "/favicon.ico";
        if (link) {
            link.href = iconUrl;
        } else {
            const newLink = document.createElement('link');
            newLink.rel = 'icon';
            newLink.href = iconUrl;
            document.head.appendChild(newLink);
        }

        // Apply UI Density Class
        const root = document.documentElement;
        if (data.ui_density === 'compact') {
            root.classList.add('ui-density-compact');
            root.classList.remove('ui-density-comfortable');
        } else {
            root.classList.add('ui-density-comfortable');
            root.classList.remove('ui-density-compact');
        }
    };

    const refreshBranding = useCallback(async () => {
        if (!token) return;

        try {
            const res = await fetch(API_ENDPOINTS.admin.config, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setConfig(data);
                applyBranding(data);
            }
        } catch (error) {
            console.error("Failed to fetch branding", error);
        }
    }, [token]);

    const toggleDarkMode = () => setIsDarkMode(prev => !prev);

    useEffect(() => {
        refreshBranding();
    }, [refreshBranding]);

    return (
        <BrandingContext.Provider value={{ config, isDarkMode, toggleDarkMode, refreshBranding }}>
            {children}
        </BrandingContext.Provider>
    );
}

export function useBrandingContext() {
    const context = useContext(BrandingContext);
    if (context === undefined) {
        throw new Error("useBrandingContext must be used within a BrandingProvider");
    }
    return context;
}
