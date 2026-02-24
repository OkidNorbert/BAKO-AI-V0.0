"""
Stats Extraction Service.
Reads a box score PDF or image file from Supabase Storage and extracts structured player stats.
"""
import io
import re
import asyncio
from typing import List, Dict, Optional, Tuple

from app.services.supabase_client import get_supabase_service
from app.services.stats_utils import parse_xy_field, validate_and_compute_totals
from app.services.player_linking_service import auto_link_players_to_roster
from app.models.stats import PlayerStatRow, TeamTotals, ExtractedMatchStatsPreview


# ─────────────────────────────
# Header keywords used to detect the table header row
# ─────────────────────────────
HEADER_KEYWORDS = {"PLAYER", "MINS", "PTS", "REB", "AST", "STL", "BLK", "TO", "PF"}
STAT_COLUMNS = ["PLAYER", "JERSEY", "MINS", "PTS", "FG", "2P", "3P", "FT",
                "OFF", "DEF", "REB", "AST", "TO", "STL", "BLK", "PF", "+/-", "INDEX"]


# ─────────────────────────────
# Low-level text extraction
# ─────────────────────────────

def _extract_text_from_pdf(file_bytes: bytes) -> str:
    """Use pdfplumber to extract text from a text-based PDF."""
    try:
        import pdfplumber
        with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
            pages = [page.extract_text() or "" for page in pdf.pages]
        return "\n".join(pages)
    except ImportError:
        return ""


def _extract_text_from_image(file_bytes: bytes) -> str:
    """Use pytesseract OCR to extract text from an image or scanned PDF."""
    try:
        from PIL import Image
        import pytesseract
        image = Image.open(io.BytesIO(file_bytes))
        return pytesseract.image_to_string(image)
    except (ImportError, Exception) as e:
        print(f"OCR failed: {e}")
        return ""


def _extract_text_from_scanned_pdf(file_bytes: bytes) -> str:
    """Convert a scanned/image-based PDF to images and OCR each page."""
    try:
        from pdf2image import convert_from_bytes
        from PIL import Image
        import pytesseract
        pages = convert_from_bytes(file_bytes, dpi=200)
        texts = [pytesseract.image_to_string(page) for page in pages]
        return "\n".join(texts)
    except (ImportError, Exception) as e:
        print(f"Scanned PDF OCR failed: {e}")
        return ""


# ─────────────────────────────
# Table parsing from raw text
# ─────────────────────────────

def _find_header_row(lines: List[str]) -> Optional[int]:
    """Find the line index that contains the box score header."""
    for i, line in enumerate(lines):
        words = set(re.sub(r'[^a-zA-Z0-9+/-]', ' ', line).upper().split())
        overlap = words & HEADER_KEYWORDS
        if len(overlap) >= 3:  # At least 3 header keywords present
            return i
    return None


def _parse_player_row(row: str, col_positions: List[int] = None) -> Optional[Dict]:
    """Parse a raw text line into a player stats dictionary."""
    # Remove leading/trailing whitespace
    row = row.strip()
    if not row or len(row) < 5:
        return None

    # Attempt a flexible token split to extract stats
    # Rows look like: #16 Norbert Okidi  2:08  0  0-0  0-0  0-0  0-0  0  1  1  0  0  0  0  0  +5  1
    tokens = re.split(r'\s{2,}|\t', row)
    tokens = [t.strip() for t in tokens if t.strip()]
    
    if len(tokens) < 4:
        return None

    # Try to find jersey number at start
    jersey = None
    name_start = 0
    jersey_match = re.match(r'^#?(\d+)', tokens[0])
    if jersey_match:
        jersey = int(jersey_match.group(1))
        name_start = 1
    
    # Numeric check on a token
    def is_stat(t):
        return bool(re.match(r'^[\d\-\+\/]+$', t))

    # Find first all-numeric token → that's where stats begin
    stat_start = None
    for idx in range(name_start, len(tokens)):
        if is_stat(tokens[idx]) and re.match(r'^\d', tokens[idx]):
            stat_start = idx
            break
    
    if stat_start is None or stat_start <= name_start:
        return None

    name_raw = " ".join(tokens[name_start:stat_start])
    if not name_raw:
        return None

    stats = tokens[stat_start:]
    
    # Helper accessor with default
    def g(index, default="0"):
        return stats[index] if index < len(stats) else default

    result = {
        "name_raw": name_raw,
        "jersey_number": jersey,
        "mins": g(0) if re.match(r'^\d+:\d{2}$', g(0)) else None,
        "pts": int(re.sub(r'\D', '0', g(0 if not re.match(r'^\d+:\d{2}$', g(0)) else 1))),
    }

    # Parse FG, 2P, 3P, FT as x-y fields
    field_idx = 1 if result["mins"] else 0
    try:
        result["fg"]  = g(field_idx + 1)
        result["tp"]  = g(field_idx + 2)
        result["thp"] = g(field_idx + 3)
        result["ft"]  = g(field_idx + 4)
        result["off"] = int(re.sub(r'\D', '0', g(field_idx + 5)))
        result["def"] = int(re.sub(r'\D', '0', g(field_idx + 6)))
        result["reb"] = int(re.sub(r'\D', '0', g(field_idx + 7)))
        result["ast"] = int(re.sub(r'\D', '0', g(field_idx + 8)))
        result["to"]  = int(re.sub(r'\D', '0', g(field_idx + 9)))
        result["stl"] = int(re.sub(r'\D', '0', g(field_idx + 10)))
        result["blk"] = int(re.sub(r'\D', '0', g(field_idx + 11)))
        result["pf"]  = int(re.sub(r'\D', '0', g(field_idx + 12)))
        pm_raw = g(field_idx + 13)
        result["plus_minus"] = int(pm_raw) if re.match(r'^[+\-]?\d+$', pm_raw) else None
        idx_raw = g(field_idx + 14)
        result["index"] = int(idx_raw) if idx_raw.isdigit() else None
    except ValueError:
        pass

    return result


