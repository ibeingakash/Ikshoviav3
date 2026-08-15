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


def parse_upsc_date(raw_text: str) -> Optional[datetime]:
    """
    Parses UPSC date strings in standard Indian official formats:
    - '14/02/2024' or '14-02-2024' or '14.02.2024'
    - '14 Feb 2024' or '14-Feb-2024' or '14 February 2024'
    - '2024-02-14'
    """
    if not raw_text:
        return None

    clean = re.sub(r"\s+", " ", raw_text).strip()

    # Pattern 1: DD/MM/YYYY or DD-MM-YYYY or DD.MM.YYYY
    m1 = re.search(r"(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})", clean)
    if m1:
        d, m, y = m1.groups()
        try:
            return datetime(int(y), int(m), int(d))
        except Exception:
            pass

    # Pattern 2: DD Mon YYYY / DD-Mon-YYYY (e.g. 14 Feb 2024 or 14-February-2024)
    m2 = re.search(r"(\d{1,2})[\s-]+([A-Za-z]{3,9})[\s-]+(\d{4})", clean)
    if m2:
        d, mon, y = m2.groups()
        mon_abbr = mon[:3].title()
        try:
            return datetime.strptime(f"{d} {mon_abbr} {y}", "%d %b %Y")
        except Exception:
            pass

    # Pattern 3: YYYY-MM-DD
    m3 = re.search(r"(\d{4})-(\d{2})-(\d{2})", clean)
    if m3:
        y, m, d = m3.groups()
        try:
            return datetime(int(y), int(m), int(d))
        except Exception:
            pass

    return None


