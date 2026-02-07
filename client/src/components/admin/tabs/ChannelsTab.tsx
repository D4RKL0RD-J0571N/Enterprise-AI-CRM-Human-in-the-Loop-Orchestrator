import { MessageSquare, Mail, Instagram, Shield, Key, Server } from "lucide-react";
import type { AIConfig } from "../../../types/admin";

interface ChannelsTabProps {
    config: AIConfig;
    setConfig: (config: AIConfig) => void;
}

export function ChannelsTab({ config, setConfig }: ChannelsTabProps) {
    const updateField = (field: keyof AIConfig, value: any) => {
        setConfig({ ...config, [field]: value });
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* WhatsApp Integration */}
            <div className="bg-white dark:bg-[var(--brand-surface)] p-8 rounded-3xl shadow-sm border dark:border-[var(--brand-border)]">
                <div className="flex items-center gap-4 mb-8">
                    <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-2xl">
                        <MessageSquare className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold dark:text-white">WhatsApp Business API</h3>
                        <p className="text-sm text-gray-500">Connect your official WhatsApp Business account.</p>
                    </div>
                    <div className="ml-auto flex items-center gap-2">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${config.whatsapp_driver === 'meta' ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-white'}`}>
                            {config.whatsapp_driver === 'meta' ? 'Live' : 'Sandbox (Mock)'}
                        </span>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Driver Mode</label>
                        <select
                            value={config.whatsapp_driver || 'mock'}
                            onChange={(e) => updateField('whatsapp_driver', e.target.value)}
                            className="w-full p-4 bg-gray-50 dark:bg-gray-950/50 rounded-2xl border-2 border-transparent focus:border-[var(--brand-primary)] focus:outline-none transition-all dark:text-white"
                        >
                            <option value="mock">Sandbox (Developer Mock)</option>
                            <option value="meta">Meta Cloud API (Official)</option>
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Phone ID</label>
                        <input
                            type="text"
                            value={config.whatsapp_phone_id || ''}
                            onChange={(e) => updateField('whatsapp_phone_id', e.target.value)}
                            className="w-full p-4 bg-gray-50 dark:bg-gray-950/50 rounded-2xl border-2 border-transparent focus:border-[var(--brand-primary)] focus:outline-none transition-all dark:text-white"
                            placeholder="e.g. 1092837465"
                        />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">API Access Token</label>
                        <div className="relative">
                            <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="password"
                                value={config.whatsapp_api_token || ''}
                                onChange={(e) => updateField('whatsapp_api_token', e.target.value)}
                                className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-gray-950/50 rounded-2xl border-2 border-transparent focus:border-[var(--brand-primary)] focus:outline-none transition-all dark:text-white"
                                placeholder="EAABw..."
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Email Integration */}
            <div className="bg-white dark:bg-[var(--brand-surface)] p-8 rounded-3xl shadow-sm border dark:border-[var(--brand-border)]">
                <div className="flex items-center gap-4 mb-8">
                    <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-2xl">
                        <Mail className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold dark:text-white">Email (SMTP)</h3>
                        <p className="text-sm text-gray-500">Send and receive messages via professional email.</p>
                    </div>
                    <div className="ml-auto">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${config.email_driver === 'smtp' ? 'bg-emerald-500 text-white' : 'bg-gray-500 text-white'}`}>
                            {config.email_driver === 'smtp' ? 'Active' : 'Disabled'}
                        </span>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Driver</label>
                            <select
                                value={config.email_driver || 'mock'}
                                onChange={(e) => updateField('email_driver', e.target.value)}
                                className="w-full p-4 bg-gray-50 dark:bg-gray-950/50 rounded-2xl border-2 border-transparent focus:border-[var(--brand-primary)] focus:outline-none transition-all dark:text-white"
                            >
                                <option value="mock">None (Placeholder Messages)</option>
                                <option value="smtp">Standard SMTP Server</option>
                            </select>
                        </div>
                    </div>

                    <div className="bg-gray-50 dark:bg-black/20 p-6 rounded-2xl border border-dashed border-gray-200 dark:border-gray-800 self-start">
                        <h4 className="text-xs font-black uppercase tracking-widest mb-4 flex items-center gap-2">
                            <Mail className="w-3 h-3 text-[var(--brand-primary)]" />
                            SMTP Setup Guide
                        </h4>
                        <ul className="space-y-3 text-xs text-secondary-foreground/70">
                            <li className="flex gap-2">
                                <span className="w-4 h-4 rounded-full bg-[var(--brand-primary)]/10 text-[var(--brand-primary)] flex items-center justify-center shrink-0 font-bold">1</span>
                                <div>Enable <b>2FA</b> on your email account.</div>
                            </li>
                            <li className="flex gap-2">
                                <span className="w-4 h-4 rounded-full bg-[var(--brand-primary)]/10 text-[var(--brand-primary)] flex items-center justify-center shrink-0 font-bold">2</span>
                                <div>Generate an <b>App Password</b> (Gmail calls this 'App Passwords').</div>
                            </li>
                            <li className="flex gap-2">
                                <span className="w-4 h-4 rounded-full bg-[var(--brand-primary)]/10 text-[var(--brand-primary)] flex items-center justify-center shrink-0 font-bold">3</span>
                                <div>Use port <b>587</b> for TLS or <b>465</b> for SSL.</div>
                            </li>
                        </ul>
                    </div>
                </div>

                {config.email_driver === 'smtp' && (
                    <>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">SMTP Server</label>
                            <div className="relative">
                                <Server className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    value={config.email_smtp_server || ''}
                                    onChange={(e) => updateField('email_smtp_server', e.target.value)}
                                    className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-gray-950/50 rounded-2xl border-2 border-transparent focus:border-[var(--brand-primary)] focus:outline-none transition-all dark:text-white"
                                    placeholder="smtp.gmail.com"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">SMTP Port</label>
                            <input
                                type="number"
                                value={config.email_smtp_port || 587}
                                onChange={(e) => updateField('email_smtp_port', parseInt(e.target.value))}
                                className="w-full p-4 bg-gray-50 dark:bg-gray-950/50 rounded-2xl border-2 border-transparent focus:border-[var(--brand-primary)] focus:outline-none transition-all dark:text-white"
                                placeholder="587"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">User / Email</label>
                            <input
                                type="text"
                                value={config.email_user || ''}
                                onChange={(e) => updateField('email_user', e.target.value)}
                                className="w-full p-4 bg-gray-50 dark:bg-gray-950/50 rounded-2xl border-2 border-transparent focus:border-[var(--brand-primary)] focus:outline-none transition-all dark:text-white"
                                placeholder="support@company.com"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Password / App Key</label>
                            <input
                                type="password"
                                value={config.email_password || ''}
                                onChange={(e) => updateField('email_password', e.target.value)}
                                className="w-full p-4 bg-gray-50 dark:bg-gray-950/50 rounded-2xl border-2 border-transparent focus:border-[var(--brand-primary)] focus:outline-none transition-all dark:text-white"
                                placeholder="••••••••"
                            />
                        </div>
                    </>
                )}
            </div>

            {/* Meta Integration (Instagram / Messenger) */}
            <div className="bg-white dark:bg-[var(--brand-surface)] p-8 rounded-3xl shadow-sm border dark:border-[var(--brand-border)]">
                <div className="flex items-center gap-4 mb-8">
                    <div className="p-3 bg-pink-100 dark:bg-pink-900/30 rounded-2xl">
                        <Instagram className="w-6 h-6 text-pink-600 dark:text-pink-400" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold dark:text-white">Instagram & Messenger</h3>
                        <p className="text-sm text-gray-500">Connect your Meta Business Page and Instagram accounts.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Meta Driver</label>
                            <select
                                value={config.meta_driver || 'mock'}
                                onChange={(e) => updateField('meta_driver', e.target.value)}
                                className="w-full p-4 bg-gray-50 dark:bg-gray-950/50 rounded-2xl border-2 border-transparent focus:border-[var(--brand-primary)] focus:outline-none transition-all dark:text-white"
                            >
                                <option value="mock">Sandbox (Developer Mock)</option>
                                <option value="meta">Meta Graph API (Official)</option>
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Instagram Business ID</label>
                            <input
                                type="text"
                                value={config.instagram_business_id || ''}
                                onChange={(e) => updateField('instagram_business_id', e.target.value)}
                                className="w-full p-4 bg-gray-50 dark:bg-gray-950/50 rounded-2xl border-2 border-transparent focus:border-[var(--brand-primary)] focus:outline-none transition-all dark:text-white"
                                placeholder="e.g. 178414000..."
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Page Access Token</label>
                            <input
                                type="password"
                                value={config.facebook_api_token || ''}
                                onChange={(e) => updateField('facebook_api_token', e.target.value)}
                                className="w-full p-4 bg-gray-50 dark:bg-gray-950/50 rounded-2xl border-2 border-transparent focus:border-[var(--brand-primary)] focus:outline-none transition-all dark:text-white"
                                placeholder="EAAC..."
                            />
                        </div>
                    </div>

                    <div className="bg-gray-50 dark:bg-black/20 p-6 rounded-2xl border border-dashed border-gray-200 dark:border-gray-800 self-start">
                        <h4 className="text-xs font-black uppercase tracking-widest mb-4 flex items-center gap-2">
                            <Shield className="w-3 h-3 text-[var(--brand-primary)]" />
                            How to Link Meta
                        </h4>
                        <ul className="space-y-3 text-xs text-secondary-foreground/70">
                            <li className="flex gap-2">
                                <span className="w-4 h-4 rounded-full bg-[var(--brand-primary)]/10 text-[var(--brand-primary)] flex items-center justify-center shrink-0 font-bold">1</span>
                                <div>Create a Meta App in <b>developers.facebook.com</b></div>
                            </li>
                            <li className="flex gap-2">
                                <span className="w-4 h-4 rounded-full bg-[var(--brand-primary)]/10 text-[var(--brand-primary)] flex items-center justify-center shrink-0 font-bold">2</span>
                                <div>Add <b>WhatsApp</b> or <b>Messenger</b> products to your app.</div>
                            </li>
                            <li className="flex gap-2">
                                <span className="w-4 h-4 rounded-full bg-[var(--brand-primary)]/10 text-[var(--brand-primary)] flex items-center justify-center shrink-0 font-bold">3</span>
                                <div>Generate a <b>Permanent system user token</b> with <i>whatsapp_business_messaging</i> permissions.</div>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>

            <div className="flex gap-4 p-6 bg-[var(--brand-primary)]/5 rounded-3xl border border-[var(--brand-primary)]/10">
                <Shield className="w-8 h-8 text-[var(--brand-primary)] shrink-0" />
                <div>
                    <h4 className="font-bold text-[var(--brand-primary)]">Security Note</h4>
                    <p className="text-xs text-gray-500 mt-1">
                        All API tokens and passwords are encrypted using AES-256 before being stored in our database.
                        Never share your verify tokens or access keys with unauthorized users.
                    </p>
                </div>
            </div>
        </div >
    );
}
