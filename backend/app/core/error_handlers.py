"""
Global error handlers for the FastAPI application.
"""

from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from sqlalchemy.exc import SQLAlchemyError, IntegrityError
import logging
import traceback
from datetime import datetime
from typing import Any, Dict

from .exceptions import (
    BasketballPerformanceException,
    ValidationError,
    AuthenticationError,
    AuthorizationError,
    NotFoundError,
    DatabaseError,
    ExternalServiceError,
    RateLimitError,
    create_error_response,
    handle_database_error,
    handle_validation_error,
    handle_external_service_error
)

logger = logging.getLogger(__name__)


def setup_error_handlers(app: FastAPI) -> None:
    """Setup global error handlers for the FastAPI application."""
    
    @app.exception_handler(BasketballPerformanceException)
    async def basketball_performance_exception_handler(
        request: Request, 
        exc: BasketballPerformanceException
    ) -> JSONResponse:
        """Handle custom Basketball Performance System exceptions."""
        request_id = getattr(request.state, 'request_id', None)
        return create_error_response(exc, request_id)
    
    @app.exception_handler(HTTPException)
    async def http_exception_handler(request: Request, exc: HTTPException) -> JSONResponse:
        """Handle FastAPI HTTP exceptions."""
        request_id = getattr(request.state, 'request_id', None)
        
        # Convert HTTPException to BasketballPerformanceException
        if exc.status_code == 401:
            error = AuthenticationError(exc.detail)
        elif exc.status_code == 403:
            error = AuthorizationError(exc.detail)
        elif exc.status_code == 404:
            error = NotFoundError("Resource", "unknown")
        else:
            error = BasketballPerformanceException(
                message=exc.detail,
                error_code="HTTP_ERROR",
                status_code=exc.status_code
            )
        
        return create_error_response(error, request_id)
    
    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(
        request: Request, 
        exc: RequestValidationError
    ) -> JSONResponse:
        """Handle request validation errors."""
        request_id = getattr(request.state, 'request_id', None)
        
        # Extract field-specific validation errors
        validation_errors = []
        for error in exc.errors():
            field = " -> ".join(str(loc) for loc in error["loc"])
            validation_errors.append({
                "field": field,
                "message": error["msg"],
                "type": error["type"]
            })
        
        error = ValidationError(
            message="Request validation failed",
            details={"validation_errors": validation_errors}
        )
        
        return create_error_response(error, request_id)
    
    @app.exception_handler(SQLAlchemyError)
    async def sqlalchemy_exception_handler(
        request: Request, 
        exc: SQLAlchemyError
    ) -> JSONResponse:
        """Handle SQLAlchemy database errors."""
        request_id = getattr(request.state, 'request_id', None)
        
        # Log the full error for debugging
        logger.error(f"Database error: {exc}", exc_info=True)
        
        # Convert to standardized error
        if isinstance(exc, IntegrityError):
            error = ValidationError(
                message="Database integrity constraint violated",
                details={"constraint_error": str(exc.orig) if hasattr(exc, 'orig') else str(exc)}
            )
        else:
            error = DatabaseError(
                message="Database operation failed",
                operation="unknown",
                details={"original_error": str(exc)}
            )
        
        return create_error_response(error, request_id)
    
    @app.exception_handler(Exception)
    async def general_exception_handler(request: Request, exc: Exception) -> JSONResponse:
        """Handle all other unhandled exceptions."""
        request_id = getattr(request.state, 'request_id', None)
        
        # Log the full error for debugging
        logger.error(f"Unhandled exception: {exc}", exc_info=True)
        
        # Create a generic error response
        error = BasketballPerformanceException(
            message="An unexpected error occurred",
            error_code="INTERNAL_SERVER_ERROR",
            details={"original_error": str(exc)},
            status_code=500
        )
        
        return create_error_response(error, request_id, include_traceback=True)


def create_success_response(
    data: Any,
    message: str = "Success",
    status_code: int = 200,
    meta: Dict[str, Any] = None
) -> JSONResponse:
    """Create a standardized success response."""
    
    response_body = {
        "success": True,
        "message": message,
        "data": data,
        "timestamp": datetime.utcnow().isoformat()
    }
    
    if meta:
        response_body["meta"] = meta
    
    return JSONResponse(
        status_code=status_code,
        content=response_body
    )


def create_paginated_response(
    data: list,
    total: int,
    page: int,
    limit: int,
    message: str = "Success"
) -> JSONResponse:
    """Create a standardized paginated response."""
    
    total_pages = (total + limit - 1) // limit
    
    response_body = {
        "success": True,
        "message": message,
        "data": data,
        "pagination": {
            "page": page,
            "limit": limit,
            "total": total,
            "total_pages": total_pages,
            "has_next": page < total_pages,
            "has_prev": page > 1
        },
        "timestamp": datetime.utcnow().isoformat()
    }
    
    return JSONResponse(
        status_code=200,
        content=response_body
    )
