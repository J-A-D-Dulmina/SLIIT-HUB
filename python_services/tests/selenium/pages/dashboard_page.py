from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException
from .base_page import BasePage
from ..helpers.waits import wait_visible, wait_clickable
import time

class DashboardPage(BasePage):
    """Page Object for Student Dashboard"""
    
    # Updated locators to match actual React app structure
    SIDE_MENU = (By.CSS_SELECTOR, ".side-menu")
    MODULES_LINK = (By.CSS_SELECTOR, "a[href*='units'], a[href*='modules'], a[href*='content']")
    MEETINGS_LINK = (By.CSS_SELECTOR, "a[href*='meetings'], a[href*='join-meeting']")
    TUTORING_LINK = (By.CSS_SELECTOR, "a[href*='tutoring']")
    RESOURCES_LINK = (By.CSS_SELECTOR, "a[href*='resources']")
    AI_TOOLS_LINK = (By.CSS_SELECTOR, "a[href*='ai']")
    CALENDAR_LINK = (By.CSS_SELECTOR, "a[href*='calendar']")
    PROFILE_LINK = (By.CSS_SELECTOR, "a[href*='profile']")
    USER_INFO = (By.CSS_SELECTOR, ".user-info, .user-profile")
    LOGOUT_BTN = (By.CSS_SELECTOR, "button[onclick*='logout'], .logout-btn, a[href*='logout']")
    DASHBOARD_CONTENT = (By.CSS_SELECTOR, ".dashboard-content, .main-content")
    
    def open(self, base_url):
        """Open the dashboard page"""
        try:
            self.driver.get(f"{base_url}/dashboard")
            # Wait for dashboard to load
            self.wait_for_dashboard_load()
        except Exception as e:
            print(f"Error opening dashboard: {e}")
            # Try opening just the base URL
            self.driver.get(base_url)
    
    def wait_for_dashboard_load(self, timeout=15):
        """Wait for dashboard to fully load"""
        try:
            # Wait for side menu to be visible
            WebDriverWait(self.driver, timeout).until(
                EC.presence_of_element_located(self.SIDE_MENU)
            )
            # Wait for dashboard content
            WebDriverWait(self.driver, timeout).until(
                EC.presence_of_element_located(self.DASHBOARD_CONTENT)
            )
        except TimeoutException:
            print("Dashboard load timeout - continuing anyway")
    
    def navigate_to_modules(self):
        """Navigate to modules page"""
        try:
            element = wait_clickable(self.driver, self.MODULES_LINK, timeout=10)
            element.click()
            # Wait for navigation
            time.sleep(2)
        except TimeoutException:
            print("Modules link not found")
            # Try alternative approach
            self.driver.get(f"{self.driver.current_url.split('/')[0]}//{self.driver.current_url.split('/')[2]}/units")
    
    def navigate_to_meetings(self):
        """Navigate to meetings page"""
        try:
            element = wait_clickable(self.driver, self.MEETINGS_LINK, timeout=10)
            element.click()
            time.sleep(2)
        except TimeoutException:
            print("Meetings link not found")
            self.driver.get(f"{self.driver.current_url.split('/')[0]}//{self.driver.current_url.split('/')[2]}/my-meetings")
    
    def navigate_to_tutoring(self):
        """Navigate to tutoring page"""
        try:
            element = wait_clickable(self.driver, self.TUTORING_LINK, timeout=10)
            element.click()
            time.sleep(2)
        except TimeoutException:
            print("Tutoring link not found")
            self.driver.get(f"{self.driver.current_url.split('/')[0]}//{self.driver.current_url.split('/')[2]}/tutoring")
    
    def navigate_to_resources(self):
        """Navigate to resources page"""
        try:
            element = wait_clickable(self.driver, self.RESOURCES_LINK, timeout=10)
            element.click()
            time.sleep(2)
        except TimeoutException:
            print("Resources link not found")
            self.driver.get(f"{self.driver.current_url.split('/')[0]}//{self.driver.current_url.split('/')[2]}/resources")
    
    def navigate_to_ai_tools(self):
        """Navigate to AI tools page"""
        try:
            element = wait_clickable(self.driver, self.AI_TOOLS_LINK, timeout=10)
            element.click()
            time.sleep(2)
        except TimeoutException:
            print("AI tools link not found")
            self.driver.get(f"{self.driver.current_url.split('/')[0]}//{self.driver.current_url.split('/')[2]}/ai")
    
    def navigate_to_calendar(self):
        """Navigate to calendar page"""
        try:
            element = wait_clickable(self.driver, self.CALENDAR_LINK, timeout=10)
            element.click()
            time.sleep(2)
        except TimeoutException:
            print("Calendar link not found")
            self.driver.get(f"{self.driver.current_url.split('/')[0]}//{self.driver.current_url.split('/')[2]}/calendar")
    
    def navigate_to_profile(self):
        """Navigate to profile page"""
        try:
            element = wait_clickable(self.driver, self.PROFILE_LINK, timeout=10)
            element.click()
            time.sleep(2)
        except TimeoutException:
            print("Profile link not found")
            self.driver.get(f"{self.driver.current_url.split('/')[0]}//{self.driver.current_url.split('/')[2]}/profile")
    
    def logout(self):
        """Logout from the application"""
        try:
            element = wait_clickable(self.driver, self.LOGOUT_BTN, timeout=10)
            element.click()
        except TimeoutException:
            print("Logout button not found")
    
    def get_user_info(self):
        """Get user information"""
        try:
            element = wait_visible(self.driver, self.USER_INFO, timeout=5)
            return element.text if element else None
        except TimeoutException:
            return None
    
    def is_side_menu_visible(self):
        """Check if side menu is visible"""
        try:
            return len(self.driver.find_elements(*self.SIDE_MENU)) > 0
        except:
            return False
    
    def get_current_url(self):
        """Get current URL"""
        return self.driver.current_url
    
    def is_on_dashboard(self):
        """Check if currently on dashboard page"""
        return "/dashboard" in self.driver.current_url 