import abc
from logger import setup_logger
from services.whatsapp_service import WhatsAppService, BaseWhatsApp

logger = setup_logger("messaging_hub")

class MessageAdapter(abc.ABC):
    @abc.abstractmethod
    async def send_message(self, to: str, text: str, media_url: str = None, media_type: str = None) -> str | bool:
        pass

class WhatsAppAdapter(MessageAdapter):
    def __init__(self, config_dict: dict):
        self.driver = WhatsAppService.get_driver(config_dict)

    async def send_message(self, to: str, text: str, media_url: str = None, media_type: str = None) -> str | bool:
        return await self.driver.send_message(to, text, media_url, media_type)

class EmailAdapter(MessageAdapter):
    def __init__(self, config_dict: dict):
        self.config = config_dict

    async def send_message(self, to: str, text: str, media_url: str = None, media_type: str = None) -> str | bool:
        driver = self.config.get("email_driver", "mock")
        logger.info(f"[EMAIL SEND] Carrier: {driver} | To: {to} | Content: {text[:50]}...")
        return "email_mock_id_" + to

class InstagramAdapter(MessageAdapter):
    def __init__(self, config_dict: dict):
        self.config = config_dict

    async def send_message(self, to: str, text: str, media_url: str = None, media_type: str = None) -> str | bool:
        driver = self.config.get("meta_driver", "mock")
        logger.info(f"[INSTAGRAM SEND] Carrier: {driver} | To: {to} | Content: {text[:50]}...")
        return "insta_mock_id_" + to

class MessengerAdapter(MessageAdapter):
    def __init__(self, config_dict: dict):
        self.config = config_dict

    async def send_message(self, to: str, text: str, media_url: str = None, media_type: str = None) -> str | bool:
        driver = self.config.get("meta_driver", "mock")
        logger.info(f"[MESSENGER SEND] Carrier: {driver} | To: {to} | Content: {text[:50]}...")
        return "messenger_mock_id_" + to

class MessagingHubService:
    @staticmethod
    def get_adapter(channel: str, config_dict: dict) -> MessageAdapter:
        if channel == "email":
            return EmailAdapter(config_dict)
        if channel == "instagram":
            return InstagramAdapter(config_dict)
        if channel == "messenger":
            return MessengerAdapter(config_dict)
        
        # Default to WhatsApp
        return WhatsAppAdapter(config_dict)
