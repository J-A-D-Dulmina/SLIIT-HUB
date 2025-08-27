import os
import time
import pytest
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from webdriver_manager.chrome import ChromeDriverManager
from dotenv import load_dotenv
from .config.test_config import TestConfig

# Reduce TensorFlow/CPP logs
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'

# Load environment variables - try both .env and env_template.txt
env_path = 'tests/selenium/config/.env'
if not os.path.exists(env_path):
    env_path = 'tests/selenium/config/env_template.txt'
load_dotenv(env_path)

@pytest.fixture(scope="session")
def driver():
    """Create and configure Chrome WebDriver"""
    chrome_options = Options()

    # Suppress Chrome/Driver logs
    chrome_options.add_experimental_option('excludeSwitches', ['enable-logging'])
    chrome_options.add_argument('--log-level=3')
    chrome_options.add_argument('--disable-logging')
    chrome_options.add_argument('--silent')
    chrome_options.add_argument('--disable-extensions')

    # Add headless option if specified
    if TestConfig.HEADLESS:
        chrome_options.add_argument('--headless')

    chrome_options.add_argument('--no-sandbox')
    chrome_options.add_argument('--disable-dev-shm-usage')
    chrome_options.add_argument('--disable-gpu')
    chrome_options.add_argument('--window-size=1920,1080')
    chrome_options.add_argument('--disable-web-security')
    chrome_options.add_argument('--allow-running-insecure-content')

    service = Service(ChromeDriverManager().install())
    driver = webdriver.Chrome(service=service, options=chrome_options)
    
    # Set implicit wait
    driver.implicitly_wait(TestConfig.IMPLICIT_WAIT)
    
    yield driver
    try:
        driver.quit()
    except:
        pass

@pytest.fixture
def base_url():
    """Get base URL from configuration"""
    return TestConfig.BASE_URL

@pytest.fixture
def module_code():
    """Get module code from configuration"""
    return TestConfig.MODULE_CODE

@pytest.fixture
def student_id():
    """Get student ID from configuration"""
    return TestConfig.STUDENT_ID

@pytest.fixture
def student_name():
    """Get student name from configuration"""
    return TestConfig.STUDENT_NAME

@pytest.fixture
def student_password():
    """Get student password from configuration"""
    return TestConfig.STUDENT_PASSWORD

@pytest.fixture
def admin_email():
    """Get admin email from configuration"""
    return TestConfig.ADMIN_EMAIL

@pytest.fixture
def admin_password():
    """Get admin password from configuration"""
    return TestConfig.ADMIN_PASSWORD

