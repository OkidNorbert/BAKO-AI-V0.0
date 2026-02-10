# 🏀 Personal Analysis & Skill Diagnostic System Design

This document defines the logic, data structure, and labeling strategy for the **Personal Basketball Analysis System**. It is designed to be AI-agnostic, providing a clear blueprint for any Computer Vision or Machine Learning model to interpret and provide coaching feedback.

---

## 🎯 System Objective
The goal is to transition from simple "object tracking" to **"Biometric Coaching."** The system analyzes a player's physical form (pose) throughout a shot sequence, correlates that form with the shot outcome (Made/Missed), and provides actionable biostatistical feedback for improvement.

---

## 🧠 Core Component: `SkillDiagnosticService`

The `SkillDiagnosticService` is the intelligence layer that processes pose data. It follows a **"4-Phase Shot Logic"** to diagnose performance.

### 1. The 4-Phase Shot Logic
Every shot is broken into four critical temporal keyframes:

| Phase | Description | Key Metric to Analyze |
| :--- | :--- | :--- |
| **DIP** | The lowest point of concentration before the jump/shot. | **Power**: Knee bend angle + Ball height. |
| **SET** | The "Shot Pocket"—ball is near forehead/eye level. | **Alignment**: Elbow angle + Shoulder squareness. |
| **RELEASE** | The exact frame the ball leaves the fingertips. | **Extension**: Elbow angle (Goal: 170°+) + Release height. |
| **FINISH** | 0.5s after release—the follow-through. | **Stability**: Balance + Wrist "Gooseneck" hold. |

---

## 🏷️ Data Labeling Strategy

To train this system, we use **Image-Level Labeling** extracted from **Video Sequences**.

### 1. The Dataset Requirement
*   **Target**: 500 total labeled frames.
*   **Structure**: 125 individual shot videos, with 4 specific frames extracted from each.
*   **Split**: Aim for a 50/50 mix of `Made` and `Missed` shots to help the AI learn the difference.

### 2. File Naming Convention
Every image frame must be named clearly before labeling to maintain data integrity:
`[ShotID]_[Outcome]_[Phase]_[FrameValue].jpg`

> **Example**: `shot_042_missed_release_0048.jpg`

### 3. Labeling Layers (The "Labels")
For every extracted image, apply two layers of data:

#### **Layer A: Pose Estimation (Keypoints)**
Define the standard 17 COCO Keypoints.
*   **Critical Points**: Shooting Wrist, Shooting Elbow, Shooting Shoulder, Knees, and Ankles.
*   **Rule**: If a joint is hidden by the body, mark it as "hidden/occluded" but still provide an estimated position.

#### **Layer B: Metadata / Classification (Tags)**
Every image must be tagged with categories:
1.  **Phase Tag**: `phase:dip`, `phase:set`, `phase:release`, or `phase:finish`.
2.  **Outcome Tag**: `outcome:made` or `outcome:missed`.
3.  **Fault Tag (Optional)**: If a specific error is visible (e.g., `fault:flared_elbow`).

---

## 🛠️ The Diagnostic Logic (The "Why")

The `SkillDiagnosticService` uses a **Heuristic Comparison Engine**. It compares the user's current metrics against "Ideal Profiles" derived from successful shots in the dataset.

### Example Diagnostic Paths:

#### **Scenario 1: The "Flat Shot" Fix**
*   **Input**: `Outcome: Missed` + `Phase: Release`.
*   **Check**: Elbow angle is 150° (Ideal is 175°).
*   **Insight**: "Your arm isn't fully extended. This creates a flat trajectory."
*   **Improvement**: "Focus on reaching for the ceiling during your follow-through to increase your shot arc."

#### **Scenario 2: The "Weak Base" Fix**
*   **Input**: `Outcome: Missed` + `Phase: Dip`.
*   **Check**: Knee bend angle is 160° (Ideal is 120°).
*   **Insight**: "You are shooting with 'stiff legs,' losing your primary power source."
*   **Improvement**: "Try to dip lower before starting your upward motion to generate more lift."

---

## 📈 Long-Term Record Keeping

The system records every shot in a longitudinal database (`personal_shot_history`) to track progress:

| Date | Shot Count | Avg Elbow Angle | Best Streak | Primary Fault |
| :--- | :--- | :--- | :--- | :--- |
| Feb 01 | 50 | 158° | 3 Made | Short-Arming |
| Feb 09 | 50 | 172° | 7 Made | Perfect Extension |

---

## 🚀 Future AI Integration
By following this labeling structure, any future AI model (Pose Detection, Transformer-based Action Recognition, or Large Vision Model) will be able to ingest this data and automatically generate coaching commentary because the **Logic of the Game** is embedded in the **Structure of the Data**.
