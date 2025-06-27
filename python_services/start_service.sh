#!/bin/bash

echo "Starting AI Video Processing Service..."
echo

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "Activating virtual environment..."
source venv/bin/activate

# Install dependencies if requirements.txt exists
if [ -f "requirements.txt" ]; then
    echo "Installing dependencies..."
    pip install -r requirements.txt
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "Creating .env file from template..."
    cp env_template.txt .env
    echo
    echo "Please edit .env file and add your OpenAI API key before running the service."
    echo
    read -p "Press Enter to continue..."
    exit 1
fi

# Start the service
echo "Starting service on http://localhost:5001"
echo "Press Ctrl+C to stop the service"
echo
python api.py 