# BAKO-AI Frontend Architecture & Logic Documentation

This document provides a comprehensive overview of the frontend architecture, logic, routing, and state management used in the BAKO-AI application.

## 1. Technology Stack
- **Framework**: React (Vite-based)
- **Routing**: React Router DOM (v6)
- **State Management**: React Context API
- **Styling**: Tailwind CSS & Vanilla CSS
- **API Communication**: Axios with Interceptors
- **Icons**: Lucide React
- **Notifications**: React Toastify (UI) & Custom Notification System (Logic)

---

## 2. Directory Structure (`/src`)

- **`components/`**: Reusable UI components.
  - `shared/`: Components used across multiple roles (Layouts, Navbars, Sidebars).
  - `ProtectedRoute.jsx`: Logic for role-based access control.
- **`context/`**: React Context providers for global state.
  - `AuthContext.jsx`: Authentication, user roles, and session management.
  - `ThemeContext.jsx`: Dark/Light mode management.
  - `NotificationContext.jsx`: Real-time (polling) notification system.
- **`layouts/`**: Content wrappers providing consistent structure (Sidebar/Navbar) for different user roles.
- **`pages/`**: Page-level components organized by user role (`team`, `player`, `coach`, `shared`).
- **`services/`**: API service layer (`api.js`).
- **`utils/`**: Utility functions and configurations (e.g., `axiosConfig.js`).
- **`styles/`**: Global CSS and theme variables.

---

## 3. Core Logic & Data Flow

### 3.1 Authentication Flow (`AuthContext.jsx`)
The authentication system is JWT-based and manages session persistence across page reloads.

1.  **Login**: `login(email, password)` sends credentials to `/auth/login`.
    - On success, `accessToken`, `refreshToken`, and user metadata are stored in `localStorage`.
    - User role is normalized (e.g., `personal` maps to `player`).
2.  **Persistence**: On mount, `AuthContext` checks `localStorage` for tokens and populates the `user` state.
3.  **Role Management**: Supports three primary roles: `team`, `coach`, and `player`.
4.  **Security**: Tokens are automatically added to every outgoing request via Axios interceptors.

### 3.2 API Integration & Token Refresh (`axiosConfig.js`)
We use a centralized Axios instance with interceptors to handle cross-cutting concerns.

-   **Request Interceptor**: Extracts the `accessToken` from `localStorage` and attaches it to the `Authorization` header.
-   **Response Interceptor (401 Handling)**:
    - If a request fails with a `401 Unauthorized` status, the interceptor automatically attempts to refresh the token using the `refreshToken`.
    - It queues failed requests while refreshing and retries them once a new token is obtained.
    - If refresh fails or max attempts are exceeded, the user is logged out and redirected to `/login`.

### 3.2 State Management
-   **Theme**: `ThemeContext` monitors system preferences and user overrides, applying `.dark` or `.light` classes to the `<html>` element.
-   **Notifications**: `NotificationContext` polls the backend every 60 seconds to fetch unread notifications, providing global state for notification badges.

---

## 4. Routing & Protection (`App.jsx` & `ProtectedRoute.jsx`)

The application uses a hierarchical routing structure with role-based protection.

### 4.1 Route Types
-   **Public Routes**: `/`, `/login`, `/register`, `/about`, `/contact`, etc.
-   **Protected Routes**: Wrapped in `<ProtectedRoute allowedRoles={[...]} />`.
    - If not logged in: Redirects to `/login`.
    - If role unauthorized: Redirects to the user's specific dashboard.

### 4.2 Route Organization
-   **Team Routes**: `/team/*` - Protected for `team` and `coach` roles. Uses `TeamLayout`.
-   **Player Routes**: `/player/*` - Protected for `player` role. Uses `PlayerLayout`.
-   **Coach Routes**: `/coach/*` - Protected for `coach` role (personal space). Uses `CoachLayout`.

---

## 5. Feature Logic: Match Upload & Analysis

The `MatchUpload.jsx` page demonstrates the interaction between specialized UI logic and external services.

1.  **File Validation**: Checks video format (MP4, MKV, etc.) and size limits.
2.  **Dual-Phase Upload**:
    - **Phase 1 (Storage)**: Video is uploaded to `/videos/upload` via `videoAPI.upload`.
    - **Phase 2 (Processing)**: Once storage is confirmed, a request is sent to `/analysis/team` to trigger AI detection and tracking.
3.  **Status Polling**: The frontend enters a polling loop, calling `/videos/{id}/status` every 2 seconds to track progress (e.g., detect players, track ball).
4.  **Result Retrieval**: Once the status hits `completed`, the final structured analysis data is fetched and rendered in the dashboard.

---

## 6. Development Utilities
-   **Bypass Login**: In development, `AuthContext` provides a `bypassLogin(role)` function to mock a session without a running backend.
-   **Dev Session Flag**: `isDevSession` in `localStorage` suppresses network error toasts during local development.

---

## 7. Styling System
-   **Tailwind CSS**: Used for layout and responsive design.
-   **CSS Variables**: Defined in `index.css` for theme colors (colors like `--bg-color` change based on Dark Mode).
-   **Scrollbars**: Custom CSS classes for consistent scrollbar styling in dashboard components.
