@echo off
echo Starting AI Video Processing Service...
echo.

REM Check if virtual environment exists
if not exist "venv" (
    echo Creating virtual environment...
    python -m venv venv
)

REM Activate virtual environment
echo Activating virtual environment...
call venv\Scripts\activate

REM Install dependencies if requirements.txt exists
if exist "requirements.txt" (
    echo Installing dependencies...
    pip install -r requirements.txt
)

REM Check if .env file exists
if not exist ".env" (
    echo Creating .env file from template...
    copy env_template.txt .env
    echo.
    echo Please edit .env file and add your OpenAI API key before running the service.
    echo.
    pause
    exit /b 1
)

REM Start the service
echo Starting service on http://localhost:5001
echo Press Ctrl+C to stop the service
echo.
python api.py

pause 