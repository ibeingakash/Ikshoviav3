import html
from html.parser import HTMLParser
import re
import urllib.parse
from datetime import datetime
from typing import Any, Dict, List, Optional, Tuple

from app.ingestion.contracts.models import FetchResponse, ParsedContent
from app.ingestion.parsers.base_parser import BaseParser


def detect_language(text: str) -> str:
    """Detects primary language/script from Unicode character ranges."""
    if not text:
        return "en"
    if re.search(r"[\u0900-\u097F]", text):
        return "hi"
    return "en"


HINDI_MONTHS = {
    "जनवरी": 1,
    "फ़रवरी": 2,
    "फरवरी": 2,
    "मार्च": 3,
    "अप्रैल": 4,
    "मई": 5,
    "जून": 6,
    "जुलाई": 7,
    "अगस्त": 8,
    "सितंबर": 9,
    "अक्टूबर": 10,
    "नवंबर": 11,
    "दिसंबर": 12,
}


def parse_rbi_date(raw_text: str) -> Optional[datetime]:
    """
    Parses RBI date formats:
    - 'Date : Dec 06, 2024' or 'Dec 06, 2024' or 'December 06, 2024'
    - '06/12/2024' or '06-12-2024'
    - 'October 11, 2024'
    - '06 दिसंबर 2024'
    """
    if not raw_text:
        return None

    clean = re.sub(r"\s+", " ", raw_text).strip()
    clean = re.sub(r"^(?:Date|दिनांक)\s*[:\-]?\s*", "", clean, flags=re.I).strip()

    # Pattern 1: Mon DD, YYYY or Month DD, YYYY
    m1 = re.search(r"([A-Za-z]{3,9})\s+(\d{1,2})[,\s]+(\d{4})", clean)
    if m1:
        mon, d, y = m1.groups()
        mon_abbr = mon[:3].title()
        try:
            return datetime.strptime(f"{d} {mon_abbr} {y}", "%d %b %Y")
        except Exception:
            pass

    # Pattern 2: DD Mon YYYY / DD Month YYYY (English)
    m2 = re.search(r"(\d{1,2})\s+([A-Za-z]{3,9})[,\s]+(\d{4})", clean)
    if m2:
        d, mon, y = m2.groups()
        mon_abbr = mon[:3].title()
        try:
            return datetime.strptime(f"{d} {mon_abbr} {y}", "%d %b %Y")
        except Exception:
            pass

    # Pattern 3: Hindi DD Month YYYY (e.g. 06 दिसंबर 2024)
    m_hi = re.search(r"(\d{1,2})\s+([\u0900-\u097F]+)\s+(\d{4})", clean)
    if m_hi:
        d, mon_hi, y = m_hi.groups()
        m_num = HINDI_MONTHS.get(mon_hi)
        if m_num:
            try:
                return datetime(int(y), m_num, int(d))
            except Exception:
                pass

    # Pattern 4: DD/MM/YYYY or DD-MM-YYYY
    m3 = re.search(r"(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})", clean)
    if m3:
        d, m, y = m3.groups()
        try:
            return datetime(int(y), int(m), int(d))
        except Exception:
            pass

    return None


