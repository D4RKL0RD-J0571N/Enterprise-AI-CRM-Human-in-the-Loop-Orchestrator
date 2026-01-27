from typing import List, Optional, Tuple, Literal
from pydantic import BaseModel
import json

class GuardrailResult(BaseModel):
    classification: Literal["security_violation", "legal_violation", "medical_violation", "out_of_scope", "in_scope"]
    triggered_keywords: List[str]
    is_safe: bool

class GuardrailEngine:
    # Hard-coded Security Triggers (Never touch business topics)
    SECURITY_VIOLATION_KEYWORDS = [
        "huelga", "politic", "activismo", "manifestaci", "gobierno", "voto", "elección",
        "religi", "gas lacrim", "manifestante", "protesta", "marcha", "disturbio",
        # Abuse/Hate speech
        "maldito", "idiota", "estúpido", "pendejo", "hijo de puta",
        # Medical/Emergencies (High Risk)
        "médico", "herida", "sangre", "hospital", "ambulancia"
    ]
    
    # Legal/Medical Hard Boundaries
    LEGAL_KEYWORDS = ["ley", "legal", "abogado", "derecho", "demanda", "juicio"]
    MEDICAL_KEYWORDS = ["diagnóstico", "medicina", "tratamiento médico", "prescripción"]

    @classmethod
    def prescan_message(cls, user_message: str, forbidden_topics: List[str] = []) -> GuardrailResult:
        """
        Classify whether triggered keywords are Security Violations or just Out-of-Scope business topics.
        """
        user_msg_lower = user_message.lower()
        
        # 1. Security Check (Highest Priority)
        security_triggers = [kw for kw in cls.SECURITY_VIOLATION_KEYWORDS if kw.lower() in user_msg_lower]
        if security_triggers:
            return GuardrailResult(
                classification="security_violation",
                triggered_keywords=security_triggers,
                is_safe=False
            )
        
        # 2. Legal/Medical Check (Also Security)
        legal_triggers = [kw for kw in cls.LEGAL_KEYWORDS if kw.lower() in user_msg_lower]
        if legal_triggers:
            return GuardrailResult(
                classification="legal_violation",
                triggered_keywords=legal_triggers,
                is_safe=False
            )
        
        medical_triggers = [kw for kw in cls.MEDICAL_KEYWORDS if kw.lower() in user_msg_lower]
        if medical_triggers:
            return GuardrailResult(
                classification="medical_violation",
                triggered_keywords=medical_triggers,
                is_safe=False
            )
        
        # 3. Business Boundary Check (Out of Scope)
        business_triggers = [topic for topic in forbidden_topics if topic.lower() in user_msg_lower]
        if business_triggers:
            return GuardrailResult(
                classification="out_of_scope",
                triggered_keywords=business_triggers,
                is_safe=True # Safe to respond, just out of scope
            )
        
        return GuardrailResult(
            classification="in_scope",
            triggered_keywords=[],
            is_safe=True
        )
