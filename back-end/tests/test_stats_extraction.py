import unittest
from app.services.stats_utils import parse_xy_field, validate_and_compute_totals
from app.models.stats import PlayerStatRow, TeamTotals

class TestStatsUtils(unittest.TestCase):

    def test_parse_xy_field_valid(self):
        self.assertEqual(parse_xy_field("5-10"), (5, 10))
        self.assertEqual(parse_xy_field("5/10"), (5, 10))
        self.assertEqual(parse_xy_field("0-0"), (0, 0))
        self.assertEqual(parse_xy_field(" 12 - 20 "), (12, 20))

    def test_parse_xy_field_invalid(self):
        self.assertEqual(parse_xy_field("invalid"), (0, 0))
        self.assertEqual(parse_xy_field(None), (0, 0))
        self.assertEqual(parse_xy_field("5"), (0, 0))

    def test_validate_and_compute_totals_no_existing(self):
        players = [
            PlayerStatRow(name_raw="P1", pts=10, reb=5, ast=2),
            PlayerStatRow(name_raw="P2", pts=15, reb=10, ast=5)
        ]
        
        # Test computing missing totals
        totals = validate_and_compute_totals(players)
        self.assertEqual(totals.pts, 25)
        self.assertEqual(totals.reb, 15)
        self.assertEqual(totals.ast, 7)

    def test_validate_and_compute_totals_with_existing(self):
        players = [
            PlayerStatRow(name_raw="P1", pts=10, reb=5, ast=2),
            PlayerStatRow(name_raw="P2", pts=15, reb=10, ast=5)
        ]
        existing = TeamTotals(pts=25, reb=15, ast=7)
        
        # Test passing existing totals
        totals = validate_and_compute_totals(players, existing)
        self.assertEqual(totals.pts, 25)

    def test_rebounds_auto_compute(self):
        # reb = 0 but off and def exist
        players = [
            PlayerStatRow(name_raw="P1", off=2, def_reb=3, reb=0)
        ]
        totals = validate_and_compute_totals(players)
        self.assertEqual(players[0].reb, 5)
        self.assertEqual(totals.reb, 5)

if __name__ == "__main__":
    unittest.main()
