le#!/usr/bin/env python3
"""
Test runner script for Selenium tests
Provides options to run tests with debugging and troubleshooting
"""

import os
import sys
import subprocess
import argparse
from pathlib import Path

def get_python_executable():
    """Get the correct Python executable for the virtual environment"""
    if os.name == 'nt':  # Windows
        venv_python = os.path.join(os.getcwd(), "venv", "Scripts", "python.exe")
    else:  # Unix/Linux/Mac
        venv_python = os.path.join(os.getcwd(), "venv", "bin", "python")
    
    if os.path.exists(venv_python):
        return venv_python
    else:
        # Fallback to system python if venv not found
        return "python"

def run_command(cmd, description=""):
    """Run a command and handle errors"""
    print(f"\n{'='*50}")
    print(f"Running: {description}")
    print(f"Command: {' '.join(cmd)}")
    print(f"{'='*50}")
    
    try:
        result = subprocess.run(cmd, check=True, capture_output=False)
        print(f"\n✅ {description} completed successfully")
        return True
    except subprocess.CalledProcessError as e:
        print(f"\n❌ {description} failed with exit code {e.returncode}")
        return False

def check_prerequisites():
    """Check if all prerequisites are met"""
    print("Checking prerequisites...")
    
    # Check if we're in the right directory
    if not os.path.exists("tests/selenium"):
        print("❌ Not in the correct directory. Please run from python_services/")
        return False
    
    # Check if virtual environment exists
    if not os.path.exists("venv"):
        print("❌ Virtual environment not found. Please create it first.")
        return False
    
    # Check if required packages are installed
    python_exe = get_python_executable()
    try:
        result = subprocess.run([python_exe, "-c", "import pytest, selenium, webdriver_manager"], 
                              capture_output=True, text=True)
        if result.returncode != 0:
            print("❌ Required packages not installed. Please run: pip install -r requirements.txt")
            return False
        print("✅ Required packages are installed")
    except Exception as e:
        print(f"❌ Error checking packages: {e}")
        return False
    
    # Check if React app is running (optional)
    try:
        import requests
        response = requests.get("http://localhost:3000", timeout=5)
        if response.status_code == 200:
            print("✅ React app is running")
        else:
            print("⚠️  React app might not be running properly")
    except:
        print("⚠️  React app is not running. Please start it with 'npm start' in the client/ directory")
    
    print("✅ Prerequisites check completed")
    return True

def run_single_test(test_file, verbose=False):
    """Run a single test file"""
    python_exe = get_python_executable()
    cmd = [python_exe, "-m", "pytest", f"tests/selenium/suites/{test_file}"]
    
    if verbose:
        cmd.extend(["-v", "--tb=long", "--capture=no"])
    
    return run_command(cmd, f"Running test: {test_file}")

def run_all_tests(verbose=False):
    """Run all Selenium tests"""
    python_exe = get_python_executable()
    cmd = [python_exe, "-m", "pytest", "tests/selenium/suites/"]
    
    if verbose:
        cmd.extend(["-v", "--tb=long", "--capture=no"])
    
    return run_command(cmd, "Running all Selenium tests")

def run_debug_test():
    """Run the debug test to check login simulation"""
    python_exe = get_python_executable()
    cmd = [python_exe, "tests/selenium/debug_tests.py", "login"]
    return run_command(cmd, "Running login simulation debug test")

def run_smoke_test():
    """Run smoke tests"""
    python_exe = get_python_executable()
    cmd = [python_exe, "-m", "pytest", "tests/selenium/suites/test_smoke.py", "-v"]
    return run_command(cmd, "Running smoke tests")

def main():
    parser = argparse.ArgumentParser(description="Run Selenium tests with debugging options")
    parser.add_argument("--test", help="Run a specific test file")
    parser.add_argument("--all", action="store_true", help="Run all tests")
    parser.add_argument("--debug", action="store_true", help="Run debug test")
    parser.add_argument("--smoke", action="store_true", help="Run smoke tests")
    parser.add_argument("--verbose", "-v", action="store_true", help="Verbose output")
    parser.add_argument("--check", action="store_true", help="Check prerequisites only")
    
    args = parser.parse_args()
    
    # Check prerequisites first
    if not check_prerequisites():
        sys.exit(1)
    
    if args.check:
        return
    
    # Set environment variables
    os.environ['PYTHONPATH'] = os.getcwd()
    
    success = True
    
    if args.debug:
        success = run_debug_test()
    elif args.smoke:
        success = run_smoke_test()
    elif args.test:
        success = run_single_test(args.test, args.verbose)
    elif args.all:
        success = run_all_tests(args.verbose)
    else:
        # Default: run smoke tests
        success = run_smoke_test()
    
    if success:
        print("\n🎉 All tests completed successfully!")
        sys.exit(0)
    else:
        print("\n💥 Some tests failed. Check the output above for details.")
        sys.exit(1)

if __name__ == "__main__":
    main()
