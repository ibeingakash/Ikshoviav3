import hashlib
import re
import unicodedata


class TextNormalizer:
    """
    Deterministic text normalizer for ingested content.
    
    Principles:
    - Zero AI / LLM rewriting or summarizing.
    - Preserves exact factual content and Unicode representations.
    - Cleans irregular whitespace, control characters, and line breaks.
    """

    @staticmethod
    def normalize(text: str) -> str:
        """
        Normalizes raw text into clean, structured plain text.
        """
        if not text:
            return ""

        # 1. Unicode NFC standard normalization
        normalized = unicodedata.normalize("NFC", text)

        # 2. Standardize line endings to LF (\n)
        normalized = normalized.replace("\r\n", "\n").replace("\r", "\n")

        # 3. Strip non-printable ASCII control characters (preserving tab, newline)
        normalized = re.sub(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]", "", normalized)

        # 4. Normalize spaces and tabs within lines while preserving paragraph boundaries
        lines = []
        for line in normalized.split("\n"):
            # Replace multiple spaces/tabs with single space, strip margins
            cleaned_line = re.sub(r"[ \t]+", " ", line).strip()
            lines.append(cleaned_line)

        # 5. Join lines and collapse 3+ consecutive newlines into exactly 2 (\n\n)
        rejoined = "\n".join(lines)
        rejoined = re.sub(r"\n{3,}", "\n\n", rejoined)

        return rejoined.strip()

    @staticmethod
    def compute_hash(text: str) -> str:
        """
        Computes deterministic SHA-256 content hash of the normalized text.
        """
        normalized = TextNormalizer.normalize(text)
        return hashlib.sha256(normalized.encode("utf-8")).hexdigest()
