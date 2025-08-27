#!/usr/bin/env python3
"""
Debug script for Selenium tests
This script helps identify issues with failing tests after login
"""

import os
import sys
import time
import pytest
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from webdriver_manager.chrome import ChromeDriverManager

def setup_driver():
    """Setup Chrome driver with debugging options"""
    chrome_options = Options()
    
    # Debug options - show browser window
    chrome_options.add_argument('--no-sandbox')
    chrome_options.add_argument('--disable-dev-shm-usage')
    chrome_options.add_argument('--disable-gpu')
    chrome_options.add_argument('--window-size=1920,1080')
    
    # Don't run headless for debugging
    # chrome_options.add_argument('--headless')
    
    service = Service(ChromeDriverManager().install())
    driver = webdriver.Chrome(service=service, options=chrome_options)
    driver.implicitly_wait(10)
    
    return driver

def test_login_simulation():
    """Test the login simulation manually"""
    print("Testing login simulation...")
    
    driver = setup_driver()
    base_url = "http://localhost:3000"
    student_id = "ST001"
    student_name = "John Doe"
    
    try:
        # Navigate to the app
        print(f"Navigating to {base_url}")
        driver.get(base_url)
        time.sleep(2)
        
        # Clear localStorage
        print("Clearing localStorage...")
        driver.execute_script("localStorage.clear();")
        
        # Mock the API response
        print("Setting up API mock...")
        driver.execute_script("""
            const originalFetch = window.fetch;
            window.fetch = function(url, options) {
                if (url.includes('/api/protected')) {
                    console.log('Mocking API call to:', url);
                    return Promise.resolve({
                        ok: true,
                        status: 200,
                        json: () => Promise.resolve({
                            user: {
                                id: arguments[0],
                                name: arguments[1],
                                userType: 'student',
                                studentId: arguments[0],
                                email: 'student@example.com'
                            }
                        })
                    });
                }
                console.log('Real API call to:', url);
                return originalFetch.apply(this, arguments);
            };
        """, student_id, student_name)
        
        # Set up localStorage
        print("Setting up localStorage...")
        driver.execute_script("""
            localStorage.setItem('userInfo', JSON.stringify({
                id: arguments[0],
                name: arguments[1],
                userType: 'student',
                studentId: arguments[0],
                email: 'student@example.com'
            }));
            localStorage.setItem('userType', 'student');
            localStorage.setItem('token', 'fake-token-for-testing');
        """, student_id, student_name)
        
        # Navigate to dashboard
        print("Navigating to dashboard...")
        driver.get(f"{base_url}/dashboard")
        time.sleep(5)
        
        # Check what's on the page
        print(f"Current URL: {driver.current_url}")
        print(f"Page title: {driver.title}")
        
        # Check for side menu
        side_menu = driver.find_elements("css selector", ".side-menu")
        print(f"Side menu elements found: {len(side_menu)}")
        
        if side_menu:
            print("Side menu is visible!")
        else:
            print("Side menu not found")
            # Print page source for debugging
            print("Page source preview:")
            print(driver.page_source[:1000])
        
        # Check for any error messages
        error_elements = driver.find_elements("css selector", ".error, .alert-danger, .error-message")
        if error_elements:
            print("Error messages found:")
            for error in error_elements:
                print(f"  - {error.text}")
        
        # Wait for user input
        input("Press Enter to continue...")
        
    except Exception as e:
        print(f"Error during test: {e}")
        import traceback
        traceback.print_exc()
    finally:
        driver.quit()

def run_single_test(test_name):
    """Run a single test with verbose output"""
    print(f"Running test: {test_name}")
    
    # Run pytest with verbose output
    result = pytest.main([
        f"tests/selenium/suites/{test_name}",
        "-v",
        "--tb=long",
        "--capture=no"
    ])
    
    return result

if __name__ == "__main__":
    if len(sys.argv) > 1:
        if sys.argv[1] == "login":
            test_login_simulation()
        elif sys.argv[1] == "test":
            if len(sys.argv) > 2:
                run_single_test(sys.argv[2])
            else:
                print("Please specify a test file")
        else:
            print("Usage:")
            print("  python debug_tests.py login  - Test login simulation")
            print("  python debug_tests.py test <test_file>  - Run specific test")
    else:
        print("Usage:")
        print("  python debug_tests.py login  - Test login simulation")
        print("  python debug_tests.py test <test_file>  - Run specific test")







