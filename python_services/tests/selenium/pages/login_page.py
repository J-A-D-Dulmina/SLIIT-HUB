from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.common.exceptions import TimeoutException, NoSuchElementException
from .base_page import BasePage
from ..helpers.waits import wait_visible, wait_clickable, safe_find_element

class LoginPage(BasePage):
    """Page Object for Login Page"""
    
    # Locators - more specific and robust
    STUDENT_LOGIN_BTN = (By.CSS_SELECTOR, "button[onclick*='student'], button:contains('Student'), .student-login-btn")
    ADMIN_LOGIN_BTN = (By.CSS_SELECTOR, "button[onclick*='admin'], button:contains('Admin'), .admin-login-btn")
    STUDENT_ID_INPUT = (By.CSS_SELECTOR, "input[placeholder*='Student ID'], input[name*='student'], input[id*='student']")
    STUDENT_PASSWORD_INPUT = (By.CSS_SELECTOR, "input[type='password'][placeholder*='Password'], input[name*='password']")
    ADMIN_EMAIL_INPUT = (By.CSS_SELECTOR, "input[type='email'], input[placeholder*='Email'], input[name*='email']")
    ADMIN_PASSWORD_INPUT = (By.CSS_SELECTOR, "input[type='password'][placeholder*='Password'], input[name*='password']")
    LOGIN_SUBMIT_BTN = (By.CSS_SELECTOR, "button[type='submit'], button:contains('Login'), .login-btn")
    ERROR_MESSAGE = (By.CSS_SELECTOR, ".error-message, .alert-danger, .error, [class*='error']")
    USER_INFO = (By.CSS_SELECTOR, ".user-info, .user-name, [class*='user']")
    LOGOUT_BTN = (By.CSS_SELECTOR, "button[onclick*='logout'], .logout-btn, a[href*='logout']")
    
    def open(self, base_url):
        """Open the login page"""
        try:
            self.driver.get(f"{base_url}/login")
            # Wait for page to load
            self.driver.implicitly_wait(3)
        except Exception as e:
            print(f"Error opening login page: {e}")
            # Try opening just the base URL
            self.driver.get(base_url)
    
    def click_student_login(self):
        """Click student login button"""
        try:
            element = wait_clickable(self.driver, self.STUDENT_LOGIN_BTN, timeout=15)
            element.click()
        except TimeoutException:
            print("Student login button not found, trying alternative approach")
            # Try to find any button that might be for student login
            buttons = self.driver.find_elements(By.TAG_NAME, "button")
            for button in buttons:
                if "student" in button.text.lower() or "login" in button.text.lower():
                    button.click()
                    break
    
    def click_admin_login(self):
        """Click admin login button"""
        try:
            element = wait_clickable(self.driver, self.ADMIN_LOGIN_BTN, timeout=15)
            element.click()
        except TimeoutException:
            print("Admin login button not found, trying alternative approach")
            # Try to find any button that might be for admin login
            buttons = self.driver.find_elements(By.TAG_NAME, "button")
            for button in buttons:
                if "admin" in button.text.lower():
                    button.click()
                    break
    
    def enter_student_credentials(self, student_id, password):
        """Enter student login credentials"""
        try:
            id_input = wait_visible(self.driver, self.STUDENT_ID_INPUT, timeout=15)
            id_input.clear()
            id_input.send_keys(student_id)
            
            password_input = wait_visible(self.driver, self.STUDENT_PASSWORD_INPUT, timeout=15)
            password_input.clear()
            password_input.send_keys(password)
        except TimeoutException as e:
            print(f"Error entering student credentials: {e}")
    
    def enter_admin_credentials(self, email, password):
        """Enter admin login credentials"""
        try:
            email_input = wait_visible(self.driver, self.ADMIN_EMAIL_INPUT, timeout=15)
            email_input.clear()
            email_input.send_keys(email)
            
            password_input = wait_visible(self.driver, self.ADMIN_PASSWORD_INPUT, timeout=15)
            password_input.clear()
            password_input.send_keys(password)
        except TimeoutException as e:
            print(f"Error entering admin credentials: {e}")
    
    def submit_login(self):
        """Submit login form"""
        try:
            element = wait_clickable(self.driver, self.LOGIN_SUBMIT_BTN, timeout=15)
            element.click()
        except TimeoutException:
            print("Login submit button not found, trying alternative approach")
            # Try to find any submit button
            buttons = self.driver.find_elements(By.TAG_NAME, "button")
            for button in buttons:
                if "login" in button.text.lower() or button.get_attribute("type") == "submit":
                    button.click()
                    break
    
    def get_error_message(self):
        """Get error message if present"""
        try:
            element = safe_find_element(self.driver, self.ERROR_MESSAGE, timeout=5)
            return element.text if element else None
        except:
            return None
    
    def is_logged_in(self):
        """Check if user is logged in"""
        try:
            # Check for dashboard elements or user info
            current_url = self.driver.current_url.lower()
            page_source = self.driver.page_source.lower()
            
            # Check for user info element
            user_info = safe_find_element(self.driver, self.USER_INFO, timeout=3)
            if user_info:
                return True
            
            # Check URL and page content
            if "dashboard" in current_url or "logout" in page_source:
                return True
            
            # Check localStorage for user data
            user_data = self.driver.execute_script("return localStorage.getItem('user');")
            if user_data:
                return True
                
            return False
        except Exception as e:
            print(f"Error checking login status: {e}")
            return False
    
    def wait_for_page_load(self, timeout=10):
        """Wait for page to fully load"""
        try:
            WebDriverWait(self.driver, timeout).until(
                lambda driver: driver.execute_script("return document.readyState") == "complete"
            )
        except TimeoutException:
            print("Page load timeout") 