class UPSCHTMLStreamingParser(HTMLParser):
    """
    Streaming HTML parser tailored for Union Public Service Commission (UPSC) web pages.
    Extracts high-fidelity official tables, notices, examination announcements, dates,
    and associated PDF links while filtering out navigation bars, menus, sidebars, and footers.
    """

    def __init__(self, base_url: str):
        super().__init__()
        self.base_url = base_url
        self._in_script_or_style = False
        self._in_title_tag = False
        self._in_h1 = False
        self._in_breadcrumb = False
        self._in_table = False
        self._in_th = False
        self._in_td = False
        self._ignored_depth = 0

        # Current table state
        self._current_row: List[str] = []
        self._current_cell: List[str] = []

        # Discovered chrome / navigation identifiers
        self._ignore_classes = {
            "header",
            "region-header",
            "top-header",
            "site-header",
            "navbar",
            "navbar-nav",
            "menu",
            "main-menu",
            "menu-block",
            "navigation",
            "region-sidebar-first",
            "region-sidebar-second",
            "sidebar",
            "footer",
            "region-footer",
            "site-footer",
            "copyright",
            "accessibility-bar",
            "skip-link",
            "font-resizer",
            "screen-reader",
            "theme-switcher",
            "social-share",
            "share-buttons",
            "share-this",
            "quick-links",
            "search-block",
            "search-form",
            "block-search",
        }
        self._ignore_ids = {
            "header",
            "main-menu",
            "navigation",
            "sidebar-first",
            "sidebar-second",
            "footer",
            "social-share",
            "accessibility-bar",
            "search-block",
        }

        # Extracted components
        self.doc_title_chunks: List[str] = []
        self.h1_title_chunks: List[str] = []
        self.breadcrumb_chunks: List[str] = []
        self.body_chunks: List[str] = []
        self.pdf_links: List[Dict[str, str]] = []
        self._current_a_href: Optional[str] = None
        self._current_a_text: List[str] = []

    def handle_starttag(self, tag: str, attrs: list):
        tag_lower = tag.lower()
        attr_dict = {k.lower(): (v or "") for k, v in attrs}
        classes = attr_dict.get("class", "").lower()
        elem_id = attr_dict.get("id", "").lower()

        if tag_lower in ("script", "style", "noscript", "svg", "iframe"):
            self._in_script_or_style = True
            return

        # Check ignored container hierarchy
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

        # Inspect Links for PDF detection
        if tag_lower == "a":
            href = attr_dict.get("href", "").strip()
            if href:
                self._current_a_href = href
                self._current_a_text = []

        # Structural tag tracking
        if tag_lower == "title":
            self._in_title_tag = True
        elif tag_lower == "h1" or "page-title" in classes or elem_id == "page-title":
            self._in_h1 = True
        elif "breadcrumb" in classes or elem_id == "breadcrumb":
            self._in_breadcrumb = True
        elif tag_lower == "table":
            self._in_table = True
            self.body_chunks.append("\n\n")
        elif tag_lower == "tr":
            self._current_row = []
        elif tag_lower in ("th", "td"):
            if tag_lower == "th":
                self._in_th = True
            else:
                self._in_td = True
            self._current_cell = []
        elif tag_lower in ("p", "br", "div", "h2", "h3", "h4", "h5", "h6", "li", "article", "section", "blockquote"):
            self.body_chunks.append("\n")

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
                # Check if href is a PDF file
                parsed_href = urllib.parse.urlparse(href)
                if parsed_href.path.lower().endswith(".pdf") or "pdf" in href.lower():
                    # Resolve relative URL
                    full_pdf_url = urllib.parse.urljoin(self.base_url, href)
                    self.pdf_links.append({
                        "url": full_pdf_url,
                        "title": link_text or "PDF Document",
                        "mime_type": "application/pdf",
                    })
                self._current_a_href = None
                self._current_a_text = []

        if tag_lower == "title":
            self._in_title_tag = False
        elif tag_lower == "h1":
            self._in_h1 = False
        elif self._in_breadcrumb and tag_lower in ("div", "nav", "ol", "ul"):
            self._in_breadcrumb = False
        elif tag_lower in ("th", "td"):
            cell_text = re.sub(r"\s+", " ", " ".join(self._current_cell)).strip()
            self._current_row.append(cell_text)
            self._in_th = False
            self._in_td = False
        elif tag_lower == "tr":
            if self._current_row:
                row_str = " | ".join(filter(None, self._current_row))
                if row_str.strip():
                    self.body_chunks.append(f"{row_str}\n")
            self._current_row = []
        elif tag_lower == "table":
            self._in_table = False
            self.body_chunks.append("\n")
        elif tag_lower in ("p", "div", "h2", "h3", "h4", "h5", "h6", "li", "article", "section", "blockquote"):
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
        elif self._in_h1:
            self.h1_title_chunks.append(cleaned)
        elif self._in_breadcrumb:
            self.breadcrumb_chunks.append(cleaned)
        elif self._in_th or self._in_td:
            self._current_cell.append(cleaned)
        else:
            self.body_chunks.append(f" {cleaned} ")

    def get_extracted(self) -> Dict[str, Any]:
        return {
            "doc_title": " ".join(self.doc_title_chunks).strip(),
            "h1_title": " ".join(self.h1_title_chunks).strip(),
            "breadcrumb": " > ".join(self.breadcrumb_chunks).strip(),
            "body": "".join(self.body_chunks),
            "pdf_links": self.pdf_links,
        }


