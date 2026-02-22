import re
from typing import Tuple, Dict, List, Any
from app.models.stats import PlayerStatRow, TeamTotals

def parse_xy_field(value: str) -> Tuple[int, int]:
    """Parse a field like '5-10' or '5/10' into (made, attempted). Returns (0, 0) if invalid."""
    if not value:
        return 0, 0
    match = re.search(r'(\d+)\s*[\-/]\s*(\d+)', str(value))
    if match:
        return int(match.group(1)), int(match.group(2))
    return 0, 0

def validate_and_compute_totals(players: List[PlayerStatRow], current_totals: TeamTotals = None) -> TeamTotals:
    """Computes totals from player rows and validates against existing totals if provided."""
    computed_pts = sum(p.pts for p in players)
    computed_reb = sum((p.off + p.def_reb) if p.reb == 0 and (p.off != 0 or p.def_reb != 0) else p.reb for p in players)
    computed_ast = sum(p.ast for p in players)
    
    # Update player rebounds if they were 0 but off+def exist
    for p in players:
        if p.reb == 0 and (p.off > 0 or p.def_reb > 0):
            p.reb = p.off + p.def_reb
            
    # Resolve against existing totals (if missing, use computed)
    final_pts = current_totals.pts if current_totals and current_totals.pts is not None else computed_pts
    final_reb = current_totals.reb if current_totals and current_totals.reb is not None else computed_reb
    final_ast = current_totals.ast if current_totals and current_totals.ast is not None else computed_ast
    
    # Note: In a stricter validation, we might flag mismatches, but for now we just compute what's missing.
    return TeamTotals(pts=final_pts, reb=final_reb, ast=final_ast)
