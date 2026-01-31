# BAKO Basketball Analytics - Technical Documentation

## 🏀 Project Overview
BAKO Analytics is a sophisticated web application designed for basketball performance analysis. It provides specialized tools for both **Teams (Organizations)** and **Personal Players** to analyze game footage, track skill progression, and manage basketball activities.

This project was transformed from a modern daycare management template, leveraging its robust administrative and scheduling features to create a high-performance sports analytics platform.

---

## 🛠 Features & Why They Are Needed

### 1. Account Type Selection (`/select-account`)
- **What**: A post-registration gate that forces users to define their role (Team vs. Player).
- **Why**: Sports analytics needs differ wildly. Teams care about organization-wide stats and rosters; players care about personal growth and feedback. This gate ensures the UI experience is tailored from the start.

### 2. Team Analytics Dashboard (`/team/dashboard`)
- **What**: A high-level overview of team performance metrics like Offensive Rating, Defensive Rating, and Win Percentage.
- **Why**: Coaches need a "command center" to see how the season is progressing at a glance. We repurposed financial and attendance charts into performance and possession analytics.

### 3. Match Analysis (`/team/analysis`)
- **What**: A specialized video player with **AI-simulated overlays** (Bounding Boxes and Player IDs).
- **How**: We implemented an SVG/Div overlay system synced with the HTML5 video player timestamps to demonstrate how automated tracking would look in production.
- **Why**: Visualizing "Who is where" and "What are they doing" is the core value proposition of BAKO.

### 4. Player Management (`/team/management`)
- **What**: A tool to manage player rosters and link physical players to their system-detected IDs.
- **Why**: To maintain data integrity, the system needs to know which "Bounding Box" in a video corresponds to which registered player.

### 5. Training Analysis (`/player/training`)
- **What**: A focus on individual practice, featuring **Pose (Skeleton) overlays**.
- **How**: Simulates AI skeleton detection to provide feedback on shooting form or defensive stance.
- **Why**: Individual players need granular feedback on their technique, not just team-level stats.

### 6. Skill Progression (`/player/skills`)
- **What**: Dynamic progress bars for Shooting, Dribbling, and Defense.
- **Why**: Gamification and visual growth tracking motivate athletes to stick to their training regimens.

---

## 🏗 Architectural Transformation (The "How")

### 1. Refactoring from Daycare to Basketball
We performed a deep-level refactor of the template's domain logic:
- **Admin** → **Team**: Repurposed administrative power for coaching and organization management.
- **Babysitter** → **Player**: Repurposed staff/caregiver views into personal athlete profiles.
- **Child** → **Player (Data Entity)**: Repurposed child management into player rosters.
- **Parents** → **Contacts/Guardians**: Maintained the logic for secondary contact points (crucial for youth basketball).

### 2. Navigation & Branding Logic
The application uses a **Role-Based Layout** system:
- `TeamLayout`: Features a persistent sidebar for deep management.
- `PlayerLayout`: Features a lighter, navigation-focused setup for mobile-first athletes.
- **Branding**: Replaced all daycare aesthetics with a high-contrast, premium basketball identity using orange/indigo gradients and sports-centric iconography (Lucide-React).

### 3. State Management
- **AuthContext**: Handles the `userRole` property, which steers React Router to the correct layout and restricts access to sensitive data.
- **ThemeContext**: Supports both Professional Light and Immersive Dark modes, ensuring readability in all environments (court-side or desk).

---

## 🚀 Future Roadmap
- **Real-time API Integration**: Hooking up the simulated overlays to a live Computer Vision backend.
- **Mobile App**: Wrapping the existing responsive frontend into a Capacitor or React Native container.
- **Advanced Heatmaps**: Implementing SVG-based basketball court heatmaps for shot analysis.
