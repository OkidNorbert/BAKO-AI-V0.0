"""
A utility module providing functions for drawing shapes on video frames.

This module includes functions to draw triangles and ellipses on frames, which can be used
to represent various annotations such as player positions or ball locations in sports analysis.
"""

import cv2 
import numpy as np
import sys 
sys.path.append('../')
from utils import get_center_of_bbox, get_bbox_width, get_foot_position

def draw_traingle(frame,bbox,color):
    """
    Draws a filled triangle on the given frame at the specified bounding box location.

    Args:
        frame (numpy.ndarray): The frame on which to draw the triangle.
        bbox (tuple): A tuple representing the bounding box (x, y, width, height).
        color (tuple): The color of the triangle in BGR format.

    Returns:
        numpy.ndarray: The frame with the triangle drawn on it.
    """
    y= int(bbox[1])
    x,_ = get_center_of_bbox(bbox)

    triangle_points = np.array([
        [x,y],
        [x-10,y-20],
        [x+10,y-20],
    ])
    cv2.drawContours(frame, [triangle_points],0,color, cv2.FILLED)
    cv2.drawContours(frame, [triangle_points],0,(0,0,0), 2)

    return frame

def draw_ellipse(frame,bbox,color,track_id=None):
    """
    Draws an ellipse and an optional rectangle with a track ID on the given frame at the specified bounding box location.

    Args:
        frame (numpy.ndarray): The frame on which to draw the ellipse.
        bbox (tuple): A tuple representing the bounding box (x, y, width, height).
        color (tuple): The color of the ellipse in BGR format.
        track_id (int, optional): The track ID to display inside a rectangle. Defaults to None.

    Returns:
        numpy.ndarray: The frame with the ellipse and optional track ID drawn on it.
    """
    y2 = int(bbox[3])
    x_center, _ = get_center_of_bbox(bbox)
    width = get_bbox_width(bbox)

    cv2.ellipse(
        frame,
        center=(x_center,y2),
        axes=(int(width), int(0.35*width)),
        angle=0.0,
        startAngle=-45,
        endAngle=235,
        color = color,
        thickness=2,
        lineType=cv2.LINE_4
    )

    rectangle_width = 40
    rectangle_height=20
    x1_rect = x_center - rectangle_width//2
    x2_rect = x_center + rectangle_width//2
    y1_rect = (y2- rectangle_height//2) +15
    y2_rect = (y2+ rectangle_height//2) +15

    if track_id is not None:
        cv2.rectangle(frame,
                        (int(x1_rect),int(y1_rect) ),
                        (int(x2_rect),int(y2_rect)),
                        color,
                        cv2.FILLED)
        
        x1_text = x1_rect+12
        if track_id > 99:
            x1_text -=10
        
        cv2.putText(
            frame,
            f"{track_id}",
            (int(x1_text),int(y1_rect+15)),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.6,
            (0,0,0),
            2
        )

    return frame

def draw_rounded_rect(frame, rect, color, thickness=1, radius=10):
    """
    Draws a rounded rectangle on the given frame.
    """
    x, y, w, h = rect
    
    # Top-left corner
    cv2.ellipse(frame, (x + radius, y + radius), (radius, radius), 180, 0, 90, color, thickness)
    # Top-right corner
    cv2.ellipse(frame, (x + w - radius, y + radius), (radius, radius), 270, 0, 90, color, thickness)
    # Bottom-right corner
    cv2.ellipse(frame, (x + w - radius, y + h - radius), (radius, radius), 0, 0, 90, color, thickness)
    # Bottom-left corner
    cv2.ellipse(frame, (x + radius, y + h - radius), (radius, radius), 90, 0, 90, color, thickness)
    
    # Lines
    cv2.line(frame, (x + radius, y), (x + w - radius, y), color, thickness)
    cv2.line(frame, (x, y + radius), (x, y + h - radius), color, thickness)
    cv2.line(frame, (x + w, y + radius), (x + w, y + h - radius), color, thickness)
    cv2.line(frame, (x + radius, y + h), (x + w - radius, y + h), color, thickness)
    
    return frame

def draw_glass_panel(frame, rect, alpha=0.6, color=(20, 20, 20), radius=15):
    """
    Draws a modern 'glass' panel overlay.
    """
    x, y, w, h = rect
    overlay = frame.copy()
    
    # Fill background
    cv2.rectangle(overlay, (x, y), (x + w, y + h), color, -1)
    
    # Create mask for rounded corners
    mask = np.zeros(frame.shape[:2], dtype=np.uint8)
    cv2.rectangle(mask, (x + radius, y), (x + w - radius, y + h), 255, -1)
    cv2.rectangle(mask, (x, y + radius), (x + w, y + h - radius), 255, -1)
    cv2.circle(mask, (x + radius, y + radius), radius, 255, -1)
    cv2.circle(mask, (x + w - radius, y + radius), radius, 255, -1)
    cv2.circle(mask, (x + radius, y + h - radius), radius, 255, -1)
    cv2.circle(mask, (x + w - radius, y + h - radius), radius, 255, -1)
    
    # Apply alpha blending only on the mask area
    mask_bool = mask > 0
    frame[mask_bool] = cv2.addWeighted(overlay, alpha, frame, 1 - alpha, 0)[mask_bool]
    
    # Draw a thin subtle border (silver/white)
    draw_rounded_rect(frame, (x, y, w, h), (200, 200, 200), thickness=1, radius=radius)
    
    return frame

def draw_text_with_shadow(frame, text, pos, font_scale=0.6, color=(255, 255, 255), thickness=1):
    """
    Draws text with a small black shadow for readability.
    """
    # Shadow
    cv2.putText(frame, text, (pos[0]+1, pos[1]+1), cv2.FONT_HERSHEY_SIMPLEX, font_scale, (0, 0, 0), thickness+1, cv2.LINE_AA)
    # Main text
    cv2.putText(frame, text, pos, cv2.FONT_HERSHEY_SIMPLEX, font_scale, color, thickness, cv2.LINE_AA)
    return frame