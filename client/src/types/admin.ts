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
