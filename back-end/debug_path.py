from app.config import get_settings
import os

settings = get_settings()

# Same logic as pipeline.py
_BACKEND_ROOT = os.path.dirname(os.path.abspath(__file__))

def _resolve_model_path(path: str) -> str:
    """Safely resolve model path relative to backend root."""
    if os.path.isabs(path):
        return path
    return os.path.abspath(os.path.join(_BACKEND_ROOT, path))

res_rim = _resolve_model_path(settings.swish_ball_rim_model)
res_pose = _resolve_model_path(settings.swish_pose_model)

print(f"RES_RIM: {res_rim}")
print(f"Exists: {os.path.exists(res_rim)}")
print(f"RES_POSE: {res_pose}")
print(f"Exists: {os.path.exists(res_pose)}")
