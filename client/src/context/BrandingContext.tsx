import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

interface BrandingConfig {
    business_name?: string;
    primary_color?: string;
    logo_url?: string;
}

interface BrandingContextType {
    config: BrandingConfig;
    refreshBranding: () => Promise<void>;
}

const BrandingContext = createContext<BrandingContextType | undefined>(undefined);

export function BrandingProvider({ children }: { children: React.ReactNode }) {
    const [config, setConfig] = useState<BrandingConfig>({});

    const applyBranding = (data: BrandingConfig) => {
        let styleTag = document.getElementById('branding-vars') as HTMLStyleElement;
        if (!styleTag) {
            styleTag = document.createElement('style');
            styleTag.id = 'branding-vars';
            document.head.appendChild(styleTag);
        }

        let cssVariables = '--brand-primary: #2563eb; --brand-primary-muted: rgba(37, 99, 235, 0.1); ';
        if (data.primary_color) {
            cssVariables = `--brand-primary: ${data.primary_color}; `;
            const hex = data.primary_color.replace('#', '');
            const r = parseInt(hex.substring(0, 2), 16);
            const g = parseInt(hex.substring(2, 4), 16);
            const b = parseInt(hex.substring(4, 6), 16);
            cssVariables += `--brand-primary-muted: rgba(${r}, ${g}, ${b}, 0.1); `;
        }

        if (cssVariables) {
            styleTag.innerHTML = `:root { ${cssVariables} }`;
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
            const res = await fetch("http://localhost:8000/admin/config");
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

    return (
        <BrandingContext.Provider value={{ config, refreshBranding }}>
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
