from personal_analysis.drawers.utils import get_center

def valid_point(p):
    return (
        p is not None and
        len(p) == 2 and
        p[0] is not None and
        p[1] is not None
    )

def valid_bbox(b):
    """Return False for None, 0, empty, or invalid bbox."""
    if b == 0:
        return False
    else:
        return True
    
def distance(p1, p2):
    if p1 is None or p2 is None:
        return None
    return ((p1**2 + p2**2)**0.5)

def ball_hand(ball_loco, points, frames):
    leave_frames = []
    in_hand_prev = False
    is_dribble = False
    ball_is_head = False
    prev_ball_valid = False


    dist_thresh=40
    for i, frame_id in enumerate(frames):

        # ---- Safe Ball Center ----
        ball_bbox = ball_loco[i] if i < len(ball_loco) else None

        if valid_bbox(ball_bbox):
            ball_center = get_center(ball_bbox)
        else:
            ball_center = None  # No ball detected
            prev_ball_valid = False
            continue

        # ---- Right wrist and face parts ----
        joints = points[i] if i < len(points) else None
        if joints is None:
            in_hand = False
            prev_ball_valid = True
            in_hand_prev = in_hand
            continue

        right_wrist = joints[10]
        right_soulder = joints[6]
        nose = joints[0]
        l_eye = joints[1]
        r_eye = joints[2]
        l_ear = joints[3]
        r_ear = joints[4]


        # ---- Validity check ----
        if not (valid_point(ball_center) and valid_point(right_wrist)):
            in_hand = False
        else:
            dx = ball_center[0] - right_wrist[0]
            dy = ball_center[1] - right_wrist[1]
            dist = distance(dx, dy)

            # Increased threshold for high-res videos (1080p/4K)
            if (dist < 100):
                in_hand = True
            else:
                in_hand = False
       
        # Only mark as dribble if it's significantly below the shoulder
        if (ball_center[1] > (right_soulder[1] + 50)): 
            is_dribble = True

        # Check if the head is wrongly detected as the ball
        if not (valid_point(nose) and valid_point(r_eye) and valid_point(l_eye) and
                valid_point(r_ear) and valid_point(l_ear)):
            ball_is_head = False
        else:
            # More robust head check
            dist_thresh_head = 80 

            distance_nose = distance(ball_center[0] - nose[0], ball_center[1] - nose[1])
            distance_r_eye = distance(ball_center[0] - r_eye[0], ball_center[1] - r_eye[1])
            distance_l_eye = distance(ball_center[0] - l_eye[0], ball_center[1] - l_eye[1])
            distance_r_ear = distance(ball_center[0] - r_ear[0], ball_center[1] - r_ear[1])
            distance_l_ear = distance(ball_center[0] - l_ear[0], ball_center[1] - l_ear[1])

            if (distance_nose <= dist_thresh_head or distance_r_eye <= dist_thresh_head or 
                distance_l_eye <= dist_thresh_head or distance_r_ear <= dist_thresh_head or 
                distance_l_ear <= dist_thresh_head):
                ball_is_head = True


        # ---- Detect transition: ball was in hand → now not ----
        if prev_ball_valid and in_hand_prev and not in_hand:
            leave_frames.append(i)

        prev_ball_valid = True
        in_hand_prev = in_hand
        is_dribble = False
        ball_is_head = False


    accurate_leave_frames = []
    buffer_frames=10
    last_kept = -10000000000
    for f in leave_frames:
        if f - last_kept > buffer_frames:
            accurate_leave_frames.append(f)
            last_kept = f


    return accurate_leave_frames

def shot_started(points, leave_frames):
    shot_start_frames = []
    buffer_frames = 10
    


    for frame_num in leave_frames:
        # print(f"\nAnalyzing ball leave at frame {frame_num}:")
        start = frame_num - 15
        end = frame_num + 1
        # print(f"Analyzing frames {start} to {end} for shot start detection.")
        for i in range(start, end):
            joints = points[i] 
            right_soulder = joints[6] if joints is not None else None
            right_elbow = joints[8] if joints is not None else None

            if (right_elbow[1] - 25) <= right_soulder[1]:
                # print(f"right_elbow: {right_elbow}, right_soulder: {right_soulder}")
                shot_start_frames.append(i)
                break

    return shot_start_frames


