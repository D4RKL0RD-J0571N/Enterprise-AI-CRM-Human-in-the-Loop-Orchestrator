import { useState, useEffect } from "react";
import { PlusCircle, Archive, Pin, Search, Trash2, CheckSquare, Square, X, Mail, Instagram, MessageCircle, MessageSquare, LayoutGrid } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import { useBrandingContext } from "../context/BrandingContext";
import { Menu, Item, useContextMenu } from 'react-contexify';
import type { ItemParams } from 'react-contexify';
import 'react-contexify/dist/ReactContexify.css';
import { API_ENDPOINTS } from "../lib/api";

const CONV_MENU_ID = "conversation-menu";

interface ConversationSummary {
    id: number;
    client_id: number;
    client_name: string;
    client_phone: string;
    last_message: string;
    last_message_time: string;
    is_active: boolean;
    is_archived: boolean;
    is_pinned: boolean;
    has_pending: boolean;
    channel: 'whatsapp' | 'email' | 'instagram' | 'messenger';
}

interface SidebarProps {
    onSelect: (conversationId: number, clientName: string, clientPhone: string) => void;
    activeConversationId: number | null;
    onNewMessage: () => void;
    onPrefetch?: (id: number) => void;
    onNavigate?: (view: "chat" | "admin") => void;
    conversations?: ConversationSummary[];
}

