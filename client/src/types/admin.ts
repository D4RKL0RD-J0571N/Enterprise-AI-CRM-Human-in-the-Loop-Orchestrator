export interface AIConfig {
    business_name: string;
    business_description: string;
    tone: string;
    rules: string[];
    auto_respond_threshold: number;
    review_threshold: number;
    forbidden_topics: string[];
    language_code: string;
    translate_messages: boolean;
    identity_prompt: string | null;
    grounding_template: string | null;
    intent_rules: { keywords: string[], intent: string, suggestions?: string[] }[];
    fallback_message: string;
    preferred_model: string;
    logo_url: string | null;
    primary_color: string;
    ui_density: 'compact' | 'comfortable';

    // Secrets (Optional)
    openai_api_key?: string;
    openai_api_base?: string;
    whatsapp_api_token?: string;
    whatsapp_verify_token?: string;
    whatsapp_phone_id?: string;
    whatsapp_driver?: 'mock' | 'meta';

    // Email
    email_smtp_server?: string;
    email_smtp_port?: number;
    email_user?: string;
    email_password?: string;
    email_from_name?: string;
    email_driver?: 'mock' | 'smtp';

    // Meta
    facebook_api_token?: string;
    facebook_page_id?: string;
    instagram_business_id?: string;
    meta_driver?: 'mock' | 'meta';

    timezone: string;
    suggestions_json?: string[]; // Global suggestions
    workspace_config?: any; // JSON storage for UI layout preferences
}

export interface SecurityAudit {
    id: number;
    client_id: string;
    input_message: string;
    output_message: string;
    domain: string;
    intent: string;
    confidence: number;
    latency_ms: number;
    model_name: string;
    tokens_used: number;
    status: string;
    timestamp: string;
    reasoning: string;
    triggered_keywords: string;
}

export interface AIConfigSnapshot {
    id: number;
    created_at: string;
    version_label: string;
    version_name?: string;
    is_locked?: boolean;
    logo_url?: string | null;
    primary_color?: string;
}

export interface AIDataset {
    id: number;
    name: string;
    data_type: string;
    content: string;
    is_active: boolean;
}

export interface AnalyticsItem {
    intent: string;
    count: number;
}

export interface AuditLogItem {
    id: number;
    timestamp: string;
    action: string;
    resource: string;
    details: string;
    user_id: number;
    user?: { username: string };
}

export interface Product {
    id: number;
    name: string;
    description: string;
    price: number; // In cents
    currency: string;
    stock_quantity: number;
    is_active: boolean;
}

export interface OrderItem {
    product_id: number;
    quantity: number;
    price: number;
    name?: string;
}

export interface Order {
    id: number;
    client_id: number;
    total_amount: number;
    currency: string;
    status: string;
    items_json: string;
    created_at: string;
    external_id?: string;
    payment_method?: string;
}

export interface Client {
    id: number;
    name: string;
    phone_number: string;
    tenant_id: string;
    created_at: string;
    conversation_count?: number;
}
