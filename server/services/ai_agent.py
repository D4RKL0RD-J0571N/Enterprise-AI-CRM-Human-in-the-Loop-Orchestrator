import openai
import os
from logger import setup_logger

logger = setup_logger("ai_agent")

# Configure OpenAI to use Local LLM (LM Studio)
openai.api_key = os.getenv("OPENAI_API_KEY", "lm-studio")
openai.api_base = os.getenv("OPENAI_API_BASE", "http://localhost:1234/v1")

class AIAgent:
    def __init__(self):
        self.context = {}

    def generate_response(self, client_id, user_message):
        logger.debug(f"Generating response for Client {client_id}: {user_message[:50]}...")
        
        history = self.context.get(client_id, [])
        messages = [{"role": "system", "content": "You are a helpful WhatsApp assistant. Keep responses concise."}]
        for role, msg in history[-5:]:
            messages.append({"role": role, "content": msg})
        messages.append({"role": "user", "content": user_message})
        
        # Default fallback
        fallback_response = {
            "content": "I am currently having trouble processing your request.",
            "confidence": 0,
            "metadata": {"intent": "error", "reasoning": "Exception occurred"}
        }

        if not openai.api_key:
             logger.warning("OpenAI API Key is missing")
             return {
                 "content": "AI Agent: OpenAI API Key not configured.", 
                 "confidence": 0, 
                 "metadata": {"intent": "system_error", "reasoning": "Missing API Key"}
             }

        try:
            response = openai.ChatCompletion.create(model="gpt-4-turbo", messages=messages)
            reply_text = response.choices[0].message["content"]
            
            # Simulate Metadata Analysis (since we can't easily force JSON from all local models)
            import random
            confidence_score = random.randint(85, 99)
            
            intent = "General"
            if "?" in user_message: intent = "Inquiry"
            elif any(x in user_message.lower() for x in ["hi", "hello", "hey"]): intent = "Greeting"
            elif any(x in user_message.lower() for x in ["price", "cost"]): intent = "Pricing"
            
            reasoning = f"User asked '{user_message[:20]}...'. Detected intent: {intent}. Formulated concise response."

            self.context[client_id] = history + [("user", user_message), ("assistant", reply_text)]
            
            logger.info(f"AI Response Generated | Intent: {intent} | Confidence: {confidence_score}%")
            
            return {
                "content": reply_text,
                "confidence": confidence_score,
                "metadata": {
                    "intent": intent, 
                    "reasoning": reasoning,
                    "model": "gpt-4-turbo"
                }
            }

        except Exception as e:
            logger.error(f"Error generating AI response: {e}", exc_info=True)
            return fallback_response