export default function Sidebar({ onSelect, activeConversationId, onNewMessage, onPrefetch, conversations: externalConvs }: SidebarProps) {
    const { t } = useTranslation();
    const { token } = useAuth();
    const { config } = useBrandingContext();
    const [conversations, setConversations] = useState<ConversationSummary[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [showArchived, setShowArchived] = useState(false);
    const [selectedChannel, setSelectedChannel] = useState<'all' | 'whatsapp' | 'email' | 'instagram' | 'messenger'>('all');

    // Mass Selection State
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [isBulkProcessing, setIsBulkProcessing] = useState(false);
    const [deletingConvId, setDeletingConvId] = useState<number | null>(null);

    useEffect(() => {
        if (!externalConvs) {
            fetchConversations();
            const interval = setInterval(fetchConversations, 5000);
            return () => clearInterval(interval);
        }
    }, [externalConvs, token]);

    // Reset prompt on search
    useEffect(() => {
        setDeletingConvId(null);
    }, [searchQuery]);

    useEffect(() => {
        if (externalConvs) {
            setConversations(externalConvs);
        }
    }, [externalConvs]);

    async function fetchConversations() {
        try {
            const res = await fetch(API_ENDPOINTS.conversations.base, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setConversations(data);
            }
        } catch (error) {
            console.error("Failed to fetch conversations", error);
        }
    }

    const { show } = useContextMenu({ id: CONV_MENU_ID });

    function handleContextMenu(event: React.MouseEvent, conversationId: number, isArchived: boolean, isPinned: boolean) {
        show({ event, props: { conversationId, isArchived, isPinned } });
    }

    async function toggleArchive(id: number, currentStatus: boolean) {
        setConversations(prev => prev.map(c => c.id === id ? { ...c, is_archived: !currentStatus } : c));
        try {
            await fetch(API_ENDPOINTS.conversations.action(id, currentStatus ? "unarchive" : "archive"), {
                method: "POST",
                headers: { "Authorization": `Bearer ${token}` }
            });
        } catch (e) {
            console.error(e);
        }
    }

    async function togglePin(id: number, currentStatus: boolean) {
        setConversations(prev => prev.map(c => c.id === id ? { ...c, is_pinned: !currentStatus } : c));
        try {
            await fetch(API_ENDPOINTS.conversations.action(id, currentStatus ? "unpin" : "pin"), {
                method: "POST",
                headers: { "Authorization": `Bearer ${token}` }
            });
        } catch (e) {
            console.error(e);
        }
    }

    async function deleteConversation(id: number) {
        setConversations(prev => prev.filter(c => c.id !== id));
        try {
            await fetch(`${API_ENDPOINTS.conversations.base}${id}`, {
                method: "DELETE",
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (activeConversationId === id) {
                // Deselect if active
                // Implementation depends on parent state control, but sidebar update is local
            }
        } catch (e) {
            console.error(e);
        }
    }

    // BULK ACTIONS
    const toggleSelection = (id: number) => {
        setSelectedIds(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]);
    };

    const toggleSelectAll = () => {
        if (selectedIds.length === displayedConversations.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(displayedConversations.map(c => c.id));
        }
    };

    const [bulkDeleting, setBulkDeleting] = useState(false);
    const [bulkArchiving, setBulkArchiving] = useState(false);

    const handleBulkAction = async (action: "archive" | "delete") => {
        if (action === "archive") {
            setBulkArchiving(true);
            return;
        }
        if (action === "delete") {
            setBulkDeleting(true);
            return;
        }
    };

    const executeBulkAction = async (action: "archive" | "delete") => {

        setIsBulkProcessing(true);
        try {
            // Optimistic update
            if (action === "delete") {
                setConversations(prev => prev.filter(c => !selectedIds.includes(c.id)));
                setSelectedIds([]);
                setIsSelectionMode(false);
            } else if (action === "archive") {
                setConversations(prev => prev.map(c => selectedIds.includes(c.id) ? { ...c, is_archived: true } : c));
                setSelectedIds([]);
                setIsSelectionMode(false);
            }

            const res = await fetch(API_ENDPOINTS.conversations.bulk, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ conversation_ids: selectedIds, action })
            });

            if (!res.ok) throw new Error("Bulk action failed");

            // Refresh to be sure
            fetchConversations();
        } catch (e) {
            console.error("Bulk action error", e);
            alert("Bulk action failed");
            fetchConversations(); // Revert on error
        }
        setIsBulkProcessing(false);
    };

    const handleItemClick = ({ id, props }: ItemParams) => {
        if (id === "archive") toggleArchive(props.conversationId, props.isArchived);
        if (id === "pin") togglePin(props.conversationId, props.isPinned);
        if (id === "delete") setDeletingConvId(Number(props.conversationId));
    };

    const timeAgo = (date: string) => {
        if (!date) return "";
        const now = new Date();
        const past = new Date(date);
        const diffMs = now.getTime() - past.getTime();
        const diffMin = Math.round(diffMs / 60000);
        if (diffMin < 1) return t('common.just_now');
        if (diffMin < 60) return `${diffMin}m`;
        const diffHrs = Math.round(diffMin / 60);
        if (diffHrs < 24) return `${diffHrs}h`;
        return `${Math.round(diffHrs / 24)}d`;
    };

    const displayedConversations = conversations
        .filter(c => c.is_archived === showArchived)
        .filter(c => selectedChannel === 'all' || c.channel === selectedChannel)
        .filter(c => c.client_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            c.client_phone.includes(searchQuery))
        .sort((a, b) => {
            if (a.is_pinned && !b.is_pinned) return -1;
            if (!a.is_pinned && b.is_pinned) return 1;
            return new Date(b.last_message_time).getTime() - new Date(a.last_message_time).getTime();
        });

    const formatTime = (ts: string) => {
        if (!ts) return "";
        const isoTs = ts.includes('Z') || ts.includes('+') ? ts : ts.replace(' ', 'T') + 'Z';
        try {
            return new Date(isoTs).toLocaleTimeString('es-CR', {
                hour: '2-digit',
                minute: '2-digit',
                timeZone: config.timezone || 'UTC'
            });
        } catch (e) {
            return new Date(isoTs).toLocaleTimeString('es-CR', {
                hour: '2-digit',
                minute: '2-digit'
            });
        }
    };

    return (
        <div className="w-80 h-full border-r dark:border-[var(--brand-border)] flex flex-col bg-white dark:bg-[var(--brand-surface)] transition-colors">
            <div className="flex flex-col gap-2 p-3 border-b dark:border-[var(--brand-border)]">
                <div className="flex items-center justify-between">
                    <h2 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('sidebar.chats')}</h2>
                    <button
                        onClick={onNewMessage}
                        aria-label={t('sidebar.new_message')}
                        title={t('sidebar.new_message')}
                        className="p-1.5 text-white hover:scale-110 transition-transform shadow-md rounded-full"
                        style={{ backgroundColor: "var(--brand-primary)" }}>
                        <PlusCircle className="w-4 h-4" />
                    </button>
                </div>

                {/* Bulk Action Bar or Search */}
                {isSelectionMode ? (
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-2 border border-blue-200 dark:border-blue-800 rounded-md animate-in fade-in slide-in-from-top-2">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-xs font-bold text-blue-700 dark:text-blue-300">{selectedIds.length} Selected</span>
                            <div className="flex gap-2">
                                <button onClick={toggleSelectAll} className="text-[10px] text-blue-600 hover:underline">All</button>
                                <button onClick={() => { setIsSelectionMode(false); setSelectedIds([]); }} className="text-blue-600 hover:bg-blue-100 p-1 rounded"><X className="w-3 h-3" /></button>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            {(bulkDeleting || bulkArchiving) ? (
                                <div className="flex-1 bg-white dark:bg-gray-800 p-2 rounded-xl border-2 border-red-500/30 flex items-center justify-between gap-2 animate-in slide-in-from-right-2 duration-300 shadow-lg">
                                    <span className="text-[10px] font-black uppercase text-red-600 px-1">
                                        {bulkDeleting ? `Eliminar ${selectedIds.length}?` : `Archivar ${selectedIds.length}?`}
                                    </span>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => { setBulkDeleting(false); setBulkArchiving(false); }}
                                            className="px-3 py-1.5 bg-gray-100 dark:bg-gray-700 text-[9px] font-black uppercase rounded-lg"
                                        >
                                            NO
                                        </button>
                                        <button
                                            onClick={() => { executeBulkAction(bulkDeleting ? 'delete' : 'archive'); setBulkDeleting(false); setBulkArchiving(false); }}
                                            className="px-3 py-1.5 bg-red-600 text-white text-[9px] font-black uppercase rounded-lg shadow-sm"
                                        >
                                            SI
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <button
                                        onClick={() => handleBulkAction("archive")}
                                        disabled={selectedIds.length === 0 || isBulkProcessing}
                                        aria-label="Archive selected conversations"
                                        className="flex-1 bg-[var(--brand-surface)] py-2 rounded-lg text-xs font-bold text-amber-600 shadow-sm border dark:border-[var(--brand-border)] hover:opacity-80 flex items-center justify-center gap-1 select-none hover-premium"
                                    >
                                        <Archive className="w-3 h-3" /> {t('common.archive')}
                                    </button>
                                    <button
                                        onClick={() => handleBulkAction("delete")}
                                        disabled={selectedIds.length === 0 || isBulkProcessing}
                                        aria-label="Delete selected conversations"
                                        className="flex-1 bg-[var(--brand-surface)] py-2 rounded-lg text-xs font-bold text-red-600 shadow-sm border dark:border-[var(--brand-border)] hover:opacity-80 flex items-center justify-center gap-1 select-none hover-premium"
                                    >
                                        <Trash2 className="w-3 h-3" /> {t('common.delete')}
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="flex gap-2 p-1 bg-gray-100 dark:bg-[var(--brand-bg)] rounded-md">
                        <button
                            onClick={() => setShowArchived(false)}
                            aria-selected={!showArchived}
                            className={`flex-1 py-1.5 text-[10px] font-bold transition-all relative select-none hover-premium rounded-sm ${!showArchived ? "bg-white dark:bg-[var(--brand-surface)] shadow-sm" : "text-gray-500"}`}
                            style={{
                                color: !showArchived ? "var(--brand-primary)" : undefined
                            }}
                        >
                            {t('sidebar.inbox')}
                            {conversations.filter(c => c.has_pending).length > 0 && (
                                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[8px] flex items-center justify-center rounded-full animate-bounce tabular-nums">
                                    {conversations.filter(c => c.has_pending).length}
                                </span>
                            )}
                        </button>
                        <button
                            onClick={() => setShowArchived(true)}
                            aria-selected={showArchived}
                            className={`flex-1 py-1.5 text-[10px] font-bold transition-all select-none hover-premium rounded-sm ${showArchived ? "bg-white dark:bg-[var(--brand-surface)] shadow-sm" : "text-gray-500"}`}
                            style={{
                                color: showArchived ? "var(--brand-primary)" : undefined
                            }}
                        >
                            <Archive className="w-3 h-3 inline mr-1" /> {t('common.archive') || "Archive"}
                        </button>
                        <button
                            onClick={() => setIsSelectionMode(true)}
                            aria-label="Enter selection mode"
                            className="px-2 py-1.5 text-gray-500 hover:text-[var(--brand-primary)] hover:bg-[var(--brand-surface)] transition-all select-none hover-premium rounded-sm"
                            title="Select Multiple"
                        >
                            <CheckSquare className="w-3 h-3" />
                        </button>
                    </div>
                )}

                {!isSelectionMode && (
                    <div className="flex flex-col gap-3">
                        {/* Channel Filter - Refined UI */}
                        <div className="flex p-1 bg-gray-100 dark:bg-gray-950/50 rounded-xl border dark:border-gray-800">
                            {[
                                { id: 'all', icon: LayoutGrid, label: 'All' },
                                { id: 'whatsapp', icon: MessageSquare, label: 'WA' },
                                { id: 'email', icon: Mail, label: 'Email' },
                                { id: 'instagram', icon: Instagram, label: 'IG' },
                                { id: 'messenger', icon: MessageCircle, label: 'FB' }
                            ].map((ch) => (
                                <button
                                    key={ch.id}
                                    onClick={() => setSelectedChannel(ch.id as any)}
                                    title={ch.label}
                                    className={`flex-1 flex flex-col items-center justify-center py-3 rounded-lg transition-all duration-300 relative group ${selectedChannel === ch.id
                                        ? "bg-white dark:bg-gray-800 shadow-md text-[var(--brand-primary)] scale-100"
                                        : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-white/50 dark:hover:bg-white/5"
                                        }`}
                                >
                                    <ch.icon className={`w-5 h-5 ${selectedChannel === ch.id ? 'scale-110' : 'group-hover:scale-110'} transition-transform`} />
                                    <span className="text-[11px] font-black uppercase tracking-tight mt-1">{ch.label}</span>
                                    {selectedChannel === ch.id && (
                                        <div className="absolute -bottom-1 w-2.5 h-0.5 bg-[var(--brand-primary)] rounded-full animate-in zoom-in" />
                                    )}
                                </button>
                            ))}
                        </div>

                        <div className="relative group">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-[var(--brand-primary)] transition-colors" />
                            <input
                                type="text"
                                placeholder={t('sidebar.search_placeholder') || "Search..."}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                spellCheck={false}
                                autoComplete="off"
                                className="w-full pl-9 pr-4 py-2 bg-gray-50 dark:bg-[var(--brand-bg)] border-none text-sm focus:ring-2 focus:ring-[var(--brand-primary)] dark:text-white transition-all outline-none rounded-md"
                            />
                        </div>
                    </div>
                )}
            </div>

            <div className="flex-1 overflow-y-auto">
                {showArchived && (
                    <div className="px-4 py-2 bg-amber-50 dark:bg-amber-900/20 text-xs text-amber-600 dark:text-amber-400 font-bold text-center italic">
                        {t('sidebar.archived_view')}
                    </div>
                )}
                {displayedConversations.length === 0 && (
                    <div className="p-12 text-center space-y-2">
                        <div className="w-12 h-12 bg-gray-50 dark:bg-[var(--brand-surface)] rounded-full flex items-center justify-center mx-auto">
                            <Search className="w-6 h-6 text-gray-300" />
                        </div>
                        <p className="text-xs text-gray-400 italic">
                            {t('sidebar.no_conversations', { status: showArchived ? 'archived' : 'active' })}
                        </p>
                    </div>
                )}

                {displayedConversations.map((conv) => (
                    <div
                        key={conv.id}
                        onClick={() => isSelectionMode ? toggleSelection(conv.id) : onSelect(conv.id, conv.client_name, conv.client_phone)}
                        onMouseEnter={() => !isSelectionMode && onPrefetch?.(conv.id)}
                        onContextMenu={(e) => handleContextMenu(e, conv.id, conv.is_archived, conv.is_pinned)}
                        className={`relative p-4 border-b dark:border-[var(--brand-border)] cursor-pointer hover:bg-gray-50 dark:hover:bg-[var(--brand-bg)] transition-colors flex gap-3 z-0 ${activeConversationId === conv.id && !isSelectionMode ? "border-l-4 shadow-sm" :
                            isSelectionMode && selectedIds.includes(conv.id) ? "border-l-4 opacity-70" :
                                "border-l-4 border-l-transparent"
                            }`}
                        style={(activeConversationId === conv.id && !isSelectionMode) || (isSelectionMode && selectedIds.includes(conv.id)) ? {
                            borderLeftColor: "var(--brand-primary)",
                            backgroundColor: "var(--brand-primary-muted)"
                        } : {}}
                    >
                        {Number(deletingConvId) == Number(conv.id) && (
                            <div
                                className="absolute inset-0 bg-white/95 dark:bg-[var(--brand-bg)]/95 z-[100] flex flex-col items-center justify-center p-4 animate-in fade-in zoom-in-95 duration-200 backdrop-blur-sm shadow-2xl"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <p className="text-xs font-black uppercase text-red-600 mb-3 text-center">{t('chat.alerts.confirm_delete_chat')}</p>
                                <div className="flex gap-3 w-full max-w-[200px]">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setDeletingConvId(null); }}
                                        className="flex-1 py-2 text-[10px] font-black uppercase bg-gray-100 dark:bg-[var(--brand-surface)] rounded-xl text-gray-500 hover:bg-gray-200 dark:hover:opacity-80 transition-colors"
                                    >
                                        {t('common.no')}
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); deleteConversation(conv.id); setDeletingConvId(null); }}
                                        className="flex-1 py-2 text-[10px] font-black uppercase bg-red-600 text-white rounded-xl shadow-lg shadow-red-500/30 hover:bg-red-700 transition-all"
                                    >
                                        {t('common.yes')}
                                    </button>
                                </div>
                            </div>
                        )}

                        {isSelectionMode && (
                            <div className="flex items-center" onClick={(e) => { e.stopPropagation(); toggleSelection(conv.id); }}>
                                {selectedIds.includes(conv.id)
                                    ? <CheckSquare className="w-4 h-4 text-[var(--brand-primary)]" />
                                    : <Square className="w-4 h-4 text-gray-300 dark:text-gray-600" />}
                            </div>
                        )}
                        <div className="flex-1 overflow-hidden">
                            <div className="flex justify-between mb-1">
                                <div className="flex flex-col overflow-hidden">
                                    <span className="font-bold text-sm truncate w-32 dark:text-gray-200 flex items-center gap-1">
                                        {conv.is_pinned && <Pin className="w-3 h-3 fill-blue-500 text-blue-500" />}
                                        {conv.has_pending && (
                                            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" title="Pending Review"></span>
                                        )}
                                        {conv.client_name}
                                    </span>
                                    <div className="flex items-center gap-1 mt-0.5">
                                        {conv.channel === 'email' && <Mail className="w-2.5 h-2.5 text-blue-400" />}
                                        {conv.channel === 'whatsapp' && <MessageSquare className="w-2.5 h-2.5 text-emerald-500" />}
                                        {conv.channel === 'instagram' && <Instagram className="w-2.5 h-2.5 text-pink-500" />}
                                        {conv.channel === 'messenger' && <MessageCircle className="w-2.5 h-2.5 text-blue-600" />}
                                        <span className="text-[8px] font-black uppercase text-gray-400 tracking-tighter">{conv.channel}</span>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end shrink-0">
                                    <span className="text-[10px] text-gray-500 dark:text-gray-400 font-mono tabular-nums">
                                        {formatTime(conv.last_message_time)}
                                    </span>
                                    <span className="bg-gray-100 dark:bg-[var(--brand-surface)] px-1.5 py-0.5 rounded text-[8px] font-black text-gray-500 uppercase tracking-tighter mt-0.5 tabular-nums">
                                        {timeAgo(conv.last_message_time)}
                                    </span>
                                </div>
                            </div>
                            <p className="text-xs text-gray-600 dark:text-gray-400 truncate font-medium">{conv.last_message}</p>
                        </div>
                    </div>
                ))}
            </div>

            <Menu id={CONV_MENU_ID} className="dark:bg-[var(--brand-surface)] dark:border-[var(--brand-border)]">
                <Item id="pin" onClick={handleItemClick} className="text-xs font-bold dark:text-gray-300">
                    <Pin className="w-4 h-4 mr-2 text-[var(--brand-primary)]" /> {t('common.pin')}
                </Item>
                <Item id="archive" onClick={handleItemClick} className="text-xs font-bold dark:text-gray-300">
                    <Archive className="w-4 h-4 mr-2 text-amber-500" /> {t('common.archive')}
                </Item>
                <Item id="delete" onClick={handleItemClick} className="text-xs font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10">
                    <Trash2 className="w-4 h-4 mr-2" /> {t('common.delete')}
                </Item>
            </Menu>
        </div >
    );
}