class RBIHTMLStreamingParser(HTMLParser):
    """
    Streaming HTML parser for Reserve Bank of India (RBI) press releases, notifications,
    circulars, policy statements, and statistical reports.
    """

    def __init__(self, base_url: str):
        super().__init__()
        self.base_url = base_url
        self._in_script_or_style = False
        self._in_title_tag = False
        self._in_h1_or_h2 = False
        self._ignored_depth = 0

        self._ignore_classes = {
            "header",
            "footer",
            "nav",
            "navbar",
            "menu",
            "sidebar",
            "breadcrumb",
            "social-share",
            "social-sharing",
            "top-bar",
            "site-header",
            "site-footer",
            "copyright",
            "accessibility-bar",
        }
        self._ignore_ids = {
            "header",
            "footer",
            "nav",
            "menu",
            "sidebar",
            "socialshare",
            "topbar",
        }

        self.doc_title_chunks: List[str] = []
        self.heading_chunks: List[str] = []
        self.body_chunks: List[str] = []
        self.pdf_links: List[Dict[str, str]] = []
        self._current_a_href: Optional[str] = None
        self._current_a_text: List[str] = []

    def handle_starttag(self, tag: str, attrs: list):
        tag_lower = tag.lower()
        attr_dict = {k.lower(): (v or "") for k, v in attrs}
        classes_str = attr_dict.get("class", "").lower()
        class_tokens = set(classes_str.split())
        elem_id = attr_dict.get("id", "").lower()

        if tag_lower in ("script", "style", "noscript", "svg", "iframe"):
            self._in_script_or_style = True
            return

        is_ignored = False
        if bool(class_tokens & self._ignore_classes):
            is_ignored = True
        if elem_id in self._ignore_ids:
            is_ignored = True

        if is_ignored:
            self._ignored_depth += 1
            return

        if self._ignored_depth > 0:
            self._ignored_depth += 1
            return

        if tag_lower == "a":
            href = attr_dict.get("href", "").strip()
            if href:
                self._current_a_href = href
                self._current_a_text = []

        if tag_lower == "title":
            self._in_title_tag = True
        elif tag_lower in ("h1", "h2") or bool(class_tokens & {"press-title", "notif-heading"}):
            self._in_h1_or_h2 = True
        elif tag_lower in ("p", "br", "div", "h3", "h4", "h5", "h6", "li", "tr", "article", "section"):
            self.body_chunks.append("\n")
        elif tag_lower in ("td", "th"):
            self.body_chunks.append(" | ")

    def handle_endtag(self, tag: str):
        tag_lower = tag.lower()
        if tag_lower in ("script", "style", "noscript", "svg", "iframe"):
            self._in_script_or_style = False
            return

        if self._ignored_depth > 0:
            self._ignored_depth -= 1
            return

        if tag_lower == "a":
            if self._current_a_href:
                href = self._current_a_href
                link_text = " ".join(self._current_a_text).strip()
                if ".pdf" in href.lower():
                    full_pdf_url = urllib.parse.urljoin(self.base_url, href)
                    self.pdf_links.append({
                        "url": full_pdf_url,
                        "title": link_text or "RBI PDF Document",
                        "mime_type": "application/pdf",
                    })
                self._current_a_href = None
                self._current_a_text = []

        if tag_lower == "title":
            self._in_title_tag = False
        elif tag_lower in ("h1", "h2"):
            self._in_h1_or_h2 = False
        elif tag_lower in ("p", "div", "h3", "h4", "h5", "h6", "li", "tr", "article", "section"):
            self.body_chunks.append("\n")

    def handle_data(self, data: str):
        if self._in_script_or_style or self._ignored_depth > 0:
            return

        cleaned = data.strip()
        if not cleaned:
            return

        if self._current_a_href is not None:
            self._current_a_text.append(cleaned)

        if self._in_title_tag:
            self.doc_title_chunks.append(cleaned)
        elif self._in_h1_or_h2:
            self.heading_chunks.append(cleaned)
        else:
            self.body_chunks.append(f" {cleaned} ")

    def get_extracted(self) -> Dict[str, Any]:
        if self._current_a_href:
            href = self._current_a_href
            link_text = " ".join(self._current_a_text).strip()
            if ".pdf" in href.lower():
                full_pdf_url = urllib.parse.urljoin(self.base_url, href)
                self.pdf_links.append({
                    "url": full_pdf_url,
                    "title": link_text or "RBI Document",
                    "mime_type": "application/pdf",
                })
            self._current_a_href = None
            self._current_a_text = []

        return {
            "doc_title": " ".join(self.doc_title_chunks).strip(),
            "heading": " ".join(self.heading_chunks).strip(),
            "body": "".join(self.body_chunks),
            "pdf_links": self.pdf_links,
        }


