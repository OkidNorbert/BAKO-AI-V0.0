"""
Personal Analysis Pipeline Service.

Wraps the swiss basketball shot analysis algorithm and exposes
a single async-friendly entry point: run_personal_analysis().

This is completely separate from the team YOLO analysis pipeline.
"""
import os
import cv2
import uuid
import asyncio
import logging
import traceback
from typing import List, Optional
from concurrent.futures import ThreadPoolExecutor

import sys
logger = logging.getLogger("personal_analysis")
print(f"PIPELINE LOADED FROM: {__file__}", file=sys.stderr)
print(f"DEBUG: CWD = {os.getcwd()}", file=sys.stderr)

# Thread pool for CPU-bound analysis work (keeps FastAPI event loop free)
_executor = ThreadPoolExecutor(max_workers=2)

from app.config import get_settings
from app.api.videos import get_video_info

# ── Model paths ──────────────────────────────────────────────────────────────
settings = get_settings()

# ---------------------------------------------------------------------------
# Backend root — computed from __file__ then immediately healed.
#
# When the FastAPI process is launched from a shell that strips the apostrophe
# in "DON'T TOUCH", Python's __file__ itself arrives mangled (without the ').
# We detect that case and swap in the correct character so that every
# subsequent model path built from _BACKEND_ROOT is already correct.
# ---------------------------------------------------------------------------
def _heal_path(p: str) -> str:
    """Return the real on-disk path by fixing the apostrophe-mangling."""
    if os.path.exists(p):
        return p
    fixed = p.replace("OKIDI-DONT TOUCH", "OKIDI-DON'T TOUCH")
    if os.path.exists(fixed):
        return fixed
    return p  # give up – let the caller handle it

_BACKEND_ROOT = _heal_path(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
)
print(f"DEBUG: _BACKEND_ROOT = {_BACKEND_ROOT}", file=sys.stderr)


def _resolve_model_path(path: str) -> str:
    """
    Resolve a model path relative to the (already-healed) backend root.

    • Absolute paths are used as-is (after one heal attempt).
    • Relative paths are anchored to _BACKEND_ROOT — never to CWD.
    """
    if os.path.isabs(path):
        return _heal_path(path)

    # Anchor to the healed backend root
    candidate = os.path.abspath(os.path.join(_BACKEND_ROOT, path))
    if os.path.exists(candidate):
        return candidate

    # One more heal attempt (shouldn't be needed after root fix, but be safe)
    healed = _heal_path(candidate)
    if os.path.exists(healed):
        return healed

    logger.warning(f"Model file not found at {candidate!r} — check model paths")
    return candidate

BALL_RIM_MODEL = _resolve_model_path(settings.swish_ball_rim_model)
POSE_MODEL = _resolve_model_path(settings.swish_pose_model)

print(f"DEBUG: FINAL BALL_RIM_MODEL: {BALL_RIM_MODEL}", file=sys.stderr)
print(f"DEBUG: FINAL POSE_MODEL: {POSE_MODEL}", file=sys.stderr)


def _read_video(path: str):
    """Read video frames using OpenCV. Returns (frames, fps)."""
    cap = cv2.VideoCapture(path)
    if not cap.isOpened():
        raise IOError(f"Cannot open video: {path}")

    fps = cap.get(cv2.CAP_PROP_FPS) or 30
    frames = []
    while True:
        ret, frame = cap.read()
        if not ret:
            break
        frames.append(frame)
    cap.release()
    return frames, fps


def _write_video(frames: list, out_path: str, fps: float = 30.0):
    """Write annotated frames to a browser-compatible MP4 file."""
    if not frames:
        return
    h, w = frames[0].shape[:2]

    # Try H.264 first (best browser support), then mp4v as fallback.
    # Both produce .mp4 containers.
    mp4v_fourcc = cv2.VideoWriter_fourcc(*"mp4v")
    writer = cv2.VideoWriter(out_path, mp4v_fourcc, fps, (w, h))
    if not writer.isOpened():
        # Very unlikely — try avc1 (same codec, different FOURCC)
        writer = cv2.VideoWriter(out_path, cv2.VideoWriter_fourcc(*"avc1"), fps, (w, h))
    for frame in frames:
        writer.write(frame)
    writer.release()

    # Optional: re-encode with ffmpeg for a proper web-ready H.264+AAC stream
    # (ffmpeg ensures the moov atom is at the front for fast browser starts)
    try:
        import subprocess
        tmp_path = out_path.replace(".mp4", "_tmp.mp4")
        os.rename(out_path, tmp_path)
        result = subprocess.run(
            ["ffmpeg", "-y", "-i", tmp_path,
             "-c:v", "libx264", "-preset", "fast", "-movflags", "+faststart",
             "-pix_fmt", "yuv420p", "-an", out_path],
            capture_output=True, timeout=300
        )
        if result.returncode == 0:
            os.remove(tmp_path)
        else:
            # ffmpeg failed — restore original mp4v file
            os.rename(tmp_path, out_path)
    except Exception:
        # ffmpeg not available or failed — mp4v file is still usable
        pass