def _compute_row_confidence(row: Dict) -> float:
    """Compute row confidence based on which fields were parsed successfully."""
    required_fields = ["name_raw", "pts", "reb", "ast"]
    optional_fields = ["mins", "fg", "stl", "blk", "to", "pf", "plus_minus"]
    
    score = sum(1 for f in required_fields if row.get(f) is not None) / len(required_fields)
    bonus = sum(0.05 for f in optional_fields if row.get(f) is not None)
    return min(round(score + bonus, 2), 1.0)


def _parse_box_score_text(raw_text: str) -> ExtractedMatchStatsPreview:
    """Parse raw extracted text into a structured ExtractedMatchStatsPreview."""
    lines = raw_text.split("\n")
    header_idx = _find_header_row(lines)
    
    players: List[PlayerStatRow] = []
    
    if header_idx is not None:
        # Parse all lines after header until blank or suspect end
        for line in lines[header_idx + 1:]:
            row_dict = _parse_player_row(line)
            if not row_dict:
                continue
            confidence = _compute_row_confidence(row_dict)
            try:
                player = PlayerStatRow(
                    name_raw=row_dict["name_raw"],
                    jersey_number=row_dict.get("jersey_number"),
                    mins=row_dict.get("mins"),
                    pts=row_dict.get("pts", 0),
                    fg=row_dict.get("fg", "0-0"),
                    tp=row_dict.get("tp", "0-0"),
                    thp=row_dict.get("thp", "0-0"),
                    ft=row_dict.get("ft", "0-0"),
                    off=row_dict.get("off", 0),
                    def_reb=row_dict.get("def", 0),
                    reb=row_dict.get("reb", 0),
                    ast=row_dict.get("ast", 0),
                    to=row_dict.get("to", 0),
                    stl=row_dict.get("stl", 0),
                    blk=row_dict.get("blk", 0),
                    pf=row_dict.get("pf", 0),
                    plus_minus=row_dict.get("plus_minus"),
                    index=row_dict.get("index"),
                    row_confidence=confidence
                )
                players.append(player)
            except Exception:
                continue

    totals = validate_and_compute_totals(players)
    overall_confidence = round(sum(p.row_confidence or 0 for p in players) / len(players), 2) if players else 0.0
    header_bonus = 0.05 if header_idx is not None else 0.0

    return ExtractedMatchStatsPreview(
        players=players,
        team_totals=totals,
        overall_confidence=min(overall_confidence + header_bonus, 1.0)
    )


# ─────────────────────────────
# Main Background Task
# ─────────────────────────────

async def extract_stats_from_file_background(upload_id: str, organization_id: str):
    """
    Background task to extract stats from the uploaded box score file.
    """
    supabase = get_supabase_service()

    upload = await supabase.select_one("match_stat_uploads", upload_id)
    if not upload:
        return

    await supabase.update("match_stat_uploads", upload_id, {"extract_status": "extracting"})

    try:
        storage_path = upload["storage_path"]
        file_type = upload.get("file_type", "image")

        # Download the file from storage
        try:
            file_bytes = await _download_file(supabase, storage_path)
        except Exception as e:
            print(f"Could not download file, using placeholder: {e}")
            file_bytes = None

        if file_bytes:
            if file_type == "pdf":
                raw_text = _extract_text_from_pdf(file_bytes)
                if not raw_text.strip():
                    # Likely a scanned PDF — try OCR
                    raw_text = _extract_text_from_scanned_pdf(file_bytes)
            else:
                raw_text = _extract_text_from_image(file_bytes)
        else:
            raw_text = ""

        # Parse the text
        preview = _parse_box_score_text(raw_text)

        # Auto-link players
        preview.players = await auto_link_players_to_roster(organization_id, preview.players)

        # Determine status
        confidence_threshold = 0.80
        status = "needs_review" if preview.overall_confidence < confidence_threshold else "needs_review"

        await supabase.update(
            "match_stat_uploads",
            upload_id,
            {
                "extract_status": status,
                "extracted_json": preview.model_dump(by_alias=True),
                "confidence": preview.overall_confidence
            }
        )

    except Exception as e:
        print(f"Extraction failed for upload {upload_id}: {e}")
        import traceback
        traceback.print_exc()
        await supabase.update(
            "match_stat_uploads",
            upload_id,
            {
                "extract_status": "failed",
                "extracted_json": {"error": str(e)}
            }
        )


async def _download_file(supabase, storage_path: str) -> bytes:
    """Download a file from Supabase storage bucket."""
    import anyio
    client = supabase.client
    if not client:
        raise ConnectionError("Supabase not connected")
    response = await anyio.to_thread.run_sync(
        lambda: client.storage.from_("match-stats").download(storage_path)
    )
    return response
