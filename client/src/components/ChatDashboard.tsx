import { useState, useEffect, useRef } from "react";
import { Send, Phone, MoreVertical, Moon, Sun, Trash2, Copy, Edit2, ShieldAlert } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Menu, Item, Separator, useContextMenu } from 'react-contexify';
import type { ItemParams } from 'react-contexify';
import 'react-contexify/dist/ReactContexify.css';

const MESSAGE_MENU_ID = "message-menu";
import Sidebar from "./Sidebar";
import InfoPanel from "./InfoPanel";
import SimulateWebhookModal from "./SimulateWebhookModal";

interface ChatDashboardProps {
    onNavigate?: (view: "chat" | "admin") => void;
}

export default function ChatDashboard({ onNavigate }: ChatDashboardProps) {
    const { t } = useTranslation();
    const [messages, setMessages] = useState<{ id: number; role: string; sender: string; text: string; phone?: string; timestamp?: string; status?: string; is_ai_generated?: boolean; confidence?: number; metadata?: any }[]>([]);
    const [activeConversationId, setActiveConversationId] = useState<number | null>(null);
    const [activeClientName, setActiveClientName] = useState<string>(t('chat.select_client'));
    const [activeClientPhone, setActiveClientPhone] = useState<string>("");
    const [isDarkMode, setIsDarkMode] = useState(() => {
        if (typeof window !== "undefined") {
            return localStorage.getItem("theme") === "dark" ||
                (!localStorage.getItem("theme") && window.matchMedia("(prefers-color-scheme: dark)").matches);
        }
        return false;
    });
    const [isThinking, setIsThinking] = useState(false);
    const [isSimulateModalOpen, setIsSimulateModalOpen] = useState(false);
    const [input, setInput] = useState("");
    const [securityAlert, setSecurityAlert] = useState<{ show: boolean; message: string; reason: string } | null>(null);
    const ws = useRef<WebSocket | null>(null);
    const activePhoneRef = useRef<string>("");

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

    useEffect(() => {
        const socket = new WebSocket("ws://localhost:8000/ws/chat");
        ws.current = socket;

        socket.onmessage = (event) => {
            const data = JSON.parse(event.data);

            // --- SECURITY SENTINEL ---
            if (data.event === 'security_alert') {
                setSecurityAlert({ show: true, message: data.message, reason: data.reason });
                setTimeout(() => setSecurityAlert(null), 8000);
                return;
            }

            if (activePhoneRef.current && data.phone === activePhoneRef.current) {
                if (data.sender === "agent") setIsThinking(false);

                setMessages((prev) => {
                    const exists = prev.find(m => m.id === data.id);
                    if (exists) {
                        return prev.map(m => m.id === data.id ? {
                            ...m,
                            status: data.status,
                            text: data.content,
                            confidence: data.confidence,
                            metadata: data.metadata
                        } : m);
                    }
                    return [...prev, {
                        id: data.id,
                        role: data.sender,
                        sender: data.sender === "user" ? t('chat.client') : t('chat.ai_agent'),
                        text: data.content,
                        phone: data.phone,
                        timestamp: data.timestamp,
                        status: data.status,
                        is_ai_generated: data.is_ai_generated,
                        confidence: data.confidence,
                        metadata: data.metadata
                    }];
                });
            }
        };

        return () => socket.close();
    }, []);

    useEffect(() => {
        if (activeConversationId) {
            fetchMessages(activeConversationId);
            setIsThinking(false);
        }
    }, [activeConversationId]);

    async function fetchMessages(convId: number) {
        const res = await fetch(`http://localhost:8000/conversations/${convId}/messages`);
        if (res.ok) {
            const data = await res.json();
            setMessages(data.map((d: any) => ({
                id: d.id,
                role: d.sender,
                sender: d.sender === "user" ? t('chat.client') : t('chat.ai_agent'),
                text: d.content,
                phone: "",
                timestamp: d.timestamp,
                status: d.status,
                is_ai_generated: d.is_ai_generated,
                confidence: d.confidence,
                metadata: typeof d.metadata_json === 'string' ? JSON.parse(d.metadata_json || '{}') : (d.metadata_json || {})
            })));
        }
    }

    function handleSelectConversation(id: number, name: string, phone: string) {
        setActiveConversationId(id);
        setActiveClientName(name);
        setActiveClientPhone(phone);
    }

    async function handleSimulateIncoming(phone: string, message: string) {
        if (phone === activeClientPhone) setIsThinking(true);
        await fetch("http://localhost:8000/whatsapp/webhook", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sender: phone, message: message }),
        });
    }

    async function sendMessage() {
        if (!input.trim() || !activeClientPhone) return;
        const currentInput = input;
        setInput("");
        await fetch("http://localhost:8000/whatsapp/webhook", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sender: activeClientPhone, message: currentInput }),
        });
    }

    async function approveMessage(id: number) {
        setMessages(prev => prev.map(m => m.id === id ? { ...m, status: 'sent' } : m));
        await fetch(`http://localhost:8000/conversations/messages/${id}/approve`, { method: "POST" });
    }

    async function rejectMessage(id: number) {
        if (!confirm(t('chat.alerts.confirm_reject'))) return;
        setMessages(prev => prev.filter(m => m.id !== id));
        await fetch(`http://localhost:8000/conversations/messages/${id}/reject`, { method: "POST" });
    }

    async function deleteMessage(id: number) {
        if (!confirm(t('chat.alerts.confirm_delete'))) return;
        setMessages(prev => prev.filter(m => m.id !== id));
        await fetch(`http://localhost:8000/conversations/messages/${id}/reject`, { method: "POST" });
    }

    async function editMessage(id: number, currentText: string) {
        const newText = prompt(t('chat.alerts.edit_prompt'), currentText);
        if (newText !== null && newText !== currentText) {
            await fetch(`http://localhost:8000/conversations/messages/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ content: newText })
            });
            setMessages(prev => prev.map(m => m.id === id ? { ...m, text: newText } : m));
        }
    }

    const { show } = useContextMenu({ id: MESSAGE_MENU_ID });

    function handleContextMenu(event: React.MouseEvent, messageId: number, text: string) {
        show({ event, props: { messageId, text } });
    }

    const handleItemClick = ({ id, props }: ItemParams) => {
        if (id === "copy") navigator.clipboard.writeText(props.text);
        if (id === "delete") deleteMessage(props.messageId);
        if (id === "edit") editMessage(props.messageId, props.text);
    };

    return (
        <div className="flex h-full w-full bg-white dark:bg-gray-900 transition-colors duration-200 overflow-hidden">
            {/* Security Alert Overlay */}
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
                activeConversationId={activeConversationId}
                onNewMessage={() => setIsSimulateModalOpen(true)}
                onNavigate={onNavigate}
            />

            <SimulateWebhookModal
                isOpen={isSimulateModalOpen}
                onClose={() => setIsSimulateModalOpen(false)}
                onSimulate={handleSimulateIncoming}
            />

            <div className="flex-1 flex flex-col bg-slate-50 dark:bg-gray-950/50 relative">
                <div className="h-16 bg-white dark:bg-gray-800 border-b dark:border-gray-700 flex items-center justify-between px-6">
                    <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${activeConversationId ? "bg-green-500" : "bg-gray-300"}`}></div>
                        <span className="font-bold text-gray-800 dark:text-gray-100">{activeClientName}</span>
                    </div>
                    <div className="flex gap-4 text-gray-400">
                        <button onClick={() => setIsDarkMode(!isDarkMode)} className="hover:text-gray-600 dark:hover:text-gray-200 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
                            {isDarkMode ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5" />}
                        </button>
                        <Phone className="w-5 h-5 hover:text-gray-600 cursor-pointer" />
                        <MoreVertical className="w-5 h-5 hover:text-gray-600 cursor-pointer" />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {!activeConversationId && (
                        <div className="h-full flex flex-col items-center justify-center text-gray-400 gap-2">
                            <p className="italic">{t('chat.select_client_to_view')}</p>
                        </div>
                    )}

                    {messages.map((m, i) => (
                        <div key={i} className={`flex ${m.role === "agent" ? "justify-end" : "justify-start"}`}>
                            <div className={`p-4 rounded-3xl max-w-md shadow-sm relative group ${m.status === 'pending'
                                    ? "bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-400 rounded-br-none"
                                    : m.role === "agent"
                                        ? "bg-blue-600/10 dark:bg-blue-500/20 text-blue-800 dark:text-blue-100 rounded-br-none border border-blue-200 dark:border-blue-800"
                                        : "bg-white dark:bg-gray-800 dark:text-gray-100 border dark:border-gray-700 rounded-bl-none"
                                }`}
                                onContextMenu={(e) => handleContextMenu(e, m.id, m.text)}
                            >
                                <div className="flex justify-between items-center mb-1 gap-4">
                                    <span className={`text-[10px] font-black uppercase tracking-widest opacity-50 ${m.role === "agent" ? "text-blue-600" : "text-gray-400"}`}>
                                        {m.role === "agent" ? t('chat.ai_agent') : t('chat.client')}
                                    </span>
                                    {m.metadata?.intent === "Violation" && (
                                        <span className="bg-red-600 text-white text-[8px] px-1.5 py-0.5 rounded-full font-black animate-pulse">
                                            MONOLITHIC BLOCK
                                        </span>
                                    )}
                                </div>

                                {m.status === 'pending' && (
                                    <div className="mb-2 text-xs font-bold text-amber-600 dark:text-amber-400 flex justify-between items-center bg-amber-100/50 dark:bg-amber-900/30 px-2 py-1 rounded-lg">
                                        <span>{t('chat.ai_suggestion')}</span>
                                        <span className="text-[10px] opacity-70 uppercase tracking-tighter">Review required</span>
                                    </div>
                                )}

                                <p className="leading-relaxed text-sm whitespace-pre-wrap font-medium">{m.text}</p>

                                {m.status === 'pending' && (
                                    <div className="mt-3 flex gap-2 border-t border-amber-200 dark:border-amber-800 pt-2">
                                        <button onClick={() => approveMessage(m.id)} className="flex-1 bg-green-600 hover:bg-green-700 text-white text-xs py-1.5 rounded-xl transition-all font-bold">Approve</button>
                                        <button onClick={() => editMessage(m.id, m.text)} className="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 text-xs py-1.5 rounded-xl font-bold">Edit</button>
                                        <button onClick={() => rejectMessage(m.id)} className="flex-1 bg-red-100 dark:bg-red-900/30 text-red-600 text-xs py-1.5 rounded-xl font-bold">Reject</button>
                                    </div>
                                )}

                                <div className={`text-[9px] mt-2 opacity-60 flex items-center gap-1 font-mono ${m.role === "agent" ? "justify-end" : "justify-start"}`}>
                                    {m.timestamp ? new Date(m.timestamp).toLocaleTimeString('es-CR', { hour: '2-digit', minute: '2-digit' }) : "Just now"}
                                    {m.status === 'pending' && <span className="animate-spin text-amber-500">⏳</span>}
                                    {m.metadata?.domain && <span className="ml-2 px-1 bg-gray-100 dark:bg-gray-950 rounded uppercase font-black text-[7px]">{m.metadata.domain}</span>}
                                </div>
                            </div>
                        </div>
                    ))}

                    {isThinking && (
                        <div className="flex justify-start">
                            <div className="p-4 rounded-3xl rounded-bl-none bg-white dark:bg-gray-800 border dark:border-gray-700 flex items-center gap-2 shadow-sm">
                                <span className="flex gap-1.5">
                                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce"></span>
                                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                                </span>
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{t('chat.thinking')}</span>
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-4 bg-white dark:bg-gray-800 border-t dark:border-gray-700">
                    <div className="flex gap-2 p-1 bg-gray-50 dark:bg-gray-900 rounded-2xl border dark:border-gray-700">
                        <input
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                            placeholder={activeConversationId ? t('chat.type_to_simulate') : t('chat.select_first')}
                            disabled={!activeConversationId}
                            className="flex-1 bg-transparent dark:text-white border-0 px-4 py-2 focus:ring-0 outline-none text-sm disabled:opacity-50"
                        />
                        <button onClick={sendMessage} disabled={!activeConversationId} className="bg-blue-600 text-white p-2.5 rounded-xl transition-all shadow-lg shadow-blue-500/10 disabled:opacity-50">
                            <Send className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>

            <InfoPanel
                clientName={activeClientName}
                clientPhone={activeClientPhone}
                currentAction={(() => {
                    const pendingMsg = messages.find(m => m.status === 'pending');
                    return pendingMsg ? {
                        intent: pendingMsg.metadata?.intent || "Unknown",
                        reasoning: pendingMsg.metadata?.reasoning || "No reasoning provided.",
                        confidence: pendingMsg.confidence || 0
                    } : null;
                })()}
            />

            <Menu id={MESSAGE_MENU_ID} className="dark:bg-gray-900 dark:border-gray-800 shadow-2xl rounded-xl">
                <Item id="copy" onClick={handleItemClick} className="text-xs font-bold dark:text-gray-300">
                    <Copy className="w-4 h-4 mr-2 text-indigo-500" /> {t('common.copy_text')}
                </Item>
                <Item id="edit" onClick={handleItemClick} className="text-xs font-bold dark:text-gray-300">
                    <Edit2 className="w-4 h-4 mr-2 text-blue-500" /> {t('common.edit_message')}
                </Item>
                <Separator />
                <Item id="delete" onClick={handleItemClick} className="text-xs font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10">
                    <Trash2 className="w-4 h-4 mr-2" /> {t('common.delete_message')}
                </Item>
            </Menu>
        </div>
    );
}
