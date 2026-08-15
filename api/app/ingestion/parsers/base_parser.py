from abc import ABC, abstractmethod
from html.parser import HTMLParser
import re
from typing import List, Optional
from app.ingestion.contracts.models import FetchResponse, ParsedContent


class SimpleHTMLTextExtractor(HTMLParser):
    """
    Standard library HTML parser to safely extract title, meta description,
    and visible textual content without heavy external dependencies.
    """

    def __init__(self):
        super().__init__()
        self._in_title = False
        self._in_script_or_style = False
        self.title = ""
        self.meta_description = ""
        self.text_chunks: List[str] = []

    def handle_starttag(self, tag: str, attrs: list):
        tag_lower = tag.lower()
        if tag_lower in ("script", "style", "noscript", "svg"):
            self._in_script_or_style = True
        elif tag_lower == "title":
            self._in_title = True
        elif tag_lower == "meta":
            attr_dict = {k.lower(): (v or "") for k, v in attrs}
            name = attr_dict.get("name", "").lower()
            prop = attr_dict.get("property", "").lower()
            if name in ("description", "og:description") or prop in ("description", "og:description"):
                content = attr_dict.get("content", "")
                if content and not self.meta_description:
                    self.meta_description = content.strip()
        elif tag_lower in ("p", "br", "div", "h1", "h2", "h3", "h4", "h5", "h6", "li", "tr", "article", "section"):
            self.text_chunks.append("\n")

    def handle_endtag(self, tag: str):
        tag_lower = tag.lower()
        if tag_lower in ("script", "style", "noscript", "svg"):
            self._in_script_or_style = False
        elif tag_lower == "title":
            self._in_title = False
        elif tag_lower in ("p", "div", "h1", "h2", "h3", "h4", "h5", "h6", "li", "tr", "article", "section"):
            self.text_chunks.append("\n")

    def handle_data(self, data: str):
        if self._in_title:
            self.title += data
        elif not self._in_script_or_style:
            text = data.strip()
            if text:
                self.text_chunks.append(f" {data} ")

    def get_extracted_text(self) -> str:
        return "".join(self.text_chunks)


class BaseParser(ABC):
    """Abstract parser contract."""

    @abstractmethod
    def parse(self, response: FetchResponse) -> ParsedContent:
        """Parses a FetchResponse into ParsedContent."""
        pass


class GenericTextParser(BaseParser):
    """
    Generic parser handling HTML and Plain Text documents.
    """

    def parse(self, response: FetchResponse) -> ParsedContent:
        content_type = response.content_type.lower()
        raw_text = response.text_content

        title = ""
        description: Optional[str] = None
        extracted_text = raw_text

        if "html" in content_type:
            parser = SimpleHTMLTextExtractor()
            try:
                parser.feed(raw_text)
                title = parser.title.strip()
                description = parser.meta_description.strip() or None
                extracted_text = parser.get_extracted_text()
            except Exception:
                # Fallback to regex-based extraction if html parser encounters corrupted tokens
                title_match = re.search(r"<title[^>]*>(.*?)</title>", raw_text, re.IGNORECASE | re.DOTALL)
                if title_match:
                    title = title_match.group(1).strip()
                extracted_text = re.sub(r"<[^>]+>", " ", raw_text)

        # If title is empty, derive a title from the URL or first text segment
        if not title:
            # Try first line
            lines = [l.strip() for l in extracted_text.splitlines() if l.strip()]
            if lines:
                title = lines[0][:120]
            else:
                title = response.url.split("/")[-1].replace("-", " ").replace("_", " ").title() or "Untitled Resource"

        return ParsedContent(
            url=response.url,
            title=title,
            text=extracted_text,
            description=description,
            language="en",
            mime_type=content_type,
            extraction_method="HTML_EXTRACTOR" if "html" in content_type else "DIRECT_TEXT",
            metadata={
                "status_code": response.status_code,
                "content_length": response.content_length,
                "encoding": response.encoding,
                "elapsed_ms": response.elapsed_ms,
            },
        )
