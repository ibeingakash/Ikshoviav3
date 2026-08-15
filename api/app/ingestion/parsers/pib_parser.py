import html
from html.parser import HTMLParser
import re
from datetime import datetime
from typing import Any, Dict, List, Optional, Tuple

from app.ingestion.contracts.models import FetchResponse, ParsedContent
from app.ingestion.parsers.base_parser import BaseParser


def detect_language(text: str) -> str:
    """Detects primary language/script from Unicode character ranges."""
    if not text:
        return "en"
    if re.search(r"[\u0600-\u06FF]", text):
        return "ur"
    if re.search(r"[\u0A00-\u0A7F]", text):
        return "pa"
    if re.search(r"[\u0A80-\u0AFF]", text):
        return "gu"
    if re.search(r"[\u0B00-\u0B7F]", text):
        return "or"
    if re.search(r"[\u0B80-\u0BFF]", text):
        return "ta"
    if re.search(r"[\u0C00-\u0C7F]", text):
        return "te"
    if re.search(r"[\u0C80-\u0CFF]", text):
        return "kn"
    if re.search(r"[\u0D00-\u0D7F]", text):
        return "ml"
    if re.search(r"[\u0980-\u09FF]", text):
        return "bn"
    if re.search(r"[\u0900-\u097F]", text):
        return "hi"
    return "en"


def parse_pib_release_date(raw_text: str) -> Tuple[Optional[datetime], Optional[str], Optional[str]]:
    """
    Parses PIB date strings such as:
    - 'प्रविष्टि तिथि: 16 DEC 2024 7:40PM by PIB Mumbai'
    - 'Posted On: 04 FEB 2025 5:52PM by PIB Delhi'
    - '14-May-2019 16:16 IST'
    Returns: (parsed_datetime, pib_location, clean_raw_string)
    """
    if not raw_text:
        return None, None, None

    clean_str = re.sub(r"\s+", " ", raw_text).strip()

    # Extract location (e.g. PIB Delhi, PIB Mumbai, PIB Chandigarh, etc.)
    loc_match = re.search(r"by\s+(PIB\s+[A-Za-z\s]+)", clean_str, re.IGNORECASE)
    pib_location = loc_match.group(1).strip() if loc_match else None

    # Date pattern 1: DD Mon YYYY H:MM AM/PM
    m1 = re.search(
        r"(\d{1,2})\s+([A-Za-z]{3,9})\s+(\d{4})\s+(\d{1,2}):(\d{2})\s*([APap][Mm])?",
        clean_str,
    )
    if m1:
        day, mon, year, hour, minute, ampm = m1.groups()
        mon_abbr = mon[:3].title()
        time_str = f"{day} {mon_abbr} {year} {hour}:{minute}"
        if ampm:
            time_str += f" {ampm.upper()}"
            fmt = "%d %b %Y %I:%M %p"
        else:
            fmt = "%d %b %Y %H:%M"
        try:
            dt = datetime.strptime(time_str, fmt)
            return dt, pib_location, clean_str
        except Exception:
            pass

    # Date pattern 2: DD-Mon-YYYY HH:MM
    m2 = re.search(r"(\d{1,2})-([A-Za-z]{3,9})-(\d{4})\s+(\d{1,2}):(\d{2})", clean_str)
    if m2:
        day, mon, year, hour, minute = m2.groups()
        mon_abbr = mon[:3].title()
        time_str = f"{day}-{mon_abbr}-{year} {hour}:{minute}"
        try:
            dt = datetime.strptime(time_str, "%d-%b-%Y %H:%M")
            return dt, pib_location, clean_str
        except Exception:
            pass

    return None, pib_location, clean_str


