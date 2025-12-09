#!/usr/bin/env python3
"""
Helper script to configure which actions are enabled for detection
Use this to disable actions that haven't been well-trained yet
"""

import json
from pathlib import Path

# Default configuration
DEFAULT_CONFIG = {
    "enabled_actions": {
        "free_throw_shot": True,
        "2point_shot": True,
        "3point_shot": True,
        "dribbling": True,
        "passing": False,  # Disable if not well-trained
        "defense": True,
        "idle": True,  # Always enabled as fallback
    },
    "confidence_thresholds": {
        "free_throw_shot": 0.4,  # Lower threshold for well-trained actions
        "2point_shot": 0.4,
        "3point_shot": 0.4,
        "dribbling": 0.4,
        "passing": 0.8,  # Higher threshold if enabled (not well-trained)
        "defense": 0.5,
        "idle": 0.3,  # Lower threshold for fallback
    },
    "min_confidence": 0.3  # Global minimum
}

def load_config(config_path: str = "action_config.json") -> dict:
    """Load action configuration from file"""
    config_file = Path(config_path)
    if config_file.exists():
        with open(config_file, 'r') as f:
            return json.load(f)
    return DEFAULT_CONFIG.copy()

def save_config(config: dict, config_path: str = "action_config.json"):
    """Save action configuration to file"""
    with open(config_path, 'w') as f:
        json.dump(config, f, indent=2)
    print(f"✅ Configuration saved to {config_path}")

def print_config(config: dict):
    """Print current configuration"""
    print("\n📋 Current Action Configuration:")
    print("=" * 60)
    print("\n✅ Enabled Actions:")
    for action, enabled in config["enabled_actions"].items():
        status = "✅ ENABLED" if enabled else "❌ DISABLED"
        threshold = config["confidence_thresholds"].get(action, 0.3)
        print(f"  {action:20s} {status:15s} (threshold: {threshold:.2f})")
    
    print(f"\n🔒 Global Minimum Confidence: {config['min_confidence']:.2f}")
    print("=" * 60)

def interactive_config():
    """Interactive configuration tool"""
    config = load_config()
    print_config(config)
    
    print("\n💡 To modify configuration:")
    print("  1. Edit backend/app/core/config.py directly")
    print("  2. Or modify the ENABLED_ACTIONS and ACTION_CONFIDENCE_THRESHOLDS dictionaries")
    print("\n📝 Example: To disable 'passing' and enable it later when trained:")
    print("  ENABLED_ACTIONS = {")
    print("      'passing': False,  # Not well-trained yet")
    print("      ...")
    print("  }")
    print("\n  ACTION_CONFIDENCE_THRESHOLDS = {")
    print("      'passing': 0.8,  # High threshold if enabled")
    print("      ...")
    print("  }")

if __name__ == "__main__":
    interactive_config()

