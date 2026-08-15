from typing import Any, Dict, List, Optional
from fastapi import Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from app.core.logging import logger


class DataAPIException(Exception):
    """Base exception for all IKSHOVIA Data API errors."""
    def __init__(
        self,
        message: str,
        code: str = "INTERNAL_ERROR",
        status_code: int = status.HTTP_500_INTERNAL_SERVER_ERROR,
        details: Optional[Any] = None,
    ):
        super().__init__(message)
        self.message = message
        self.code = code
        self.status_code = status_code
        self.details = details


class EntityNotFoundError(DataAPIException):
    def __init__(self, entity_name: str, identifier: Any):
        super().__init__(
            message=f"{entity_name} with identifier '{identifier}' was not found.",
            code="ENTITY_NOT_FOUND",
            status_code=status.HTTP_404_NOT_FOUND,
            details={"entity": entity_name, "identifier": str(identifier)},
        )


class DuplicateEntityError(DataAPIException):
    def __init__(self, entity_name: str, field: str, value: Any):
        super().__init__(
            message=f"{entity_name} with {field} '{value}' already exists.",
            code="DUPLICATE_ENTITY",
            status_code=status.HTTP_409_CONFLICT,
            details={"entity": entity_name, "field": field, "value": str(value)},
        )


class InvalidParameterError(DataAPIException):
    def __init__(self, message: str, details: Optional[Any] = None):
        super().__init__(
            message=message,
            code="INVALID_PARAMETER",
            status_code=status.HTTP_400_BAD_REQUEST,
            details=details,
        )


class DatabaseConnectionError(DataAPIException):
    def __init__(self, message: str = "Database operation failed."):
        super().__init__(
            message=message,
            code="DATABASE_ERROR",
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        )


def format_error_response(
    code: str,
    message: str,
    details: Optional[Any] = None,
    status_code: int = 400,
) -> JSONResponse:
    """Generates uniform, structured API error payloads."""
    payload = {
        "success": False,
        "error": {
            "code": code,
            "message": message,
            "details": details,
        }
    }
    return JSONResponse(status_code=status_code, content=payload)


async def data_api_exception_handler(request: Request, exc: DataAPIException) -> JSONResponse:
    logger.warning(f"Handled API error [{exc.code}] on {request.method} {request.url.path}: {exc.message}")
    return format_error_response(
        code=exc.code,
        message=exc.message,
        details=exc.details,
        status_code=exc.status_code,
    )


async def validation_exception_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
    errors = []
    for err in exc.errors():
        field_loc = " -> ".join([str(x) for x in err.get("loc", []) if x != "body"])
        errors.append({
            "field": field_loc or "body",
            "message": err.get("msg"),
            "type": err.get("type"),
        })
    
    logger.info(f"Validation failed on {request.method} {request.url.path}: {errors}")
    return format_error_response(
        code="VALIDATION_ERROR",
        message="Request body or parameters failed schema validation.",
        details=errors,
        status_code=422,
    )


async def sqlalchemy_integrity_handler(request: Request, exc: IntegrityError) -> JSONResponse:
    logger.error(f"SQLAlchemy IntegrityError on {request.method} {request.url.path}: {str(exc.orig)}")
    err_str = str(exc.orig).lower()
    
    if "unique constraint" in err_str or "duplicate key" in err_str:
        return format_error_response(
            code="DUPLICATE_ENTITY",
            message="A record with unique constraint violation already exists.",
            status_code=status.HTTP_409_CONFLICT,
        )
    elif "foreign key" in err_str:
        return format_error_response(
            code="INVALID_FOREIGN_KEY",
            message="Referenced parent entity does not exist.",
            status_code=status.HTTP_400_BAD_REQUEST,
        )
    
    return format_error_response(
        code="DATABASE_INTEGRITY_ERROR",
        message="The database rejected the requested transaction.",
        status_code=status.HTTP_400_BAD_REQUEST,
    )


async def general_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    logger.error(f"Unhandled system error on {request.method} {request.url.path}: {type(exc).__name__}: {str(exc)}")
    return format_error_response(
        code="INTERNAL_SERVER_ERROR",
        message="An unexpected internal error occurred. Please retry shortly.",
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
    )
