"""
A module for reading and writing video files.

This module provides utility functions to load video frames into memory and save
processed frames back to video files, with support for common video formats.
"""

import cv2
import os

def read_video(video_path):
    """
    Read all frames from a video file into memory.

    Args:
        video_path (str): Path to the input video file.

    Returns:
        list: List of video frames as numpy arrays.
    """
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        cap.release()
        return []

    frames = []
    try:
        while True:
            ret, frame = cap.read()
            if not ret:
                break
            frames.append(frame)
    finally:
        cap.release()

    return frames

def save_video(output_video_frames, output_video_path):
    """
    Save a sequence of frames as a video file.

    Creates necessary directories if they don't exist and selects appropriate codec
    based on the output file extension (.mp4, .avi, etc.).

    Args:
        output_video_frames (list): List of frames to save.
        output_video_path (str): Path where the video should be saved.
    """
    if not output_video_frames:
        return

    # If folder doesn't exist, create it
    output_dir = os.path.dirname(output_video_path)
    if output_dir and not os.path.exists(output_dir):
        os.makedirs(output_dir)

    # Determine codec based on file extension
    extension = os.path.splitext(output_video_path)[1].lower()
    
    if extension == '.mp4':
        # Use avc1 (H.264) for better browser compatibility. 
        # Fallback to mp4v if avc1 is not available on this system's OpenCV build.
        fourcc = cv2.VideoWriter_fourcc(*'avc1')
    else:
        # Default to XVID for AVI or other formats
        fourcc = cv2.VideoWriter_fourcc(*'XVID')

    height, width = output_video_frames[0].shape[:2]
    out = cv2.VideoWriter(output_video_path, fourcc, 24, (width, height))
    
    # Fallback to mp4v if avc1 is not supported by this OpenCV build or environment
    if not out.isOpened() and extension == '.mp4':
        fourcc = cv2.VideoWriter_fourcc(*'mp4v')
        out = cv2.VideoWriter(output_video_path, fourcc, 24, (width, height))

    if not out.isOpened():
        print(f"⚠️  Failed to open VideoWriter with path: {output_video_path}")
        return
        
    for frame in output_video_frames:
        out.write(frame)
    out.release()