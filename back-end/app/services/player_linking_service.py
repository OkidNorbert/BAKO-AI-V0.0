from typing import List, Dict, Any
from app.models.stats import PlayerStatRow

try:
    from thefuzz import process, fuzz
    FUZZ_AVAILABLE = True
except ImportError:
    FUZZ_AVAILABLE = False

def match_players_against_roster(extracted_players: List[PlayerStatRow], roster: List[Dict[str, Any]]) -> List[PlayerStatRow]:
    """
    Match extracted players against a roster using jersey numbers and fuzzy name matching.
    roster expects dicts with at least 'id', 'name', 'jersey_number'
    """
    if not roster or not FUZZ_AVAILABLE:
        # Fallback if no roster or no library
        return extracted_players

    # Prepare roster for fuzzy matching
    roster_names = {p["name"]: p for p in roster if p.get("name")}
    
    for row in extracted_players:
        if not row.name_raw:
            continue
            
        matched = False
        
        # Strategy 1: Match by Jersey + Fuzzy Name (Best)
        if row.jersey_number is not None:
            # Find players in roster with same jersey
            jersey_matches = [p for p in roster if p.get("jersey_number") == row.jersey_number]
            if jersey_matches:
                names = [p["name"] for p in jersey_matches if "name" in p]
                if names:
                    best_match, score = process.extractOne(row.name_raw, names, scorer=fuzz.token_sort_ratio)
                    if score >= 60: # Threshold for jersey+name combination is lower
                        matched_player = roster_names[best_match]
                        row.linked_player_profile_id = matched_player["id"]
                        row.link_confidence = score / 100.0
                        row.link_reason = "Jersey + Fuzzy Name"
                        matched = True
        
        # Strategy 2: Fuzzy Name Only (If Jersey missing or no jersey match found)
        if not matched:
            all_names = list(roster_names.keys())
            if all_names:
                best_match, score = process.extractOne(row.name_raw, all_names, scorer=fuzz.token_sort_ratio)
                if score >= 85: # Threshold is higher when relying on name alone
                    matched_player = roster_names[best_match]
                    row.linked_player_profile_id = matched_player["id"]
                    row.link_confidence = score / 100.0
                    row.link_reason = "Fuzzy Name Only"
                    matched = True
        
        # If still no match
        if not matched:
            row.linked_player_profile_id = None
            row.link_confidence = 0.0
            row.link_reason = "No confident match"
            
    return extracted_players


async def auto_link_players_to_roster(organization_id: str, extracted_players: List[PlayerStatRow]) -> List[PlayerStatRow]:
    """
    Fetch the roster and link the extracted players.
    """
    from app.services.supabase_client import get_supabase_service
    supabase = get_supabase_service()
    
    players = await supabase.select("players", filters={"organization_id": organization_id})
    if not players:
        return extracted_players
        
    return match_players_against_roster(extracted_players, players)
