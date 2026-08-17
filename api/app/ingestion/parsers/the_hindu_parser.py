import html
from html.parser import HTMLParser
import re
from datetime import datetime
from typing import Any, Dict, List, Optional, Tuple

from app.ingestion.contracts.models import FetchResponse, ParsedContent
from app.ingestion.parsers.base_parser import BaseParser


def detect_hindu_article_type(url: str, title: str, section: Optional[str] = None) -> str:
    """
    Classifies The Hindu article into standard intelligence categories:
    EDITORIAL, OPINION, EXPLAINER, NEWS, or OTHER.
    """
    u = (url or "").lower()
    t = (title or "").lower()
    s = (section or "").lower()

    if "/opinion/editorial" in u or "editorial:" in t or s == "editorial" or "/opinion/lead" in u:
        return "EDITORIAL"
    if "/opinion/op-ed" in u or "/opinion/columns" in u or "/opinion/" in u or s in ("opinion", "comment", "lead"):
        return "OPINION"
    if "/sci-tech/" in u or "/environment/" in u or "explained" in u or "explainer" in t or s in ("science", "environment", "technology"):
        return "EXPLAINER"
    if "/news/" in u or "/business/" in u or s in ("national", "international", "business", "states"):
        return "NEWS"
    return "NEWS"


def parse_the_hindu_date(raw_text: str) -> Optional[datetime]:
    """
    Parses The Hindu publication timestamps such as:
    - 'August 17, 2026 04:30 am IST'
    - 'Updated: August 17, 2026 08:15 am IST'
    - '17 August 2026 10:20:00'
    - '2026-08-17T04:30:00+05:30'
    """
    if not raw_text:
        return None

    clean_str = re.sub(r"\s+", " ", raw_text).strip()
    clean_str = re.sub(r"^(published|updated|posted)\s*:\s*", "", clean_str, flags=re.IGNORECASE)

    # ISO format check
    iso_match = re.search(r"(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})", clean_str)
    if iso_match:
        try:
            return datetime.fromisoformat(iso_match.group(1))
        except Exception:
            pass

    # Standard The Hindu format: Month DD, YYYY HH:MM am/pm
    m = re.search(
        r"([A-Za-z]{3,9})\s+(\d{1,2}),?\s+(\d{4})\s+(\d{1,2}):(\d{2})\s*([APap][Mm])?",
        clean_str,
    )
    if m:
        mon, day, year, hour, minute, ampm = m.groups()
        mon_abbr = mon[:3].title()
        time_str = f"{day} {mon_abbr} {year} {hour}:{minute}"
        if ampm:
            time_str += f" {ampm.upper()}"
            fmt = "%d %b %Y %I:%M %p"
        else:
            fmt = "%d %b %Y %H:%M"
        try:
            return datetime.strptime(time_str, fmt)
        except Exception:
            pass

    # DD Month YYYY format
    m2 = re.search(
        r"(\d{1,2})\s+([A-Za-z]{3,9})\s+(\d{4})",
        clean_str,
    )
    if m2:
        day, mon, year = m2.groups()
        mon_abbr = mon[:3].title()
        try:
            return datetime.strptime(f"{day} {mon_abbr} {year}", "%d %b %Y")
        except Exception:
            pass

    return None


