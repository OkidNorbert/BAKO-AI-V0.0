"""
Wearable data schemas for API requests and responses.
"""

from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
from app.models.wearable import WearableType, DataType


class WearableDeviceCreate(BaseModel):
    """Schema for creating a wearable device."""
    device_type: WearableType
    device_name: str
    device_identifier: str


class WearableDeviceResponse(BaseModel):
    """Schema for wearable device response."""
    id: int
    device_type: WearableType
    device_name: str
    device_identifier: str
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True


class WearableDataPoint(BaseModel):
    """Schema for a single wearable data point."""
    data_type: DataType
    value: float
    unit: str
    timestamp: datetime
    metadata: Optional[Dict[str, Any]] = None


class WearableDataBatch(BaseModel):
    """Schema for batch wearable data upload."""
    device_id: int
    data_points: List[WearableDataPoint]


class HealthKitSyncRequest(BaseModel):
    """Schema for Apple HealthKit sync request."""
    player_id: int
    samples: List[Dict[str, Any]] = Field(..., description="HealthKit samples data")


class GoogleFitSyncRequest(BaseModel):
    """Schema for Google Fit sync request."""
    player_id: int
    dataset: List[Dict[str, Any]] = Field(..., description="Google Fit dataset")


class BLESyncRequest(BaseModel):
    """Schema for BLE device sync request."""
    player_id: int
    device_identifier: str
    heart_rate: float
    timestamp: datetime
    metadata: Optional[Dict[str, Any]] = None


class WearableSessionCreate(BaseModel):
    """Schema for creating a wearable session."""
    player_id: int
    session_id: int
    device_id: int
    start_time: datetime
    end_time: datetime


class WearableSessionResponse(BaseModel):
    """Schema for wearable session response."""
    id: int
    player_id: int
    session_id: int
    device_id: int
    start_time: datetime
    end_time: datetime
    total_steps: int
    avg_heart_rate: Optional[float]
    max_heart_rate: Optional[float]
    min_heart_rate: Optional[float]
    calories_burned: Optional[float]
    distance_covered: Optional[float]
    session_summary: Optional[Dict[str, Any]]
    created_at: datetime
    
    class Config:
        from_attributes = True


class WearableMetricsResponse(BaseModel):
    """Schema for wearable metrics response."""
    player_id: int
    date_range: str
    total_steps: int
    avg_heart_rate: float
    max_heart_rate: float
    calories_burned: float
    distance_covered: float
    sleep_hours: Optional[float]
    hrv_avg: Optional[float]
    active_minutes: int
    sessions_count: int


class WearableDataQuery(BaseModel):
    """Schema for querying wearable data."""
    player_id: int
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    data_types: Optional[List[DataType]] = None
    device_ids: Optional[List[int]] = None
    limit: Optional[int] = 1000
