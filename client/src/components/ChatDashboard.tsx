import { useState, useEffect, useRef } from "react";
import { Send, Phone, MoreVertical, Moon, Sun, Trash2, Copy, Edit2 } from "lucide-react";
import { Menu, Item, Separator, useContextMenu } from 'react-contexify';
import type { ItemParams } from 'react-contexify';
import 'react-contexify/dist/ReactContexify.css';

const MESSAGE_MENU_ID = "message-menu";
import Sidebar from "./Sidebar";
import InfoPanel from "./InfoPanel";
import SimulateWebhookModal from "./SimulateWebhookModal";

export default function ChatDashboard() {
    // State for messages
    const [messages, setMessages] = useState<{ id: number; sender: string; text: string; phone?: string; timestamp?: string; status?: string; is_ai_generated?: boolean; confidence?: number; metadata?: any }[]>([]);
    // State for currently selected conversation/client
    const [activeConversationId, setActiveConversationId] = useState<number | null>(null);
    const [activeClientName, setActiveClientName] = useState<string>("Select a client");
    const [activeClientPhone, setActiveClientPhone] = useState<string>("");

    // Dark Mode State
    const [isDarkMode, setIsDarkMode] = useState(() => {
        if (typeof window !== "undefined") {
            return localStorage.getItem("theme") === "dark" ||
                (!localStorage.getItem("theme") && window.matchMedia("(prefers-color-scheme: dark)").matches);
        }
        return false;
    });

    // State to track if AI is generating a response
    const [isThinking, setIsThinking] = useState(false);

    useEffect(() => {
        if (isDarkMode) {
            document.documentElement.classList.add("dark");
            localStorage.setItem("theme", "dark");
        } else {
            document.documentElement.classList.remove("dark");
            localStorage.setItem("theme", "light");
        }
    }, [isDarkMode]);

    // State for Simulation Modal
    const [isSimulateModalOpen, setIsSimulateModalOpen] = useState(false);

    const [input, setInput] = useState("");
    const ws = useRef<WebSocket | null>(null);

    // Ref to track active phone for the persistent websocket listener
    const activePhoneRef = useRef<string>("");

    useEffect(() => {
        activePhoneRef.current = activeClientPhone;
    }, [activeClientPhone]);

    useEffect(() => {
        // Connect to WebSocket on mount
        const socket = new WebSocket("ws://localhost:8000/ws/chat");
        ws.current = socket;

        socket.onopen = () => {
            console.log("Connected to WebSocket");
        };

        socket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            console.log("WebSocket Recv:", data);

            // Check if the message belongs to the currently open chat
            if (activePhoneRef.current && data.phone === activePhoneRef.current) {
                // If it's an AI message (pending or sent), we stop thinking
                if (data.sender === "agent") {
                    setIsThinking(false);
                }

                setMessages((prev) => {
                    // Check if message already exists (to handle updates)
                    const exists = prev.find(m => m.id === data.id);
                    if (exists) {
                        return prev.map(m => m.id === data.id ? { ...m, status: data.status, text: data.content, confidence: data.confidence, metadata: data.metadata } : m);
                    }
                    return [...prev, {
                        id: data.id,
                        sender: data.sender === "user" ? "Client" : "AI Agent",
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

        return () => {
            socket.close();
        };
    }, []);

    // Effect to load messages when a conversation is selected
    useEffect(() => {
        if (activeConversationId) {
            fetchMessages(activeConversationId);
            setIsThinking(false);
        }
    }, [activeConversationId]);

    async function fetchMessages(convId: number) {
        try {
            const res = await fetch(`http://localhost:8000/conversations/${convId}/messages`);
            if (res.ok) {
                const data = await res.json();
                // Transform to UI format
                const formatted = data.map((d: any) => ({
                    id: d.id,
                    sender: d.sender === "user" ? "Client" : "AI Agent",
                    text: d.content,
                    phone: "",
                    timestamp: d.timestamp,
                    status: d.status,
                    is_ai_generated: d.is_ai_generated,
                    confidence: d.confidence,
                    metadata: typeof d.metadata_json === 'string' ? JSON.parse(d.metadata_json || '{}') : (d.metadata_json || {})
                }));
                setMessages(formatted);
            }
        } catch (err) {
            console.error(err);
        }
    }

    function handleSelectConversation(id: number, name: string, phone: string) {
        setActiveConversationId(id);
        setActiveClientName(name);
        setActiveClientPhone(phone);
    }

    async function handleSimulateIncoming(phone: string, message: string) {
        if (phone === activeClientPhone) {
            setIsThinking(true);
        }
        try {
            await fetch("http://localhost:8000/whatsapp/webhook", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ sender: phone, message: message }),
            });
            // Simulation successful
        } catch (error) {
            console.error("Simulation failed", error);
            setIsThinking(false);
            alert("Simulation failed");
        }
    }

    async function sendMessage() {
        if (!input.trim()) return;

        // Enforce selection
        const targetSender = activeClientPhone;

        if (!targetSender) {
            alert("Please select a conversation first or use the '+' button to simulate a new client.");
            return;
        }

        const currentInput = input;
        setInput("");

        try {
            await fetch("http://localhost:8000/whatsapp/webhook", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                // Send as the client
                body: JSON.stringify({ sender: targetSender, message: currentInput }),
            });
        } catch (error) {
            console.error(error);
            alert("Error generating message");
        }
    }

    async function approveMessage(id: number) {
        // Optimistic State Update
        setMessages(prev => prev.map(m => m.id === id ? { ...m, status: 'sent' } : m));
        try {
            await fetch(`http://localhost:8000/conversations/messages/${id}/approve`, { method: "POST" });
        } catch (e) {
            console.error(e);
            // Revert on failure (optional)
        }
    }

    async function rejectMessage(id: number) {
        if (!confirm("Are you sure you want to reject (delete) this suggestion?")) return;
        try {
            // Optimistic update
            setMessages(prev => prev.filter(m => m.id !== id));
            await fetch(`http://localhost:8000/conversations/messages/${id}/reject`, { method: "POST" });
        } catch (e) {
            console.error(e);
        }
    }

    async function deleteMessage(id: number) {
        if (!confirm("Delete this message?")) return;
        setMessages(prev => prev.filter(m => m.id !== id));
        try {
            // We reuse reject as it deletes the message record
            await fetch(`http://localhost:8000/conversations/messages/${id}/reject`, { method: "POST" });
        } catch (e) {
            console.error(e);
        }
    }

    async function editMessage(id: number, currentText: string) {
        const newText = prompt("Edit response:", currentText);
        if (newText !== null && newText !== currentText) {
            try {
                await fetch(`http://localhost:8000/conversations/messages/${id}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ content: newText })
                });
                // Optimistic update (or wait for websocket)
                setMessages(prev => prev.map(m => m.id === id ? { ...m, text: newText } : m));
            } catch (e) {
                console.error(e);
            }
        }
    }

    const { show } = useContextMenu({
        id: MESSAGE_MENU_ID,
    });

    function handleContextMenu(event: React.MouseEvent, messageId: number, text: string) {
        show({
            event,
            props: {
                messageId,
                text
            }
        });
    }

    const handleItemClick = ({ id, props }: ItemParams) => {
        switch (id) {
            case "copy":
                navigator.clipboard.writeText(props.text);
                break;
            case "delete":
                deleteMessage(props.messageId);
                break;
            case "edit":
                editMessage(props.messageId, props.text);
                break;
        }
    };

    return (
        <div className="flex h-full w-full bg-white dark:bg-gray-900 transition-colors duration-200">
            {/* Left Panel: Conversation List */}
            <Sidebar
                onSelect={handleSelectConversation}
                activeConversationId={activeConversationId}
                onNewMessage={() => setIsSimulateModalOpen(true)}
            />

            <SimulateWebhookModal
                isOpen={isSimulateModalOpen}
                onClose={() => setIsSimulateModalOpen(false)}
                onSimulate={handleSimulateIncoming}
            />

            {/* Middle Panel: Chat Area */}
            <div className="flex-1 flex flex-col bg-slate-50 dark:bg-gray-950/50 relative transition-colors duration-200">
                {/* Chat Header */}
                <div className="h-16 bg-white dark:bg-gray-800 border-b dark:border-gray-700 flex items-center justify-between px-6 transition-colors duration-200">
                    <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${activeConversationId ? "bg-green-500" : "bg-gray-300"}`}></div>
                        <span className="font-bold text-gray-800 dark:text-gray-100">{activeClientName}</span>
                    </div>
                    <div className="flex gap-4 text-gray-400">
                        <button
                            onClick={() => {
                                console.log("Toggling theme. Current:", isDarkMode);
                                setIsDarkMode(!isDarkMode);
                            }}
                            className="hover:text-gray-600 dark:hover:text-gray-200 transition-colors p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                            title="Toggle Theme"
                        >
                            {isDarkMode ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5" />}
                        </button>
                        <Phone className="w-5 h-5 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer" />
                        <MoreVertical className="w-5 h-5 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer" />
                    </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {!activeConversationId && (
                        <div className="h-full flex flex-col items-center justify-center text-gray-400 gap-2">
                            <p className="italic">Select a client from the sidebar to view chat history.</p>
                        </div>
                    )}

                    {activeConversationId && messages.length === 0 && !isThinking && (
                        <div className="h-full flex flex-col items-center justify-center text-gray-400 gap-2">
                            <p className="italic">No messages in this history.</p>
                        </div>
                    )}

                    {messages.map((m, i) => (
                        <div key={i} className={`flex ${m.sender === "AI Agent" ? "justify-end" : "justify-start"}`}>
                            <div className={`p-4 rounded-2xl max-w-md shadow-sm relative group ${
                                // Review Queue Styling
                                m.status === 'pending'
                                    ? "bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-400 dark:border-amber-600 rounded-br-none text-gray-800 dark:text-gray-100"
                                    : m.sender === "AI Agent"
                                        ? "bg-blue-600 text-white rounded-br-none"
                                        : "bg-white dark:bg-gray-700 dark:text-gray-100 border dark:border-gray-600 text-gray-800 rounded-bl-none"
                                }`}
                                onContextMenu={(e) => handleContextMenu(e, m.id, m.text)}
                            >

                                {m.status === 'pending' && (
                                    <div className="mb-2 text-xs font-bold text-amber-600 dark:text-amber-400 flex justify-between items-center">
                                        <span>AI SUGGESTION (PENDING)</span>
                                        <span className="text-[10px] opacity-70">Review required</span>
                                    </div>
                                )}

                                <p className="leading-relaxed text-sm whitespace-pre-wrap">{m.text}</p>

                                {m.status === 'pending' && (
                                    <div className="mt-3 flex gap-2 border-t border-amber-200 dark:border-amber-800 pt-2">
                                        <button
                                            onClick={() => approveMessage(m.id)}
                                            className="flex-1 bg-green-600 hover:bg-green-700 text-white text-xs py-1.5 rounded transition-colors"
                                        >
                                            Approve
                                        </button>
                                        <button
                                            onClick={() => editMessage(m.id, m.text)}
                                            className="flex-1 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 text-xs py-1.5 rounded transition-colors"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => rejectMessage(m.id)}
                                            className="flex-1 bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 text-xs py-1.5 rounded transition-colors"
                                        >
                                            Reject
                                        </button>
                                    </div>
                                )}

                                <div className={`text-[10px] mt-2 opacity-60 flex items-center gap-1 ${m.sender === "AI Agent" ? "justify-end" : "justify-start"}`}>
                                    {m.timestamp ? new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Just now"}
                                    {m.status === 'pending' ? ' ⏳' : ''}
                                </div>

                                {/* Hover Actions */}
                                {m.status !== 'pending' && (
                                    <div className={`absolute top-2 ${m.sender === "AI Agent" ? "-left-10" : "-right-10"} opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-2`}>
                                        <button
                                            onClick={() => deleteMessage(m.id)}
                                            className="p-1.5 bg-gray-200 dark:bg-gray-700 rounded-full hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 text-gray-500 transition-colors shadow-sm"
                                            title="Delete"
                                        >
                                            <Trash2 className="w-3 h-3" />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}

                    {isThinking && (
                        <div className="flex justify-start animate-pulse">
                            <div className="p-4 rounded-xl rounded-bl-none bg-gray-100 dark:bg-gray-800 border dark:border-gray-700 flex items-center gap-2">
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-75"></div>
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-150"></div>
                                <span className="text-xs text-gray-400 ml-2">AI is thinking...</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Input Area */}
                <div className="p-4 bg-white dark:bg-gray-800 border-t dark:border-gray-700 transition-colors duration-200">
                    <div className="flex gap-2">
                        <input
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                            placeholder={activeConversationId ? "Type a message to simulate client..." : "⬅ Select a client first to start chatting"}
                            disabled={!activeConversationId}
                            className="flex-1 bg-gray-100 dark:bg-gray-900 dark:text-white border-0 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 focus:outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                        <button
                            onClick={sendMessage}
                            disabled={!activeConversationId}
                            className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-lg transition-colors flex items-center justify-center shadow-lg shadow-blue-200 dark:shadow-none disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Send className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Right Panel: Info & AI */}
            <InfoPanel
                clientName={activeClientName}
                clientPhone={activeClientPhone}
                currentAction={(() => {
                    const pendingMsg = messages.find(m => m.status === 'pending');
                    if (pendingMsg) {
                        return {
                            intent: pendingMsg.metadata?.intent || "Unknown",
                            reasoning: pendingMsg.metadata?.reasoning || "No reasoning provided.",
                            confidence: pendingMsg.confidence || 0
                        };
                    }
                    return null;
                })()}
            />


            <Menu id={MESSAGE_MENU_ID}>
                <Item id="copy" onClick={handleItemClick}>
                    <Copy className="w-4 h-4 mr-2" /> Copy Text
                </Item>
                <Item id="edit" onClick={handleItemClick}>
                    <Edit2 className="w-4 h-4 mr-2" /> Edit Message
                </Item>
                <Separator />
                <Item id="delete" onClick={handleItemClick} className="text-red-500">
                    <Trash2 className="w-4 h-4 mr-2" /> Delete
                </Item>
            </Menu>
        </div>
    );
}
