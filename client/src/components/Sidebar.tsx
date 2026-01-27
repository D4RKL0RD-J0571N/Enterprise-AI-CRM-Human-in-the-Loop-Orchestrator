import { useState, useEffect } from "react";
import { PlusCircle, Archive, Pin, Settings, Search, Trash2, CheckSquare, Square, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Menu, Item, useContextMenu } from 'react-contexify';
import type { ItemParams } from 'react-contexify';
import 'react-contexify/dist/ReactContexify.css';

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
}

interface SidebarProps {
    onSelect: (conversationId: number, clientName: string, clientPhone: string) => void;
    activeConversationId: number | null;
    onNewMessage: () => void;
    onPrefetch?: (id: number) => void;
    onNavigate?: (view: "chat" | "admin") => void;
    conversations?: ConversationSummary[];
}

export default function Sidebar({ onSelect, activeConversationId, onNewMessage, onPrefetch, onNavigate, conversations: externalConvs }: SidebarProps) {
    const { t } = useTranslation();
    const [conversations, setConversations] = useState<ConversationSummary[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [showArchived, setShowArchived] = useState(false);

    // Mass Selection State
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [isBulkProcessing, setIsBulkProcessing] = useState(false);

    useEffect(() => {
        if (!externalConvs) {
            fetchConversations();
            const interval = setInterval(fetchConversations, 5000);
            return () => clearInterval(interval);
        }
    }, [externalConvs]);

    useEffect(() => {
        if (externalConvs) {
            setConversations(externalConvs);
        }
    }, [externalConvs]);

    async function fetchConversations() {
        try {
            const res = await fetch("http://localhost:8000/conversations/");
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
            await fetch(`http://localhost:8000/conversations/${id}/${currentStatus ? "unarchive" : "archive"}`, { method: "POST" });
        } catch (e) {
            console.error(e);
        }
    }

    async function togglePin(id: number, currentStatus: boolean) {
        setConversations(prev => prev.map(c => c.id === id ? { ...c, is_pinned: !currentStatus } : c));
        try {
            await fetch(`http://localhost:8000/conversations/${id}/${currentStatus ? "unpin" : "pin"}`, { method: "POST" });
        } catch (e) {
            console.error(e);
        }
    }

    async function deleteConversation(id: number) {
        if (!confirm(t('common.confirm_delete_chat'))) return;
        setConversations(prev => prev.filter(c => c.id !== id));
        try {
            await fetch(`http://localhost:8000/conversations/${id}`, { method: "DELETE" });
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

    const handleBulkAction = async (action: "archive" | "delete") => {
        if (!confirm(t(`common.confirm_bulk_${action}`, `Are you sure you want to ${action} ${selectedIds.length} conversations?`))) return;

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

            const res = await fetch("http://localhost:8000/conversations/bulk-action", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
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
        if (id === "delete") deleteConversation(props.conversationId);
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
        .filter(c => c.client_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            c.client_phone.includes(searchQuery))
        .sort((a, b) => {
            if (a.is_pinned && !b.is_pinned) return -1;
            if (!a.is_pinned && b.is_pinned) return 1;
            return new Date(b.last_message_time).getTime() - new Date(a.last_message_time).getTime();
        });

    return (
        <div className="w-80 h-full border-r dark:border-gray-800 flex flex-col bg-white dark:bg-gray-950 transition-colors">
            <div className="p-4 space-y-4">
                <div className="flex items-center justify-between">
                    <h1 className="text-xl font-black italic tracking-tighter dark:text-white">Support<span style={{ color: "var(--brand-primary)" }}>Hub</span></h1>
                    <button onClick={onNewMessage} className="p-2 text-white rounded-xl hover:scale-110 transition-transform shadow-lg"
                        style={{ backgroundColor: "var(--brand-primary)", boxShadow: "0 10px 15px -3px var(--brand-primary-muted)" }}>
                        <PlusCircle className="w-5 h-5" />
                    </button>
                </div>



                {/* Bulk Action Bar or Search */}
                {isSelectionMode ? (
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-xl border border-blue-200 dark:border-blue-800 animate-in fade-in slide-in-from-top-2">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-xs font-bold text-blue-700 dark:text-blue-300">{selectedIds.length} Selected</span>
                            <div className="flex gap-2">
                                <button onClick={toggleSelectAll} className="text-[10px] text-blue-600 hover:underline">All</button>
                                <button onClick={() => { setIsSelectionMode(false); setSelectedIds([]); }} className="text-blue-600 hover:bg-blue-100 p-1 rounded"><X className="w-3 h-3" /></button>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => handleBulkAction("archive")}
                                disabled={selectedIds.length === 0 || isBulkProcessing}
                                className="flex-1 bg-white dark:bg-gray-800 py-2 rounded-lg text-xs font-bold text-amber-600 shadow-sm border dark:border-gray-700 hover:bg-gray-50 flex items-center justify-center gap-1"
                            >
                                <Archive className="w-3 h-3" /> Archive
                            </button>
                            <button
                                onClick={() => handleBulkAction("delete")}
                                disabled={selectedIds.length === 0 || isBulkProcessing}
                                className="flex-1 bg-white dark:bg-gray-800 py-2 rounded-lg text-xs font-bold text-red-600 shadow-sm border dark:border-gray-700 hover:bg-gray-50 flex items-center justify-center gap-1"
                            >
                                <Trash2 className="w-3 h-3" /> Delete
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="flex gap-2 p-1 bg-gray-100 dark:bg-gray-900 rounded-xl">
                        <button
                            onClick={() => setShowArchived(false)}
                            className={`flex-1 py-1.5 text-[10px] font-bold rounded-lg transition-all ${!showArchived ? "bg-white dark:bg-gray-800 shadow-sm" : "text-gray-500"}`}
                            style={!showArchived ? { color: "var(--brand-primary)" } : {}}
                        >
                            {t('sidebar.inbox')}
                        </button>
                        <button
                            onClick={() => setShowArchived(true)}
                            className={`flex-1 py-1.5 text-[10px] font-bold rounded-lg transition-all ${showArchived ? "bg-white dark:bg-gray-800 shadow-sm" : "text-gray-500"}`}
                            style={showArchived ? { color: "var(--brand-primary)" } : {}}
                        >
                            <Archive className="w-3 h-3 inline mr-1" /> {t('common.archive')}
                        </button>
                        <button
                            onClick={() => setIsSelectionMode(true)}
                            className="px-3 py-1.5 text-gray-500 hover:text-blue-600 hover:bg-white dark:hover:bg-gray-800 rounded-lg transition-all"
                            title="Select Multiple"
                        >
                            <CheckSquare className="w-3 h-3" />
                        </button>
                    </div>
                )}

                {!isSelectionMode && (
                    <div className="relative group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                        <input
                            type="text"
                            placeholder={t('sidebar.search_placeholder')}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 bg-gray-50 dark:bg-gray-800 border-none rounded-xl text-xs focus:ring-2 focus:ring-blue-500 dark:text-white transition-all outline-none"
                        />
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
                        <div className="w-12 h-12 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto">
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
                        className={`p-4 border-b dark:border-gray-800 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex gap-3 ${activeConversationId === conv.id && !isSelectionMode ? "bg-brand-primary-muted border-l-4 shadow-sm" :
                            isSelectionMode && selectedIds.includes(conv.id) ? "bg-brand-primary-muted border-l-4 opacity-70" :
                                "border-l-4 border-l-transparent"
                            }`}
                        style={(activeConversationId === conv.id && !isSelectionMode) || (isSelectionMode && selectedIds.includes(conv.id)) ? {
                            borderLeftColor: "var(--brand-primary)",
                            backgroundColor: "var(--brand-primary-muted)"
                        } : {}}
                    >
                        {isSelectionMode && (
                            <div className="flex items-center" onClick={(e) => { e.stopPropagation(); toggleSelection(conv.id); }}>
                                {selectedIds.includes(conv.id)
                                    ? <CheckSquare className="w-4 h-4 text-blue-600" />
                                    : <Square className="w-4 h-4 text-gray-300" />}
                            </div>
                        )}
                        <div className="flex-1 overflow-hidden">
                            <div className="flex justify-between mb-1">
                                <span className="font-bold text-sm truncate w-32 dark:text-gray-200 flex items-center gap-1">
                                    {conv.is_pinned && <Pin className="w-3 h-3 fill-blue-500 text-blue-500" />}
                                    {conv.has_pending && (
                                        <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" title="Pending Review"></span>
                                    )}
                                    {conv.client_name}
                                </span>
                                <div className="flex flex-col items-end">
                                    <span className="text-[10px] text-gray-500 dark:text-gray-400 font-mono">
                                        {conv.last_message_time ? new Date(conv.last_message_time).toLocaleTimeString('es-CR', { hour: '2-digit', minute: '2-digit' }) : ""}
                                    </span>
                                    <span className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-[8px] font-black text-gray-500 uppercase tracking-tighter mt-0.5">
                                        {timeAgo(conv.last_message_time)}
                                    </span>
                                </div>
                            </div>
                            <p className="text-xs text-gray-600 dark:text-gray-400 truncate font-medium">{conv.last_message}</p>
                        </div>
                    </div>
                ))}
            </div>

            <Menu id={CONV_MENU_ID} className="dark:bg-gray-900 dark:border-gray-800">
                <Item id="pin" onClick={handleItemClick} className="text-xs font-bold dark:text-gray-300">
                    <Pin className="w-4 h-4 mr-2 text-blue-500" /> {t('common.pin')}
                </Item>
                <Item id="archive" onClick={handleItemClick} className="text-xs font-bold dark:text-gray-300">
                    <Archive className="w-4 h-4 mr-2 text-amber-500" /> {t('common.archive')}
                </Item>
                <Item id="delete" onClick={handleItemClick} className="text-xs font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10">
                    <Trash2 className="w-4 h-4 mr-2" /> {t('common.delete')}
                </Item>
            </Menu>

            <div className="p-4 border-t dark:border-gray-800 flex items-center justify-between text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-widest">
                <span>v1.2.0 AUDIT</span>
                <button
                    onClick={() => onNavigate?.("admin")}
                    className="flex items-center gap-1 transition-colors"
                    style={{ color: "inherit" }}
                    onMouseEnter={(e) => e.currentTarget.style.color = "var(--brand-primary)"}
                    onMouseLeave={(e) => e.currentTarget.style.color = "inherit"}
                >
                    <Settings className="w-3.5 h-3.5" /> {t('sidebar.ai_config')}
                </button>
            </div>
        </div>
    );
}
