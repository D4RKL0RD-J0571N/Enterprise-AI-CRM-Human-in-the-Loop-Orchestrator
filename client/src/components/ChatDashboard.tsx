import { useState, useEffect, useRef, useCallback } from "react";
import { ShieldAlert, Sun, Moon, Layout, Grid2X2, LayoutGrid, Monitor } from "lucide-react";
import { useTranslation } from "react-i18next";
import Sidebar from "./Sidebar";
import InfoPanel from "./InfoPanel";
import ChatWindow from "./ChatWindow";
import SimulateWebhookModal from "./SimulateWebhookModal";

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
}

export default function ChatDashboard({ onNavigate }: ChatDashboardProps) {
    const { t } = useTranslation();
    const [sessions, setSessions] = useState<ChatSession[]>([]);

    const [conversations, setConversations] = useState<any[]>([]);
    const lastSyncRef = useRef<{ [key: number]: string }>({});
    const hydrationLock = useRef(new Set<number>());
    const [activeConversationId, setActiveConversationId] = useState<number | null>(null);
    const activeSession = sessions.find(s => s.conversationId === activeConversationId) || null;

    const activeClientName = activeSession?.clientName || t('chat.select_client');
    const activeClientPhone = activeSession?.clientPhone || "";

    const [isDarkMode, setIsDarkMode] = useState(() => {
        if (typeof window !== "undefined") {
            return localStorage.getItem("theme") === "dark" ||
                (!localStorage.getItem("theme") && window.matchMedia("(prefers-color-scheme: dark)").matches);
        }
        return false;
    });

    const [isSimulateModalOpen, setIsSimulateModalOpen] = useState(false);
    const [securityAlert, setSecurityAlert] = useState<{ show: boolean; message: string; reason: string } | null>(null);
    const ws = useRef<WebSocket | null>(null);
    const activePhoneRef = useRef<string>("");

    const [layoutMode, setLayoutMode] = useState<"focus" | "canvas">("canvas");
    const maxZIndex = useRef(100);
    const canvasRef = useRef<HTMLDivElement>(null);
    const [draggingId, setDraggingId] = useState<number | null>(null);
    const [resizingId, setResizingId] = useState<number | null>(null);
    const dragOffset = useRef({ x: 0, y: 0 });

    // PERSISTENCE: Save Workspace Config
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
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ config: JSON.stringify(workspaceConfig) })
                });
            } catch (e) {
                console.error("Failed to save workspace", e);
            }
        }, 2000);
        return () => clearTimeout(saveConfig);
    }, [sessions, layoutMode, activeConversationId]);

    // RESTORE: Load Workspace Config
    useEffect(() => {
        const checkIntegrity = async () => {
            try {
                const res = await fetch("http://localhost:8000/conversations/");
                if (res.ok) {
                    const validConvs = await res.json();
                    const validIds = new Set(validConvs.map((c: any) => c.id));
                    setSessions(prev => {
                        // GRACE PERIOD: Don't eject sessions that are less than 15 seconds old
                        const now = Date.now();
                        const filtered = prev.filter(s => {
                            const isOld = (s as any)._createdAt ? (now - (s as any)._createdAt > 15000) : false;
                            return !isOld || validIds.has(s.conversationId);
                        });
                        if (filtered.length !== prev.length) return filtered;
                        return prev;
                    });
                }
            } catch (e) {
                console.error("Integrity check failed", e);
            }
        };

        fetch("http://localhost:8000/admin/config")
            .then(res => res.json())
            .then(data => {
                if (data.workspace_config) {
                    try {
                        const conf = JSON.parse(data.workspace_config);
                        if (conf.layout_mode) setLayoutMode(conf.layout_mode);
                        if (conf.active_conversation_id) setActiveConversationId(conf.active_conversation_id);
                    } catch (e) { }
                }
                checkIntegrity();
            });

        const integrityInterval = setInterval(checkIntegrity, 5000);
        return () => clearInterval(integrityInterval);
    }, []);

    useEffect(() => {
        activePhoneRef.current = activeClientPhone;
    }, [activeClientPhone]);

    useEffect(() => {
        if (isDarkMode) {
            document.documentElement.classList.add("dark");
            localStorage.setItem("theme", "dark");
        } else {
            document.documentElement.classList.remove("dark");
            localStorage.setItem("theme", "light");
        }
    }, [isDarkMode]);

    const tRef = useRef(t);
    useEffect(() => { tRef.current = t; }, [t]);

    useEffect(() => {
        let socket: WebSocket | null = new WebSocket("ws://localhost:8000/ws/chat");
        ws.current = socket;

        socket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.event === 'security_alert') {
                setSecurityAlert({ show: true, message: data.message, reason: data.reason });
                setTimeout(() => setSecurityAlert(null), 8000);
                return;
            }

            setSessions(prev => prev.map(session => {
                if (session.clientPhone === data.phone) {
                    const isFromClient = data.sender === "user";
                    const isAI = data.is_ai_generated;

                    const formatted = {
                        id: data.id,
                        role: isFromClient ? "client" : "user",
                        sender: isFromClient
                            ? tRef.current('chat.client_label')
                            : (isAI ? `🤖 ${tRef.current('chat.ai_label')}` : `👤 ${tRef.current('chat.you')}`),
                        is_ai: isAI,
                        text: data.content,
                        phone: data.phone,
                        timestamp: data.timestamp,
                        status: data.status || 'sent',
                        metadata: typeof data.metadata === 'string' ? JSON.parse(data.metadata || '{}') : (data.metadata || {})
                    };

                    // Optimistic resolution: remove pending/sending if real one arrives
                    const existsIdx = session.messages.findIndex(m => m.id === data.id || (m.status === 'sending' && m.text === data.content));
                    let newMessages = [...session.messages];

                    if (existsIdx !== -1) {
                        newMessages[existsIdx] = formatted;
                    } else {
                        newMessages.push(formatted);
                    }

                    return {
                        ...session,
                        messages: newMessages.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()),
                        isThinking: isFromClient
                    };
                }
                return session;
            }));

            if (data.sender !== 'agent') {
                triggerNotification();
            }
        };

        socket.onerror = (err) => {
            console.warn("WebSocket Tool Error:", err);
        };

        return () => {
            if (socket) {
                // Ensure no more callbacks trigger
                socket.onmessage = null;
                socket.onopen = null;
                socket.onerror = null;
                socket.onclose = null;
                // Graceful close: if connecting, handle establish then close
                if (socket.readyState === WebSocket.CONNECTING) {
                    socket.onopen = () => { socket?.close(); };
                } else if (socket.readyState === WebSocket.OPEN) {
                    socket.close();
                }
                socket = null;
            }
        };
    }, []);

    const triggerNotification = () => {
        const originalTitle = document.title;
        let count = 0;
        const interval = setInterval(() => {
            document.title = count % 2 === 0 ? "🔔 (1) New Message!" : originalTitle;
            count++;
            if (count > 5) {
                clearInterval(interval);
                document.title = originalTitle;
            }
        }, 1000);

        // Removed Pixabay audio to fix 403 errors.
    };

    // LIVE SYNC POLLING: Run every 4s, but don't re-create interval on every session change
    const sessionsRef = useRef(sessions);
    useEffect(() => { sessionsRef.current = sessions; }, [sessions]);

    useEffect(() => {
        const syncList = async () => {
            try {
                const res = await fetch("http://localhost:8000/conversations/");
                if (res.ok) {
                    const list = await res.json();
                    setConversations(list);

                    // Check for updates in active sessions
                    list.forEach((c: any) => {
                        const prevTime = lastSyncRef.current[c.id];
                        if (prevTime && prevTime !== c.last_message_time) {
                            // Message arrived! Refresh windows if open
                            const sessionOpen = sessionsRef.current.find(s => Number(s.conversationId) === Number(c.id));
                            if (sessionOpen) {
                                console.log("LIVE: Message update detected for", c.id);
                                fetchMessages(c.id);
                            }
                            triggerNotification();
                        }
                        lastSyncRef.current[c.id] = c.last_message_time;
                    });
                }
            } catch (e) { }
        };

        const interval = setInterval(syncList, 4000);
        return () => clearInterval(interval);
    }, []);

    async function fetchMessages(convId: number) {
        const id = Number(convId);
        // INTERNAL GUARD: Don't fetch if currently fetching or already hydrated recently
        if (hydrationLock.current.has(id)) return;

        hydrationLock.current.add(id);
        console.log("FETCH: Hydrating session", id);
        try {
            const res = await fetch(`http://localhost:8000/conversations/${convId}/messages?v=${Date.now()}`, {
                headers: { 'Cache-Control': 'no-cache' }
            });
            if (res.ok) {
                const data = await res.json();
                const formatted = data.map((d: any) => {
                    const isClient = d.sender === 'user'; // Viene de WhatsApp (Externo)
                    return {
                        id: d.id,
                        role: isClient ? 'client' : 'user', // user = operador/IA en la derecha
                        sender: isClient ? t('chat.client_label') : (d.is_ai_generated ? `🤖 ${t('chat.ai_label')}` : `👤 ${t('chat.you')}`),
                        is_ai: d.is_ai_generated,
                        text: d.content,
                        phone: d.phone || "",
                        timestamp: d.timestamp,
                        status: d.status || 'sent',
                        confidence: d.confidence,
                        metadata: typeof d.metadata_json === 'string'
                            ? JSON.parse(d.metadata_json || '{}')
                            : (d.metadata_json || {})
                    };
                });

                console.log(`FETCH: Found ${formatted.length} messages for session ${convId}`);
                setSessions(prev => {
                    const exists = prev.find(s => Number(s.conversationId) === Number(id));
                    if (!exists) {
                        hydrationLock.current.delete(id); // Release lock so it can try again later if it disappeared
                        return prev;
                    }
                    return prev.map(s =>
                        Number(s.conversationId) === Number(id)
                            ? { ...s, messages: formatted, isLoading: false }
                            : s
                    );
                });
            } else {
                setSessions(prev => prev.map(s => Number(s.conversationId) === Number(id) ? { ...s, isLoading: false } : s));
                hydrationLock.current.delete(id); // Release on failure
            }
        } catch (e) {
            console.error("FETCH: Failed for", id, e);
            setSessions(prev => prev.map(s => Number(s.conversationId) === Number(id) ? { ...s, isLoading: false } : s));
            hydrationLock.current.delete(id);
        } finally {
            // Lock release is handled inside setSessions/catch to ensure we don't block forever on transient errors
        }
    }

    useEffect(() => {
        sessions.forEach(session => {
            const id = Number(session.conversationId);
            // ONLY trigger hydration if not already locked AND missing messages AND marked for load
            if (!hydrationLock.current.has(id) && session.messages.length === 0 && session.isLoading === true) {
                console.log(`FETCH: Lock & Trigger hydration for session ${id}`);
                fetchMessages(id);
            }
        });
    }, [sessions]);

    function handleSelectConversation(id: number, name: string, phone: string) {
        const convId = Number(id);
        const existingIdx = sessions.findIndex(s => Number(s.conversationId) === convId);

        if (existingIdx !== -1) {
            setActiveConversationId(convId);
            // Bring to front
            maxZIndex.current += 1;
            setSessions(prev => prev.map(s => s.conversationId === convId ? { ...s, layout: { ...s.layout!, zIndex: maxZIndex.current } } : s));
        } else {
            console.log("SESSION: Creating new canvas window for", convId);
            maxZIndex.current += 1;
            const newSession: ChatSession = {
                conversationId: convId,
                clientName: name,
                clientPhone: phone,
                messages: [],
                isThinking: false,
                isLoading: true,
                _createdAt: Date.now(),
                layout: {
                    x: 50 + (sessions.length * 30),
                    y: 50 + (sessions.length * 30),
                    width: 450,
                    height: 650,
                    zIndex: maxZIndex.current
                }
            } as any;

            setSessions(prev => [...prev, newSession]);
            setActiveConversationId(convId);
        }
    }

    const startDrag = (e: React.MouseEvent, id: number) => {
        if (layoutMode !== "canvas") return;
        setDraggingId(id);
        const session = sessions.find(s => s.conversationId === id);
        if (session?.layout) {
            dragOffset.current = {
                x: e.clientX - session.layout.x,
                y: e.clientY - session.layout.y
            };
            maxZIndex.current += 1;
            setSessions(prev => prev.map(s => s.conversationId === id ? { ...s, layout: { ...s.layout!, zIndex: maxZIndex.current } } : s));
        }
    };

    const startResize = (e: React.MouseEvent, id: number) => {
        e.stopPropagation();
        setResizingId(id);
        maxZIndex.current += 1;
        setSessions(prev => prev.map(s => s.conversationId === id ? { ...s, layout: { ...s.layout!, zIndex: maxZIndex.current } } : s));
    };

    useEffect(() => {
        const handleGlobalMove = (e: MouseEvent) => {
            if (draggingId !== null) {
                setSessions(prev => prev.map(s => s.conversationId === draggingId ? {
                    ...s,
                    layout: { ...s.layout!, x: e.clientX - dragOffset.current.x, y: e.clientY - dragOffset.current.y }
                } : s));
            } else if (resizingId !== null) {
                setSessions(prev => prev.map(s => s.conversationId === resizingId ? {
                    ...s,
                    layout: {
                        ...s.layout!,
                        width: Math.max(300, e.clientX - s.layout!.x),
                        height: Math.max(400, e.clientY - s.layout!.y)
                    }
                } : s));
            }
        };

        const handleGlobalUp = () => {
            setDraggingId(null);
            setResizingId(null);
        };

        if (draggingId !== null || resizingId !== null) {
            window.addEventListener("mousemove", handleGlobalMove);
            window.addEventListener("mouseup", handleGlobalUp);
        }
        return () => {
            window.removeEventListener("mousemove", handleGlobalMove);
            window.removeEventListener("mouseup", handleGlobalUp);
        };
    }, [draggingId, resizingId]);

    async function handleSimulateIncoming(phone: string, message: string) {
        if (phone === activeClientPhone) {
            setSessions(prev => prev.map(s => s.conversationId === activeConversationId ? { ...s, isThinking: true } : s));
        }
        await fetch("http://localhost:8000/whatsapp/webhook", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sender: phone, message: message }),
        });
    }

    const updateSessionMessages = useCallback((convId: number, updateFn: (msgs: any[]) => any[]) => {
        setSessions(prev => prev.map(s => Number(s.conversationId) === Number(convId) ? { ...s, messages: updateFn(s.messages) } : s));
    }, []);

    const sendMessage = useCallback(async (text: string, session: ChatSession) => {
        if (!text.trim() || !session.conversationId) return;

        const tempId = Date.now();
        const optimisticMsg = {
            id: tempId,
            role: "user",
            sender: t('chat.you'),
            text: text,
            phone: session.clientPhone,
            timestamp: new Date().toISOString(),
            status: "sending",
            is_ai: false
        };

        updateSessionMessages(session.conversationId, msgs => [...msgs, optimisticMsg]);

        try {
            const res = await fetch(`http://localhost:8000/conversations/${session.conversationId}/messages`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ content: text }),
            });

            if (res.ok) {
                const data = await res.json();
                updateSessionMessages(session.conversationId, msgs => msgs.map(m => m.id === tempId ? { ...m, id: data.id, status: 'sent' } : m));
            } else {
                throw new Error("Failed to send");
            }
        } catch (e) {
            console.error("Send failed", e);
            updateSessionMessages(session.conversationId, msgs => msgs.map(m => m.id === tempId ? { ...m, status: 'error' } : m));
            alert("Failed to send message");
        }
    }, [t, updateSessionMessages]);

    const approveMessage = useCallback(async (id: number, session: ChatSession) => {
        updateSessionMessages(session.conversationId, msgs => msgs.map(m => m.id === id ? { ...m, status: 'sent' } : m));
        await fetch(`http://localhost:8000/conversations/messages/${id}/approve`, { method: "POST" });
    }, [updateSessionMessages]);

    const rejectMessage = useCallback(async (id: number, session: ChatSession) => {
        if (!confirm(t('chat.alerts.confirm_reject'))) return;
        updateSessionMessages(session.conversationId, msgs => msgs.filter(m => m.id !== id));
        fetch(`http://localhost:8000/conversations/messages/${id}/reject`, { method: "POST" });
    }, [t, updateSessionMessages]);

    const deleteMessage = useCallback(async (id: number, session: ChatSession) => {
        if (!confirm(t('chat.alerts.confirm_delete'))) return;
        updateSessionMessages(session.conversationId, msgs => msgs.filter(m => m.id !== id));
        fetch(`http://localhost:8000/conversations/messages/${id}/reject`, { method: "POST" });
    }, [t, updateSessionMessages]);

    const editMessage = useCallback(async (id: number, currentText: string, session: ChatSession) => {
        const newText = prompt(t('chat.alerts.edit_prompt'), currentText);
        if (newText !== null && newText !== currentText) {
            await fetch(`http://localhost:8000/conversations/messages/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ content: newText })
            });
            updateSessionMessages(session.conversationId, msgs => msgs.map(m => m.id === id ? { ...m, text: newText } : m));
        }
    }, [t, updateSessionMessages]);

    useEffect(() => {
        const handleGlobalUp = () => {
            setDraggingId(null);
            setResizingId(null);
        };

        if (draggingId !== null || resizingId !== null) {
            window.addEventListener("mouseup", handleGlobalUp);
        }
        return () => {
            window.removeEventListener("mouseup", handleGlobalUp);
        };
    }, [draggingId, resizingId]);

    return (
        <div className="flex h-full w-full bg-white dark:bg-gray-900 transition-colors duration-200 overflow-hidden">
            {securityAlert?.show && (
                <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[100] w-full max-w-lg px-4 animate-in fade-in slide-in-from-top-4">
                    <div className="bg-red-600 text-white p-4 rounded-3xl shadow-2xl flex items-center gap-4 border-2 border-red-400">
                        <div className="p-3 bg-red-700/50 rounded-2xl animate-pulse">
                            <ShieldAlert className="w-8 h-8" />
                        </div>
                        <div className="flex-1">
                            <h3 className="font-black text-xs uppercase tracking-widest bg-red-800/50 w-fit px-2 py-0.5 rounded mb-1">Sentinel Violation</h3>
                            <p className="text-sm font-bold leading-tight">{securityAlert.message}</p>
                            <p className="text-[10px] opacity-70 mt-1 italic">{securityAlert.reason}</p>
                        </div>
                        <button onClick={() => setSecurityAlert(null)} className="p-2 hover:bg-red-700 rounded-full transition-colors font-black">✕</button>
                    </div>
                </div>
            )}

            <Sidebar
                onSelect={handleSelectConversation}
                onPrefetch={(id) => {
                    const exists = sessions.find(s => s.conversationId === id);
                    if (!exists) fetchMessages(id);
                }}
                activeConversationId={activeConversationId}
                onNewMessage={() => setIsSimulateModalOpen(true)}
                onNavigate={onNavigate}
                conversations={conversations}
            />

            <SimulateWebhookModal
                isOpen={isSimulateModalOpen}
                onClose={() => setIsSimulateModalOpen(false)}
                onSimulate={handleSimulateIncoming}
            />

            <div className="flex-1 flex flex-col relative w-full h-full overflow-hidden">
                <div className="h-14 bg-white dark:bg-gray-800 border-b dark:border-gray-700 flex items-center justify-end px-6 gap-4 sticky top-0 z-[60] shadow-sm transition-colors">
                    <div className="flex gap-2 p-1 bg-gray-100 dark:bg-gray-900 rounded-2xl border dark:border-gray-700">
                        <button
                            onClick={() => setLayoutMode("focus")}
                            className={`p-2 rounded-xl transition-all ${layoutMode === "focus" ? "bg-white dark:bg-gray-800 shadow-md text-blue-500 scale-105" : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"}`}
                            title="Focus Mode"
                        >
                            <Monitor className="w-5 h-5" />
                        </button>
                        <button
                            onClick={() => setLayoutMode("canvas")}
                            className={`p-2 rounded-xl transition-all ${layoutMode === "canvas" ? "bg-white dark:bg-gray-800 shadow-md text-blue-500 scale-105" : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"}`}
                            title="Whiteboard Canvas"
                        >
                            <LayoutGrid className="w-5 h-5" />
                        </button>
                        <div className="w-[1px] bg-gray-300 dark:bg-gray-700 mx-1"></div>
                        <button
                            onClick={() => setIsDarkMode(!isDarkMode)}
                            className="p-2 hover:bg-white dark:hover:bg-gray-800 rounded-xl transition-all text-gray-500 hover:text-amber-500 dark:hover:text-blue-400"
                        >
                            {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-auto relative bg-gray-50 dark:bg-gray-950 p-6 custom-scrollbar" ref={canvasRef}>
                    {/* Whiteboard Grid Background */}
                    <div className="absolute inset-0 opacity-[0.03] pointer-events-none dark:opacity-[0.05]"
                        style={{ backgroundImage: `radial-gradient(circle, currentColor 1px, transparent 1px)`, backgroundSize: '40px 40px' }}></div>

                    {layoutMode === "focus" ? (
                        <div className="h-full w-full animate-in fade-in duration-500">
                            {activeSession ? (
                                <div className="w-full h-full p-0">
                                    <ChatWindow
                                        {...activeSession}
                                        onSendMessage={(txt) => sendMessage(txt, activeSession)}
                                        onApprove={(id) => approveMessage(id, activeSession)}
                                        onReject={(id) => rejectMessage(id, activeSession)}
                                        onEdit={(id, txt) => editMessage(id, txt, activeSession)}
                                        onDelete={(id) => deleteMessage(id, activeSession)}
                                        onMaximize={() => setLayoutMode("canvas")}
                                        onClose={() => {
                                            setSessions(prev => prev.filter(s => s.conversationId !== activeSession.conversationId));
                                            setActiveConversationId(null);
                                        }}
                                        isMaximized={true}
                                    />
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full opacity-30 select-none">
                                    <Layout className="w-20 h-20 mb-6" />
                                    <h2 className="text-2xl font-black uppercase tracking-[0.5em]">{t('chat.select_client')}</h2>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="min-w-[3000px] min-h-[3000px] relative">
                            {sessions.length === 0 && (
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center opacity-20 select-none">
                                    <Grid2X2 className="w-32 h-32 mb-8" />
                                    <h2 className="text-4xl font-black uppercase tracking-[1em]">{t('chat.select_client')}</h2>
                                </div>
                            )}

                            {sessions.map((session) => (
                                <div
                                    key={session.conversationId}
                                    className={`absolute transition-shadow duration-200 ${draggingId === session.conversationId ? "shadow-2xl ring-2 ring-indigo-500/50" : "shadow-xl"}`}
                                    style={{
                                        left: session.layout?.x || 0,
                                        top: session.layout?.y || 0,
                                        width: session.layout?.width || 450,
                                        height: session.layout?.height || 650,
                                        zIndex: session.layout?.zIndex || 10,
                                        cursor: draggingId === session.conversationId ? 'grabbing' : 'default'
                                    }}
                                    onMouseDown={() => {
                                        if (activeConversationId !== session.conversationId) setActiveConversationId(session.conversationId);
                                    }}
                                >
                                    <ChatWindow
                                        {...session}
                                        onSendMessage={(txt) => sendMessage(txt, session)}
                                        onApprove={(id) => approveMessage(id, session)}
                                        onReject={(id) => rejectMessage(id, session)}
                                        onEdit={(id, txt) => editMessage(id, txt, session)}
                                        onDelete={(id) => deleteMessage(id, session)}
                                        onMaximize={() => {
                                            setActiveConversationId(session.conversationId);
                                            setLayoutMode("focus");
                                        }}
                                        onClose={() => {
                                            setSessions(prev => prev.filter(s => s.conversationId !== session.conversationId));
                                            if (activeConversationId === session.conversationId) setActiveConversationId(null);
                                        }}
                                        isMaximized={false}
                                        isLoading={session.isLoading}
                                        // Custom Props for Canvas
                                        canDrag={true}
                                        onDragStart={(e: any) => startDrag(e, session.conversationId)}
                                        onResizeStart={(e: any) => startResize(e, session.conversationId)}
                                    />
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

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
        </div>
    );
}