class PIBHTMLStreamingParser(HTMLParser):
    """
    Dedicated streaming HTML parser for Press Information Bureau (PIB) press releases.
    Extracts high-fidelity structural components and cleanly isolates article content from page chrome.
    """

    def __init__(self):
        super().__init__()
        self._in_script_or_style = False
        self._in_title_tag = False
        self._in_h2 = False
        self._in_h3 = False
        self._in_ministry = False
        self._in_date = False
        self._in_release_id = False
        self._ignored_depth = 0

        # Discovered chrome / navigation identifiers
        self._ignore_classes = {
            "header",
            "footer",
            "nav",
            "navbar",
            "menu",
            "sidebar",
            "releaselang",
            "social-sharing",
            "social-share",
            "innner-page-main-about-us-content-left-part",
            "top-bar",
            "main-menu",
            "breadcrum",
            "breadcrumb",
            "share",
            "carousel",
            "banner",
            "ticker",
            "flashnews",
            "flash-news",
        }
        self._ignore_ids = {
            "header",
            "footer",
            "nav",
            "menu",
            "reel_pic",
            "lblviews",
            "lblrefphoto",
            "pimage",
            "socialshare",
            "releaselang",
            "carousel",
        }

        # Extracted fields
        self.doc_title_chunks: List[str] = []
        self.h2_title_chunks: List[str] = []
        self.subtitle_chunks: List[str] = []
        self.ministry_chunks: List[str] = []
        self.date_chunks: List[str] = []
        self.release_id_chunks: List[str] = []
        self.body_chunks: List[str] = []

    def handle_starttag(self, tag: str, attrs: list):
        tag_lower = tag.lower()
        attr_dict = {k.lower(): (v or "") for k, v in attrs}
        classes = attr_dict.get("class", "").lower()
        elem_id = attr_dict.get("id", "").lower()

        if tag_lower in ("script", "style", "noscript", "svg", "iframe"):
            self._in_script_or_style = True
            return

        # Check ignored blocks (navigation, footer, language switcher, social shares)
        is_ignored = False
        if any(cls in classes for cls in self._ignore_classes):
            is_ignored = True
        if any(i in elem_id for i in self._ignore_ids):
            is_ignored = True

        if is_ignored:
            self._ignored_depth += 1
            return

        if self._ignored_depth > 0:
            self._ignored_depth += 1
            return

        # Identify structural PIB elements
        if tag_lower == "title":
            self._in_title_tag = True
        elif "ministrynamesubhead" in classes or elem_id == "lblministry":
            self._in_h2 = False
            self._in_h3 = False
            self._in_date = False
            self._in_ministry = True
        elif elem_id == "titleh2" or (tag_lower == "h2" and ("title" in classes or not self.h2_title_chunks)):
            self._in_ministry = False
            self._in_h3 = False
            self._in_date = False
            self._in_h2 = True
        elif elem_id in ("subtitleh3", "ltrsubtitle") or (tag_lower == "h3" and not self.subtitle_chunks):
            self._in_ministry = False
            self._in_h2 = False
            self._in_date = False
            self._in_h3 = True
        elif "releasedatesubheaddatetime" in classes:
            self._in_ministry = False
            self._in_h2 = False
            self._in_h3 = False
            self._in_date = True
        elif elem_id == "releaseid":
            self._in_ministry = False
            self._in_h2 = False
            self._in_h3 = False
            self._in_date = False
            self._in_release_id = True
        elif tag_lower in ("p", "br", "div", "h4", "h5", "h6", "li", "tr", "article", "section", "blockquote"):
            if tag_lower in ("p", "article", "section"):
                self._in_h2 = False
                self._in_h3 = False
                self._in_ministry = False
                self._in_date = False
            self.body_chunks.append("\n")

    def handle_endtag(self, tag: str):
        tag_lower = tag.lower()
        if tag_lower in ("script", "style", "noscript", "svg", "iframe"):
            self._in_script_or_style = False
            return

        if self._ignored_depth > 0:
            self._ignored_depth -= 1
            return

        if tag_lower == "title":
            self._in_title_tag = False
        elif self._in_ministry and tag_lower in ("div", "span", "p"):
            self._in_ministry = False
        elif self._in_h2 and tag_lower in ("h2", "div", "span"):
            self._in_h2 = False
        elif self._in_h3 and tag_lower in ("h3", "div", "span"):
            self._in_h3 = False
        elif self._in_date and tag_lower in ("div", "span", "p"):
            self._in_date = False
        elif self._in_release_id and tag_lower in ("span", "div"):
            self._in_release_id = False
        elif tag_lower in ("p", "div", "h4", "h5", "h6", "li", "tr", "article", "section", "blockquote"):
            self.body_chunks.append("\n")

    def handle_data(self, data: str):
        if self._in_script_or_style or self._ignored_depth > 0:
            return

        cleaned = data.strip()
        if not cleaned:
            return

        if self._in_title_tag:
            self.doc_title_chunks.append(cleaned)
        elif self._in_ministry:
            self.ministry_chunks.append(cleaned)
        elif self._in_h2:
            self.h2_title_chunks.append(cleaned)
        elif self._in_h3:
            self.subtitle_chunks.append(cleaned)
        elif self._in_date:
            self.date_chunks.append(cleaned)
        elif self._in_release_id:
            self.release_id_chunks.append(cleaned)
        else:
            self.body_chunks.append(f" {cleaned} ")

    def get_extracted(self) -> Dict[str, str]:
        return {
            "doc_title": " ".join(self.doc_title_chunks).strip(),
            "h2_title": " ".join(self.h2_title_chunks).strip(),
            "subtitle": " ".join(self.subtitle_chunks).strip(),
            "ministry": " ".join(self.ministry_chunks).strip(),
            "date_raw": " ".join(self.date_chunks).strip(),
            "release_id": " ".join(self.release_id_chunks).strip(),
            "body": "".join(self.body_chunks),
        }


