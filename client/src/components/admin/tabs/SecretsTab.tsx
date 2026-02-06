import { Shield, Key, Server, Lock } from "lucide-react";
import type { AIConfig } from "../../../types/admin";
import { useTranslation } from "react-i18next";

interface SecretsTabProps {
    config: AIConfig;
    setConfig: (config: AIConfig) => void;
}

export function SecretsTab({ config, setConfig }: SecretsTabProps) {
    const { t } = useTranslation();

    const handleChange = (field: keyof AIConfig, value: string) => {
        setConfig({ ...config, [field]: value });
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-white dark:bg-[var(--brand-surface)] p-6 rounded-3xl border dark:border-[var(--brand-border)] shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-2xl">
                        <Lock className="w-6 h-6 text-red-600 dark:text-red-400" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold dark:text-white">{t('admin.secrets.title')}</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{t('admin.secrets.subtitle')}</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* OpenAI / LLM Configuration */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                            <BrainIcon className="w-4 h-4" /> {t('admin.secrets.llm_config')}
                        </h3>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-700 dark:text-gray-300">{t('admin.secrets.api_key_label')}</label>
                            <div className="relative">
                                <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="password"
                                    value={config.openai_api_key || ""}
                                    onChange={(e) => handleChange("openai_api_key", e.target.value)}
                                    placeholder={t('admin.secrets.api_key_placeholder')}
                                    className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-[var(--brand-bg)] border-none rounded-xl text-sm focus:ring-2 focus:ring-[var(--brand-primary)] dark:text-white transition-all outline-none"
                                />
                            </div>
                            <p className="text-xs text-gray-400">{t('admin.secrets.api_key_hint')}</p>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-700 dark:text-gray-300">{t('admin.secrets.api_base_label')}</label>
                            <div className="relative">
                                <Server className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    value={config.openai_api_base || ""}
                                    onChange={(e) => handleChange("openai_api_base", e.target.value)}
                                    placeholder="http://localhost:1234/v1"
                                    className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-[var(--brand-bg)] border-none rounded-xl text-sm focus:ring-2 focus:ring-[var(--brand-primary)] dark:text-white transition-all outline-none font-mono"
                                />
                            </div>
                            <p className="text-xs text-gray-400">{t('admin.secrets.api_base_hint')}</p>
                        </div>
                    </div>

                    {/* WhatsApp Configuration */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                            <MessageCircleIcon className="w-4 h-4" /> {t('admin.secrets.whatsapp_config')}
                        </h3>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-700 dark:text-gray-300">{t('admin.secrets.whatsapp_token_label')}</label>
                            <div className="relative">
                                <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="password"
                                    value={config.whatsapp_api_token || ""}
                                    onChange={(e) => handleChange("whatsapp_api_token", e.target.value)}
                                    placeholder={t('admin.secrets.whatsapp_token_placeholder')}
                                    className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-[var(--brand-bg)] border-none rounded-xl text-sm focus:ring-2 focus:ring-green-500 dark:text-white transition-all outline-none"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-8 pt-8 border-t dark:border-[var(--brand-border)] grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-700 dark:text-gray-300">{t('admin.secrets.whatsapp_driver_label')}</label>
                            <select
                                value={config.whatsapp_driver || "mock"}
                                onChange={(e) => handleChange("whatsapp_driver", e.target.value as any)}
                                className="w-full px-4 py-2 bg-gray-50 dark:bg-[var(--brand-bg)] border-none rounded-xl text-sm focus:ring-2 focus:ring-green-500 dark:text-white transition-all outline-none"
                            >
                                <option value="mock">{t('admin.secrets.whatsapp_driver_mock')}</option>
                                <option value="meta">{t('admin.secrets.whatsapp_driver_meta')}</option>
                            </select>
                            <p className="text-[10px] text-gray-500 italic">{t('admin.secrets.whatsapp_driver_hint')}</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {config.whatsapp_driver === 'meta' && (
                            <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                                <label className="text-sm font-bold text-gray-700 dark:text-gray-300">{t('admin.secrets.whatsapp_phone_id_label')}</label>
                                <div className="relative">
                                    <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        type="text"
                                        value={config.whatsapp_phone_id || ""}
                                        onChange={(e) => handleChange("whatsapp_phone_id", e.target.value)}
                                        placeholder={t('admin.secrets.whatsapp_phone_id_placeholder')}
                                        className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-[var(--brand-bg)] border-none rounded-xl text-sm focus:ring-2 focus:ring-green-500 dark:text-white transition-all outline-none"
                                    />
                                </div>
                            </div>
                        )}
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-700 dark:text-gray-300">{t('admin.secrets.verify_token_label')}</label>
                            <div className="relative">
                                <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    value={config.whatsapp_verify_token || ""}
                                    onChange={(e) => handleChange("whatsapp_verify_token", e.target.value)}
                                    placeholder={t('admin.secrets.verify_token_placeholder')}
                                    className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-[var(--brand-bg)] border-none rounded-xl text-sm focus:ring-2 focus:ring-green-500 dark:text-white transition-all outline-none font-mono"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function BrainIcon(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z" />
            <path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z" />
            <path d="M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4" />
            <path d="M17.599 6.5a3 3 0 0 0 .399-1.375" />
            <path d="M6.003 5.125A3 3 0 0 0 6.401 6.5" />
            <path d="M3.477 10.896a4 4 0 0 1 .585-.396" />
            <path d="M19.938 10.5a4 4 0 0 1 .585.396" />
            <path d="M6 18a4 4 0 0 1-1.97-3.284" />
            <path d="M17.97 14.716A4 4 0 0 1 18 18" />
        </svg>
    )
}

function MessageCircleIcon(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="m3 21 1.9-5.7a8.5 8.5 0 1 1 3.8 3.8z" />
        </svg>
    )
}
