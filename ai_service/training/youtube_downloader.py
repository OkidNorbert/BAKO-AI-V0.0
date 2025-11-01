#!/usr/bin/env python3
"""
Automated YouTube Video Downloader for African Basketball Content
================================================================

This script uses the `yt-dlp` library (a fork of youtube-dl) to search for
and download videos from YouTube based on provided search queries.

It is designed to help in automatically collecting video data for training
YOLOv8 basketball detection models, especially for region-specific content
like African basketball, where curated datasets are scarce.

Usage:
    python youtube_downloader.py --query "FIBA Africa basketball" --max_videos 10 --output_dir "downloads/fiba_africa"
    python youtube_downloader.py --query "Basketball Africa League highlights" --max_videos 5 --output_dir "downloads/bal"

Prerequisites:
    - Python 3.x
    - `yt-dlp` library: `pip install yt-dlp`

Features:
    - Search YouTube with a given query.
    - Download a specified number of top-ranked videos.
    - Save videos to a designated output directory.
    - Basic error handling.
"""

import os
import argparse
import logging
import subprocess
from pathlib import Path
from typing import Optional, Dict, Any, List
import json # Added missing import for json

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def check_yt_dlp_installed() -> bool:
    """Checks if yt-dlp is installed and accessible."""
    try:
        subprocess.run(["yt-dlp", "--version"], capture_output=True, check=True)
        logger.info("✅ yt-dlp is installed.")
        return True
    except (subprocess.CalledProcessError, FileNotFoundError):
        logger.error("❌ yt-dlp is not installed or not found in PATH.")
        logger.info("Please install yt-dlp: `pip install yt-dlp` or `sudo apt install yt-dlp` (Linux)")
        return False

def download_youtube_videos(
    query: str,
    max_videos: int,
    output_dir: Path,
    min_duration_seconds: int = 60, # Minimum 1 minute to avoid very short clips
    max_duration_seconds: int = 3600, # Maximum 1 hour to avoid extremely long videos
    format: str = "bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best" # Prioritize mp4
) -> List[Dict[str, Any]]:
    """Searches YouTube for videos and downloads them."""
    if not check_yt_dlp_installed():
        return []

    output_dir.mkdir(parents=True, exist_ok=True)
    downloaded_videos_info = []

    logger.info(f"🔍 Searching YouTube for '{query}' and attempting to download {max_videos} videos...")

    try:
        # Construct yt-dlp command
        # --dump-json: output video metadata as JSON
        # --flat-playlist: only extract video IDs, do not extract info about videos in playlist
        # --match-filter: filter videos by duration
        # --format: preferred video format
        # --output: output file name template
        yt_dlp_command = [
            "yt-dlp",
            f"ytsearch{max_videos}:{query}",
            "--dump-json",
            "--flat-playlist", # Use flat-playlist with ytsearch to get metadata without downloading
            "--match-filter", f"duration > {min_duration_seconds} & duration < {max_duration_seconds}",
            "--format", format,
            "--output", str(output_dir / "%(title)s.%(ext)s"),
            "--restrict-filenames", # Keep filenames simple
        ]

        # First, get video metadata to filter and select
        logger.info("Fetching video metadata...")
        metadata_process = subprocess.run(
            yt_dlp_command,
            capture_output=True,
            text=True,
            check=True
        )
        
        video_metadatas = []
        for line in metadata_process.stdout.splitlines():
            try:
                video_metadatas.append(json.loads(line))
            except json.JSONDecodeError:
                logger.warning(f"Could not decode JSON from yt-dlp output: {line[:100]}...")
                
        if not video_metadatas:
            logger.warning("No videos found matching criteria. Try a different query or adjust duration filters.")
            return []

        logger.info(f"Found {len(video_metadatas)} potential videos. Starting download...")

        for i, video_meta in enumerate(video_metadatas):
            if i >= max_videos:
                break

            video_url = video_meta.get("webpage_url")
            video_title = video_meta.get("title")
            video_id = video_meta.get("id")
            
            if not video_url:
                logger.warning(f"Skipping video with missing URL: {video_title}")
                continue

            logger.info(f"⬇️ Downloading video {i+1}/{max_videos}: {video_title} ({video_url})")
            
            download_command = [
                "yt-dlp",
                video_url,
                "--format", format,
                "--output", str(output_dir / "%(title)s.%(ext)s"),
                "--restrict-filenames",
            ]

            try:
                download_process = subprocess.run(
                    download_command,
                    capture_output=True,
                    text=True,
                    check=True
                )
                logger.info(f"✅ Downloaded: {video_title}")
                # yt-dlp outputs the final filename in stdout/stderr, but it's easier to glob
                # for the file if we want the exact path after download.
                # For simplicity, we'll construct a potential path. A more robust way would parse yt-dlp output.
                potential_filename = f"{video_title}.mp4" # Assuming mp4 for simplicity due to format preference
                final_path = output_dir / potential_filename
                if not final_path.exists():
                    # Fallback to glob if exact filename construction is tricky
                    found_files = list(output_dir.glob(f"{video_title}*.mp4"))
                    if found_files:
                        final_path = found_files[0]
                    else:
                        logger.warning(f"Could not find downloaded file for {video_title} in {output_dir}.")
                        final_path = None

                if final_path:
                    downloaded_videos_info.append({
                        "title": video_title,
                        "id": video_id,
                        "url": video_url,
                        "path": str(final_path),
                        "area_tag": output_dir.name # Infer area_tag from output directory name
                    })

            except subprocess.CalledProcessError as e:
                logger.error(f"❌ Failed to download '{video_title}': {e.stderr}")
            except Exception as e:
                logger.error(f"❌ An unexpected error occurred while downloading '{video_title}': {e}")
                
    except subprocess.CalledProcessError as e:
        logger.error(f"❌ yt-dlp search failed: {e.stderr}")
    except Exception as e:
        logger.error(f"❌ An unexpected error occurred during YouTube search: {e}")

    logger.info(f"Summary: Downloaded {len(downloaded_videos_info)} videos to {output_dir}")
    return downloaded_videos_info

def main():
    parser = argparse.ArgumentParser(description="Automated YouTube Video Downloader.")
    parser.add_argument(
        "--query", 
        type=str, 
        required=True, 
        help="Search query for YouTube (e.g., 'FIBA Africa basketball')"
    )
    parser.add_argument(
        "--max_videos", 
        type=int, 
        default=5, 
        help="Maximum number of videos to download"
    )
    parser.add_argument(
        "--output_dir", 
        type=str, 
        default="downloads/unspecified", 
        help="Directory to save downloaded videos. Will infer area_tag from this name."
    )
    parser.add_argument(
        "--min_duration",
        type=int,
        default=60,
        help="Minimum video duration in seconds to download (default: 60)"
    )
    parser.add_argument(
        "--max_duration",
        type=int,
        default=3600,
        help="Maximum video duration in seconds to download (default: 3600)"
    )

    args = parser.parse_args()

    output_path = Path(args.output_dir)
    if not output_path.is_absolute():
        output_path = Path(os.getcwd()) / output_path
    
    downloaded = download_youtube_videos(
        query=args.query,
        max_videos=args.max_videos,
        output_dir=output_path,
        min_duration_seconds=args.min_duration,
        max_duration_seconds=args.max_duration
    )

    if downloaded:
        logger.info("\n--- Downloaded Videos Summary ---")
        for video in downloaded:
            logger.info(f"Title: {video.get('title')}, Path: {video.get('path')}, Area Tag: {video.get('area_tag')}")
    else:
        logger.warning("No videos were downloaded.")

if __name__ == "__main__":
    main()
