import os
import copy
from typing import Optional

class PrivacyService:
    def __init__(self):
        self.analyzer = None
        self.anonymizer = None

    def configure(self):
        try:
            from presidio_analyzer import AnalyzerEngine
            from presidio_anonymizer import AnonymizerEngine
            
            self.analyzer = AnalyzerEngine()
            self.anonymizer = AnonymizerEngine()
            print("[PrivacyService] Presidio initialized successfully.")
        except Exception as e:
            print(f"[PrivacyService] Failed to initialize Presidio: {e}")

    @property
    def is_configured(self) -> bool:
        return self.analyzer is not None and self.anonymizer is not None

    def scrub_text(self, text: str) -> str:
        """
        Takes raw text and automatically replaces PII (names, emails, SSNs, etc.)
        with placeholders like <PERSON>, <EMAIL_ADDRESS>.
        """
        if not self.is_configured:
            # Fallback if Presidio isn't configured/installed properly
            # In a strict enterprise environment, you might raise an error here to prevent open fail.
            self.configure()
            if not self.is_configured:
                return text

        try:
            results = self.analyzer.analyze(text=text, language='en')
            # Anonymize the findings
            anonymized_result = self.anonymizer.anonymize(text=text, analyzer_results=results)
            return anonymized_result.text
        except Exception as e:
            print(f"[PrivacyService] Error during scrubbing: {e}")
            return text

privacy_service = PrivacyService()
