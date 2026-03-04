from PIL import Image
import cv2
from transformers import CLIPProcessor, CLIPModel
import numpy as np
from sklearn.cluster import KMeans
from collections import Counter

import sys 
sys.path.append('../')
from utils import read_stub, save_stub

class TeamAssigner:
    """
    A class that assigns players to teams based on their jersey colors using visual analysis.

    The class uses a pre-trained vision model to classify players into teams based on their
    appearance. It maintains a consistent team assignment for each player across frames.

     Attributes:
        team_colors (dict): Dictionary storing team color information.
        player_team_dict (dict): Dictionary mapping player IDs to their team assignments.
        team_1_class_name (str): Description of Team 1's jersey appearance.
        team_2_class_name (str): Description of Team 2's jersey appearance.
    """
    def __init__(self,
                 team_1_class_name= "player in grey jersey",
                 team_2_class_name= "player in red jersey",
                 use_hsv_clustering=True
                 ):
        """
        Initialize the TeamAssigner with specified team jersey descriptions.

        Args:
            team_1_class_name (str): Description of Team 1's jersey appearance.
            team_2_class_name (str): Description of Team 2's jersey appearance.
            use_hsv_clustering (bool): Whether to use HSV-based clustering as a first pass.
        """
        self.team_colors = {}
        self.player_team_dict = {}        
    
        self.team_1_class_name = team_1_class_name
        self.team_2_class_name = team_2_class_name
        self.use_hsv_clustering = use_hsv_clustering
        self.model_loaded = False
        self.hsv_classifier = HueTeamClassifier()

    def load_model(self):
        """
        Loads the pre-trained vision model for jersey color classification.
        Handles connection errors gracefully.
        """
        try:
            print("Loading Team Assignment Model (Fashion-CLIP)...")
            self.model = CLIPModel.from_pretrained("patrickjohncyh/fashion-clip", local_files_only=False)
            self.processor = CLIPProcessor.from_pretrained("patrickjohncyh/fashion-clip", local_files_only=False)
            print("✅ Team Assignment Model loaded.")
            self.model_loaded = True
        except Exception as e:
            print(f"⚠️ Warning: Could not load Team Assignment Model due to connection/download error: {e}")
            print("Falling back to default team assignment (No AI color detection).")
            self.model_loaded = False

    def get_player_color(self,frame,bbox):
        """
        Analyzes the jersey color of a player within the given bounding box.

        Args:
            frame (numpy.ndarray): The video frame containing the player.
            bbox (tuple): Bounding box coordinates of the player.

        Returns:
            str: The classified jersey color/description.
        """
        if not self.model_loaded:
            return self.team_1_class_name

        image = frame[int(bbox[1]):int(bbox[3]),int(bbox[0]):int(bbox[2])]

        # Convert to PIL Image
        rgb_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        pil_image = Image.fromarray(rgb_image)
        image = pil_image

        # Enhanced CLIP prompts for better zero-shot performance
        prompt_1 = f"a professional basketball player wearing a {self.team_1_class_name}"
        prompt_2 = f"a professional basketball player wearing a {self.team_2_class_name}"
        classes = [prompt_1, prompt_2]

        inputs = self.processor(text=classes, images=image, return_tensors="pt", padding=True)

        outputs = self.model(**inputs)
        logits_per_image = outputs.logits_per_image
        probs = logits_per_image.softmax(dim=1) 
        
        confidence = probs.max().item()
        class_idx = probs.argmax(dim=1)[0].item()
        
        # If the model is not confident, return None to indicate ambiguous detection
        if confidence < 0.6:
            return None
            
        original_classes = [self.team_1_class_name, self.team_2_class_name]
        return original_classes[class_idx]


        class_name=  classes[probs.argmax(dim=1)[0]]

        return class_name

    def get_player_team(self,frame,player_bbox,player_id):
        """
        Gets the team assignment for a player, using cached results if available.

        Args:
            frame (numpy.ndarray): The video frame containing the player.
            player_bbox (tuple): Bounding box coordinates of the player.
            player_id (int): Unique identifier for the player.

        Returns:
            int: Team ID (1 or 2) assigned to the player.
        """
        if player_id in self.player_team_dict:
          return self.player_team_dict[player_id]

        player_color = self.get_player_color(frame,player_bbox)

        if player_color is None:
            return -1

        team_id=2
        if player_color==self.team_1_class_name:
            team_id=1

        self.player_team_dict[player_id] = team_id
        return team_id

    def get_player_teams_across_frames(self,video_frames,player_tracks,read_from_stub=False, stub_path=None):
        """
        Processes all video frames to assign teams to players, with optional caching.

        Args:
            video_frames (list): List of video frames to process.
            player_tracks (list): List of player tracking information for each frame.
            read_from_stub (bool): Whether to attempt reading cached results.
            stub_path (str): Path to the cache file.

        Returns:
            list: List of dictionaries mapping player IDs to team assignments for each frame.
        """
        
        player_assignment = read_stub(read_from_stub,stub_path)
        if player_assignment is not None:
            if len(player_assignment) == len(video_frames):
                return player_assignment

        self.load_model()

        player_assignment=[]
        for frame_num, player_track in enumerate(player_tracks):        
            player_assignment.append({})
            
            # FIT: On the first 100 frames, collect crops for clustering
            if self.use_hsv_clustering and frame_num < 100:
                tids = np.array(list(player_track.keys()))
                boxes = np.array([t['bbox'] for t in player_track.values()])
                if len(tids) > 0:
                    self.hsv_classifier.collect(video_frames[frame_num], boxes, tids)
            
            # FIT FINISH: At frame 100, cluster the collected data
            if self.use_hsv_clustering and frame_num == 100:
                self.hsv_classifier.fit()

            if frame_num % 50 == 0 and not self.use_hsv_clustering:
                self.player_team_dict = {}

            for player_id, track in player_track.items():
                # Skip team assignment for referees
                if track.get('class', '').lower() == 'referee':
                    continue
                
                # Use HSV clustering prediction if available
                if self.use_hsv_clustering and self.hsv_classifier.is_fitted:
                    team = self.hsv_classifier.team_map.get(player_id, -1)
                else:
                    team = self.get_player_team(video_frames[frame_num],   
                                                        track['bbox'],
                                                        player_id)
                
                # Temporal fallback for ambiguous AI classification
                if team == -1:
                    if frame_num > 0 and player_id in player_assignment[frame_num-1]:
                        team = player_assignment[frame_num-1][player_id]
                    else:
                        team = 1 # Default fallback if first frame is ambiguous
                
                player_assignment[frame_num][player_id] = team
        
        save_stub(stub_path,player_assignment)

        return player_assignment

