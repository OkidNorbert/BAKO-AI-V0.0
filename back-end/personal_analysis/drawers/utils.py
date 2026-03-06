"""Shared geometry utilities."""
import numpy as np


def get_center(bbox):
    """Return (cx, cy) center of a bounding box [x1, y1, x2, y2]."""
    x1, y1, x2, y2 = bbox
    return ((x1 + x2) / 2, (y1 + y2) / 2)
