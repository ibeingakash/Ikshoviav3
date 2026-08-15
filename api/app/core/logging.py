import logging
import sys
import time
from typing import Callable
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware


def setup_logging(debug: bool = True) -> logging.Logger:
    """Configures structured, security-safe logging."""
    log_level = logging.DEBUG if debug else logging.INFO
    
    # Configure root logger
    logging.basicConfig(
        level=log_level,
        format="%(asctime)s | %(levelname)-8s | %(name)s:%(funcName)s:%(lineno)d | %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
        handlers=[logging.StreamHandler(sys.stdout)],
        force=True,
    )
    
    # Silence noisy third-party loggers
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
    logging.getLogger("asyncio").setLevel(logging.WARNING)
    
    logger = logging.getLogger("ikshovia.data_api")
    logger.setLevel(log_level)
    return logger


logger = setup_logging()


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """Logs incoming HTTP requests with latency while sanitizing sensitive details."""

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        start_time = time.perf_counter()
        
        # Redact any authorization tokens or sensitive headers
        client_host = request.client.host if request.client else "unknown"
        method = request.method
        path = request.url.path
        
        try:
            response = await call_next(request)
            duration_ms = (time.perf_counter() - start_time) * 1000
            
            # Log response summary
            logger.info(
                f"{method} {path} - {response.status_code} ({duration_ms:.2f}ms) [client: {client_host}]"
            )
            return response
        except Exception as exc:
            duration_ms = (time.perf_counter() - start_time) * 1000
            logger.error(
                f"Unhandled exception on {method} {path} after {duration_ms:.2f}ms: {str(exc)}",
                exc_info=False
            )
            raise
