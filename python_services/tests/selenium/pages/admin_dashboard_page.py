from selenium.webdriver.common.by import By
from .base_page import BasePage
from ..helpers.waits import wait_visible

class AdminDashboardPage(BasePage):
    """Page Object for Admin Dashboard"""
    
    # Locators
    ADMIN_SIDEBAR = (By.CSS_SELECTOR, ".admin-sidebar, .sidebar")
    STUDENTS_LINK = (By.CSS_SELECTOR, "a[href*='students']")
    LECTURERS_LINK = (By.CSS_SELECTOR, "a[href*='lecturers']")
    ADMINS_LINK = (By.CSS_SELECTOR, "a[href*='admins']")
    DEGREES_LINK = (By.CSS_SELECTOR, "a[href*='degrees']")
    VIDEOS_LINK = (By.CSS_SELECTOR, "a[href*='videos']")
    MEETINGS_LINK = (By.CSS_SELECTOR, "a[href*='meetings']")
    ANNOUNCEMENTS_LINK = (By.CSS_SELECTOR, "a[href*='announcements']")
    DASHBOARD_STATS = (By.CSS_SELECTOR, ".dashboard-stats, .stats")
    ADMIN_INFO = (By.CSS_SELECTOR, ".admin-info, .user-info")
    LOGOUT_BTN = (By.CSS_SELECTOR, "button[onclick*='logout'], .logout-btn")
    
    def open(self, base_url):
        """Open the admin dashboard page"""
        self.driver.get(f"{base_url}/admin/dashboard")
    
    def navigate_to_students(self):
        """Navigate to students management"""
        wait_visible(self.driver, self.STUDENTS_LINK).click()
    
    def navigate_to_lecturers(self):
        """Navigate to lecturers management"""
        wait_visible(self.driver, self.LECTURERS_LINK).click()
    
    def navigate_to_admins(self):
        """Navigate to admins management"""
        wait_visible(self.driver, self.ADMINS_LINK).click()
    
    def navigate_to_degrees(self):
        """Navigate to degrees management"""
        wait_visible(self.driver, self.DEGREES_LINK).click()
    
    def navigate_to_videos(self):
        """Navigate to videos management"""
        wait_visible(self.driver, self.VIDEOS_LINK).click()
    
    def navigate_to_meetings(self):
        """Navigate to meetings management"""
        wait_visible(self.driver, self.MEETINGS_LINK).click()
    
    def navigate_to_announcements(self):
        """Navigate to announcements management"""
        wait_visible(self.driver, self.ANNOUNCEMENTS_LINK).click()
    
    def logout(self):
        """Logout from admin panel"""
        wait_visible(self.driver, self.LOGOUT_BTN).click()
    
    def get_dashboard_stats(self):
        """Get dashboard statistics"""
        try:
            return wait_visible(self.driver, self.DASHBOARD_STATS).text
        except:
            return None
    
    def get_admin_info(self):
        """Get admin information"""
        try:
            return wait_visible(self.driver, self.ADMIN_INFO).text
        except:
            return None 
    def is_admin_sidebar_visible(self):
        return len(self.driver.find_elements(*self.ADMIN_SIDEBAR)) > 0
    
    def get_dashboard_stats(self):
        stats = {}
        try:
            stats['students'] = self.driver.find_element(*self.TOTAL_STUDENTS).text
        except:
            stats['students'] = "0"
        
        try:
            stats['lecturers'] = self.driver.find_element(*self.TOTAL_LECTURERS).text
        except:
            stats['lecturers'] = "0"
        
        try:
            stats['videos'] = self.driver.find_element(*self.TOTAL_VIDEOS).text
        except:
            stats['videos'] = "0"
        
        try:
            stats['meetings'] = self.driver.find_element(*self.TOTAL_MEETINGS).text
        except:
            stats['meetings'] = "0"
        
        return stats 