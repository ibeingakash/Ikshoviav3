import re
from typing import List, Optional, Set, Tuple

# Common stop words to avoid artificial over-weighting in lexical coverage
STOP_WORDS: Set[str] = {
    "a", "an", "the", "and", "or", "but", "if", "then", "else", "when",
    "at", "by", "for", "with", "about", "against", "between", "into", "through",
    "during", "before", "after", "above", "below", "to", "from", "up", "down",
    "in", "out", "on", "off", "over", "under", "again", "further", "then",
    "once", "here", "there", "where", "why", "how", "all", "any", "both",
    "each", "few", "more", "most", "other", "some", "such", "no", "nor", "not",
    "only", "own", "same", "so", "than", "too", "very", "can", "will", "just",
    "don", "should", "now", "is", "are", "was", "were", "be", "been", "being",
    "have", "has", "had", "do", "does", "did", "of"
}


def tokenize(text: Optional[str], remove_stopwords: bool = False) -> List[str]:
    """
    Extracts normalized alphanumeric tokens from text.
    Lowercases and splits on whitespace/punctuation.
    """
    if not text:
        return []
    # Match alphanumeric sequences (including digits and hyphens inside words)
    tokens = [t.lower() for t in re.findall(r"[A-Za-z0-9]+", text)]
    if remove_stopwords and len(tokens) > 1:
        filtered = [t for t in tokens if t not in STOP_WORDS]
        return filtered if filtered else tokens
    return tokens


def extract_snippet(
    text: Optional[str],
    query: str,
    max_length: int = 300,
    prefix_chars: int = 50,
) -> str:
    """
    Extracts a concise, safe excerpt centered around the matched query phrase or terms.
    Adds ellipses when the text is truncated before or after the snippet window.
    """
    if not text:
        return ""

    # Normalize whitespace
    clean = " ".join(text.split())
    if len(clean) <= max_length:
        return clean

    clean_lower = clean.lower()
    query_lower = query.lower().strip()

    # 1. Try to find the exact full query phrase
    match_start = clean_lower.find(query_lower)

    # 2. If exact phrase not found, find the first matching token
    if match_start == -1:
        tokens = tokenize(query, remove_stopwords=True)
        earliest_pos = -1
        for token in tokens:
            pos = clean_lower.find(token)
            if pos != -1 and (earliest_pos == -1 or pos < earliest_pos):
                earliest_pos = pos
        match_start = earliest_pos if earliest_pos != -1 else 0

    # 3. Compute snippet boundaries around the match position
    start_pos = max(0, match_start - prefix_chars)
    end_pos = min(len(clean), start_pos + max_length)

    # Adjust window if end reached boundary
    if end_pos - start_pos < max_length and start_pos > 0:
        start_pos = max(0, end_pos - max_length)

    # Snap to clean word boundaries
    if start_pos > 0:
        next_space = clean.find(" ", start_pos)
        if next_space != -1 and next_space < start_pos + 20:
            start_pos = next_space + 1

    if end_pos < len(clean):
        prev_space = clean.rfind(" ", start_pos, end_pos)
        if prev_space != -1 and prev_space > end_pos - 20:
            end_pos = prev_space

    snippet = clean[start_pos:end_pos].strip()

    # Add ellipses
    if start_pos > 0:
        snippet = f"...{snippet}"
    if end_pos < len(clean):
        snippet = f"{snippet}..."

    return snippet


def calculate_relevance_score(
    query: str,
    title: Optional[str],
    body: Optional[str],
    meta_text: Optional[str] = None,
    entity_type: str = "question",
) -> float:
    """
    Calculates an explainable, deterministic relevance score between 0.0 and 1.0.

    Scoring Logic:
    1. Exact Phrase Matching (High Weight):
       - Exact query phrase in title: +0.40
       - Exact query phrase in body: +0.25
       - Exact query phrase in meta: +0.15
    2. Token Coverage (Fraction of query keywords found):
       - Tokens in title: up to +0.35
       - Tokens in body: up to +0.20
       - Tokens in meta: up to +0.10
    3. Perfect Title Match:
       - Exact case-insensitive match of title == query: +0.20
    4. Base Entity Priority:
       - question / document: +0.05
       - chunk: +0.03
       - tag: +0.02
    5. Capping & Normalization:
       - Raw sum bounded in [0.05, 1.00], rounded to 3 decimal places.
    """
    clean_query = query.lower().strip()
    if not clean_query:
        return 0.0

    title_str = (title or "").lower()
    body_str = (body or "").lower()
    meta_str = (meta_text or "").lower()

    score = 0.0

    # Base entity type weighting
    if entity_type in ("question", "document"):
        score += 0.05
    elif entity_type == "chunk":
        score += 0.03
    elif entity_type == "tag":
        score += 0.02

    # 1. Exact Match on whole title
    if title_str.strip() == clean_query:
        score += 0.20

    # 2. Exact Phrase Match
    if clean_query in title_str:
        score += 0.40
    elif clean_query in body_str:
        score += 0.25
    elif meta_str and clean_query in meta_str:
        score += 0.15

    # 3. Token Coverage
    query_tokens = tokenize(clean_query, remove_stopwords=False)
    if query_tokens:
        total_tokens = len(query_tokens)
        title_tokens = set(tokenize(title_str, remove_stopwords=False))
        body_tokens = set(tokenize(body_str, remove_stopwords=False))
        meta_tokens = set(tokenize(meta_str, remove_stopwords=False))

        title_matches = sum(1 for t in query_tokens if t in title_tokens)
        body_matches = sum(1 for t in query_tokens if t in body_tokens)
        meta_matches = sum(1 for t in query_tokens if t in meta_tokens)

        score += (title_matches / total_tokens) * 0.35
        score += (body_matches / total_tokens) * 0.20
        score += (meta_matches / total_tokens) * 0.10

    # Minimum floor for any matching item
    score = max(0.05, min(1.0, score))
    return round(score, 3)
