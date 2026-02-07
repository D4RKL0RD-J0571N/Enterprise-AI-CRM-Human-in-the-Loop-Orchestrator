import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { API_ENDPOINTS } from "../lib/api";
import type { Client } from "../types/admin";
import {
    Users,
    Search,
    MoreVertical,
    Phone,
    MessageSquare,
    Calendar,
    Filter,
    ArrowUpDown,
    ShoppingCart,
    Trash2
} from "lucide-react";

import { useTranslation } from "react-i18next";

export default function ClientsPage() {
    const { t } = useTranslation();
    const { token, isAdmin } = useAuth();
    const [clients, setClients] = useState<Client[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [openMenuId, setOpenMenuId] = useState<number | null>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setOpenMenuId(null);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        fetchClients();
    }, []);

    const fetchClients = async () => {
        try {
            const res = await fetch(API_ENDPOINTS.clients.base, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (res.ok) {
                setClients(await res.json());
            }
        } catch (err) {
            console.error("Failed to fetch clients", err);
        } finally {
            setIsLoading(false);
        }
    };

    const filteredClients = clients.filter(client =>
        client.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.phone_number?.includes(searchTerm)
    );

    return (
        <div className="p-8 space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                        <Users className="w-8 h-8 text-[var(--brand-primary)]" />
                        {t('clients.title')}
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        {t('clients.subtitle')}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder={t('clients.search_placeholder')}
                            className="pl-10 pr-4 py-2 rounded-lg border bg-background text-sm w-full md:w-64 focus:ring-2 focus:ring-[var(--brand-primary)] outline-none transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button className="p-2 rounded-lg border bg-card hover:bg-accent transition-colors">
                        <Filter className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="border bg-card rounded-xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-muted/50 text-xs uppercase font-bold text-muted-foreground tracking-wider border-b">
                            <tr>
                                <th className="px-6 py-4">
                                    <div className="flex items-center gap-2 cursor-pointer hover:text-foreground transition-colors">
                                        {t('clients.table.name')} <ArrowUpDown className="w-3 h-3" />
                                    </div>
                                </th>
                                <th className="px-6 py-4">{t('clients.table.phone')}</th>
                                <th className="px-6 py-4 text-center">{t('clients.table.conversations')}</th>
                                <th className="px-6 py-4">{t('clients.table.joined')}</th>
                                <th className="px-6 py-4">{t('clients.table.status')}</th>
                                <th className="px-6 py-4 text-right">{t('clients.table.actions')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground italic">
                                        {t('clients.loading')}
                                    </td>
                                </tr>
                            ) : filteredClients.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground italic">
                                        {searchTerm ? t('clients.empty_search') : t('clients.empty_all')}
                                    </td>
                                </tr>
                            ) : filteredClients.map((client) => (
                                <tr key={client.id} className="group hover:bg-muted/30 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-[var(--brand-primary)]/10 flex items-center justify-center text-[var(--brand-primary)] font-bold">
                                                {client.name?.charAt(0) || "?"}
                                            </div>
                                            <div>
                                                <div className="font-bold text-sm">{client.name || "Unknown"}</div>
                                                <div className="text-[10px] text-muted-foreground uppercase font-black">{t('clients.table.id')}: {client.id}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2 text-sm">
                                            <Phone className="w-3 h-3 text-muted-foreground" />
                                            {client.phone_number}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-xs font-bold ring-1 ring-inset ring-blue-700/10">
                                            <MessageSquare className="w-3 h-3" />
                                            {client.conversation_count || 0}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                            <Calendar className="w-3 h-3" />
                                            {new Date(client.created_at).toLocaleDateString()}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="flex items-center gap-1.5">
                                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                            <span className="text-xs font-medium">{t('clients.active')}</span>
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="relative flex justify-end" ref={openMenuId === client.id ? menuRef : null}>
                                            <button
                                                onClick={() => setOpenMenuId(openMenuId === client.id ? null : client.id)}
                                                className={`p-2 rounded-lg transition-all ${openMenuId === client.id ? "bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white" : "text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"}`}
                                            >
                                                <MoreVertical className="w-5 h-5" />
                                            </button>

                                            {/* Centralized Action Hub */}
                                            {openMenuId === client.id && (
                                                <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-2xl shadow-2xl z-[100] animate-in fade-in zoom-in-95 duration-200 origin-top-right overflow-hidden ring-1 ring-black/5">
                                                    <div className="p-2 border-b dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50">
                                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-3 py-1">{t('clients.action_hub')}</p>
                                                    </div>
                                                    <div className="p-1.5 space-y-1">
                                                        <button
                                                            onClick={() => {
                                                                // Logic to open chat with this client (would need to trigger layout change or navigation)
                                                                window.location.href = `/dashboard/chat?phone=${client.phone_number}`;
                                                            }}
                                                            className="w-full flex items-center gap-3 px-3 py-2.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:text-indigo-600 rounded-xl transition-all"
                                                        >
                                                            <MessageSquare className="w-4 h-4" /> {t('clients.actions.send_message')}
                                                        </button>

                                                        <Link
                                                            to={`/dashboard/orders?clientId=${client.id}`}
                                                            className="w-full flex items-center gap-3 px-3 py-2.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 hover:text-emerald-600 rounded-xl transition-all"
                                                        >
                                                            <ShoppingCart className="w-4 h-4" /> {t('clients.actions.past_orders')}
                                                        </Link>

                                                        <button
                                                            className="w-full flex items-center gap-3 px-3 py-2.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"
                                                        >
                                                            <Users className="w-4 h-4" /> {t('clients.actions.view_profile')}
                                                        </button>
                                                    </div>

                                                    {isAdmin && (
                                                        <div className="p-1.5 pt-0">
                                                            <div className="h-px bg-slate-100 dark:bg-slate-800 mb-1 mx-2" />
                                                            <button
                                                                onClick={async () => {
                                                                    if (window.confirm(`${t('clients.actions.confirm_delete')} ${client.name || client.phone_number}?`)) {
                                                                        try {
                                                                            const res = await fetch(`${API_ENDPOINTS.clients.base}${client.id}`, {
                                                                                method: 'DELETE',
                                                                                headers: { 'Authorization': `Bearer ${token}` }
                                                                            });
                                                                            if (res.ok) fetchClients();
                                                                        } catch (err) { console.error(err); }
                                                                    }
                                                                }}
                                                                className="w-full flex items-center gap-3 px-3 py-2.5 text-xs font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all"
                                                            >
                                                                <Trash2 className="w-4 h-4" /> {t('clients.actions.delete_client')}
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Quick Stats Footer */}
            {!isLoading && clients.length > 0 && (
                <div className="flex items-center gap-8 px-2 text-xs text-muted-foreground">
                    <div>{t('dashboard.stats.total_clients')}: <span className="font-bold text-foreground">{clients.length}</span></div>
                    <div>{t('dashboard.stats.active_conversations')}: <span className="font-bold text-foreground">{clients.reduce((acc, c) => acc + (c.conversation_count || 0), 0)}</span></div>
                </div>
            )}
        </div>
    );
}
