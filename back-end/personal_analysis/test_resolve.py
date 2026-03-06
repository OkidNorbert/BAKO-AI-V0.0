import os
import logging
from app.config import get_settings

logger = logging.getLogger("test")

settings = get_settings()

_BACKEND_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
print(f"DEBUG: _BACKEND_ROOT = {_BACKEND_ROOT}")

def _resolve_model_path(path: str) -> str:
    if os.path.isabs(path):
        return path
    full_path = os.path.abspath(os.path.join(_BACKEND_ROOT, path))
    print(f"DEBUG: checking {full_path} -> {os.path.exists(full_path)}")
    if os.path.exists(full_path):
        return full_path
    
    hardcoded_root = "/home/student/Music/OKIDI-DON'T TOUCH/BAKO-AI-V0.0/back-end"
    safe_path = os.path.abspath(os.path.join(hardcoded_root, path))
    print(f"DEBUG: checking fallback {safe_path} -> {os.path.exists(safe_path)}")
    if os.path.exists(safe_path):
        return safe_path
    return full_path

rim = _resolve_model_path(settings.swish_ball_rim_model)
print(f"FINAL RESOLVED: {rim}")
