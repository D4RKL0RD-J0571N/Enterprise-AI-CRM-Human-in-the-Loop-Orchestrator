import { Bot, CheckCircle } from "lucide-react";
import { useTranslation } from "react-i18next";

interface InfoPanelProps {
    currentAction?: {
        intent: string;
        reasoning: string;
        confidence: number;
    } | null;
    clientName?: string;
    clientPhone?: string;
}

export default function InfoPanel({ currentAction, clientName, clientPhone = "" }: InfoPanelProps) {
    const { t } = useTranslation();
    const effectiveClientName = clientName || t('chat.select_client');
    if (!clientPhone) {
        return (
            <div className="w-80 bg-white dark:bg-[var(--brand-surface)] border-l dark:border-[var(--brand-border)] hidden lg:flex flex-col h-full items-center justify-center text-gray-400 p-6 text-center">
                <Bot className="w-12 h-12 mb-4 opacity-20" />
                <p>{t('info.select_to_see')}</p>
            </div>
        );
    }

    const confidence = currentAction?.confidence || 0;
    const isHighConfidence = confidence > 80;

    return (
        <div className="w-80 bg-white dark:bg-[var(--brand-surface)] border-l dark:border-[var(--brand-border)] flex flex-col h-full transition-colors duration-200">
            <div className="p-6 border-b dark:border-[var(--brand-border)]">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-gray-200 dark:bg-[var(--brand-bg)] rounded-full flex items-center justify-center text-xl">
                        👤
                    </div>
                    <div>
                        <h2 className="font-bold text-lg dark:text-white">{effectiveClientName}</h2>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{clientPhone}</p>
                    </div>
                </div>

                <div className="flex gap-2">
                    <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 text-xs rounded-full font-medium flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" /> {t('info.active')}
                    </span>
                    <span className="px-2 py-1 text-xs rounded-full font-medium" style={{ backgroundColor: 'var(--brand-primary-muted)', color: 'var(--brand-primary)' }}>
                        {t('info.new_customer')}
                    </span>
                </div>
            </div>

            <div className="p-6 flex-1 bg-gray-50 dark:bg-[var(--brand-surface)]/10 overflow-y-auto">
                <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-4">{t('info.ai_assistant')}</h3>

                {currentAction ? (
                    <div className="bg-white dark:bg-[var(--brand-surface)] p-4 rounded-lg border dark:border-[var(--brand-border)] shadow-sm space-y-3">
                        <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200 font-medium">
                            <Bot className="w-4 h-4" style={{ color: 'var(--brand-primary)' }} />
                            <span>{t('info.suggested_action')}</span>
                        </div>

                        <div className="space-y-1">
                            <p className="text-xs font-semibold text-gray-500 uppercase">{t('info.intent')}: <span className="text-gray-700 dark:text-gray-300">{currentAction.intent}</span></p>
                            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                                {currentAction.reasoning}
                            </p>
                        </div>

                        <div className="h-1 bg-gray-100 dark:bg-[var(--brand-bg)] rounded-full overflow-hidden mt-2">
                            <div
                                className={`h-full transition-all duration-500`}
                                style={{ width: `${confidence}%`, backgroundColor: isHighConfidence ? '#10b981' : '#f59e0b' }}
                            ></div>
                        </div>
                        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                            <span>{t('info.confidence')}</span>
                            <span className={`font-bold`} style={{ color: isHighConfidence ? '#10b981' : '#f59e0b' }}>{confidence}%</span>
                        </div>
                    </div>
                ) : (
                    <div className="bg-white dark:bg-[var(--brand-surface)] p-6 rounded-lg border dark:border-[var(--brand-border)] border-dashed text-center text-gray-400 text-sm">
                        <p>{t('info.no_pending')}</p>
                        <p className="text-xs mt-1 opacity-70">{t('info.waiting')}</p>
                    </div>
                )}
            </div>
        </div>
    );
}