def _run_pipeline_sync(video_path: str, output_dir: str, job_id: str, shooting_arm: str = "right") -> dict:
    """
    Synchronous (blocking) pipeline — runs in a thread pool.
    Returns a structured results dict.
    """
    from personal_analysis.trackers.ball_tracker import BallTracker
    from personal_analysis.trackers.rim_tracker import RimTracker
    from personal_analysis.trackers.human_tracker import HumanTracker
    from personal_analysis.drawers.shot_tracker import ShotTracker
    from personal_analysis.drawers.human_tracks_drawer import HumanTracksDrawer
    from personal_analysis.utils.ball_hand import ball_hand, shot_started
    from utils import get_foot_position, measure_distance

    os.makedirs(output_dir, exist_ok=True)
    report_path = os.path.join(output_dir, f"{job_id}_report.txt")
    video_out_path = os.path.join(output_dir, f"{job_id}_output.mp4")

    # ── 1. Read video ──────────────────────────────────────────────────────
    logger.info(f"[{job_id}] Reading video: {video_path}")
    video_frames, fps = _read_video(video_path)
    if not video_frames:
        raise ValueError("Video has no frames")

    # ── 2. Detect ball & rim ───────────────────────────────────────────────
    logger.info(f"[{job_id}] Running ball/rim detection...")
    ball_tracker = BallTracker(model_path=BALL_RIM_MODEL)
    rim_tracker = RimTracker(model_path=BALL_RIM_MODEL)

    # get_object_tracks returns both ball and rim detections in one pass
    all_tracks = ball_tracker.get_object_tracks(video_frames)
    
    # Clean up ball and rim tracks separately without deleting the other
    ball_tracks = ball_tracker.remove_wrong_tracks([dict(t) for t in all_tracks])
    rim_tracks = rim_tracker.remove_wrong_tracks([dict(t) for t in all_tracks])
    
    interpolated_ball_tracks = ball_tracker.interpolate_missing_tracks(ball_tracks)
    ball_loco = ball_tracker.get_ball_loco(video_frames, interpolated_ball_tracks)
    rim_tracks = rim_tracker.interpolate_missing_tracks(rim_tracks)

    # ── 3. Human pose detection ────────────────────────────────────────────
    logger.info(f"[{job_id}] Running human pose detection for {shooting_arm} arm...")
    human_tracker = HumanTracker(model_path=POSE_MODEL)
    human_tracks = human_tracker.detect_frame(video_frames)
    angles = human_tracker.calc_angles(video_frames, human_tracks, shooting_arm=shooting_arm)
    points = human_tracker.get_points(video_frames, human_tracks)

    # ── 4. Shot detection ──────────────────────────────────────────────────
    logger.info(f"[{job_id}] Detecting release frames...")
    ball_left_frames = ball_hand(ball_loco, points, video_frames)
    shot_starts = shot_started(points, ball_left_frames)

    # Court detection is only for team videos; skipping for personal analysis
    shot_distances = [None] * len(ball_left_frames)



    # ── 5. Make/miss tracking ──────────────────────────────────────────────
    logger.info(f"[{job_id}] Scoring shots...")
    shot_tracker = ShotTracker()
    shot_tracker.detect_shot(video_frames, interpolated_ball_tracks, rim_tracks)

    # ── 6. Draw overlays & analyse form ───────────────────────────────────
    logger.info(f"[{job_id}] Drawing analysis overlays...")
    human_drawer = HumanTracksDrawer()
    out_frames = human_drawer.draw(
        video_frames, human_tracks, angles,
        draw_boxes=False, draw_keypoints=True,
        shooting_arm=shooting_arm
    )
    out_frames = human_drawer.analysis(
        out_frames, angles, ball_left_frames, shot_starts,
        report_path,
        shot_distances=shot_distances,
        shooting_arm=shooting_arm
    )
    out_frames = shot_tracker.draw_shots(out_frames)

    # ── 7. Write video ─────────────────────────────────────────────────────
    logger.info(f"[{job_id}] Writing output video...")
    _write_video(out_frames, video_out_path, fps)

    # ── 8. Parse report.txt into structured data ───────────────────────────
    shot_reports = _parse_report(report_path)

    shots = shot_tracker.shots
    made = len([s for s in shots if s["outcome"] == "make"])
    missed = len([s for s in shots if s["outcome"] == "miss"])
    total = len(shots)
    made_pct = round((made / total * 100), 1) if total > 0 else 0.0

    return {
        "job_id": job_id,
        "status": "completed",
        "shots_total": total,
        "shots_made": made,
        "shots_missed": missed,
        "made_percentage": made_pct,
        "shot_reports": shot_reports,
        "shooting_arm": shooting_arm,
        "annotated_video_url": f"/personal-output/{job_id}_output.mp4",
    }


def _parse_report(report_path: str) -> list:
    """Parse the text form-analysis report into structured shot dicts."""
    reports = []
    if not os.path.exists(report_path):
        return reports

    with open(report_path) as f:
        content = f.read()

    # Split on blank lines → one block per shot
    blocks = [b.strip() for b in content.strip().split("\n\n") if b.strip()]
    for i, block in enumerate(blocks):
        lines = [l.strip() for l in block.splitlines() if l.strip()]
        verdict = "GOOD FORM" if any("GOOD FORM" in l for l in lines) else "NEEDS WORK"
        issues = [l for l in lines if any(k in l.lower() for k in ["angle", "try", "shoot", "distance"])]
        reports.append({
            "shot_number": i + 1,
            "verdict": verdict,
            "issues": issues,
        })

    return reports


async def run_personal_analysis(
    video_path: str,
    output_dir: str,
    job_id: str,
    shooting_arm: str = "right"
) -> dict:
    """
    Async wrapper: runs the blocking pipeline in a thread pool
    so FastAPI's event loop stays responsive.
    """
    loop = asyncio.get_running_loop()
    try:
        result = await loop.run_in_executor(
            _executor,
            _run_pipeline_sync,
            video_path,
            output_dir,
            job_id,
            shooting_arm,
        )
        return result
    except Exception as e:
        logger.error(f"[{job_id}] Pipeline failed: {e}\n{traceback.format_exc()}")
        return {
            "job_id": job_id,
            "status": "failed",
            "error": str(e),
        }
