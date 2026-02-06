import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Send, CheckCircle, MessageSquare, Bot } from "lucide-react";
import { API_BASE_URL } from "../../../lib/api";

interface Props {
    testQuery: string;
    setTestQuery: (q: string) => void;
    testResult: { content: string; confidence: number; metadata: any } | null;
    isTesting: boolean;
    runTest: () => void;
}

export const SandboxTab = ({ testQuery, setTestQuery, testResult, isTesting, runTest }: Props) => {
    const { t } = useTranslation();
    const [mode, setMode] = useState<"ai" | "whatsapp">("ai");

    // WhatsApp Simulation State
    const [simPhone, setSimPhone] = useState("");
    const [simMessage, setSimMessage] = useState("");
    const [simLoading, setSimLoading] = useState(false);
    const [simHistory, setSimHistory] = useState<Array<{ from: string; text: string; timestamp: number }>>([]);

    const handleWhatsAppSimulation = async () => {
        if (!simPhone.trim() || !simMessage.trim()) return;

        setSimLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/whatsapp/webhook`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    object: "whatsapp_business_account",
                    entry: [{
                        changes: [{
                            value: {
                                messages: [{
                                    from: simPhone,
                                    id: `sim_${Date.now()}`,
                                    text: { body: simMessage },
                                    type: "text",
                                    timestamp: Math.floor(Date.now() / 1000)
                                }],
                                contacts: [{ profile: { name: simPhone }, wa_id: simPhone }]
                            }
                        }]
                    }]
                })
            });

            setSimHistory(prev => [...prev, { from: "user", text: simMessage, timestamp: Date.now() }]);

            if (res.ok) {
                const data = await res.json();
                if (data.reply) {
                    setSimHistory(prev => [...prev, { from: "agent", text: data.reply, timestamp: Date.now() }]);
                } else if (data.status === "blocked") {
                    setSimHistory(prev => [...prev, { from: "system", text: `🚫 Blocked by Sentinel: ${data.reason}`, timestamp: Date.now() }]);
                }
            }
            setSimMessage("");
        } catch (err) {
            console.error(err);
        }
        setSimLoading(false);
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300 h-full flex flex-col">
            {/* Mode Selector */}
            <div className="flex gap-2 p-1 bg-gray-100 dark:bg-gray-900 rounded-2xl border dark:border-gray-800 w-fit">
                <button
                    onClick={() => setMode("ai")}
                    className={`px-6 py-2 rounded-xl transition-all font-bold text-sm flex items-center gap-2 ${mode === "ai" ? "bg-white dark:bg-gray-800 shadow-md text-blue-600" : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"}`}
                >
                    <Bot className="w-4 h-4" />
                    {t('simulate.ai_mode')}
                </button>
                <button
                    onClick={() => setMode("whatsapp")}
                    className={`px-6 py-2 rounded-xl transition-all font-bold text-sm flex items-center gap-2 ${mode === "whatsapp" ? "bg-white dark:bg-gray-800 shadow-md text-green-600" : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"}`}
                >
                    <MessageSquare className="w-4 h-4" />
                    {t('simulate.whatsapp_mode')}
                </button>
            </div>

            {mode === "ai" ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 flex-1">
                    {/* AI Sandbox Input */}
                    <div className="md:col-span-2 space-y-6 bg-white dark:bg-gray-900 p-8 rounded-3xl border dark:border-gray-800 shadow-md flex flex-col">
                        <h2 className="text-lg font-bold dark:text-white border-b dark:border-gray-800 pb-3 flex items-center gap-2">
                            <Send className="w-5 h-5 text-blue-500" /> {t('admin.sections.sandbox_header')}
                        </h2>
                        <p className="text-sm text-gray-500">{t('admin.fields.sandbox_help')}</p>

                        <div className="flex-1 flex flex-col gap-4">
                            <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-950 rounded-2xl p-6 space-y-4 border dark:border-gray-800">
                                {testResult ? (
                                    <>
                                        <div className="flex justify-start">
                                            <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl rounded-bl-none shadow-sm text-sm dark:text-gray-200 border dark:border-gray-700 max-w-[80%]">
                                                {testQuery}
                                            </div>
                                        </div>
                                        <div className="flex justify-end">
                                            <div className="bg-blue-600 p-4 rounded-2xl rounded-br-none shadow-lg text-sm text-white max-w-[80%]">
                                                {testResult.content}
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-50 space-y-4">
                                        <Send className="w-12 h-12" />
                                        <p className="text-sm italic font-medium">{t('admin.fields.sandbox_empty')}</p>
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-4">
                                <input
                                    type="text"
                                    value={testQuery}
                                    onChange={(e) => setTestQuery(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && runTest()}
                                    className="flex-1 bg-gray-100 dark:bg-gray-800 p-4 rounded-2xl border-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                                    placeholder={t('admin.fields.test_query_placeholder')}
                                />
                                <button
                                    onClick={runTest}
                                    disabled={isTesting}
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-8 rounded-2xl font-black shadow-lg shadow-blue-500/20 transition-all active:scale-95 disabled:opacity-50"
                                >
                                    {isTesting ? "..." : t('admin.fields.run_test')}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* AI Internal Logic */}
                    <div className="md:col-span-1 space-y-6">
                        <div className="bg-white dark:bg-gray-900 p-8 rounded-3xl border dark:border-gray-800 shadow-md">
                            <h2 className="text-sm font-black dark:text-white uppercase tracking-tighter mb-6 flex items-center gap-2">
                                <Brain className="w-4 h-4 text-purple-500" /> {t('admin.sections.ai_internal_logic')}
                            </h2>

                            {testResult?.metadata ? (
                                <div className="space-y-6 animate-in fade-in duration-500">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('admin.fields.confidence_score')}</label>
                                        <div className="flex items-center gap-3">
                                            <span className="text-3xl font-black text-blue-600">{testResult.confidence}%</span>
                                            {testResult.confidence >= 85 ? (
                                                <CheckCircle className="w-5 h-5 text-emerald-500" />
                                            ) : (
                                                <AlertTriangle className="w-5 h-5 text-amber-500" />
                                            )}
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('admin.fields.detected_intent')}</label>
                                        <div className={`p-3 rounded-xl border ${testResult.metadata.intent === 'Violation' ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' : 'bg-blue-50 dark:bg-gray-800 border-blue-100 dark:border-gray-700'}`}>
                                            <span className={`text-sm font-bold ${testResult.metadata.intent === 'Violation' ? 'text-red-700 dark:text-red-400' : 'text-blue-700 dark:text-blue-400'}`}>
                                                {testResult.metadata.intent}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('admin.fields.reasoning_path')}</label>
                                        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl border dark:border-gray-700">
                                            <p className="text-xs text-gray-500 italic leading-relaxed">"{testResult.metadata.reasoning}"</p>
                                        </div>
                                    </div>

                                    {testResult.metadata.triggered_keywords?.length > 0 && (
                                        <div className="space-y-2 animate-pulse">
                                            <label className="text-[10px] font-black text-red-500 uppercase tracking-widest">{t('admin.fields.forbidden_words_detected')}</label>
                                            <div className="flex flex-wrap gap-1">
                                                {testResult.metadata.triggered_keywords.map((kw: string, i: number) => (
                                                    <span key={i} className="text-[10px] bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-2 py-0.5 rounded-lg font-bold border border-red-200 dark:border-red-800 uppercase">
                                                        {kw}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="h-[200px] flex items-center justify-center text-gray-400 italic text-sm text-center">
                                    {t('admin.fields.sandbox_metadata_empty')}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            ) : (
                <div className="bg-white dark:bg-gray-900 p-8 rounded-3xl border dark:border-gray-800 shadow-md flex-1 flex flex-col">
                    <h2 className="text-lg font-bold dark:text-white border-b dark:border-gray-800 pb-3 flex items-center gap-2 mb-6">
                        <MessageSquare className="w-5 h-5 text-green-500" /> {t('simulate.whatsapp_mode')}
                    </h2>
                    <p className="text-sm text-gray-500 mb-6">{t('simulate.whatsapp_help')}</p>

                    <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-950 rounded-2xl p-6 space-y-4 border dark:border-gray-800 mb-6">
                        {simHistory.length > 0 ? (
                            simHistory.map((msg, i) => {
                                const isUser = msg.from === "user";
                                const isSystem = msg.from === "system";
                                return (
                                    <div key={i} className={`flex ${isUser ? "justify-start" : "justify-end"}`}>
                                        <div className={`p-4 rounded-2xl shadow-sm text-sm max-w-[80%] ${isUser
                                            ? "bg-white dark:bg-gray-800 dark:text-gray-200 border dark:border-gray-700 rounded-bl-none"
                                            : isSystem
                                                ? "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200 border border-red-200 dark:border-red-800"
                                                : "bg-green-600 text-white rounded-br-none"
                                            }`}>
                                            {msg.text}
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-50 space-y-4">
                                <MessageSquare className="w-12 h-12" />
                                <p className="text-sm italic font-medium">{t('simulate.no_simulations')}</p>
                            </div>
                        )}
                    </div>

                    <div className="space-y-4">
                        <input
                            type="text"
                            value={simPhone}
                            onChange={(e) => setSimPhone(e.target.value)}
                            className="w-full bg-gray-100 dark:bg-gray-800 p-4 rounded-2xl border-none focus:ring-2 focus:ring-green-500 dark:text-white"
                            placeholder={t('simulate.client_phone_placeholder')}
                        />
                        <div className="flex gap-4">
                            <input
                                type="text"
                                value={simMessage}
                                onChange={(e) => setSimMessage(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleWhatsAppSimulation()}
                                className="flex-1 bg-gray-100 dark:bg-gray-800 p-4 rounded-2xl border-none focus:ring-2 focus:ring-green-500 dark:text-white"
                                placeholder={t('simulate.message_placeholder')}
                            />
                            <button
                                onClick={handleWhatsAppSimulation}
                                disabled={simLoading}
                                className="bg-green-600 hover:bg-green-700 text-white px-8 rounded-2xl font-black shadow-lg shadow-green-500/20 transition-all active:scale-95 disabled:opacity-50"
                            >
                                {simLoading ? "..." : t('simulate.send')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// Help Brain icon workaround for SandboxTab
const Brain = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 4.44-2.04Z" /><path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-4.44-2.04Z" /></svg>
);
const AlertTriangle = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
);
