import { useTranslation } from "react-i18next";
import { Brain, Globe } from "lucide-react";
import type { AIConfig } from "../../../types/admin";

interface Props {
    config: AIConfig;
    setConfig: (config: AIConfig) => void;
}

export const IdentityTab = ({ config, setConfig }: Props) => {
    const { t, i18n } = useTranslation();

    const handleLanguageChange = (lang: string) => {
        setConfig({ ...config, language_code: lang });
        if (lang.startsWith('en')) {
            i18n.changeLanguage('en');
        } else {
            i18n.changeLanguage('es');
        }
    };

    return (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="bg-white dark:bg-gray-900 p-8 rounded-3xl border dark:border-gray-800 shadow-sm space-y-6 h-fit">
                <h2 className="text-lg font-bold dark:text-white border-b dark:border-gray-800 pb-3 flex items-center gap-2">
                    <Brain className="w-5 h-5 text-blue-500" /> {t('admin.sections.business_identity')}
                </h2>
                <div className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">{t('admin.fields.business_name')}</label>
                        <input
                            type="text"
                            value={config.business_name}
                            onChange={(e) => setConfig({ ...config, business_name: e.target.value })}
                            className="w-full bg-gray-50 dark:bg-gray-800 p-4 rounded-2xl border-none focus:ring-2 focus:ring-blue-500 dark:text-white outline-none"
                            placeholder={t('admin.fields.business_name_placeholder')}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">{t('admin.fields.business_tone')}</label>
                        <select
                            value={config.tone}
                            onChange={(e) => setConfig({ ...config, tone: e.target.value })}
                            className="w-full bg-gray-50 dark:bg-gray-800 p-4 rounded-2xl border-none focus:ring-2 focus:ring-blue-500 dark:text-white outline-none"
                        >
                            <option value="friendly, concise, and professional">{t('admin.tones.professional')}</option>
                            <option value="casual and energetic">{t('admin.tones.casual')}</option>
                            <option value="luxury and sophisticated">{t('admin.tones.formal')}</option>
                            <option value="technical and precise">{t('admin.tones.technical')}</option>
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">{t('admin.fields.business_description')}</label>
                        <textarea
                            value={config.business_description}
                            onChange={(e) => setConfig({ ...config, business_description: e.target.value })}
                            className="w-full bg-gray-50 dark:bg-gray-800 p-4 rounded-2xl border-none focus:ring-2 focus:ring-blue-500 dark:text-white outline-none h-32 resize-none"
                            placeholder={t('admin.fields.business_description_placeholder')}
                        />
                    </div>
                </div>
            </div>

            <div className="space-y-8 h-fit">
                <div className="bg-white dark:bg-gray-900 p-8 rounded-3xl border dark:border-gray-800 shadow-sm space-y-6">
                    <h2 className="text-lg font-bold dark:text-white border-b dark:border-gray-800 pb-3 flex items-center gap-2">
                        <Brain className="w-5 h-5 text-purple-500" /> {t('admin.fields.identity_prompt')}
                    </h2>
                    <div className="space-y-2">
                        <p className="text-[10px] text-gray-500 mb-4 uppercase tracking-tighter font-bold">{t('admin.fields.identity_prompt_hint')}</p>
                        <textarea
                            value={config.identity_prompt || ""}
                            onChange={(e) => setConfig({ ...config, identity_prompt: e.target.value })}
                            className="w-full bg-gray-50 dark:bg-gray-800 p-4 rounded-2xl border-none focus:ring-2 focus:ring-blue-500 dark:text-white outline-none h-48 resize-none font-mono text-sm shadow-inner"
                            placeholder={t('admin.fields.identity_prompt_placeholder')}
                        />
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-900 p-8 rounded-3xl border dark:border-gray-800 shadow-sm space-y-6">
                    <h2 className="text-lg font-bold dark:text-white border-b dark:border-gray-800 pb-3 flex items-center gap-2">
                        <Globe className="w-5 h-5 text-emerald-500" /> {t('admin.sections.language_analytics')}
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">{t('admin.fields.app_language')}</label>
                            <select
                                value={config.language_code}
                                onChange={(e) => handleLanguageChange(e.target.value)}
                                className="w-full bg-gray-50 dark:bg-gray-800 p-4 rounded-2xl border-none focus:ring-2 focus:ring-blue-500 dark:text-white outline-none"
                            >
                                <option value="es-CR">{t('admin.languages.spanish')}</option>
                                <option value="en-US">{t('admin.languages.english')}</option>
                            </select>
                        </div>
                        <div className="flex flex-col justify-center">
                            <label className="flex items-center gap-3 cursor-pointer group">
                                <div className="relative">
                                    <input
                                        type="checkbox"
                                        className="sr-only peer"
                                        checked={config.translate_messages}
                                        onChange={(e) => setConfig({ ...config, translate_messages: e.target.checked })}
                                    />
                                    <div className="w-12 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-emerald-500"></div>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-sm font-bold dark:text-white group-hover:text-emerald-500 transition-colors leading-tight">{t('admin.fields.auto_translate')}</span>
                                    <p className="text-[10px] text-gray-500 mt-0.5">{t('admin.fields.auto_translate_hint')}</p>
                                </div>
                            </label>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
