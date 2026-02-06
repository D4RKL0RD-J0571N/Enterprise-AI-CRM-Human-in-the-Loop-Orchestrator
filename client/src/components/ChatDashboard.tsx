import { useState, useEffect, useRef } from "react";
import { Sun, Moon, Grid2X2, LayoutGrid, Monitor, Layout as LayoutIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import { useBrandingContext } from "../context/BrandingContext";
import Sidebar from "./Sidebar";
import InfoPanel from "./InfoPanel";
import ChatWindow from "./ChatWindow";
import { API_ENDPOINTS, WS_BASE_URL } from "../lib/api";

interface ChatDashboardProps {
    onNavigate?: (view: "chat" | "admin") => void;
}

interface ChatSession {
    conversationId: number;
    clientName: string;
    clientPhone: string;
    messages: any[];
    isThinking: boolean;
    isLoading?: boolean;
    layout?: {
        x: number;
        y: number;
        width: number;
        height: number;
        zIndex: number;
    };
    autoAIEnabled?: boolean;
    phone?: string;
}

export default function ChatDashboard({ onNavigate }: ChatDashboardProps) {
    const { t } = useTranslation();
    const { token, isAdmin, logout, user } = useAuth();
    const [sessions, setSessions] = useState<ChatSession[]>([]);

    const [conversations, setConversations] = useState<any[]>([]);

    const [activeConversationId, setActiveConversationId] = useState<number | null>(null);
    const activeSession = sessions.find(s => s.conversationId === activeConversationId) || null;

    const activeClientName = activeSession?.clientName || t('chat.select_client');
    const activeClientPhone = activeSession?.clientPhone || "";

    const { config, isDarkMode, toggleDarkMode } = useBrandingContext();



    const [layoutMode, setLayoutMode] = useState<"focus" | "canvas">("canvas");
    const maxZIndex = useRef(100);
    const canvasRef = useRef<HTMLDivElement>(null);
    const [retryCount, setRetryCount] = useState(0);
    const [isPollingMode, setIsPollingMode] = useState(false);
    const [isDragging, setIsDragging] = useState(false);

    const [draggingId, setDraggingId] = useState<number | null>(null);
    const [resizingId, setResizingId] = useState<number | null>(null);
    const dragOffset = useRef({ x: 0, y: 0 });
    const [isPanning, setIsPanning] = useState(false);
    const panStart = useRef({ x: 0, y: 0 });

    // New Chat Modal State
    const [isNewChatOpen, setIsNewChatOpen] = useState(false);
    const [newChatPhone, setNewChatPhone] = useState("");
    const [newChatName, setNewChatName] = useState("");

    const sessionsRef = useRef(sessions);
    useEffect(() => { sessionsRef.current = sessions; }, [sessions]);

    // RESTORE: Load Workspace Config & Sessions
    useEffect(() => {
        const savedLayout = localStorage.getItem("workspace_layout");
        if (savedLayout) {
            try {
                const parsed = JSON.parse(savedLayout);
                if (parsed.sessions) setSessions(parsed.sessions);
                if (parsed.layoutMode) setLayoutMode(parsed.layoutMode);
                if (parsed.activeConversationId) setActiveConversationId(parsed.activeConversationId);
            } catch (e) { console.error("Failed to restore layout", e); }
        }

        const connectWS = () => {
            if (retryCount > 5) {
                setIsPollingMode(true);
                console.warn("WS: Max retries reached. Switching to Polling Mode (4s).");
                return;
            }

            const socket = new WebSocket(`${WS_BASE_URL}/ws/chat`);

            socket.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    if (data.type === "security_alert") {
                        const audio = new Audio('/assets/sounds/alert.mp3');
                        audio.play().catch(() => { });
                    } else if (data.type === "new_message") {
                        if (data.sender === "user") {
                            const audio = new Audio('/assets/sounds/notification.mp3');
                            audio.play().catch(() => { });
                        }
                        // Update relevant session state
                        setSessions(prev => prev.map(s => {
                            if (s.conversationId === data.conversation_id || s.phone === data.phone) {
                                return { ...s, messages: [...s.messages, data] };
                            }
                            return s;
                        }));
                    } else if (data.type === "message_status_update") {
                        setSessions(prev => prev.map(s => {
                            if (s.phone === data.phone) {
                                return {
                                    ...s,
                                    messages: s.messages.map(m => m.id === data.id ? { ...m, status: data.status } : m)
                                };
                            }
                            return s;
                        }));
                    }
                } catch (e) { console.error("WS Parse Error", e); }
            };

            socket.onclose = () => {
                const timeout = Math.min(1000 * Math.pow(2, retryCount), 10000);
                setTimeout(() => {
                    setRetryCount(prev => prev + 1);
                    connectWS();
                }, timeout);
            };

            socket.onopen = () => {
                setRetryCount(0);
                setIsPollingMode(false);
                console.log("WS: Connected");
            };
        };

        connectWS();
    }, [retryCount]);

    // PERSISTENCE: Save Workspace Config to LocalStorage
    useEffect(() => {
        const workspaceData = {
            sessions,
            layoutMode,
            activeConversationId
        };
        localStorage.setItem("workspace_layout", JSON.stringify(workspaceData));
    }, [sessions, layoutMode, activeConversationId]);

    // PERSISTENCE: Periodic Server Sync
    useEffect(() => {
        const saveConfig = setTimeout(async () => {
            const workspaceConfig = {
                open_conversations: sessions.map(s => s.conversationId),
                layout_mode: layoutMode,
                active_conversation_id: activeConversationId
            };

            try {
                await fetch("http://localhost:8000/admin/workspace", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    },
                    body: JSON.stringify({ config: JSON.stringify(workspaceConfig) })
                });
            } catch (e) {
                console.error("Failed to save workspace", e);
            }
        }, 2000);
        return () => clearTimeout(saveConfig);
    }, [sessions, layoutMode, activeConversationId, token]);

    // RESTORE: Load Workspace Config & Sessions
    useEffect(() => {
        const syncList = async () => {
            try {
                const res = await fetch("http://localhost:8000/conversations/", {
                    headers: { "Authorization": `Bearer ${token}` }
                });
                if (res.ok) {
                    const list = await res.json();
                    setConversations(list);
                }
            } catch (err) {
                console.error("Sync failed", err);
            }
        };
        syncList();
        const interval = setInterval(syncList, 8000);
        return () => clearInterval(interval);
    }, [token]);

    const fetchMessages = async (convId: number) => {
        try {
            const res = await fetch(`http://localhost:8000/conversations/${convId}/messages`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (res.ok) {
                const msgs = await res.json();
                setSessions(prev => {
                    const idx = prev.findIndex(s => s.conversationId === convId);
                    if (idx !== -1) {
                        const copy = [...prev];
                        copy[idx] = { ...copy[idx], messages: msgs, isLoading: false };
                        return copy;
                    }
                    return prev;
                });
            }
        } catch (e) { console.error(e); }
    };

    const bringToFront = (id: number) => {
        setSessions(prev => prev.map(s => s.conversationId === id ? {
            ...s,
            layout: {
                ...(s.layout || { x: 50, y: 50, width: 450, height: 650 }),
                zIndex: ++maxZIndex.current
            }
        } : s));
    };

    const handleToggleAI = async (convId: number) => {
        if (convId < 0) {
            setSessions(prev => prev.map(s => s.conversationId === convId ? { ...s, autoAIEnabled: !s.autoAIEnabled } : s));
            return;
        }
        try {
            const res = await fetch(`http://localhost:8000/conversations/${convId}/toggle-auto-ai`, {
                method: "POST",
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setSessions(prev => prev.map(s => s.conversationId === convId ? { ...s, autoAIEnabled: data.auto_ai_enabled } : s));
            }
        } catch (e) {
            console.error("Failed to toggle AI", e);
        }
    };

    const handleSelectConversation = (id: number, name: string, phone: string) => {
        const exists = sessions.find(s => s.conversationId === id);
        if (!exists) {
            const newSession: ChatSession = {
                conversationId: id,
                clientName: name,
                clientPhone: phone,
                messages: [],
                isThinking: false,
                isLoading: true,
                autoAIEnabled: conversations.find(c => c.id === id)?.auto_ai_enabled ?? true,
                phone: phone,
                layout: {
                    x: 50 + (sessions.length * 40),
                    y: 50 + (sessions.length * 40),
                    width: 450,
                    height: 650,
                    zIndex: ++maxZIndex.current
                }
            };
            setSessions(prev => [...prev, newSession]);
            fetchMessages(id);
        } else {
            bringToFront(id);
        }
        setActiveConversationId(id);
    };

    const startDrag = (e: React.MouseEvent, id: number) => {
        bringToFront(id);
        setDraggingId(id);
        setIsDragging(true);
        const session = sessions.find(s => s.conversationId === id);
        if (session && session.layout && canvasRef.current) {
            const rect = canvasRef.current.getBoundingClientRect();
            const mouseX = e.clientX - rect.left + canvasRef.current.scrollLeft;
            const mouseY = e.clientY - rect.top + canvasRef.current.scrollTop;

            dragOffset.current = {
                x: mouseX - session.layout.x,
                y: mouseY - session.layout.y
            };
        }
    };

    const startResize = (e: React.MouseEvent, id: number) => {
        e.stopPropagation();
        setResizingId(id);
    };

    useEffect(() => {
        const handleMouseMoveGlobal = (e: MouseEvent) => {
            if (!canvasRef.current) return;
            const rect = canvasRef.current.getBoundingClientRect();

            // Mouse position relative to the SCROLLABLE canvas content
            const mouseX = e.clientX - rect.left + canvasRef.current.scrollLeft;
            const mouseY = e.clientY - rect.top + canvasRef.current.scrollTop;

            if (draggingId !== null) {
                setSessions(prev => prev.map(s => s.conversationId === draggingId ? {
                    ...s,
                    layout: {
                        ...(s.layout || { width: 450, height: 650, zIndex: 10 }),
                        x: mouseX - dragOffset.current.x,
                        y: mouseY - dragOffset.current.y,
                        zIndex: maxZIndex.current
                    }
                } : s));
            } else if (resizingId !== null) {
                setSessions(prev => prev.map(s => s.conversationId === resizingId ? {
                    ...s,
                    layout: {
                        ...(s.layout || { width: 450, height: 650, x: 0, y: 0, zIndex: 10 }),
                        width: Math.max(300, mouseX - (s.layout?.x || 0)),
                        height: Math.max(400, mouseY - (s.layout?.y || 0))
                    }
                } : s));
            } else if (isPanning) {
                const dx = e.clientX - panStart.current.x;
                const dy = e.clientY - panStart.current.y;
                canvasRef.current.scrollLeft -= dx;
                canvasRef.current.scrollTop -= dy;
                panStart.current = { x: e.clientX, y: e.clientY };
            }
        };

        const handleMouseUpGlobal = () => {
            setDraggingId(null);
            setResizingId(null);
            setIsDragging(false);
            setIsPanning(false);
        };

        if (draggingId !== null || resizingId !== null || isPanning) {
            window.addEventListener("mousemove", handleMouseMoveGlobal);
            window.addEventListener("mouseup", handleMouseUpGlobal);
        }
        return () => {
            window.removeEventListener("mousemove", handleMouseMoveGlobal);
            window.removeEventListener("mouseup", handleMouseUpGlobal);
        };
    }, [draggingId, resizingId, isPanning]);




    const handleCanvasMouseDown = (e: React.MouseEvent) => {
        // Only pan if clicking direct background or the grid, not a window
        if (layoutMode === 'canvas' && (e.target === canvasRef.current || (e.target as HTMLElement).classList.contains('infinite-canvas-bg'))) {
            setIsPanning(true);
            panStart.current = { x: e.clientX, y: e.clientY };
        }
    };

    const handleCreateNewChat = () => {
        setNewChatPhone("");
        setNewChatName("");
        setIsNewChatOpen(true);
    };

    const submitNewChat = async () => {
        if (!newChatPhone.trim()) return;
        try {
            const res = await fetch(`${API_ENDPOINTS.conversations.base}initiate`, {
                method: "POST",
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
                body: JSON.stringify({ phone_number: newChatPhone, name: newChatName || undefined })
            });
            if (res.ok) {
                const data = await res.json();
                handleSelectConversation(data.id, data.client_name, data.client_phone);
                setIsNewChatOpen(false);
            }
        } catch (e) { console.error(e); }
    };



    const sendMessage = async (text: string, session: ChatSession) => {
        try {
            const res = await fetch(API_ENDPOINTS.conversations.messages(session.conversationId), {
                method: "POST",
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
                body: JSON.stringify({ content: text }),
            });
            if (res.ok) fetchMessages(session.conversationId);
        } catch (e) { console.error(e); }
    };

    const approveMessage = async (messageId: number, session: ChatSession) => {
        try {
            const res = await fetch(API_ENDPOINTS.conversations.messageAction(messageId, "approve"), {
                method: "POST",
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (res.ok) fetchMessages(session.conversationId);
        } catch (e) { console.error(e); }
    };

    const editMessage = async (messageId: number, content: string, session: ChatSession) => {
        try {
            const res = await fetch(API_ENDPOINTS.conversations.messageUpdate(messageId), {
                method: "PUT",
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
                body: JSON.stringify({ content })
            });
            if (res.ok) fetchMessages(session.conversationId);
        } catch (e) { console.error(e); }
    };

    const deleteMessage = async (messageId: number, session: ChatSession) => {
        try {
            const res = await fetch(API_ENDPOINTS.conversations.messageAction(messageId, "reject"), {
                method: "POST",
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (res.ok) fetchMessages(session.conversationId);
        } catch (e) { console.error(e); }
    };

    const deleteBulkMessages = async (messageIds: number[], session: ChatSession) => {
        try {
            const res = await fetch(API_ENDPOINTS.conversations.bulk, {
                method: "POST",
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
                body: JSON.stringify({ message_ids: messageIds, action: "delete" })
            });
            if (res.ok) fetchMessages(session.conversationId);
        } catch (e) { console.error(e); }
    };

    return (
        <div className="flex h-screen w-full bg-slate-50 dark:bg-[var(--brand-bg)] transition-colors duration-300 overflow-hidden font-sans">
            <Sidebar
                onSelect={handleSelectConversation}
                activeConversationId={activeConversationId}
                onNewMessage={handleCreateNewChat}
                onNavigate={onNavigate}
                conversations={conversations}
            />

            <div className="flex-1 flex flex-col relative w-full h-full overflow-hidden">
                {/* MODERN HEADER SECTION */}
                <div className="flex items-center justify-between p-4 border-b dark:border-[var(--brand-border)] bg-white/50 dark:bg-[var(--brand-surface)]/50 backdrop-blur-md z-[70]">
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-3">
                            {config.logo_url && <img src={config.logo_url} alt="Logo" className="w-6 h-6 object-contain" />}
                            <span className="text-sm font-black dark:text-white uppercase tracking-tighter" style={{ color: 'var(--brand-primary)' }}>{config.business_name || "Console"}</span>
                        </div>

                        <div className="h-4 w-px bg-[var(--brand-border)]"></div>
                        <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full animate-pulse ${isPollingMode ? 'bg-amber-500' : token ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]' : 'bg-red-500'}`}></div>
                            <span className="text-[10px] font-black uppercase text-slate-400 dark:text-gray-500 tracking-widest leading-none">
                                {isPollingMode ? t('chat.status.polling') : token ? t('chat.status.online') : t('chat.status.offline')}
                            </span>
                        </div>

                        <div className="h-4 w-px bg-[var(--brand-border)]"></div>
                        <div className="flex items-center gap-3">
                            <span className="text-[10px] font-bold text-slate-500 uppercase">{t('chat.node_registry')}</span>
                            <div className="px-2 py-0.5 bg-[var(--brand-surface)] rounded border dark:border-[var(--brand-border)] flex items-center gap-1.5">
                                <span className={`w-1.5 h-1.5 rounded-full ${isAdmin ? 'bg-indigo-500' : 'bg-amber-500'}`}></span>
                                <span className="text-[9px] font-black dark:text-slate-300 uppercase tracking-tighter">
                                    {isAdmin ? t('chat.privileged_node') : t('chat.operational_access')}
                                </span>
                            </div>
                        </div>
                        <div className="flex gap-2 p-1 bg-[var(--brand-bg)] rounded-2xl border dark:border-[var(--brand-border)] ml-4">
                            <button
                                onClick={() => setLayoutMode("focus")}
                                className={`p-2 rounded-xl transition-all ${layoutMode === "focus" ? "bg-white dark:bg-[var(--brand-surface)] shadow-md text-[var(--brand-primary)] scale-105" : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"}`}
                                title="Focus Mode"
                            >
                                <Monitor className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => setLayoutMode("canvas")}
                                className={`p-2 rounded-xl transition-all ${layoutMode === "canvas" ? "bg-white dark:bg-[var(--brand-surface)] shadow-md text-[var(--brand-primary)] scale-105" : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"}`}
                                title="Whiteboard Canvas"
                            >
                                <LayoutGrid className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-3 px-3 py-1.5 bg-[var(--brand-surface)] rounded-2xl border dark:border-[var(--brand-border)] shadow-sm">
                            <div
                                className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black text-white uppercase ring-2 ring-[var(--brand-primary)]/20"
                                style={{ backgroundColor: "var(--brand-primary)" }}
                            >
                                {user?.username.substring(0, 2)}
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[11px] font-black dark:text-white leading-none uppercase">{user?.username}</span>
                                <span className="text-[8px] font-bold text-slate-500 uppercase tracking-[0.2em] mt-1">{t('auth.role_access', { role: user?.role })}</span>
                            </div>
                            <button
                                onClick={logout}
                                className="ml-2 p-2 hover:bg-red-500/10 rounded-xl text-slate-400 hover:text-red-500 transition-all active:scale-90"
                                title={t('chat.terminate_session')}
                            >
                                <LayoutIcon className="w-4 h-4 rotate-90" />
                            </button>
                        </div>

                        <button
                            onClick={toggleDarkMode}
                            className="p-2.5 bg-[var(--brand-surface)] rounded-2xl border dark:border-[var(--brand-border)] text-slate-500 dark:text-slate-400 hover:scale-105 transition-transform"
                        >
                            {isDarkMode ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-[var(--brand-secondary)]" />}
                        </button>
                    </div>
                </div>

                <div
                    className={`flex-1 overflow-auto relative bg-slate-50 dark:bg-[var(--brand-surface)]/40 infinite-canvas ${isDragging || (isPanning && layoutMode === 'canvas') ? 'cursor-grabbing' : (layoutMode === 'canvas' ? 'cursor-grab' : '')}`}
                    ref={canvasRef}
                    onMouseDown={handleCanvasMouseDown}
                >
                    {layoutMode === "focus" ? (
                        <div className="h-full w-full p-0 flex items-center justify-center overflow-hidden">
                            {activeSession ? (
                                <div className="w-full h-full animate-in fade-in duration-500 shadow-none rounded-none overflow-hidden border-x dark:border-slate-800">
                                    <ChatWindow
                                        {...activeSession}
                                        onSendMessage={(txt: string) => sendMessage(txt, activeSession)}
                                        onApprove={(id: number) => approveMessage(id, activeSession)}
                                        onEdit={(id: number, txt: string) => editMessage(id, txt, activeSession)}
                                        onDelete={(id: number) => deleteMessage(id, activeSession)}
                                        onBulkDelete={(ids: number[]) => deleteBulkMessages(ids, activeSession)}
                                        onMaximize={() => setLayoutMode("canvas")}
                                        autoAIEnabled={activeSession.autoAIEnabled}
                                        onToggleAI={() => handleToggleAI(activeSession.conversationId)}
                                        onClose={() => {
                                            setSessions(prev => prev.filter(s => s.conversationId !== activeSession.conversationId));
                                            setActiveConversationId(null);
                                        }}
                                        isMaximized={true}
                                        isLoading={activeSession.isLoading}
                                        timezone={config.timezone}
                                    />
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full opacity-20 grayscale">
                                    <LayoutIcon className="w-32 h-32 mb-10 text-slate-400" />
                                    <h2 className="text-3xl font-black uppercase tracking-[0.6em] text-slate-400">{t('chat.select_node')}</h2>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="min-w-[6000px] min-h-[6000px] relative p-40 infinite-canvas-bg">
                            {/* Whiteboard Grid Background */}
                            <div className="absolute inset-0 opacity-[0.05] pointer-events-none dark:opacity-[0.1]"
                                style={{ backgroundImage: `radial-gradient(circle, currentColor 1px, transparent 1px)`, backgroundSize: '60px 60px' }}></div>

                            {sessions.length === 0 && (
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center opacity-10 pointer-events-none">
                                    <Grid2X2 className="w-48 h-48 mb-12 text-slate-400" />
                                    <h2 className="text-5xl font-black uppercase tracking-[1em] text-slate-400">{t('chat.workspace_empty')}</h2>
                                </div>
                            )}

                            {sessions.map((session) => (
                                <div
                                    key={session.conversationId}
                                    className={`absolute transition-shadow duration-200 rounded-[32px] overflow-hidden border dark:border-[var(--brand-border)] ${draggingId === session.conversationId ? "shadow-2xl ring-4 ring-[var(--brand-primary)]/30 scale-[1.02]" : "shadow-xl"}`}
                                    style={{
                                        left: session.layout?.x || 0,
                                        top: session.layout?.y || 0,
                                        width: session.layout?.width || 450,
                                        height: session.layout?.height || 650,
                                        zIndex: session.layout?.zIndex || 10,
                                        cursor: draggingId === session.conversationId ? 'grabbing' : 'default',
                                        backgroundColor: 'var(--brand-surface)'
                                    }}
                                    onMouseDown={() => {
                                        if (activeConversationId !== session.conversationId) {
                                            setActiveConversationId(session.conversationId);
                                            bringToFront(session.conversationId);
                                        }
                                    }}
                                >
                                    <ChatWindow
                                        {...session}
                                        onSendMessage={(txt: string) => sendMessage(txt, session)}
                                        onApprove={(id: number) => approveMessage(id, session)}
                                        onEdit={(id: number, txt: string) => editMessage(id, txt, session)}
                                        onDelete={(id: number) => deleteMessage(id, session)}
                                        onBulkDelete={(ids: number[]) => deleteBulkMessages(ids, session)}
                                        onMaximize={() => {
                                            setActiveConversationId(session.conversationId);
                                            setLayoutMode("focus");
                                        }}
                                        onClose={() => {
                                            setSessions(prev => prev.filter(s => s.conversationId !== session.conversationId));
                                            if (activeConversationId === session.conversationId) setActiveConversationId(null);
                                        }}
                                        autoAIEnabled={session.autoAIEnabled}
                                        onToggleAI={() => handleToggleAI(session.conversationId)}
                                        isMaximized={false}
                                        isLoading={session.isLoading}
                                        // Custom Props for Canvas
                                        canDrag={true}
                                        onDragStart={(e: React.MouseEvent) => startDrag(e, session.conversationId)}
                                        onResizeStart={(e: React.MouseEvent) => startResize(e, session.conversationId)}
                                        timezone={config.timezone}
                                    />
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {isNewChatOpen && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in zoom-in-95 duration-200" onClick={(e) => e.target === e.currentTarget && setIsNewChatOpen(false)}>
                    <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border dark:border-gray-800 ring-1 ring-white/10">
                        <div className="p-8">
                            <h2 className="text-2xl font-black dark:text-white mb-2 tracking-tight">{t('new_chat_modal.title')}</h2>
                            <p className="text-sm text-gray-500 mb-8 font-medium">{t('new_chat_modal.description')}</p>

                            <div className="space-y-6">
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">{t('new_chat_modal.phone_label')}</label>
                                    <input
                                        type="text"
                                        value={newChatPhone}
                                        onChange={(e) => setNewChatPhone(e.target.value)}
                                        className="w-full p-4 bg-gray-50 dark:bg-gray-950 rounded-2xl border-2 border-transparent focus:border-indigo-500 focus:outline-none font-mono text-lg dark:text-white transition-all shadow-inner"
                                        placeholder="+1234567890"
                                        autoFocus
                                        onKeyDown={(e) => e.key === 'Enter' && submitNewChat()}
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">{t('new_chat_modal.name_label')}</label>
                                    <input
                                        type="text"
                                        value={newChatName}
                                        onChange={(e) => setNewChatName(e.target.value)}
                                        className="w-full p-4 bg-gray-50 dark:bg-gray-950 rounded-2xl border-2 border-transparent focus:border-indigo-500 focus:outline-none dark:text-white transition-all shadow-inner"
                                        placeholder="John Doe"
                                        onKeyDown={(e) => e.key === 'Enter' && submitNewChat()}
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="p-6 bg-gray-50 dark:bg-gray-950/50 flex justify-end gap-4 border-t dark:border-gray-800/50">
                            <button
                                onClick={() => setIsNewChatOpen(false)}
                                className="px-6 py-3 text-sm font-bold text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-2xl transition-colors"
                            >
                                {t('new_chat_modal.cancel')}
                            </button>
                            <button
                                onClick={submitNewChat}
                                disabled={!newChatPhone.trim()}
                                className="px-8 py-3 text-sm font-black text-white bg-indigo-600 hover:bg-indigo-700 rounded-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 active:scale-95 transform"
                            >
                                {t('new_chat_modal.start')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <InfoPanel
                clientName={activeClientName}
                clientPhone={activeClientPhone}
                currentAction={activeSession ? (() => {
                    const pendingMsg = activeSession.messages.find(m => m.status === 'pending');
                    return pendingMsg ? {
                        intent: pendingMsg.metadata?.intent || "Unknown",
                        reasoning: pendingMsg.metadata?.reasoning || "No reasoning provided.",
                        confidence: pendingMsg.confidence || 0
                    } : null;
                })() : null}
            />
        </div >
    );
}
