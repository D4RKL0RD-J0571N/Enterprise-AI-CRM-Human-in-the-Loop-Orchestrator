import { useState, useRef, useEffect, memo } from "react";
import {
    SendHorizontal,
    Check,
    X,
    Edit3,
    Trash2,
    Clock,
    Maximize2,
    Minimize2,
    User,
    Bot,
    AlertTriangle,
    CheckCircle2
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { Menu, Item, useContextMenu, Separator } from 'react-contexify';
import 'react-contexify/dist/ReactContexify.css';

interface Message {
    id: number;
    role: "client" | "user";
    sender: string;
    text: string;
    content?: string;
    timestamp: string;
    status: string;
    is_ai?: boolean;
    metadata?: any;
}

interface ChatWindowProps {
    conversationId: number;
    clientName: string;
    messages: Message[];
    isThinking: boolean;
    onSendMessage: (text: string) => void;
    onApprove: (id: number) => void;
    onReject: (id: number) => void;
    onEdit: (id: number, text: string) => void;
    onDelete: (id: number) => void;
    onMaximize: () => void;
    onClose: () => void;
    isMaximized: boolean;
    isLoading?: boolean;
    canDrag?: boolean;
    onDragStart?: (e: React.MouseEvent) => void;
    onResizeStart?: (e: React.MouseEvent) => void;
}

const MESSAGE_MENU_ID = "msg-context-menu";

const ChatWindow = memo(({
    conversationId,
    clientName,
    messages,
    isThinking,
    onSendMessage,
    onApprove,
    onReject,
    onEdit,
    onDelete,
    onMaximize,
    onClose,
    isMaximized,
    isLoading,
    canDrag,
    onDragStart,
    onResizeStart
}: ChatWindowProps) => {
    const { t } = useTranslation();
    const [inputValue, setInputValue] = useState("");
    const scrollRef = useRef<HTMLDivElement>(null);
    const { show } = useContextMenu({ id: `${MESSAGE_MENU_ID}-${conversationId}` });

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isThinking]);

    const handleContextMenu = (e: React.MouseEvent, id: number, text: string) => {
        e.preventDefault();
        show({ event: e, props: { id, text } });
    };

    const handleSend = () => {
        if (!inputValue.trim()) return;
        onSendMessage(inputValue);
        setInputValue("");
    };

    return (
        <div className="flex flex-col h-full bg-white dark:bg-gray-950 transition-all border dark:border-gray-800 rounded-2xl overflow-hidden shadow-2xl relative select-none">
            {/* HEADER - Drag Handle */}
            <div
                className={`p-4 flex items-center justify-between bg-gray-50/50 dark:bg-gray-900/50 border-b dark:border-gray-800 backdrop-blur-md sticky top-0 z-10 ${canDrag ? "cursor-grab active:cursor-grabbing" : ""}`}
                onMouseDown={onDragStart}
            >
                <div className="flex items-center gap-3 pointer-events-none">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-black shadow-lg shadow-indigo-500/20">
                        {clientName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <h3 className="text-sm font-black dark:text-white flex items-center gap-2">
                            {clientName}
                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                        </h3>
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest flex items-center gap-1">
                            <Clock className="w-3 h-3" /> ID: {conversationId}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-1">
                    <button onClick={onMaximize} className="p-2 hover:bg-white dark:hover:bg-gray-800 rounded-xl transition-all text-gray-500 hover:text-indigo-500">
                        {isMaximized ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                    </button>
                    <button onClick={onClose} className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all text-gray-500 hover:text-red-500">
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* MESSAGES */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-6 scroll-smooth custom-scrollbar bg-white dark:bg-gray-950">
                {isLoading && (
                    <div className="flex flex-col gap-4 animate-pulse p-4">
                        <div className="h-12 bg-gray-100 dark:bg-gray-800 rounded-3xl w-2/3 self-start"></div>
                        <div className="h-12 bg-gray-100 dark:bg-gray-800 rounded-3xl w-1/2 self-end"></div>
                        <div className="h-24 bg-gray-100 dark:bg-gray-800 rounded-3xl w-3/4 self-start"></div>
                    </div>
                )}

                {!isLoading && messages.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center opacity-30 select-none">
                        <Bot className="w-16 h-16 mb-4" />
                        <p className="font-black uppercase tracking-[0.3em] text-xs">Waiting for events...</p>
                    </div>
                )}

                {messages.map((m, idx) => {
                    const isPending = m.status === 'pending' || m.status === 'pending_review';
                    const isAI = m.is_ai;
                    const alignRight = (m.role === "user" && !isPending);
                    const isOperator = m.role === "user" && !isAI;

                    return (
                        <div key={`${m.id}-${idx}`} className={`flex flex-col ${alignRight ? "items-end" : "items-start"} group`}>
                            <div className={`flex ${alignRight ? "justify-end" : "justify-start"} w-full relative`}>
                                <div className={`p-4 rounded-3xl max-w-[85%] sm:max-w-md shadow-sm relative transition-all ${isPending
                                    ? "bg-amber-50 dark:bg-amber-900/20 border-2 border-dashed border-amber-300 rounded-bl-none"
                                    : alignRight
                                        ? "bg-indigo-600 text-white rounded-br-none shadow-indigo-200 dark:shadow-none"
                                        : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100 rounded-bl-none"
                                    }`}
                                    onContextMenu={(e) => handleContextMenu(e, m.id, m.text)}
                                >
                                    <div className="flex justify-between items-center mb-1.5 gap-4">
                                        <div className="flex items-center gap-2">
                                            {isAI ? <Bot className="w-3.5 h-3.5 opacity-70" /> : <User className="w-3.5 h-3.5 opacity-70" />}
                                            <span className={`text-[10px] font-black uppercase tracking-widest ${alignRight ? "text-indigo-100" : "text-gray-400"}`}>
                                                {isOperator ? t('chat.you') : (isPending ? t('chat.ai_suggestion_label') : (isAI ? t('chat.ai_label') : t('chat.client_label')))}
                                            </span>
                                            {m.metadata?.domain && (
                                                <span className={`px-1.5 py-0.5 rounded-md uppercase font-black text-[7px] border ${alignRight ? "bg-indigo-700/50 border-white/20" : "bg-white dark:bg-gray-900 dark:border-gray-700 text-gray-500"
                                                    }`}>
                                                    {m.metadata.domain}
                                                </span>
                                            )}
                                        </div>
                                        {m.metadata?.intent === "Violation" && (
                                            <span className="bg-red-500 text-white text-[7px] px-2 py-0.5 rounded-full font-black animate-pulse flex items-center gap-1">
                                                <AlertTriangle className="w-2.5 h-2.5" /> SENTINEL
                                            </span>
                                        )}
                                    </div>

                                    {isPending && (
                                        <div className="mb-2 text-xs font-bold text-amber-700 dark:text-amber-400 flex justify-between items-center bg-amber-500/10 px-2 py-1.5 rounded-xl border border-amber-300/30">
                                            <span className="flex items-center gap-1.5 italic">✨ AI Suggestion</span>
                                            <span className="text-[9px] opacity-70 uppercase tracking-tighter bg-amber-200 dark:bg-amber-800 px-1.5 py-0.5 rounded-md">Review</span>
                                        </div>
                                    )}

                                    <p className={`leading-relaxed text-sm whitespace-pre-wrap font-medium ${isPending ? 'italic opacity-70' : ''}`}>
                                        {m.text || m.content || <span className="opacity-20 italic">No content</span>}
                                    </p>

                                    {isPending && (
                                        <div className="mt-4 flex gap-2 border-t border-amber-200 dark:border-amber-800 pt-3">
                                            <button onClick={() => onApprove(m.id)} className="flex-1 bg-green-600 hover:bg-green-700 text-white text-[10px] py-2 rounded-xl transition-all font-black flex items-center justify-center gap-1.5 shadow-lg shadow-green-500/20">
                                                <CheckCircle2 className="w-3 h-3" /> APPROVE
                                            </button>
                                            <button onClick={() => onEdit(m.id, m.text)} className="flex-1 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 text-[10px] py-2 rounded-xl font-black border dark:border-gray-700 hover:bg-gray-50">
                                                <Edit3 className="w-3 h-3 inline mr-1" /> EDIT
                                            </button>
                                            <button onClick={() => onReject(m.id)} className="flex-1 bg-red-50 dark:bg-red-900/10 text-red-600 text-[10px] py-2 rounded-xl font-black hover:bg-red-100 flex items-center justify-center gap-1">
                                                <X className="w-3 h-3" /> REJECT
                                            </button>
                                        </div>
                                    )}

                                    <div className={`text-[9px] mt-2 flex items-center gap-2 font-mono ${alignRight ? "justify-end text-indigo-100" : "justify-start opacity-60"}`}>
                                        {m.status === 'sending' && <span className="animate-pulse">•••</span>}
                                        {m.timestamp ? new Date(m.timestamp).toLocaleTimeString('es-CR', { hour: '2-digit', minute: '2-digit' }) : "Just now"}
                                        {m.status === 'pending' && <span className="animate-spin text-amber-500 text-[8px]">⏳</span>}
                                        {m.status === 'sent' && !isPending && <Check className="w-3 h-3 text-indigo-200" />}
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}

                {isThinking && (
                    <div className="flex justify-start">
                        <div className="p-4 rounded-3xl rounded-bl-none bg-gray-100 dark:bg-gray-800 flex items-center gap-3 shadow-md border dark:border-gray-700">
                            <span className="flex gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full animate-bounce bg-blue-500"></span>
                                <span className="w-1.5 h-1.5 rounded-full animate-bounce [animation-delay:-0.15s] bg-blue-500"></span>
                                <span className="w-1.5 h-1.5 rounded-full animate-bounce [animation-delay:-0.3s] bg-blue-500"></span>
                            </span>
                            <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{t('chat.thinking')}</span>
                        </div>
                    </div>
                )}
            </div>

            {/* INPUT */}
            <div className="p-4 bg-gray-50/50 dark:bg-gray-900/50 border-t dark:border-gray-800 backdrop-blur-md sticky bottom-0">
                <div className="flex gap-2 bg-white dark:bg-gray-800 p-2 rounded-2xl shadow-inner border dark:border-gray-700 focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all">
                    <textarea
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder={t('chat.input_placeholder')}
                        className="flex-1 bg-transparent border-none focus:ring-0 text-sm resize-none py-2 px-3 h-10 max-h-32 dark:text-gray-100 font-medium"
                        onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                handleSend();
                            }
                        }}
                    />
                    <button
                        onClick={handleSend}
                        disabled={!inputValue.trim()}
                        className="p-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-lg shadow-indigo-500/30 transition-all active:scale-95 disabled:opacity-50 disabled:shadow-none"
                    >
                        <SendHorizontal className="w-5 h-5" />
                    </button>
                </div>
                <div className="mt-2 text-[8px] text-center text-gray-400 font-black uppercase tracking-[0.2em] select-none">
                    Human Operator Assistance Layer Active
                </div>
            </div>

            {/* Resize Handle */}
            {onResizeStart && (
                <div
                    className="absolute bottom-0 right-0 w-6 h-6 cursor-nwse-resize z-50 flex items-end justify-end p-1 group"
                    onMouseDown={onResizeStart}
                >
                    <div className="w-2 h-2 border-r-2 border-b-2 border-gray-300 dark:border-gray-700 group-hover:border-indigo-500 transition-colors"></div>
                </div>
            )}

            <Menu id={`${MESSAGE_MENU_ID}-${conversationId}`} className="dark:bg-gray-900 border dark:border-gray-800 shadow-2xl rounded-xl">
                <Item onClick={({ props }) => onEdit(props.id, props.text)} className="text-xs font-bold dark:text-gray-300">
                    <Edit3 className="w-4 h-4 mr-2" /> Modify Content
                </Item>
                <Separator />
                <Item onClick={({ props }) => onDelete(props.id)} className="text-xs font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10">
                    <Trash2 className="w-4 h-4 mr-2" /> Permanently Delete
                </Item>
            </Menu>
        </div>
    );
});

ChatWindow.displayName = "ChatWindow";

export default ChatWindow;