@pytest.fixture
def logged_in_driver(driver, base_url):
    """Driver with proper student login simulation"""
    try:
        print("Setting up logged in driver...")
        
        # Navigate to a blank page first to set up mocks
        driver.get("data:text/html,<html><body></body></html>")
        
        # Get test data from configuration
        student_data = TestConfig.get_student_user_data()
        storage_data = TestConfig.get_local_storage_data('student')
        
        # Set up comprehensive API mocking before loading the app
        print("Setting up API mock...")
        driver.execute_script("""
            // Mock axios specifically for the /api/protected endpoint
            const originalXMLHttpRequest = window.XMLHttpRequest;
            
            window.XMLHttpRequest = function() {
                const xhr = new originalXMLHttpRequest();
                const originalOpen = xhr.open;
                const originalSend = xhr.send;
                
                xhr.open = function(method, url, async, user, password) {
                    console.log('XHR open called with URL:', url);
                    this._url = url;
                    this._method = method;
                    return originalOpen.apply(this, arguments);
                };
                
                xhr.send = function(data) {
                    if (this._url && this._url.includes('/api/protected')) {
                        console.log('Mocking XHR API call to:', this._url);
                        // Simulate successful response
                        setTimeout(() => {
                            this.readyState = 4;
                            this.status = 200;
                            this.responseText = JSON.stringify({
                                user: arguments[0]
                            });
                            this.onreadystatechange && this.onreadystatechange();
                        }, 100);
                        return;
                    }
                    console.log('Real XHR call to:', this._url);
                    return originalSend.apply(this, arguments);
                };
                
                return xhr;
            };
            
            // Also mock fetch as backup
            const originalFetch = window.fetch;
            window.fetch = function(url, options) {
                console.log('Fetch called with URL:', url);
                
                if (url.includes('/api/protected')) {
                    console.log('Mocking fetch API call to:', url);
                    return Promise.resolve({
                        ok: true,
                        status: 200,
                        json: function() {
                            return Promise.resolve({
                                user: arguments[0]
                            });
                        }
                    });
                }
                
                console.log('Real fetch call to:', url);
                return originalFetch.apply(this, arguments);
            };
        """, student_data)
        
        # Now navigate to the actual app
        driver.get(base_url)
        
        # Clear any existing localStorage and set up new data
        driver.execute_script("localStorage.clear();")
        print("Setting up localStorage...")
        driver.execute_script("""
            localStorage.setItem('userInfo', JSON.stringify(arguments[0]));
            localStorage.setItem('userType', arguments[1]);
            localStorage.setItem('token', arguments[2]);
        """, storage_data['userInfo'], storage_data['userType'], storage_data['token'])
        
        # Navigate to dashboard to trigger authentication check
        print("Navigating to dashboard...")
        driver.get(f"{base_url}/dashboard")
        
        # Wait for the app to load and authentication to complete
        time.sleep(5)
        
        # Wait for side menu to be visible (indicates successful login)
        from selenium.webdriver.common.by import By
        from selenium.webdriver.support.ui import WebDriverWait
        from selenium.webdriver.support import expected_conditions as EC
        
        try:
            print("Waiting for side menu...")
            WebDriverWait(driver, 15).until(
                EC.presence_of_element_located((By.CSS_SELECTOR, ".side-menu"))
            )
            print("Side menu found - login successful!")
        except Exception as e:
            print(f"Warning: Side menu not found: {e}")
            # Print current page info for debugging
            print(f"Current URL: {driver.current_url}")
            print(f"Page title: {driver.title}")
            
            # Check if we're redirected to login
            if "login" in driver.current_url.lower():
                print("Redirected to login page - authentication failed")
                # Try to debug by checking what's in localStorage
                user_info = driver.execute_script("return localStorage.getItem('userInfo');")
                print(f"localStorage userInfo: {user_info}")
                
                # Check browser console for any errors
                console_logs = driver.execute_script("return window.console.logs || [];")
                if console_logs:
                    print("Console logs:")
                    for log in console_logs[-5:]:  # Last 5 logs
                        print(f"  - {log}")
            else:
                print("Not on login page, but side menu not found")
        
        return driver
    except Exception as e:
        print(f"Error in logged_in_driver fixture: {e}")
        import traceback
        traceback.print_exc()
        return driver

@pytest.fixture
def admin_logged_in_driver(driver, base_url):
    """Driver with proper admin login simulation"""
    try:
        print("Setting up admin logged in driver...")
        driver.get(base_url)
        
        # Clear any existing localStorage
        driver.execute_script("localStorage.clear();")
        
        # Get test data from configuration
        admin_data = TestConfig.get_admin_user_data()
        storage_data = TestConfig.get_local_storage_data('admin')
        
        # Mock the API response
        driver.execute_script("""
            const originalFetch = window.fetch;
            window.fetch = function(url, options) {
                if (url.includes('/api/protected')) {
                    console.log('Mocking admin API call to:', url);
                    return Promise.resolve({
                        ok: true,
                        status: 200,
                        json: function() {
                            return Promise.resolve({
                                user: arguments[0]
                            });
                        }
                    });
                }
                return originalFetch.apply(this, arguments);
            };
        """, admin_data)
        
        # Set up localStorage
        driver.execute_script("""
            localStorage.setItem('userInfo', JSON.stringify(arguments[0]));
            localStorage.setItem('userType', arguments[1]);
            localStorage.setItem('token', arguments[2]);
        """, storage_data['userInfo'], storage_data['userType'], storage_data['token'])
        
        # Navigate to admin dashboard
        driver.get(f"{base_url}/admin-dashboard")
        time.sleep(3)
        
        return driver
    except Exception as e:
        print(f"Error in admin_logged_in_driver fixture: {e}")
        return driver