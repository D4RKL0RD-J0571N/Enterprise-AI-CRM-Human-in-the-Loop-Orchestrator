import { useState } from "react";
import { X, Send } from "lucide-react";

interface SimulateWebhookModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSimulate: (phone: string, message: string) => Promise<void>;
}

export default function SimulateWebhookModal({ isOpen, onClose, onSimulate }: SimulateWebhookModalProps) {
    const [phone, setPhone] = useState("");
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!phone.trim() || !message.trim()) return;

        setLoading(true);
        await onSimulate(phone, message);
        setLoading(false);
        setPhone("");
        setMessage("");
        onClose();
    }

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 transition-all duration-200">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-96 shadow-2xl relative animate-in fade-in zoom-in duration-200 border dark:border-gray-700">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                    <X className="w-5 h-5" />
                </button>

                <h2 className="text-xl font-bold mb-4 dark:text-white">Simulate Incoming Message</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                    This mimics a webhook event from WhatsApp for a specific phone number.
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Client Name / Phone
                        </label>
                        <input
                            type="text"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="e.g. +1 555-9999"
                            className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            autoFocus
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Message
                        </label>
                        <textarea
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="e.g. I am interested in your services..."
                            className="w-full border rounded px-3 py-2 h-24 focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                    >
                        {loading ? "Sending..." : (
                            <>
                                <Send className="w-4 h-4" /> Send Simulation
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}