class UPSCParser(BaseParser):
    """
    Dedicated parser for Union Public Service Commission (UPSC) official web pages.
    Extracts examination lists, calendar schedules, previous paper indices,
    official notices, dates, structured tables, and PDF references.
    """

    # Category mappings based on known UPSC URL structures
    CATEGORY_MAPPING = {
        "active-exams": ("Active Examinations", "EXAM_LIST"),
        "forthcoming-exams": ("Forthcoming Examinations", "EXAM_LIST"),
        "previous-question-papers": ("Previous Question Papers", "QUESTION_PAPERS"),
        "examination-calendar": ("Examination Calendar", "CALENDAR"),
        "revised-syllabus-scheme": ("Revised Syllabus & Scheme", "SYLLABUS"),
        "cut-off-marks": ("Cut-off Marks", "CUT_OFF"),
        "answer-keys": ("Answer Keys", "ANSWER_KEYS"),
        "marks-information": ("Marks Information", "MARKS_INFO"),
        "whats-new": ("What's New / Announcements", "NOTICES"),
        "recruitment-advertisement": ("Recruitment Advertisements", "RECRUITMENT"),
        "recruitment": ("Recruitment", "RECRUITMENT"),
        "examinations": ("Examinations", "EXAMINATION"),
    }

    def parse(self, response: FetchResponse) -> ParsedContent:
        raw_html = response.text_content or (
            response.raw_content.decode(response.encoding or "utf-8", errors="ignore")
        )

        streaming_parser = UPSCHTMLStreamingParser(base_url=response.url)
        try:
            streaming_parser.feed(raw_html)
            extracted = streaming_parser.get_extracted()
        except Exception:
            extracted = {
                "doc_title": "",
                "h1_title": "",
                "breadcrumb": "",
                "body": "",
                "pdf_links": [],
            }

        # 1. Resolve Title
        title = extracted["h1_title"]
        if not title:
            # Check for <h1 class="page-title"> via regex
            h1_match = re.search(r"<h1[^>]*>(.*?)</h1>", raw_html, re.I | re.DOTALL)
            if h1_match:
                title = re.sub(r"<[^>]+>", " ", h1_match.group(1)).strip()
            elif extracted["doc_title"]:
                title = extracted["doc_title"]
            else:
                doc_t_match = re.search(r"<title[^>]*>(.*?)</title>", raw_html, re.I | re.DOTALL)
                if doc_t_match:
                    title = re.sub(r"<[^>]+>", " ", doc_t_match.group(1)).strip()

        # Clean UPSC title chrome e.g. " | UPSC", " | Union Public Service Commission"
        title = html.unescape(title or "").strip()
        title = re.sub(r"\s*\|\s*(?:UPSC|Union Public Service Commission|संघ लोक सेवा आयोग)\s*$", "", title, flags=re.I)
        title = re.sub(r"\s+", " ", title).strip()

        # 2. Derive Category & Document Type from URL and Breadcrumbs
        parsed_url = urllib.parse.urlparse(response.url)
        url_path = parsed_url.path.lower()

        category = None
        document_type = "WEBPAGE"
        for path_key, (cat_name, doc_t) in self.CATEGORY_MAPPING.items():
            if path_key in url_path:
                category = cat_name
                document_type = doc_t
                break

        if not category and extracted["breadcrumb"]:
            parts = [p.strip() for p in extracted["breadcrumb"].split(">") if p.strip()]
            if len(parts) > 1:
                category = parts[-1]

        # 3. Detect Examination Names
        # Look for standard UPSC exam names in title or body text
        examination = None
        known_exam_patterns = [
            r"Civil Services\s+(?:\([^)]*\)\s+)?Examination[,\s]*\d{4}",
            r"National Defence Academy and Naval Academy\s+Examination[,\s]*\d{4}",
            r"Combined Defence Services\s+Examination[,\s]*\d{4}",
            r"Engineering Services\s+(?:\([^)]*\)\s+)?Examination[,\s]*\d{4}",
            r"Combined Geo-Scientist\s+(?:\([^)]*\)\s+)?Examination[,\s]*\d{4}",
            r"Indian Forest Service\s+(?:\([^)]*\)\s+)?Examination[,\s]*\d{4}",
            r"Combined Medical Services\s+Examination[,\s]*\d{4}",
            r"Central Armed Police Forces\s+\(ACs\)\s+Examination[,\s]*\d{4}",
            r"Special Class Railway Apprentices['\s]*Examination[,\s]*\d{4}",
            r"Indian Economic Service/Indian Statistical Service Examination[,\s]*\d{4}",
        ]
        full_search_text = f"{title} {extracted['body'][:2000]}"
        for pattern in known_exam_patterns:
            exam_match = re.search(pattern, full_search_text, re.IGNORECASE)
            if exam_match:
                examination = exam_match.group(0).strip()
                break

        # 4. Detect Publication / Notification Date
        published_at = None
        # Look for date patterns in the page content
        date_patterns = [
            r"(?:Date of Notification|Notification Date|Published Date|Posted Date|Date)\s*[:\-]?\s*(\d{1,2}[/.-]\d{1,2}[/.-]\d{4})",
            r"(?:Date of Notification|Notification Date|Published Date|Posted Date|Date)\s*[:\-]?\s*(\d{1,2}\s+[A-Za-z]{3,9}\s+\d{4})",
            r"(\d{1,2}/\d{1,2}/\d{4})",
            r"(\d{1,2}-\d{1,2}-\d{4})",
        ]
        for dp in date_patterns:
            dm = re.search(dp, extracted["body"] or raw_html, re.IGNORECASE)
            if dm:
                parsed_dt = parse_upsc_date(dm.group(1))
                if parsed_dt:
                    published_at = parsed_dt
                    break

        # 5. Sanitize and Format Body Text
        body = extracted["body"]
        if not body:
            # Fallback regex extraction of text inside region-content or body
            content_match = re.search(
                r"<div[^>]*class=[\"'][^\"']*(?:region-content|content-area|node__content)[^\"']*[\"'][^>]*>(.*?)</div>",
                raw_html,
                re.I | re.DOTALL,
            )
            if content_match:
                body = re.sub(r"<[^>]+>", " ", content_match.group(1))
            else:
                body = re.sub(r"<[^>]+>", " ", raw_html)

        body = html.unescape(body)

        # Filter lines and discard common footer boilerplate
        cleaned_lines = []
        for line in body.splitlines():
            line_str = re.sub(r"\s+", " ", line).strip()
            if not line_str:
                continue
            # Remove disclaimer / copyright lines
            if "Website Contents Provided and Maintained by" in line_str:
                continue
            if "Designed, Developed and Hosted by National Informatics Centre" in line_str:
                continue
            if line_str in ("***", "**", "---", "--"):
                continue
            cleaned_lines.append(line_str)

        clean_text = "\n\n".join(cleaned_lines).strip()

        # 6. PDF Links Detection (Preserve URLs in metadata, defer binary extraction)
        pdf_links = extracted.get("pdf_links", [])
        # De-duplicate PDF links by URL
        seen_pdf_urls = set()
        unique_pdf_links = []
        for pl in pdf_links:
            p_url = pl.get("url")
            if p_url and p_url not in seen_pdf_urls:
                seen_pdf_urls.add(p_url)
                unique_pdf_links.append(pl)

        # 7. Language Detection
        detected_language = detect_language(f"{title} {clean_text[:600]}")

        # 8. Description Summary
        description = None
        if clean_text:
            first_p = clean_text.split("\n\n")[0]
            if len(first_p) > 280:
                description = first_p[:277] + "..."
            else:
                description = first_p

        # 9. Structured Metadata
        metadata: Dict[str, Any] = {
            "adapter": "upsc",
            "status_code": response.status_code,
            "content_length": response.content_length,
            "encoding": response.encoding,
            "elapsed_ms": response.elapsed_ms,
            "document_type": document_type,
            "pdf_processing": "DEFERRED",
            "pdf_links_count": len(unique_pdf_links),
            "language": detected_language,
        }
        if category:
            metadata["category"] = category
        if examination:
            metadata["examination"] = examination
        if extracted["breadcrumb"]:
            metadata["breadcrumb"] = extracted["breadcrumb"]
        if unique_pdf_links:
            metadata["pdf_links"] = unique_pdf_links

        if not title:
            title = f"UPSC Official Document ({category})" if category else "UPSC Official Document"

        return ParsedContent(
            url=response.url,
            title=title,
            text=clean_text or title,
            description=description,
            language=detected_language,
            mime_type="text/html",
            published_at=published_at,
            metadata=metadata,
            extraction_method="UPSC_ADAPTER",
        )
