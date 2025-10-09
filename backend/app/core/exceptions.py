"""
Custom exception classes and error handling utilities.
"""

from typing import Any, Dict, Optional
from fastapi import HTTPException, status
from fastapi.responses import JSONResponse
import logging
import traceback
from datetime import datetime

logger = logging.getLogger(__name__)


class BasketballPerformanceException(Exception):
    """Base exception for Basketball Performance System."""
    
    def __init__(
        self, 
        message: str, 
        error_code: str = "GENERIC_ERROR",
        details: Optional[Dict[str, Any]] = None,
        status_code: int = 500
    ):
        self.message = message
        self.error_code = error_code
        self.details = details or {}
        self.status_code = status_code
        super().__init__(self.message)


class ValidationError(BasketballPerformanceException):
    """Validation error for input data."""
    
    def __init__(self, message: str, field: Optional[str] = None, details: Optional[Dict[str, Any]] = None):
        base_details = details or {}
        if field:
            base_details = {**base_details, "field": field}
        super().__init__(
            message=message,
            error_code="VALIDATION_ERROR",
            details=base_details,
            status_code=400
        )


class AuthenticationError(BasketballPerformanceException):
    """Authentication related errors."""
    
    def __init__(self, message: str = "Authentication failed", details: Optional[Dict[str, Any]] = None):
        super().__init__(
            message=message,
            error_code="AUTHENTICATION_ERROR",
            details=details,
            status_code=401
        )


class AuthorizationError(BasketballPerformanceException):
    """Authorization related errors."""
    
    def __init__(self, message: str = "Access denied", details: Optional[Dict[str, Any]] = None):
        super().__init__(
            message=message,
            error_code="AUTHORIZATION_ERROR",
            details=details,
            status_code=403
        )


class NotFoundError(BasketballPerformanceException):
    """Resource not found errors."""
    
    def __init__(self, resource: str, resource_id: Any, details: Optional[Dict[str, Any]] = None):
        super().__init__(
            message=f"{resource} with id '{resource_id}' not found",
            error_code="NOT_FOUND_ERROR",
            details={**(details or {}), "resource": resource, "resource_id": resource_id},
            status_code=404
        )


class DatabaseError(BasketballPerformanceException):
    """Database operation errors."""
    
    def __init__(self, message: str, operation: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(
            message=message,
            error_code="DATABASE_ERROR",
            details={**(details or {}), "operation": operation},
            status_code=500
        )


class ExternalServiceError(BasketballPerformanceException):
    """External service integration errors."""
    
    def __init__(self, service: str, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(
            message=f"External service '{service}' error: {message}",
            error_code="EXTERNAL_SERVICE_ERROR",
            details={**(details or {}), "service": service},
            status_code=502
        )


class RateLimitError(BasketballPerformanceException):
    """Rate limiting errors."""
    
    def __init__(self, message: str = "Rate limit exceeded", retry_after: Optional[int] = None):
        super().__init__(
            message=message,
            error_code="RATE_LIMIT_ERROR",
            details={"retry_after": retry_after} if retry_after else {},
            status_code=429
        )


def create_error_response(
    error: BasketballPerformanceException,
    request_id: Optional[str] = None,
    include_traceback: bool = False
) -> JSONResponse:
    """Create a standardized error response."""
    
    # Log the error with context
    logger.error(
        f"Error {error.error_code}: {error.message}",
        extra={
            "error_code": error.error_code,
            "status_code": error.status_code,
            "details": error.details,
            "request_id": request_id,
            "traceback": traceback.format_exc() if include_traceback else None
        }
    )
    
    # Create response body
    response_body = {
        "error": {
            "code": error.error_code,
            "message": error.message,
            "details": error.details,
            "timestamp": datetime.utcnow().isoformat(),
            "request_id": request_id
        }
    }
    
    # Add traceback in development
    if include_traceback:
        response_body["error"]["traceback"] = traceback.format_exc()
    
    return JSONResponse(
        status_code=error.status_code,
        content=response_body
    )


def handle_database_error(error: Exception, operation: str) -> BasketballPerformanceException:
    """Handle database errors and convert to standardized exceptions."""
    
    error_message = str(error)
    
    # Check for specific database error types
    if "UNIQUE constraint failed" in error_message:
        return ValidationError(
            message="Resource already exists",
            details={"constraint": "unique", "operation": operation}
        )
    elif "FOREIGN KEY constraint failed" in error_message:
        return ValidationError(
            message="Referenced resource does not exist",
            details={"constraint": "foreign_key", "operation": operation}
        )
    elif "NOT NULL constraint failed" in error_message:
        return ValidationError(
            message="Required field is missing",
            details={"constraint": "not_null", "operation": operation}
        )
    else:
        return DatabaseError(
            message=f"Database operation failed: {error_message}",
            operation=operation,
            details={"original_error": error_message}
        )


def handle_validation_error(error: Exception, field: Optional[str] = None) -> BasketballPerformanceException:
    """Handle validation errors and convert to standardized exceptions."""
    
    return ValidationError(
        message=str(error),
        field=field,
        details={"original_error": str(error)}
    )


def handle_external_service_error(service: str, error: Exception) -> BasketballPerformanceException:
    """Handle external service errors and convert to standardized exceptions."""
    
    return ExternalServiceError(
        service=service,
        message=str(error),
        details={"original_error": str(error)}
    )

