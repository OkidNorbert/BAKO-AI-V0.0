import asyncio
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse, Response


class TimeoutMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, timeout_seconds: int):
        super().__init__(app)
        self.timeout_seconds = timeout_seconds

    async def dispatch(self, request: Request, call_next) -> Response:
        try:
            return await asyncio.wait_for(call_next(request), timeout=self.timeout_seconds)
        except TimeoutError:
            return JSONResponse(
                status_code=504,
                content={"error": "Request timed out", "details": {"timeout_seconds": self.timeout_seconds}},
            )