class TheHinduHTMLStreamingParser(HTMLParser):
    """
    Dedicated HTML streaming parser for The Hindu pages.
    Extracts high-fidelity editorial and news content while rejecting ads, navigation, and comments.
    """

    def __init__(self):
        super().__init__()
        self._in_script_or_style = False
        self._in_title = False
        self._in_h1 = False
        self._in_paragraph = False
        self._in_author = False
        self._in_date = False
        self._in_subheading = False
        self._ignored_depth = 0

        self.title_tokens: List[str] = []
        self.h1_tokens: List[str] = []
        self.subheading_tokens: List[str] = []
        self.author_tokens: List[str] = []
        self.date_tokens: List[str] = []
        self.body_paragraphs: List[str] = []
        self.current_paragraph_tokens: List[str] = []
        self.meta_tags: Dict[str, str] = {}

    def handle_starttag(self, tag: str, attrs: List[Tuple[str, Optional[str]]]):
        tag_lower = tag.lower()
        attr_dict = {k.lower(): (v or "") for k, v in attrs}
        class_str = attr_dict.get("class", "").lower()
        id_str = attr_dict.get("id", "").lower()

        if tag_lower in ("script", "style", "noscript", "svg", "iframe"):
            self._in_script_or_style = True
            return

        if tag_lower == "meta":
            prop = attr_dict.get("property", "") or attr_dict.get("name", "")
            content = attr_dict.get("content", "")
            if prop and content:
                self.meta_tags[prop.lower()] = content.strip()
            return

        is_ignored = any(
            ign in class_str or ign in id_str
            for ign in ("dfp-ad", "ad-container", "comment", "footer", "share-page", "related-stories", "taboola", "outbrain", "newsletter")
        )
        if is_ignored:
            self._ignored_depth += 1
            return

        if self._ignored_depth > 0:
            self._ignored_depth += 1
            return

        if tag_lower == "title":
            self._in_title = True
        elif tag_lower == "h1":
            self._in_h1 = True
        elif tag_lower in ("h2", "h3") and ("subtitle" in class_str or "sub-title" in class_str or "lead" in class_str):
            self._in_subheading = True
        elif tag_lower == "p":
            self._in_paragraph = True
            self.current_paragraph_tokens = []
        elif "author" in class_str or "byline" in class_str or "author" in id_str:
            self._in_author = True
        elif "publish-time" in class_str or "updated-time" in class_str or "date" in class_str or "time" in class_str:
            self._in_date = True

    def handle_endtag(self, tag: str):
        tag_lower = tag.lower()
        if tag_lower in ("script", "style", "noscript", "svg", "iframe"):
            self._in_script_or_style = False
            return

        if self._ignored_depth > 0:
            self._ignored_depth -= 1
            return

        if tag_lower == "title":
            self._in_title = False
        elif tag_lower == "h1":
            self._in_h1 = False
        elif tag_lower in ("h2", "h3"):
            self._in_subheading = False
        elif tag_lower == "p":
            if self._in_paragraph:
                p_text = " ".join(self.current_paragraph_tokens).strip()
                if p_text and len(p_text) > 15:
                    low = p_text.lower()
                    if not any(b in low for b in ("all rights reserved", "terms of use", "privacy policy", "subscribed to our newsletter", "click here to read")):
                        self.body_paragraphs.append(p_text)
            self._in_paragraph = False
            self.current_paragraph_tokens = []
        if tag_lower in ("div", "span", "p", "section", "article", "header", "footer", "h1", "h2", "h3", "h4"):
            self._in_author = False
            self._in_date = False
            self._in_subheading = False

    def handle_data(self, data: str):
        if self._in_script_or_style or self._ignored_depth > 0:
            return

        clean = re.sub(r"\s+", " ", data).strip()
        if not clean:
            return

        if self._in_paragraph:
            self.current_paragraph_tokens.append(clean)
        elif self._in_title:
            self.title_tokens.append(clean)
        elif self._in_h1:
            self.h1_tokens.append(clean)
        elif self._in_subheading:
            self.subheading_tokens.append(clean)
        elif self._in_author:
            self.author_tokens.append(clean)
        elif self._in_date:
            self.date_tokens.append(clean)


class TheHinduParser(BaseParser):
    """
    Production-grade parser for The Hindu editorial and news articles.
    Conforms to clean extraction standards without scraping boilerplate.
    """

    def parse(self, response: FetchResponse) -> ParsedContent:
        text_content = response.text_content or ""
        if not text_content and response.raw_content:
            try:
                text_content = response.raw_content.decode("utf-8", errors="replace")
            except Exception:
                text_content = ""

        # Parse with streaming HTML parser
        parser = TheHinduHTMLStreamingParser()
        try:
            parser.feed(text_content)
        except Exception:
            pass

        # 1. Resolve Title
        title = ""
        if parser.h1_tokens:
            title = " ".join(parser.h1_tokens).strip()
        elif parser.meta_tags.get("og:title"):
            title = parser.meta_tags["og:title"]
        elif parser.meta_tags.get("twitter:title"):
            title = parser.meta_tags["twitter:title"]
        elif parser.title_tokens:
            title = " ".join(parser.title_tokens).strip()

        title = re.sub(r"\s*-\s*The\s*Hindu.*$", "", title, flags=re.IGNORECASE).strip()
        if not title:
            title = "The Hindu Article"

        # 2. Resolve Description / Subtitle
        description = " ".join(parser.subheading_tokens).strip() if parser.subheading_tokens else None
        if not description:
            description = parser.meta_tags.get("og:description") or parser.meta_tags.get("description")

        # 3. Resolve Publication Date
        published_at: Optional[datetime] = None
        date_str = parser.meta_tags.get("article:published_time") or parser.meta_tags.get("publishdate") or parser.meta_tags.get("datepublished")
        if date_str:
            published_at = parse_the_hindu_date(date_str)
        if not published_at and parser.date_tokens:
            published_at = parse_the_hindu_date(" ".join(parser.date_tokens))

        # 4. Resolve Body Content
        body_text = "\n\n".join(parser.body_paragraphs).strip()
        if not body_text:
            body_text = description or title

        # 5. Classify Article Type
        section = parser.meta_tags.get("article:section") or ""
        article_type = detect_hindu_article_type(response.url, title, section)

        author = " ".join(parser.author_tokens).strip() if parser.author_tokens else (parser.meta_tags.get("author") or "The Hindu Editorial Desk")

        metadata: Dict[str, Any] = {
            "source_name": "The Hindu",
            "article_type": article_type,
            "author": author,
            "section": section or "General",
            "url": response.url,
            "extraction_method": "THE_HINDU_STREAMING_HTML",
            "is_newspaper": True,
            "rights_notice": "Permitted public news metadata with link to original publication.",
        }
        if description:
            metadata["description"] = description

        return ParsedContent(
            url=response.url,
            title=title,
            text=body_text,
            description=description,
            language="en",
            mime_type="text/html",
            published_at=published_at,
            metadata=metadata,
            extraction_method="THE_HINDU_STREAMING_HTML",
        )
