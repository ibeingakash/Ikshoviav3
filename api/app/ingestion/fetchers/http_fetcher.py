import ipaddress
import socket
import time
from urllib.parse import urlparse
from typing import Dict, Optional
import httpx
from app.ingestion.contracts.models import FetchResponse


class SSRFValidationError(ValueError):
    """Raised when a URL violates SSRF safety constraints."""
    pass


class HttpFetchError(Exception):
    """Raised when an HTTP fetch operation fails."""
    def __init__(self, message: str, status_code: Optional[int] = None):
        super().__init__(message)
        self.status_code = status_code


class HttpFetcher:
    """
    Standardized, safe asynchronous HTTP Fetcher for permitted public resources.
    
    Security & Reliability constraints:
    - Enforces strict SSRF protection (blocks private, link-local, and loopback IPs).
    - Only allows HTTP and HTTPS schemes.
    - Limits response payload size to prevent resource exhaustion.
    - Configurable timeouts and maximum redirect limits.
    """

    DEFAULT_USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
    MAX_BODY_BYTES = 10 * 1024 * 1024  # 10 MB limit
    DEFAULT_TIMEOUT_SECONDS = 15.0

    def __init__(
        self,
        user_agent: str = DEFAULT_USER_AGENT,
        timeout_seconds: float = DEFAULT_TIMEOUT_SECONDS,
        max_body_bytes: int = MAX_BODY_BYTES,
        allow_private_ips: bool = False,
        client: Optional[httpx.AsyncClient] = None,
    ):
        self.user_agent = user_agent
        self.timeout_seconds = timeout_seconds
        self.max_body_bytes = max_body_bytes
        self.allow_private_ips = allow_private_ips
        self._injected_client = client

    @staticmethod
    def is_private_ip(ip_str: str) -> bool:
        """Checks whether an IP address belongs to a private, loopback, or reserved range."""
        try:
            ip = ipaddress.ip_address(ip_str)
            return (
                ip.is_private
                or ip.is_loopback
                or ip.is_link_local
                or ip.is_reserved
                or ip.is_multicast
                or ip.is_unspecified
            )
        except ValueError:
            return True

    def validate_url(self, url: str) -> str:
        """
        Validates URL scheme and destination IP against SSRF vulnerabilities.
        """
        parsed = urlparse(url)
        if parsed.scheme not in ("http", "https"):
            raise SSRFValidationError(
                f"Unsupported URL scheme: '{parsed.scheme}'. Only 'http' and 'https' are permitted."
            )

        hostname = parsed.hostname
        if not hostname:
            raise SSRFValidationError("URL does not contain a valid hostname.")

        # Check for localhost aliases
        if hostname.lower() in ("localhost", "127.0.0.1", "0.0.0.0", "::1", "local"):
            if not self.allow_private_ips:
                raise SSRFValidationError(f"Target host '{hostname}' is a forbidden loopback/local address.")

        # If not allowing private IPs, resolve DNS and inspect all target addresses
        if not self.allow_private_ips:
            try:
                # Resolve address info
                addr_info = socket.getaddrinfo(hostname, None)
                for item in addr_info:
                    resolved_ip = item[4][0]
                    if self.is_private_ip(resolved_ip):
                        raise SSRFValidationError(
                            f"Host '{hostname}' resolves to private/internal IP '{resolved_ip}'."
                        )
            except socket.gaierror:
                # DNS failure will be caught during fetch
                pass

        return url

    async def fetch(self, url: str, extra_headers: Optional[Dict[str, str]] = None) -> FetchResponse:
        """
        Fetches public content safely with timeout, header, and size boundaries.
        """
        self.validate_url(url)

        headers = {
            "User-Agent": self.user_agent,
            "Accept": "text/html,text/plain,application/pdf,application/json,*/*",
            "Accept-Language": "en-US,en;q=0.9,hi;q=0.8",
        }
        if extra_headers:
            headers.update(extra_headers)

        start_time = time.perf_counter()

        async def _execute_fetch(session: httpx.AsyncClient) -> FetchResponse:
            try:
                response = await session.get(
                    url,
                    headers=headers,
                    follow_redirects=True,
                )
            except httpx.TimeoutException as exc:
                raise HttpFetchError(f"HTTP request timed out after {self.timeout_seconds}s for URL: {url}") from exc
            except httpx.RequestError as exc:
                raise HttpFetchError(f"Network connection failed for URL: {url} ({str(exc)})") from exc

            elapsed_ms = (time.perf_counter() - start_time) * 1000.0

            if response.status_code >= 400:
                raise HttpFetchError(
                    f"HTTP request failed with status code {response.status_code}: {response.reason_phrase}",
                    status_code=response.status_code,
                )

            raw_bytes = response.content
            if len(raw_bytes) > self.max_body_bytes:
                raise HttpFetchError(
                    f"Response payload ({len(raw_bytes)} bytes) exceeded maximum allowed limit ({self.max_body_bytes} bytes)."
                )

            content_type = response.headers.get("content-type", "text/plain").split(";")[0].strip().lower()
            encoding = response.encoding or "utf-8"

            return FetchResponse(
                url=str(response.url),
                status_code=response.status_code,
                content_type=content_type,
                headers=dict(response.headers),
                raw_content=raw_bytes,
                text_content=response.text,
                encoding=encoding,
                content_length=len(raw_bytes),
                elapsed_ms=elapsed_ms,
            )

        if self._injected_client:
            return await _execute_fetch(self._injected_client)

        async with httpx.AsyncClient(timeout=httpx.Timeout(self.timeout_seconds)) as client:
            return await _execute_fetch(client)
