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
    Sparkles
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { Menu, Item, useContextMenu, Separator } from 'react-contexify';
import 'react-contexify/dist/ReactContexify.css';

interface Message {
    id: number;
    sender: string;
    text: string;
    content?: string;
    timestamp: string;
    status: string;
    is_ai_generated?: boolean;
    metadata?: any;
    media_url?: string;
    media_type?: string;
    suggested_replies?: string[];
}

interface ChatWindowProps {
    conversationId: number;
    clientName: string;
    messages: Message[];
    isThinking: boolean;
    onSendMessage: (text: string) => void;
    onApprove: (id: number) => void;
    onEdit: (id: number, text: string) => void;
    onDelete: (id: number) => void;
    onMaximize: () => void;
    onClose: () => void;
    isMaximized: boolean;
    isLoading?: boolean;
    canDrag?: boolean;
    onDragStart?: (e: React.MouseEvent) => void;
    onResizeStart?: (e: React.MouseEvent) => void;
    autoAIEnabled?: boolean;
    onToggleAI?: () => void;
    timezone?: string;
    onBulkDelete?: (ids: number[]) => void;
}

const MESSAGE_MENU_ID = "msg-context-menu";

const ChatWindow = memo(({
    conversationId,
    clientName,
    messages,
    isThinking,
    onSendMessage,
    onApprove,
    onEdit,
    onDelete,
    onMaximize,
    onClose,
    isMaximized,
    isLoading,
    canDrag,
    onDragStart,
    onResizeStart,
    autoAIEnabled = true,
    onToggleAI,
    timezone,
    onBulkDelete
}: ChatWindowProps) => {
    const { t, i18n } = useTranslation();
    const [inputValue, setInputValue] = useState("");
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editValue, setEditValue] = useState("");
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const scrollRef = useRef<HTMLDivElement>(null);
    const { show } = useContextMenu({ id: `${MESSAGE_MENU_ID}-${conversationId}` });

    const formatTime = (ts: string) => {
        if (!ts) return t('common.just_now', { defaultValue: 'Just now' });
        const isoTs = ts.includes('Z') || ts.includes('+') ? ts : ts.replace(' ', 'T') + 'Z';
        try {
            return new Date(isoTs).toLocaleTimeString(i18n.language, {
                hour: '2-digit',
                minute: '2-digit',
                timeZone: timezone || 'UTC'
            });
        } catch (e) {
            return new Date(ts).toLocaleTimeString();
        }
    };

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

    const toggleMessageSelection = (id: number) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const handleBulkDelete = () => {
        if (selectedIds.length === 0) return;
        setDeletingId(-1); // Special ID to indicate bulk delete confirmation
    };

    const confirmBulkDelete = () => {
        onBulkDelete?.(selectedIds);
        setSelectedIds([]);
        setDeletingId(null);
    };

    const startEditing = (id: number, text: string) => {
        setEditingId(id);
        setEditValue(text);
        setDeletingId(null);
    };

    const saveEdit = () => {
        if (editingId !== null) {
            onEdit(editingId, editValue);
            setEditingId(null);
        }
    };

    return (
        <div className={`flex flex-col h-full bg-white dark:bg-[var(--brand-surface)] transition-all relative select-none ${isMaximized ? "border-none" : "border dark:border-[var(--brand-border)]"} shadow-2xl`} style={{ borderRadius: isMaximized ? '0' : 'var(--brand-radius)' }}>
            <div
                className={`flex items-center justify-between p-4 border-b dark:border-[var(--brand-border)] bg-gray-50 dark:bg-[var(--brand-surface)]/80 backdrop-blur-md z-20 ${canDrag ? "cursor-grab active:cursor-grabbing" : ""}`}
                onMouseDown={onDragStart}
            >
                <div className="flex items-center gap-3 pointer-events-none">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black shadow-lg shadow-[var(--brand-primary)]/20"
                        style={{ background: 'linear-gradient(135deg, var(--brand-primary), var(--brand-secondary))' }}
                    >
                        {clientName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <h3 className="text-base font-black dark:text-white flex items-center gap-2 select-none">
                            {clientName}
                            <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse"></span>
                        </h3>
                        <p className="text-[11px] text-gray-500 font-bold uppercase tracking-widest flex items-center gap-1.5 tabular-nums select-none">
                            <Clock className="w-3.5 h-3.5" /> ID: {conversationId}
                        </p>
                    </div>
                </div>
                <div className="flex gap-1 items-center">
                    <button
                        onClick={(e) => { e.stopPropagation(); onToggleAI?.(); }}
                        aria-label={autoAIEnabled ? "Disable AI Auto-respond" : "Enable AI Auto-respond"}
                        className={`p-2 rounded-lg transition-all flex items-center gap-2 hover-premium select-none ${autoAIEnabled ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20' : 'text-amber-600 bg-amber-50 dark:bg-amber-900/20'}`}
                    >
                        <Sparkles className={`w-4 h-4 ${autoAIEnabled ? 'animate-pulse' : 'opacity-40'}`} />
                        <span className="text-[11px] font-black uppercase tracking-tighter hidden sm:inline">
                            {autoAIEnabled ? t('chat.ai_auto') : t('chat.manual')}
                        </span>
                    </button>
                    <button
                        onClick={onMaximize}
                        aria-label={isMaximized ? t('common.minimize') : t('common.maximize')}
                        className="p-2 hover:bg-white dark:hover:bg-[var(--brand-bg)] rounded-xl transition-all text-gray-500 hover:text-[var(--brand-primary)] hover-premium select-none"
                    >
                        {isMaximized ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                    </button>
                    <button
                        onClick={onClose}
                        aria-label={t('common.close')}
                        className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all text-gray-500 hover:text-red-500 hover-premium select-none"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* MESSAGES */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto scroll-smooth custom-scrollbar bg-white dark:bg-[var(--brand-surface)] p-4 space-y-4">
                {isLoading && (
                    <div className="flex flex-col gap-4 animate-pulse">
                        <div className="h-12 bg-gray-100 dark:bg-[var(--brand-bg)] rounded-3xl w-2/3 self-start"></div>
                        <div className="h-12 bg-gray-100 dark:bg-[var(--brand-bg)] rounded-3xl w-1/2 self-end"></div>
                    </div>
                )}

                {messages.map((m, idx) => {
                    const isPending = m.status === 'pending' || m.status === 'pending_review';
                    const isAI = m.is_ai_generated;
                    const alignRight = m.sender === "agent" || m.sender === "system";
                    const label = m.sender === "system" ? t('chat.system') : (isPending ? t('chat.ai_suggestion_label') : (isAI ? t('chat.ai_label') : (m.sender === "agent" ? t('chat.you') : t('chat.client_label'))));

                    return (
                        <div key={`${m.id}-${idx}`} className={`flex items-start gap-2 ${alignRight ? "flex-row-reverse" : "flex-row"} group`}>
                            <div className={`mt-4 transition-all duration-200 ${selectedIds.includes(m.id) ? "opacity-100 scale-110" : "opacity-20 group-hover:opacity-100"}`}>
                                <input
                                    type="checkbox"
                                    checked={selectedIds.includes(m.id)}
                                    onChange={() => toggleMessageSelection(m.id)}
                                    className="w-4 h-4 rounded-md border-gray-300 dark:border-[var(--brand-border)] text-[var(--brand-primary)] focus:ring-[var(--brand-primary)] cursor-pointer transition-all"
                                />
                            </div>
                            <div className={`flex flex-col ${alignRight ? "items-end" : "items-start"} flex-1`}>
                                <div className={`max-w-[85%] sm:max-w-md shadow-sm relative p-3 transition-all ${isPending ? "bg-amber-50 dark:bg-amber-900/20 border-2 border-dashed border-amber-300 rounded-bl-none" : alignRight ? "text-white rounded-br-none" : "bg-gray-100 text-gray-800 dark:bg-[var(--brand-bubble-client-dark)] dark:text-gray-100 rounded-bl-none"}`}
                                    style={{ borderRadius: 'var(--brand-radius)', backgroundColor: alignRight && !isPending ? "var(--brand-primary)" : undefined }}
                                    onContextMenu={(e) => handleContextMenu(e, m.id, m.text || m.content || "")}
                                >
                                    <div className="flex justify-between items-center mb-1 gap-2">
                                        <div className="flex items-center gap-1.5">
                                            {isAI ? <Bot className="w-3.5 h-3.5 opacity-70" /> : <User className="w-3.5 h-3.5 opacity-70" />}
                                            <span className="text-[11px] font-black uppercase tracking-widest opacity-80">{label}</span>
                                        </div>
                                    </div>

                                    {editingId === m.id ? (
                                        <div className="space-y-3 bg-white/5 p-4 rounded-2xl border border-white/10 shadow-inner">
                                            <textarea
                                                value={editValue}
                                                onChange={(e) => setEditValue(e.target.value)}
                                                className="w-full bg-white/10 dark:bg-black/20 border border-white/20 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-white/30 min-h-[120px] resize-none font-medium"
                                                autoFocus
                                            />
                                            {m.suggested_replies && m.suggested_replies.length > 0 && (
                                                <div className="flex flex-wrap gap-2 pt-2">
                                                    {m.suggested_replies.map((reply, i) => (
                                                        <button
                                                            key={i}
                                                            onClick={() => setEditValue(reply)}
                                                            className="text-[10px] font-bold px-3 py-1.5 bg-[var(--brand-primary-muted)] text-[var(--brand-primary)] rounded-lg border border-[var(--brand-primary-border)] hover:opacity-80 transition-all select-none hover-premium"
                                                        >
                                                            {reply}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                            <div className="flex gap-3 justify-end items-center">
                                                <button onClick={() => setEditingId(null)} className="text-[10px] font-black uppercase px-4 py-2 hover:bg-white/10 rounded-xl transition-all border border-transparent select-none">{t('common.cancel')}</button>
                                                <button onClick={saveEdit} className="text-[10px] font-black uppercase px-5 py-2 bg-white text-[var(--brand-primary)] dark:text-gray-900 rounded-xl shadow-lg hover:scale-[1.02] active:scale-95 transition-all select-none hover-premium">{t('common.save')}</button>
                                            </div>
                                        </div>
                                    ) : (
                                        <p className="text-base font-semibold leading-relaxed">{m.text || m.content}</p>
                                    )}

                                    {deletingId === m.id && (
                                        <div className="mt-4 p-4 bg-red-600/10 border border-red-500/30 rounded-2xl animate-in fade-in slide-in-from-bottom-2 duration-300 backdrop-blur-sm">
                                            <div className="flex items-center gap-2 mb-3">
                                                <div className="w-6 h-6 rounded-full bg-red-600 flex items-center justify-center">
                                                    <Trash2 className="w-3.5 h-3.5 text-white" />
                                                </div>
                                                <p className="text-[11px] font-black uppercase tracking-tight text-red-600">{t('chat.alerts.confirm_delete')}</p>
                                            </div>
                                            <div className="flex gap-3">
                                                <button onClick={() => setDeletingId(null)} className="flex-1 py-2 text-[10px] font-black uppercase bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl transition-all select-none">{t('common.no')}</button>
                                                <button onClick={() => { onDelete(m.id); setDeletingId(null); }} className="flex-1 py-2 text-[10px] font-black uppercase bg-red-600 text-white shadow-lg shadow-red-600/20 rounded-xl hover:bg-red-700 transition-all select-none hover-premium">{t('common.yes')}</button>
                                            </div>
                                        </div>
                                    )}

                                    <div className={`text-[11px] mt-2.5 flex items-center gap-2 font-mono tabular-nums ${alignRight ? "justify-end opacity-85" : "justify-start opacity-70"}`}>
                                        {formatTime(m.timestamp)}
                                        {m.status === 'sent' && !isPending && <Check className="w-4 h-4" />}
                                    </div>
                                    {isPending && (
                                        <div className="mt-3 flex gap-2 pt-2 border-t border-amber-200 dark:border-amber-800">
                                            <button onClick={() => onApprove(m.id)} className="flex-1 bg-green-600 text-white text-[9px] py-1.5 rounded-lg font-black select-none hover-premium">{t('common.approve')}</button>
                                            <button onClick={() => startEditing(m.id, m.text || m.content || "")} className="flex-1 bg-white text-gray-700 text-[9px] py-1.5 rounded-lg font-black border select-none hover-premium">{t('common.edit')}</button>
                                            <button onClick={() => setDeletingId(m.id)} className="flex-1 bg-red-600 text-white text-[9px] py-1.5 rounded-lg font-black select-none hover-premium">{t('common.reject')}</button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}

                {isThinking && (
                    <div className="flex justify-start">
                        <div className="p-3 bg-gray-100 dark:bg-[var(--brand-surface)] rounded-2xl rounded-bl-none flex gap-1 animate-pulse" style={{ borderRadius: 'var(--brand-radius)' }}>
                            <span className="w-1.5 h-1.5 bg-[var(--brand-primary)] rounded-full"></span>
                            <span className="w-1.5 h-1.5 bg-[var(--brand-primary)] rounded-full"></span>
                            <span className="w-1.5 h-1.5 bg-[var(--brand-primary)] rounded-full"></span>
                        </div>
                    </div>
                )}
            </div>

            {/* BULK ACTION BAR */}
            {selectedIds.length > 0 && (
                <div className="absolute top-20 left-1/2 -translate-x-1/2 z-[70] bg-white dark:bg-[var(--brand-surface)] border dark:border-[var(--brand-border)] shadow-2xl rounded-2xl p-2 flex items-center gap-3 animate-in fade-in zoom-in slide-in-from-top-4">
                    <span className="text-xs font-black text-[var(--brand-primary)] px-3 uppercase tracking-tighter">{selectedIds.length} {t('common.selected')}</span>

                    {deletingId === -1 ? (
                        <div className="flex items-center gap-2 px-2 py-1 bg-red-50 dark:bg-red-900/10 rounded-xl">
                            <span className="text-[10px] font-black uppercase text-red-600">{t('chat.alerts.confirm_bulk_delete', { count: selectedIds.length })}</span>
                            <button onClick={confirmBulkDelete} className="px-3 py-1 bg-red-600 text-white text-[9px] font-black rounded-lg">{t('common.yes')}</button>
                            <button onClick={() => setDeletingId(null)} className="px-3 py-1 bg-gray-200 dark:bg-gray-800 text-[9px] font-black rounded-lg text-gray-600">{t('common.no')}</button>
                        </div>
                    ) : (
                        <button onClick={handleBulkDelete} className="p-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl transition-all flex items-center gap-2">
                            <Trash2 className="w-4 h-4" />
                            <span className="text-[10px] font-black uppercase">{t('common.delete')}</span>
                        </button>
                    )}

                    <button onClick={() => { setSelectedIds([]); setDeletingId(null); }} aria-label="Clear selection" className="p-2 hover:bg-gray-100 rounded-xl transition-all hover-premium">
                        <X className="w-4 h-4 text-gray-400" />
                    </button>
                </div>
            )}

            {/* INPUT */}
            <div className="p-4 bg-gray-50/50 dark:bg-[var(--brand-surface)]/50 border-t dark:border-[var(--brand-border)] backdrop-blur-md">
                <form
                    onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                    className="flex gap-2"
                >
                    <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder={t('chat.input_placeholder')}
                        spellCheck={true}
                        autoComplete="off"
                        className="flex-1 bg-white dark:bg-[var(--brand-bg)] border dark:border-[var(--brand-border)] px-4 py-2.5 text-base rounded-xl focus:outline-none"
                    />
                    <button
                        type="submit"
                        aria-label="Send message"
                        className="p-2.5 bg-brand-primary text-white rounded-xl shadow-lg shadow-brand-primary/20 hover-premium select-none disabled:opacity-50"
                        style={{ backgroundColor: 'var(--brand-primary)' }}
                        disabled={!inputValue.trim()}
                    >
                        <SendHorizontal className="w-5 h-5" />
                    </button>
                </form>
                {onResizeStart && (
                    <div className="absolute bottom-0 right-0 w-4 h-4 cursor-nwse-resize" onMouseDown={onResizeStart} title="Resize window" />
                )}
            </div>

            <Menu id={`${MESSAGE_MENU_ID}-${conversationId}`} className="dark:bg-gray-900 border dark:border-gray-800">
                <Item onClick={({ props }) => startEditing(props.id, props.text)} className="text-xs font-bold">
                    <Edit3 className="w-4 h-4 mr-2" /> {t('common.edit')}
                </Item>
                <Separator />
                <Item onClick={({ props }) => setDeletingId(props.id)} className="text-xs font-bold text-red-500">
                    <Trash2 className="w-4 h-4 mr-2" /> {t('common.delete')}
                </Item>
            </Menu>
        </div>
    );
});

ChatWindow.displayName = "ChatWindow";
export default ChatWindow;
