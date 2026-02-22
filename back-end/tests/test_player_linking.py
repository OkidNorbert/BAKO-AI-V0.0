import unittest
from app.services.player_linking_service import match_players_against_roster
from app.models.stats import PlayerStatRow

class TestPlayerLinking(unittest.TestCase):
    def setUp(self):
        self.roster = [
            {"id": "user1", "name": "Norbert Okidi", "jersey_number": 16},
            {"id": "user2", "name": "Michael Jordan", "jersey_number": 23},
            {"id": "user3", "name": "LeBron James", "jersey_number": 6},
            {"id": "user4", "name": "Stephen Curry", "jersey_number": 30},
        ]

    def test_exact_match(self):
        extracted = [PlayerStatRow(name_raw="Norbert Okidi", jersey_number=16)]
        result = match_players_against_roster(extracted, self.roster)
        
        self.assertEqual(result[0].linked_player_profile_id, "user1")
        self.assertEqual(result[0].link_reason, "Jersey + Fuzzy Name")
        self.assertGreater(result[0].link_confidence, 0.9)

    def test_fuzzy_name_with_jersey(self):
        # Slightly misspelled name, correct jersey
        extracted = [PlayerStatRow(name_raw="Norber Okdi", jersey_number=16)]
        result = match_players_against_roster(extracted, self.roster)
        
        self.assertEqual(result[0].linked_player_profile_id, "user1")

    def test_fuzzy_name_no_jersey(self):
        # No jersey provided, but name matches closely enough
        extracted = [PlayerStatRow(name_raw="Stephen Curri")]
        result = match_players_against_roster(extracted, self.roster)
        
        self.assertEqual(result[0].linked_player_profile_id, "user4")
        self.assertEqual(result[0].link_reason, "Fuzzy Name Only")
        
    def test_initials_matching(self):
        # M. Jordan -> should match Michael Jordan if score is high enough or jersey matches
        # With jersey 23, it should easily match
        extracted = [PlayerStatRow(name_raw="M. Jordan", jersey_number=23)]
        result = match_players_against_roster(extracted, self.roster)
        
        self.assertEqual(result[0].linked_player_profile_id, "user2")

    def test_no_match(self):
        extracted = [PlayerStatRow(name_raw="Random Player", jersey_number=99)]
        result = match_players_against_roster(extracted, self.roster)
        
        self.assertIsNone(result[0].linked_player_profile_id)
        self.assertEqual(result[0].link_reason, "No confident match")

if __name__ == "__main__":
    unittest.main()
