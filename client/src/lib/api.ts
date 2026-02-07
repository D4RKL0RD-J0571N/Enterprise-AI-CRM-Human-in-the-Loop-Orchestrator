/**
 * Centralized API configuration.
 * Uses Vite environment variables with local fallbacks.
 */

// Production API URL should be set via VITE_API_URL environment variable
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
console.log('DEBUG: API BASE_URL is', BASE_URL);

// Handle both standard HTTP/S and WS/WSS protocols
export const API_BASE_URL = BASE_URL.replace(/\/$/, '');
export const WS_BASE_URL = API_BASE_URL.replace(/^http/, 'ws');

export const API_ENDPOINTS = {
    auth: {
        login: `${API_BASE_URL}/auth/login`,
    },
    conversations: {
        base: `${API_BASE_URL}/conversations/`,
        messages: (id: number) => `${API_BASE_URL}/conversations/${id}/messages`,
        bulk: `${API_BASE_URL}/conversations/messages/bulk-action`,
        action: (id: number, action: string) => `${API_BASE_URL}/conversations/${id}/${action}`,
        messageAction: (id: number, action: string) => `${API_BASE_URL}/conversations/messages/${id}/${action}`,
        messageUpdate: (id: number) => `${API_BASE_URL}/conversations/messages/${id}`,
    },
    admin: {
        config: `${API_BASE_URL}/admin/config`,
        datasets: `${API_BASE_URL}/admin/datasets`,
        datasetAction: (id: number) => `${API_BASE_URL}/admin/datasets/${id}`,
        snapshots: `${API_BASE_URL}/admin/snapshots`,
        snapshotAction: (id: string, action: string) => `${API_BASE_URL}/admin/snapshots/${id}/${action}`,
        analytics: `${API_BASE_URL}/admin/analytics/intents`,
        auditsSecurity: `${API_BASE_URL}/admin/audits/security`,
        auditsOperational: `${API_BASE_URL}/admin/audits/operational`,
        test: `${API_BASE_URL}/admin/test`,
        models: `${API_BASE_URL}/admin/models`,
        license: `${API_BASE_URL}/admin/license`,
        workspace: `${API_BASE_URL}/admin/workspace`,
    },
    clients: {
        base: `${API_BASE_URL}/clients`,
        action: (id: number) => `${API_BASE_URL}/clients/${id}`,
    },
    ecommerce: {
        products: `${API_BASE_URL}/ecommerce/products`,
        orders: `${API_BASE_URL}/ecommerce/orders`,
        paymentLink: (id: number) => `${API_BASE_URL}/ecommerce/orders/${id}/payment-link`,
    },
    dashboard: {
        stats: `${API_BASE_URL}/dashboard/stats`,
        recentOrders: `${API_BASE_URL}/dashboard/recent-orders`,
        activity: `${API_BASE_URL}/dashboard/activity`,
    },
    notifications: {
        base: `${API_BASE_URL}/notifications/`,
        readAll: `${API_BASE_URL}/notifications/read-all`,
        markRead: (id: number) => `${API_BASE_URL}/notifications/${id}/read`,
    },
    ws: {
        chat: `${WS_BASE_URL}/ws/chat`,
    }
};
