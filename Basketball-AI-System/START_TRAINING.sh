#!/bin/bash
# Quick start script for Basketball AI Training Dashboard

echo "🏀 Starting Basketball AI Training Dashboard..."
echo ""

# Navigate to training directory
cd "$(dirname "$0")/training"

# Check if virtual environment exists
if [ ! -d "../backend/venv" ]; then
    echo "❌ Virtual environment not found!"
    echo "Please run: cd ../backend && python3.11 -m venv venv"
    exit 1
fi

# Activate virtual environment
source ../backend/venv/bin/activate

# Install additional dependencies if needed
pip install pillow >/dev/null 2>&1

# Run the GUI
python training_gui.py

# Deactivate venv
deactivate

