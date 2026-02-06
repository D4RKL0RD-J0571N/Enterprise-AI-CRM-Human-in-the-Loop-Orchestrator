from prometheus_client import Counter, Histogram

# Metrics Definitions

AI_REQUESTS_TOTAL = Counter(
    "ai_requests_total", 
    "Total number of AI generation requests",
    ["status", "domain", "classification"]
)

SECURITY_VIOLATIONS_TOTAL = Counter(
    "security_violations_total",
    "Total number of security violations detected",
    ["type"]
)

REQUEST_LATENCY_MS = Histogram(
    "request_latency_ms",
    "End-to-end latency of AI responses in milliseconds",
    buckets=[100, 500, 1000, 2000, 5000, 10000, 30000]
)

TOKENS_USED_TOTAL = Counter(
    "tokens_used_total",
    "Total number of tokens used by LLM",
    ["model"]
)

MANUAL_REVIEWS_TOTAL = Counter(
    "manual_reviews_total",
    "Total messages queued for manual human review"
)

MESSAGE_APPROVALS_TOTAL = Counter(
    "message_approvals_total",
    "Total number of AI messages approved by humans"
)

MESSAGE_REJECTIONS_TOTAL = Counter(
    "message_rejections_total",
    "Total number of AI messages rejected by humans"
)

HUMAN_MESSAGES_TOTAL = Counter(
    "human_messages_total",
    "Total number of messages sent manually by humans"
)
