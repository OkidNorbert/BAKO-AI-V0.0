"""
Pydantic models package.
"""
from app.models.user import (
    AccountType,
    UserCreate,
    UserLogin,
    UserUpdate,
    User,
    UserInDB,
    TokenResponse,
    TokenPayload,
)
from app.models.video import (
    VideoStatus,
    AnalysisMode,
    VideoUpload,
    Video,
    VideoStatusResponse,
    VideoListResponse,
)
from app.models.team import (
    OrganizationCreate,
    OrganizationUpdate,
    Organization,
    OrganizationWithStats,
    OrganizationListResponse,
)
from app.models.player import (
    PlayerCreate,
    PlayerUpdate,
    Player,
    PlayerWithStats,
    PlayerListResponse,
)
from app.models.analysis import (
    Detection,
    DetectionBatch,
    AnalysisRequest,
    AnalysisEvent,
    AnalysisResult,
    PersonalAnalysisResult,
)
from app.models.analytics import (
    PlayerMetric,
    PlayerAnalyticsSummary,
    TeamAnalyticsSummary,
    SkillSummary,
    ProgressData,
    ProgressReport,
)
from app.models.communication import (
    AnnouncementCreate,
    Announcement,
    AnnouncementListResponse,
)

__all__ = [
    # User models
    "AccountType",
    "UserCreate",
    "UserLogin",
    "UserUpdate",
    "User",
    "UserInDB",
    "TokenResponse",
    "TokenPayload",
    # Video models
    "VideoStatus",
    "AnalysisMode",
    "VideoUpload",
    "Video",
    "VideoStatusResponse",
    "VideoListResponse",
    # Team models
    "OrganizationCreate",
    "OrganizationUpdate",
    "Organization",
    "OrganizationWithStats",
    "OrganizationListResponse",
    # Player models
    "PlayerCreate",
    "PlayerUpdate",
    "Player",
    "PlayerWithStats",
    "PlayerListResponse",
    # Analysis models
    "Detection",
    "DetectionBatch",
    "AnalysisRequest",
    "AnalysisEvent",
    "AnalysisResult",
    "PersonalAnalysisResult",
    # Analytics models
    "PlayerMetric",
    "PlayerAnalyticsSummary",
    "TeamAnalyticsSummary",
    "SkillSummary",
    "ProgressData",
    "ProgressReport",
    # Communication models
    "AnnouncementCreate",
    "Announcement",
    "AnnouncementListResponse",
]
