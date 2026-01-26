import { useState, useEffect } from "react";
import { PlusCircle, Archive, Pin, Settings, Search, Trash2 } from "lucide-react";
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
    onNavigate?: (view: "chat" | "admin") => void;
}

export default function Sidebar({ onSelect, activeConversationId, onNewMessage, onNavigate }: SidebarProps) {
    const { t } = useTranslation();
    const [conversations, setConversations] = useState<ConversationSummary[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [showArchived, setShowArchived] = useState(false);

    useEffect(() => {
        fetchConversations();
        const interval = setInterval(fetchConversations, 5000);
        return () => clearInterval(interval);
    }, []);

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
                    <h1 className="text-xl font-black italic tracking-tighter dark:text-white">CarBlock<span className="text-blue-600">CR</span></h1>
                    <button onClick={onNewMessage} className="p-2 bg-blue-600 text-white rounded-xl hover:scale-110 transition-transform shadow-lg shadow-blue-500/20">
                        <PlusCircle className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex gap-2 p-1 bg-gray-100 dark:bg-gray-900 rounded-xl">
                    <button
                        onClick={() => setShowArchived(false)}
                        className={`flex-1 py-1.5 text-[10px] font-bold rounded-lg transition-all ${!showArchived ? "bg-white dark:bg-gray-800 shadow-sm text-blue-600" : "text-gray-500"}`}
                    >
                        {t('sidebar.inbox')}
                    </button>
                    <button
                        onClick={() => setShowArchived(true)}
                        className={`flex-1 py-1.5 text-[10px] font-bold rounded-lg transition-all ${showArchived ? "bg-white dark:bg-gray-800 shadow-sm text-blue-600" : "text-gray-500"}`}
                    >
                        <Archive className="w-3 h-3 inline mr-1" /> {t('common.archive')}
                    </button>
                </div>

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
                        onClick={() => onSelect(conv.id, conv.client_name, conv.client_phone)}
                        onContextMenu={(e) => handleContextMenu(e, conv.id, conv.is_archived, conv.is_pinned)}
                        className={`p-4 border-b dark:border-gray-800 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${activeConversationId === conv.id ? "bg-blue-50 dark:bg-blue-900/20 border-l-4 border-l-blue-600 shadow-sm" : "border-l-4 border-l-transparent"}`}
                    >
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
                    className="flex items-center gap-1 hover:text-blue-500 transition-colors"
                >
                    <Settings className="w-3.5 h-3.5" /> {t('sidebar.ai_config')}
                </button>
            </div>
        </div>
    );
}