class RBIParser(BaseParser):
    """
    Dedicated parser for Reserve Bank of India (RBI) content.
    Extracts policy statements, press releases, notifications, circulars,
    monetary rates, release/reference numbers, departments, and PDF links.
    """

    def parse(self, response: FetchResponse) -> ParsedContent:
        raw_html = response.text_content or (
            response.raw_content.decode(response.encoding or "utf-8", errors="ignore")
        )

        streaming_parser = RBIHTMLStreamingParser(base_url=response.url)
        try:
            streaming_parser.feed(raw_html)
            extracted = streaming_parser.get_extracted()
        except Exception:
            extracted = {
                "doc_title": "",
                "heading": "",
                "body": "",
                "pdf_links": [],
            }

        # 1. Resolve Title
        title = extracted["heading"] or extracted["doc_title"]
        if not title:
            h_match = re.search(r"<(?:h1|h2)[^>]*>(.*?)</(?:h1|h2)>", raw_html, re.I | re.DOTALL)
            if h_match:
                title = re.sub(r"<[^>]+>", " ", h_match.group(1)).strip()
            else:
                t_match = re.search(r"<title[^>]*>(.*?)</title>", raw_html, re.I | re.DOTALL)
                if t_match:
                    title = re.sub(r"<[^>]+>", " ", t_match.group(1)).strip()

        title = html.unescape(title or "").strip()
        title = re.sub(r"\s*-\s*Reserve Bank of India\s*$", "", title, flags=re.I)
        title = re.sub(r"\s*\|\s*Official Website of Reserve Bank of India\s*$", "", title, flags=re.I)
        title = re.sub(r"\s+", " ", title).strip()

        # 2. Extract PR Number / Reference Number
        pr_number = None
        pr_match = re.search(r"(?:Press Release|प्रेस प्रकाशनी|PR No|PR)[\s:]*([0-9]{4}-[0-9]{4}/[0-9]+)", raw_html, re.I)
        if pr_match:
            pr_number = pr_match.group(1).strip()
        else:
            ref_match = re.search(r"(?:RBI/\d{4}-\d{2,4}/\d+|Ref\.No\.[A-Za-z0-9./\-]+)", raw_html, re.I)
            if ref_match:
                pr_number = ref_match.group(0).strip()

        # 3. Extract Department
        department = None
        dept_match = re.search(r"<[^>]*class=[\"'][^\"']*department[^\"']*[\"'][^>]*>([^<]+)</", raw_html, re.I)
        if dept_match:
            department = re.sub(r"^(?:Department|विभाग)\s*[:\-]\s*", "", dept_match.group(1), flags=re.I).strip()
        if not department:
            dept_match2 = re.search(r"(?:Department|विभाग)\s*[:\-]\s*([A-Za-z\s&,\u0900-\u097F]+(?:Department|विभाग|Supervision|Regulation|Settlement))", raw_html, re.I)
            if dept_match2:
                department = dept_match2.group(1).strip()

        # 4. Extract Date
        published_at = None
        date_patterns = [
            r"<[^>]*class=[\"'][^\"']*(?:date|release-date)[^\"']*[\"'][^>]*>([^<]+)</",
            r"(?:Date|दिनांक)\s*[:\-]?\s*([A-Za-z]{3,9}\s+\d{1,2}[,\s]+\d{4})",
            r"(?:Date|दिनांक)\s*[:\-]?\s*(\d{1,2}\s+[A-Za-z]{3,9}[,\s]+\d{4})",
            r"(?:Date|दिनांक)\s*[:\-]?\s*(\d{1,2}[/.-]\d{1,2}[/.-]\d{4})",
            r"(\d{1,2}\s+(?:जनवरी|फ़रवरी|फरवरी|मार्च|अप्रैल|मई|जून|जुलाई|अगस्त|सितंबर|अक्टूबर|नवंबर|दिसंबर)\s+\d{4})",
            r"([A-Za-z]{3,9}\s+\d{1,2}[,\s]+\d{4})",
        ]
        for dp in date_patterns:
            dm = re.search(dp, raw_html, re.I)
            if dm:
                parsed_dt = parse_rbi_date(dm.group(1))
                if parsed_dt:
                    published_at = parsed_dt
                    break

        # 5. Sanitize Body Text
        body = extracted["body"] or raw_html
        body = html.unescape(body)

        cleaned_lines = []
        for line in body.splitlines():
            line_str = re.sub(r"\s+", " ", line).strip()
            if not line_str:
                continue
            if "Reserve Bank of India. All Rights Reserved" in line_str:
                continue
            if line_str in ("***", "**", "---", "--"):
                continue
            cleaned_lines.append(line_str)

        clean_text = "\n\n".join(cleaned_lines).strip()

        # 6. PDF Links
        pdf_links = extracted.get("pdf_links", [])
        seen_pdf = set()
        unique_pdf_links = []
        for pl in pdf_links:
            u = pl.get("url")
            if u and u not in seen_pdf:
                seen_pdf.add(u)
                unique_pdf_links.append(pl)

        # 7. Language
        detected_language = detect_language(f"{title} {clean_text[:600]}")

        # 8. Description Summary
        description = None
        if clean_text:
            first_p = clean_text.split("\n\n")[0]
            description = first_p[:277] + "..." if len(first_p) > 280 else first_p

        # 9. Structured Metadata
        metadata: Dict[str, Any] = {
            "adapter": "rbi",
            "status_code": response.status_code,
            "content_length": response.content_length,
            "encoding": response.encoding,
            "elapsed_ms": response.elapsed_ms,
            "pdf_processing": "DEFERRED",
            "pdf_links_count": len(unique_pdf_links),
            "language": detected_language,
        }
        if pr_number:
            metadata["reference_number"] = pr_number
        if department:
            metadata["department"] = department
        if unique_pdf_links:
            metadata["pdf_links"] = unique_pdf_links

        if not title:
            title = f"RBI Official Release ({pr_number})" if pr_number else "Reserve Bank of India Document"

        return ParsedContent(
            url=response.url,
            title=title,
            text=clean_text or title,
            description=description,
            language=detected_language,
            mime_type="text/html",
            published_at=published_at,
            metadata=metadata,
            extraction_method="RBI_ADAPTER",
        )
