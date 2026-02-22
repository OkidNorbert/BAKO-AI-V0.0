from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field
from uuid import UUID
from datetime import datetime

class PlayerStatRow(BaseModel):
    name_raw: str
    jersey_number: Optional[int] = None
    mins: Optional[str] = None
    pts: int = 0
    fg: Optional[str] = "0-0"
    tp: Optional[str] = "0-0" # 2-pointers
    thp: Optional[str] = "0-0" # 3-pointers
    ft: Optional[str] = "0-0"
    off: int = 0
    def_reb: int = Field(0, alias="def")
    reb: int = 0
    ast: int = 0
    to: int = 0
    stl: int = 0
    blk: int = 0
    pf: int = 0
    plus_minus: Optional[int] = None
    index: Optional[int] = None
    row_confidence: Optional[float] = None
    
    # Auto-linking fields
    linked_player_profile_id: Optional[UUID] = None
    link_confidence: Optional[float] = None
    link_reason: Optional[str] = None
    
    class Config:
        populate_by_name = True

class TeamTotals(BaseModel):
    pts: Optional[int] = None
    reb: Optional[int] = None
    ast: Optional[int] = None
    
class ExtractedMatchStatsPreview(BaseModel):
    team_name: Optional[str] = None
    opponent_name: Optional[str] = None
    final_score_for: Optional[int] = None
    final_score_against: Optional[int] = None
    players: List[PlayerStatRow] = []
    team_totals: Optional[TeamTotals] = None
    overall_confidence: float = 0.0

class MatchStatUploadResponse(BaseModel):
    id: UUID
    match_id: UUID
    organization_id: UUID
    uploaded_by: UUID
    storage_path: str
    file_type: str
    extract_status: str
    extracted_json: Optional[Dict[str, Any]] = None
    confidence: Optional[float] = None
    created_at: datetime
    updated_at: datetime

class StatsConfirmRequest(BaseModel):
    extracted_json: ExtractedMatchStatsPreview
