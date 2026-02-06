import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Lock, User, Shield, ArrowRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { API_ENDPOINTS } from "../lib/api";

export default function LoginPage() {
    const { t } = useTranslation();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const { login } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");

        try {
            const formData = new URLSearchParams();
            formData.append("username", username);
            formData.append("password", password);

            const res = await fetch(API_ENDPOINTS.auth.login, {
                method: "POST",
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                body: formData
            });

            if (res.ok) {
                const data = await res.json();
                login(data.access_token, { username, role: data.role });
            } else {
                const data = await res.json();
                setError(data.detail || t('auth.error_failed'));
            }
        } catch (err) {
            setError(t('auth.error_unreachable'));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full bg-[var(--brand-bg)] flex items-center justify-center p-6 relative overflow-hidden">
            {/* Ambient Background Elements */}
            <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[var(--brand-primary)]/20 blur-[120px] rounded-full scale-150 animate-pulse"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[var(--brand-secondary)]/20 blur-[120px] rounded-full scale-150 animate-pulse delay-700"></div>
            </div>

            <div className="w-full max-w-md relative z-10">
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-10 rounded-[32px] shadow-2xl space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
                    <div className="text-center space-y-2">
                        <div className="inline-flex p-4 bg-[var(--brand-primary)]/10 rounded-2xl border border-[var(--brand-primary)]/20 mb-2">
                            <Shield className="w-8 h-8 text-[var(--brand-primary)]" />
                        </div>
                        <h1 className="text-3xl font-black text-white tracking-tight">{t('auth.title')}</h1>
                        <p className="text-gray-400 text-sm font-medium">{t('auth.subtitle')}</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-1.5">
                            <label htmlFor="username" className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] ml-1 cursor-pointer select-none">{t('auth.label_identity')}</label>
                            <div className="relative group">
                                <label htmlFor="username" className="absolute left-4 top-1/2 -translate-y-1/2 cursor-text">
                                    <User className="w-4 h-4 text-slate-500 group-focus-within:text-[var(--brand-primary)] transition-colors" />
                                </label>
                                <input
                                    id="username"
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    placeholder={t('auth.placeholder_username')}
                                    spellCheck={false}
                                    autoComplete="username"
                                    className="w-full bg-[var(--brand-surface)]/50 border border-[var(--brand-border)] rounded-2xl py-4 pl-12 pr-4 text-white text-base focus:ring-2 focus:ring-[var(--brand-primary)]/50 focus:border-[var(--brand-primary)]/50 transition-all outline-none"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label htmlFor="password" className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] ml-1 cursor-pointer select-none">{t('auth.label_credentials')}</label>
                            <div className="relative group">
                                <label htmlFor="password" className="absolute left-4 top-1/2 -translate-y-1/2 cursor-text">
                                    <Lock className="w-4 h-4 text-slate-500 group-focus-within:text-[var(--brand-primary)] transition-colors" />
                                </label>
                                <input
                                    id="password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder={t('auth.placeholder_password')}
                                    autoComplete="current-password"
                                    className="w-full bg-[var(--brand-surface)]/50 border border-[var(--brand-border)] rounded-2xl py-4 pl-12 pr-4 text-white text-base focus:ring-2 focus:ring-[var(--brand-primary)]/50 focus:border-[var(--brand-primary)]/50 transition-all outline-none"
                                    required
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-xs font-bold text-center animate-in fade-in slide-in-from-top-2">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full text-white font-black py-4 rounded-2xl shadow-lg shadow-[var(--brand-primary)]/30 transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-2 group hover-premium select-none"
                            style={{ background: 'linear-gradient(to right, var(--brand-primary), var(--brand-secondary))' }}
                        >
                            {isLoading ? (
                                <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                            ) : (
                                <>
                                    {t('auth.button_login')}
                                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="pt-4 text-center border-t border-white/5">
                        <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">
                            {t('auth.footer_authorized')}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
