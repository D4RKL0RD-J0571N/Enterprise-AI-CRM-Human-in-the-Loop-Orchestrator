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
            <div className="w-80 bg-white dark:bg-gray-900 border-l dark:border-gray-800 hidden lg:flex flex-col h-full items-center justify-center text-gray-400 p-6 text-center">
                <Bot className="w-12 h-12 mb-4 opacity-20" />
                <p>{t('info.select_to_see')}</p>
            </div>
        );
    }

    const confidence = currentAction?.confidence || 0;
    const isHighConfidence = confidence > 80;

    return (
        <div className="w-80 bg-white dark:bg-gray-900 border-l dark:border-gray-800 flex flex-col h-full transition-colors duration-200">
            <div className="p-6 border-b dark:border-gray-800">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center text-xl">
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
                    <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 text-xs rounded-full font-medium">
                        {t('info.new_customer')}
                    </span>
                </div>
            </div>

            <div className="p-6 flex-1 bg-gray-50 dark:bg-gray-950 overflow-y-auto">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">{t('info.ai_assistant')}</h3>

                {currentAction ? (
                    <div className="bg-white dark:bg-gray-900 p-4 rounded-lg border dark:border-gray-800 shadow-sm space-y-3">
                        <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200 font-medium">
                            <Bot className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                            <span>{t('info.suggested_action')}</span>
                        </div>

                        <div className="space-y-1">
                            <p className="text-xs font-semibold text-gray-500 uppercase">{t('info.intent')}: <span className="text-gray-700 dark:text-gray-300">{currentAction.intent}</span></p>
                            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                                {currentAction.reasoning}
                            </p>
                        </div>

                        <div className="h-1 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden mt-2">
                            <div
                                className={`h-full ${isHighConfidence ? 'bg-green-500' : 'bg-amber-500'} transition-all duration-500`}
                                style={{ width: `${confidence}%` }}
                            ></div>
                        </div>
                        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                            <span>{t('info.confidence')}</span>
                            <span className={`font-bold ${isHighConfidence ? 'text-green-600' : 'text-amber-600'}`}>{confidence}%</span>
                        </div>
                    </div>
                ) : (
                    <div className="bg-white dark:bg-gray-900 p-6 rounded-lg border dark:border-gray-800 border-dashed text-center text-gray-400 text-sm">
                        <p>{t('info.no_pending')}</p>
                        <p className="text-xs mt-1 opacity-70">{t('info.waiting')}</p>
                    </div>
                )}
            </div>
        </div>
    );
}
