import numpy as np
import torch
import cv2
import os
from typing import Tuple, List, Optional
from ultralytics import SAM

class SAM2Tracker:
    """
    Advanced SAM2 mask propagation for pixel-perfect tracking.
    This provides much more stable tracking during occlusions and 
    scrimmages by tracking the actual shape of the player.
    """

    def __init__(self, model_path: str, device: str = "cuda" if torch.cuda.is_available() else "cpu"):
        self.device = device
        self.model_path = model_path
        self.predictor = None
        self._prompted = False
        self._use_realtime = False
        self._ultralytics_model = None

        # Build ultralytics model as default robust fallback
        try:
            print(f"Loading SAM2 (ultralytics): {model_path}")
            self._ultralytics_model = SAM(model_path)
        except Exception as e:
            print(f"⚠️ Warning: Could not load SAM2: {e}")

    def segment_frame(self, frame: np.ndarray, boxes: np.ndarray) -> List[np.ndarray]:
        """
        Segment objects in a single frame given their bounding boxes.
        
        Args:
            frame: BGR image.
            boxes: (N, 4) xyxy bounding boxes.
            
        Returns:
            List of boolean masks.
        """
        if self._ultralytics_model is None or len(boxes) == 0:
            return []

        h, w = frame.shape[:2]
        # In YOLO/SAM, bboxes should be xyxy
        results = self._ultralytics_model(
            frame,
            bboxes=boxes,
            device=self.device,
            verbose=False,
        )

        masks = []
        if results and results[0].masks is not None:
            for m in results[0].masks.data:
                mask = m.cpu().numpy().astype(np.uint8)
                if mask.shape[:2] != (h, w):
                    mask = cv2.resize(mask, (w, h), interpolation=cv2.INTER_NEAREST)
                masks.append(mask.astype(bool))

        return masks

    def reset(self):
        self._prompted = False
