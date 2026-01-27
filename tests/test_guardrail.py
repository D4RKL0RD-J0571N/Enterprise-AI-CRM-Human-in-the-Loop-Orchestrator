import sys
import os
import unittest

# Add server directory to path so we can import modules
sys.path.append(os.path.join(os.path.dirname(__file__), '../server'))

from guardrail.engine import GuardrailEngine

class TestGuardrailEngine(unittest.TestCase):
    
    def test_security_violation_politics(self):
        result = GuardrailEngine.prescan_message("Quiero ejercer mi voto por el gobierno del presidente")
        self.assertFalse(result.is_safe)
        self.assertEqual(result.classification, "security_violation")
        # Check for ANY of the expected keywords since multiple might match
        keywords = [kw.lower() for kw in result.triggered_keywords]
        self.assertTrue("voto" in keywords or "gobierno" in keywords)

    def test_medical_violation(self):
        result = GuardrailEngine.prescan_message("Necesito un médico urgente por una herida")
        self.assertFalse(result.is_safe)
        # These are now classified as high-risk security violations
        self.assertEqual(result.classification, "security_violation")
        # Check that classification is correct regardless of which specific keyword triggered it
        self.assertTrue(len(result.triggered_keywords) > 0)
        
    def test_safe_message(self):
        result = GuardrailEngine.prescan_message("Hola, quiero comprar café")
        self.assertTrue(result.is_safe)
        self.assertEqual(result.classification, "in_scope")
        self.assertEqual(result.triggered_keywords, [])
        
    def test_out_of_scope_boundary(self):
        forbidden = ["pizza", "hamburguesa"]
        result = GuardrailEngine.prescan_message("Venden pizza?", forbidden_topics=forbidden)
        self.assertTrue(result.is_safe) # Safe to respond (friendly redirect)
        self.assertEqual(result.classification, "out_of_scope")
        self.assertIn("pizza", result.triggered_keywords)

if __name__ == '__main__':
    unittest.main()