class HueTeamClassifier:
    """Cluster players into 2 teams using HSV (Hue & Saturation) color histograms.
    
    This replaces abstract embeddings (like CLIP) with direct measurement of
    actual jersey colors, yielding significantly more robust team assignment.
    """

    def __init__(self):
        self._fitted = False
        self._kmeans = None
        self._collected_crops = []
        self._collected_tids = []
        self.team_map = {}
        
    def collect(self, frame: np.ndarray, boxes: np.ndarray, tids: np.ndarray) -> None:
        """Collect raw crops for future fitting."""
        for box, tid in zip(boxes, tids):
            # Same 40% center crop to grab just the torso/jersey
            crop = self._center_crop(frame, box, factor=0.4)
            if crop is not None and crop.size > 0:
                self._collected_crops.append(crop)
                self._collected_tids.append(int(tid))

    def _center_crop(self, frame: np.ndarray, box: np.ndarray, factor: float = 0.4) -> np.ndarray:
        """Crop the center portion of a bounding box (jersey area)."""
        x1, y1, x2, y2 = map(float, box)
        cx, cy = (x1 + x2) / 2, (y1 + y2) / 2
        w, h = (x2 - x1) * factor, (y2 - y1) * factor

        cx1 = max(0, int(cx - w / 2))
        cy1 = max(0, int(cy - h / 2))
        cx2 = min(frame.shape[1], int(cx + w / 2))
        cy2 = min(frame.shape[0], int(cy + h / 2))

        crop = frame[cy1:cy2, cx1:cx2]
        if crop.size == 0:
            return np.zeros((32, 32, 3), dtype=np.uint8)
        return crop

    def _extract_features(self, crops: list[np.ndarray]) -> tuple[np.ndarray, np.ndarray, list[int]]:
        """Convert BGR crops into 26D HSV histogram features and calculate saturation."""
        crop_feats = []
        crop_sats = []
        valid_indices = []

        for i, crop in enumerate(crops):
            hsv = cv2.cvtColor(crop, cv2.COLOR_BGR2HSV)
            # Fore-ground: pixels that are not near-black
            fg = hsv[crop.max(axis=2) > 30]
            if len(fg) > 50:
                # 18-bin Hue (0-180) + 8-bin Saturation (0-256)
                h_hist = np.histogram(fg[:, 0], bins=18, range=(0, 180), density=True)[0]
                s_hist = np.histogram(fg[:, 1], bins=8,  range=(0, 256), density=True)[0]
                feat = np.concatenate([h_hist, s_hist])
                crop_feats.append(feat)
                crop_sats.append(fg[:, 1].mean())
                valid_indices.append(i)

        if not crop_feats:
            return np.array([]), np.array([]), []

        return np.array(crop_feats, dtype=np.float32), np.array(crop_sats, dtype=np.float32), valid_indices

    def fit(self, swap_teams: bool = False) -> dict[int, int]:
        """Fit the K-means model on collected crops and map each tracking ID to a team."""
        if len(self._collected_crops) < 10:
            return {}

        features, saturations, valid_indices = self._extract_features(self._collected_crops)
        if len(features) < 10:
             return {}

        valid_tids = [self._collected_tids[i] for i in valid_indices]

        # Cluster all crops into 2 teams based on color distribution
        self._kmeans = KMeans(n_clusters=2, n_init=20, random_state=42)
        crop_labels = self._kmeans.fit_predict(features)
        
        # Anchor teams: Light/White = Team 1 (0), Dark/Colored = Team 2 (1)
        avg_sat = {
            0: saturations[crop_labels == 0].mean() if np.any(crop_labels == 0) else 128.0,
            1: saturations[crop_labels == 1].mean() if np.any(crop_labels == 1) else 128.0
        }
        
        needs_flip = avg_sat[0] > avg_sat[1]
        if swap_teams:
            needs_flip = not needs_flip
            
        if needs_flip:
            crop_labels = 1 - crop_labels

        # Majority vote per track -> determines the player's true team
        tid_label_pairs = list(zip(valid_tids, crop_labels))
        unique_tids = set(valid_tids)
        
        for tid in unique_tids:
            labels_for_tid = [l for t, l in tid_label_pairs if t == tid]
            if labels_for_tid:
                # Assign the most common label + 1 (team 1 or 2)
                self.team_map[tid] = Counter(labels_for_tid).most_common(1)[0][0] + 1

        self._fitted = True
        return self.team_map

    @property
    def is_fitted(self) -> bool:
        return self._fitted