import { useState, useEffect } from "react";
import { PlusCircle, Archive, Pin } from "lucide-react";
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
}

interface SidebarProps {
    onSelect: (conversationId: number, clientName: string, clientPhone: string) => void;
    activeConversationId: number | null;
    onNewMessage: () => void;
}

export default function Sidebar({ onSelect, activeConversationId, onNewMessage }: SidebarProps) {
    const [conversations, setConversations] = useState<ConversationSummary[]>([]);

    useEffect(() => {
        fetchConversations();

        // Poll for updates every 5 seconds
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

    const { show } = useContextMenu({
        id: CONV_MENU_ID,
    });

    function handleContextMenu(event: React.MouseEvent, conversationId: number, isArchived: boolean, isPinned: boolean) {
        show({
            event,
            props: {
                conversationId,
                isArchived,
                isPinned
            }
        });
    }

    async function toggleArchive(id: number, currentStatus: boolean) {
        setConversations(prev => prev.map(c => c.id === id ? { ...c, is_archived: !currentStatus } : c));
        try {
            const action = currentStatus ? "unarchive" : "archive";
            await fetch(`http://localhost:8000/conversations/${id}/${action}`, { method: "POST" });
        } catch (e) {
            console.error(e);
        }
    }

    async function togglePin(id: number, currentStatus: boolean) {
        setConversations(prev => prev.map(c => c.id === id ? { ...c, is_pinned: !currentStatus } : c));
        try {
            const action = currentStatus ? "unpin" : "pin";
            await fetch(`http://localhost:8000/conversations/${id}/${action}`, { method: "POST" });
        } catch (e) {
            console.error(e);
        }
    }

    const [showArchived, setShowArchived] = useState(false);

    const handleItemClick = ({ id, props }: ItemParams) => {
        switch (id) {
            case "archive":
                toggleArchive(props.conversationId, props.isArchived);
                break;
            case "pin":
                togglePin(props.conversationId, props.isPinned);
                break;
        }
    };

    const displayedConversations = conversations.filter(c => showArchived ? c.is_archived : !c.is_archived);

    return (
        <div className="w-64 bg-white dark:bg-gray-900 border-r dark:border-gray-800 flex flex-col h-full transition-colors duration-200">
            <div className="p-4 border-b dark:border-gray-800 flex items-center justify-between">
                <h2 className="font-bold text-lg dark:text-white">Inbox</h2>
                <div className="flex gap-1">
                    <button
                        onClick={() => setShowArchived(!showArchived)}
                        title={showArchived ? "Show Inbox" : "Show Archived"}
                        className={`p-2 rounded-full ${showArchived ? 'bg-amber-100 text-amber-600' : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400'}`}
                    >
                        <Archive className="w-5 h-5" />
                    </button>
                    <button
                        onClick={onNewMessage}
                        title="Simulate New Message"
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full text-blue-600 dark:text-blue-400"
                    >
                        <PlusCircle className="w-5 h-5" />
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto">
                {showArchived && (
                    <div className="px-4 py-2 bg-amber-50 dark:bg-amber-900/20 text-xs text-amber-600 dark:text-amber-400 font-bold text-center">
                        ARCHIVED VIEW
                    </div>
                )}
                {displayedConversations.length === 0 && (
                    <div className="p-4 text-center text-gray-400 text-sm">
                        No {showArchived ? 'archived' : 'active'} conversations.
                    </div>
                )}

                {displayedConversations.map((conv) => (
                    <div
                        key={conv.id}
                        onClick={() => onSelect(conv.id, conv.client_name, conv.client_phone)}
                        onContextMenu={(e) => handleContextMenu(e, conv.id, conv.is_archived, conv.is_pinned)}
                        className={`p-4 border-b dark:border-gray-800 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${activeConversationId === conv.id ? "bg-blue-50 dark:bg-blue-900/20 border-l-4 border-l-blue-600" : "border-l-4 border-l-transparent"
                            }`}
                    >
                        <div className="flex justify-between mb-1">
                            <span className="font-bold text-sm truncate w-24 dark:text-gray-200 flex items-center gap-1">
                                {conv.is_pinned && <Pin className="w-3 h-3 fill-gray-500 text-gray-500" />}
                                {conv.client_name}
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                                {conv.last_message_time ? new Date(conv.last_message_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ""}
                            </span>
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-400 truncate">{conv.last_message}</p>
                    </div>
                ))}
            </div>

            <Menu id={CONV_MENU_ID}>
                <Item id="pin" onClick={handleItemClick}>
                    <Pin className="w-4 h-4 mr-2" /> Toggle Pin
                </Item>
                <Item id="archive" onClick={handleItemClick}>
                    <Archive className="w-4 h-4 mr-2" /> Toggle Archive
                </Item>
            </Menu>

            <div className="p-4 border-t dark:border-gray-800 text-xs text-center text-gray-400 dark:text-gray-500">
                v1.0.0 • LLM Connected
            </div>
        </div>
    );
}
