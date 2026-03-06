import os
from app.config import get_settings

settings = get_settings()
print(f"DEBUG: settings.swish_ball_rim_model = {settings.swish_ball_rim_model}")

_BACKEND_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

def _resolve_model_path(path: str) -> str:
    if os.path.isabs(path):
        return path
    return os.path.abspath(os.path.join(_BACKEND_ROOT, path))

resolved = _resolve_model_path(settings.swish_ball_rim_model)
print(f"DEBUG: Resolved path = {resolved}")
print(f"DEBUG: File exists? {os.path.exists(resolved)}")
