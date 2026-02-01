#!/bin/bash

# Basketball Analysis System - Quick Run Script
# This script activates the virtual environment and runs the analysis

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}============================================================${NC}"
echo -e "${BLUE}   Basketball Analysis System - Quick Run${NC}"
echo -e "${BLUE}============================================================${NC}"
echo ""

# Check if venv exists
if [ ! -d "venv" ]; then
    echo -e "${RED}❌ Virtual environment not found!${NC}"
    echo -e "${YELLOW}Creating virtual environment...${NC}"
    python3 -m venv venv
    echo -e "${GREEN}✓ Virtual environment created${NC}"
fi

# Activate virtual environment
echo -e "${YELLOW}Activating virtual environment...${NC}"
source venv/bin/activate
echo -e "${GREEN}✓ Virtual environment activated${NC}"
echo ""

# Check what command to run
if [ "$1" == "--check" ] || [ "$1" == "-c" ]; then
    echo -e "${BLUE}Running system check...${NC}"
    python test_system.py --check-only
elif [ "$1" == "--test" ] || [ "$1" == "-t" ]; then
    echo -e "${BLUE}Running full system test...${NC}"
    python test_system.py
elif [ "$1" == "--help" ] || [ "$1" == "-h" ]; then
    echo "Usage: ./run.sh [OPTION] [VIDEO_FILE]"
    echo ""
    echo "Options:"
    echo "  -c, --check          Run system check only"
    echo "  -t, --test           Run full system test"
    echo "  -h, --help           Show this help message"
    echo "  [VIDEO_FILE]         Analyze specific video file"
    echo ""
    echo "Examples:"
    echo "  ./run.sh --check                          # Check system setup"
    echo "  ./run.sh --test                           # Run test with sample video"
    echo "  ./run.sh input_videos/video_1.mp4         # Analyze specific video"
    echo "  ./run.sh input_videos/my_video.mp4        # Analyze your own video"
elif [ -n "$1" ]; then
    # Video file provided
    if [ ! -f "$1" ]; then
        echo -e "${RED}❌ Video file not found: $1${NC}"
        exit 1
    fi
    
    VIDEO_NAME=$(basename "$1")
    OUTPUT_FILE="output_videos/analyzed_${VIDEO_NAME%.*}.avi"
    
    echo -e "${BLUE}Analyzing video: ${YELLOW}$1${NC}"
    echo -e "${BLUE}Output will be saved to: ${YELLOW}$OUTPUT_FILE${NC}"
    echo ""
    
    python main.py "$1" --output_video "$OUTPUT_FILE"
    
    if [ $? -eq 0 ]; then
        echo ""
        echo -e "${GREEN}============================================================${NC}"
        echo -e "${GREEN}✅ Analysis complete!${NC}"
        echo -e "${GREEN}============================================================${NC}"
        echo -e "Output saved to: ${YELLOW}$OUTPUT_FILE${NC}"
    else
        echo ""
        echo -e "${RED}============================================================${NC}"
        echo -e "${RED}❌ Analysis failed!${NC}"
        echo -e "${RED}============================================================${NC}"
    fi
else
    # No arguments - show usage
    echo -e "${YELLOW}No arguments provided. Running system check...${NC}"
    echo ""
    python test_system.py --check-only
    echo ""
    echo -e "${BLUE}To analyze a video, use:${NC}"
    echo -e "  ${GREEN}./run.sh input_videos/video_1.mp4${NC}"
    echo ""
    echo -e "${BLUE}For more options, use:${NC}"
    echo -e "  ${GREEN}./run.sh --help${NC}"
fi