class PIBParser(BaseParser):
    """
    Parser specifically tailored for Press Information Bureau (PIB) press releases.
    Extracts article title, ministry, publication date/location, release ID, language,
    and cleanly separated article body.
    """

    def parse(self, response: FetchResponse) -> ParsedContent:
        raw_html = response.text_content or (response.raw_content.decode(response.encoding or "utf-8", errors="ignore"))

        streaming_parser = PIBHTMLStreamingParser()
        try:
            streaming_parser.feed(raw_html)
            extracted = streaming_parser.get_extracted()
        except Exception:
            extracted = {
                "doc_title": "",
                "h2_title": "",
                "subtitle": "",
                "ministry": "",
                "date_raw": "",
                "release_id": "",
                "body": "",
            }

        # 1. Resolve Title
        title = extracted["h2_title"] or extracted["doc_title"]
        if not title:
            # Fallback regex search for Titleh2 or h2 or title tag
            t_match = re.search(r"<h2[^>]*id=[\"']Titleh2[\"'][^>]*>(.*?)</h2>", raw_html, re.I | re.DOTALL)
            if t_match:
                title = re.sub(r"<[^>]+>", " ", t_match.group(1)).strip()
            else:
                doc_t_match = re.search(r"<title[^>]*>(.*?)</title>", raw_html, re.I | re.DOTALL)
                if doc_t_match:
                    title = re.sub(r"<[^>]+>", " ", doc_t_match.group(1)).strip()

        title = html.unescape(title).strip()
        # Clean multiple spaces
        title = re.sub(r"\s+", " ", title)

        # 2. Resolve Ministry
        ministry = extracted["ministry"]
        if not ministry:
            min_match = re.search(r"class=[\"'][^\"']*MinistryNameSubhead[^\"']*[\"'][^>]*>(.*?)</div>", raw_html, re.I | re.DOTALL)
            if min_match:
                ministry = re.sub(r"<[^>]+>", " ", min_match.group(1)).strip()
        ministry = html.unescape(ministry).strip()
        ministry = re.sub(r"\s+", " ", ministry) or None

        # 3. Resolve Subtitle
        subtitle = extracted["subtitle"]
        if not subtitle:
            sub_match = re.search(r"id=[\"']Subtitleh3[\"'][^>]*>(.*?)</h3>", raw_html, re.I | re.DOTALL)
            if sub_match:
                subtitle = re.sub(r"<[^>]+>", " ", sub_match.group(1)).strip()
        subtitle = html.unescape(subtitle).strip()
        subtitle = re.sub(r"\s+", " ", subtitle) or None

        # 4. Resolve Date & Location
        date_raw = extracted["date_raw"]
        if not date_raw:
            date_match = re.search(r"class=[\"'][^\"']*ReleaseDateSubHeaddateTime[^\"']*[\"'][^>]*>(.*?)</div>", raw_html, re.I | re.DOTALL)
            if date_match:
                date_raw = re.sub(r"<[^>]+>", " ", date_match.group(1)).strip()

        published_at, pib_location, clean_date_str = parse_pib_release_date(date_raw)

        # 5. Resolve Release ID
        release_id_raw = extracted["release_id"]
        if not release_id_raw:
            rel_match = re.search(r"id=[\"']ReleaseId[\"'][^>]*>(.*?)</span>", raw_html, re.I | re.DOTALL)
            if rel_match:
                release_id_raw = re.sub(r"<[^>]+>", " ", rel_match.group(1)).strip()

        # Extract numeric release ID from string like "(रिलीज़ आईडी: 2085000)" or from URL query
        release_id = None
        if release_id_raw:
            num_match = re.search(r"(\d{5,8})", release_id_raw)
            if num_match:
                release_id = num_match.group(1)
            else:
                release_id = release_id_raw

        if not release_id:
            url_prid_match = re.search(r"[?&](?:PRID|relid)=(\d+)", response.url, re.I)
            if url_prid_match:
                release_id = url_prid_match.group(1)

        # 6. Sanitize Body Text
        body = extracted["body"]
        if not body:
            # Fallback regex extraction of text inside main body container
            body_match = re.search(r"class=[\"'][^\"']*(?:BackgroundRelease|innner-page-main)[^\"']*[\"'][^>]*>(.*)", raw_html, re.I | re.DOTALL)
            if body_match:
                body = re.sub(r"<[^>]+>", " ", body_match.group(1))

        # Unescape HTML entities in body text
        body = html.unescape(body)

        # Split into lines and filter out trailing metadata boilerplate / signoffs
        cleaned_lines = []
        for line in body.splitlines():
            line_str = re.sub(r"\s+", " ", line).strip()
            if not line_str:
                continue
            # Remove trailing signatures like '***', 'DS/RT', '(Release ID: ...)', visitor counter, etc.
            if line_str in ("***", "**", "* * *", "---", "--"):
                continue
            if re.match(r"^\([^\)]*(?:Release ID|रिलीज़ आईडी)[^\)]*\)$", line_str, re.I):
                continue
            if re.match(r"^(?:आगंतुक पटल|Visitor Counter|Views)\s*:\s*\d+", line_str, re.I):
                continue
            if re.match(r"^[A-Z]{2,4}/[A-Z]{2,4}(?:/[A-Z]{2,4})?$", line_str):  # e.g. DS/RT or SNC/PK/MS
                continue
            cleaned_lines.append(line_str)

        clean_text = "\n\n".join(cleaned_lines).strip()

        # 7. Language Detection
        sample_text_for_lang = f"{title} {ministry or ''} {clean_text[:500]}"
        detected_language = detect_language(sample_text_for_lang)

        # 8. Description Summary
        description = subtitle
        if not description and clean_text:
            first_p = clean_text.split("\n\n")[0]
            if len(first_p) > 280:
                description = first_p[:277] + "..."
            else:
                description = first_p

        # 9. Structured Metadata
        metadata: Dict[str, Any] = {
            "adapter": "pib",
            "status_code": response.status_code,
            "content_length": response.content_length,
            "encoding": response.encoding,
            "elapsed_ms": response.elapsed_ms,
        }
        if ministry:
            metadata["ministry"] = ministry
        if subtitle:
            metadata["subtitle"] = subtitle
        if release_id:
            metadata["release_id"] = release_id
        if pib_location:
            metadata["pib_location"] = pib_location
        if clean_date_str:
            metadata["pib_release_date_str"] = clean_date_str
        metadata["language"] = detected_language

        if not title:
            title = f"PIB Press Release {release_id}" if release_id else "PIB Press Release"

        return ParsedContent(
            url=response.url,
            title=title,
            text=clean_text or title,
            description=description,
            language=detected_language,
            mime_type="text/html",
            published_at=published_at,
            metadata=metadata,
            extraction_method="PIB_ADAPTER",
        )
