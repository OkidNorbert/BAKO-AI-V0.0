import numpy as np
from typing import List, Tuple

def smooth_trajectory(
    trail: List[Tuple[float, float]],
    window: int = 9,
    poly: int = 2,
) -> List[Tuple[float, float]]:
    """
    Smooth a movement trail using Savitzky-Golay filter.
    
    This filter is superior to simple moving averages as it preserves 
    the "sharpness" of quick direction changes (like crossovers) 
    while removing high-frequency sensor noise.
    
    Args:
        trail: List of (x, y) coordinates.
        window: Smoothing window size (must be odd).
        poly: Polynomial order for the filter.
        
    Returns:
        Smoothed trail as a list of (x, y) tuples.
    """
    if len(trail) < window:
        return trail

    pts = np.array(trail)
    
    try:
        from scipy.signal import savgol_filter
        x_smooth = savgol_filter(pts[:, 0], window, poly)
        y_smooth = savgol_filter(pts[:, 1], window, poly)
    except ImportError:
        # Fallback: simple moving average if scipy is not available
        kernel = np.ones(window) / window
        x_smooth = np.convolve(pts[:, 0], kernel, mode='same')
        y_smooth = np.convolve(pts[:, 1], kernel, mode='same')
        
    # Return as list of numeric tuples
    return list(zip(x_smooth.tolist(), y_smooth.tolist()))
