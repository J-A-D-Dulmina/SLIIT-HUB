from selenium.webdriver.common.by import By
from .base_page import BasePage
from ..helpers.waits import wait_visible

class VideoDetailsPage(BasePage):
    """Page Object for Video Details Page"""
    
    # Locators
    VIDEO_ACTIONS_BAR = (By.CSS_SELECTOR, ".video-actions")
    VIDEO_META = (By.CSS_SELECTOR, ".video-meta")
    LIKE_BTN = (By.CSS_SELECTOR, ".like-btn")
    SHARE_BTN = (By.CSS_SELECTOR, ".share-btn")
    SAVE_BTN = (By.CSS_SELECTOR, ".save-btn")
    DOWNLOAD_BTN = (By.CSS_SELECTOR, ".download-btn")
    VIDEO_DURATION = (By.CSS_SELECTOR, ".video-duration, .duration")
    VIDEO_OWNER = (By.CSS_SELECTOR, ".video-owner, .owner")
    
    def open(self, base_url, module_code, video_id):
        """Open the video details page"""
        self.driver.get(f"{base_url}/video/{module_code}/{video_id}")
    
    def is_actions_bar_visible(self):
        """Check if video actions bar is visible"""
        try:
            wait_visible(self.driver, self.VIDEO_ACTIONS_BAR)
            return True
        except:
            return False
    
    def click_like_button(self):
        """Click the like button"""
        wait_visible(self.driver, self.LIKE_BTN).click()
    
    def click_share_button(self):
        """Click the share button"""
        wait_visible(self.driver, self.SHARE_BTN).click()
    
    def click_save_button(self):
        """Click the save button"""
        wait_visible(self.driver, self.SAVE_BTN).click()
    
    def click_download_button(self):
        """Click the download button"""
        wait_visible(self.driver, self.DOWNLOAD_BTN).click()
    
    def get_video_duration(self):
        """Get video duration text"""
        try:
            return wait_visible(self.driver, self.VIDEO_DURATION).text
        except:
            return None
    
    def get_video_owner(self):
        """Get video owner text"""
        try:
            return wait_visible(self.driver, self.VIDEO_OWNER).text
        except:
            return None