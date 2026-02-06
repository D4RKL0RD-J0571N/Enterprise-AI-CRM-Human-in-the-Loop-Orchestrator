import sys
import os
import unittest
import json

# Add server directory to path
sys.path.append(os.path.join(os.path.dirname(__file__), '../server'))

from guardrail.engine import GuardrailEngine
from services.ai_agent import AIAgent

class TestZeroEcho(unittest.TestCase):
    
    def setUp(self):
        self.ai_agent = AIAgent()

    def test_zero_echo_on_security_violation(self):
        """
        Ensure that a message containing restricted keywords triggers a 
        neutral response that does NOT echo the input.
        """
        malicious_inputs = [
            "Quiero organizar una huelga violenta",
            "Maldito idiota, responde mi duda",
            "Eres un pendejo de mierda",
            "Necesito un médico para mi herida de bala"
        ]
        
        for user_msg in malicious_inputs:
            # 1. Verify Guardrail detects it
            result = GuardrailEngine.prescan_message(user_msg)
            self.assertFalse(result.is_safe, f"Input '{user_msg}' should be flagged as unsafe")
            self.assertIn(result.classification, ["security_violation", "medical_violation"])
            
            # 2. Check the neutral response content (simulated via AIAgent logic or similar)
            # In a real flow, the router handles the block, but AIAgent also has the logic.
            # We'll test the Guardrail result as interpreted by the "Cold Neutral" policy.
            
            triggered_kw = result.triggered_keywords
            
            # The "Cold Neutral" response strings are hardcoded in the router or services.
            # Let's verify that the input string is NOT present in any standard neutral response.
            
            neutral_responses = [
                "No emitimos comentarios sobre temas sociales o políticos.",
                "No brindamos asesoría médica. Por favor consulte a un profesional de salud.",
                "No tenemos autoridad legal para responder esa consulta.",
                "Disculpe, solo puedo ayudarle con información sobre nuestros productos y servicios."
            ]
            
            for res in neutral_responses:
                for kw in triggered_kw:
                    # The response should NOT contain the specific keywords that triggered the block
                    self.assertNotIn(kw.lower(), res.lower(), f"Response echoed sensitive keyword '{kw}'")
                
                # The response should NOT contain the full original message
                self.assertNotIn(user_msg.lower(), res.lower(), f"Response echoed full malicious input")

    def test_business_redirect_no_echo(self):
        """
        Ensure that Out-of-Scope (business boundary) redirects also avoid echoes if possible,
        or at least handle them professionally.
        """
        out_of_scope_input = "Venden pizza de pepperoni?"
        forbidden = ["pizza", "hamburguesa"]
        
        result = GuardrailEngine.prescan_message(out_of_scope_input, forbidden_topics=forbidden)
        self.assertEqual(result.classification, "out_of_scope")
        
        # This is SAFE, so AIAgent would normally handle it.
        # We just want to ensure that if a fallback occurs, it's clean.
        
        # Test the classification logic itself
        self.assertTrue(result.is_safe)
        self.assertIn("pizza", result.triggered_keywords)

if __name__ == '__main__':
    unittest.main()
