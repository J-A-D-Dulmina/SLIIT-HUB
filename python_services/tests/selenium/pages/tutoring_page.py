from selenium.webdriver.common.by import By
from .base_page import BasePage
from ..helpers.waits import wait_visible, wait_all_visible

class TutoringPage(BasePage):
    """Page Object for Tutoring Page"""
    
    # Locators
    UPLOAD_FORM = (By.CSS_SELECTOR, ".upload-form, form")
    VIDEO_FILE_INPUT = (By.CSS_SELECTOR, "input[type='file']")
    TITLE_INPUT = (By.CSS_SELECTOR, "input[name='title'], input[placeholder*='title']")
    DESCRIPTION_INPUT = (By.CSS_SELECTOR, "textarea[name='description'], textarea[placeholder*='description']")
    MODULE_SELECT = (By.CSS_SELECTOR, "select[name='module'], select")
    SUBMIT_BTN = (By.CSS_SELECTOR, "button[type='submit'], .submit-btn")
    MY_VIDEOS_SECTION = (By.CSS_SELECTOR, ".my-videos, .video-list")
    VIDEO_LIST_ITEMS = (By.CSS_SELECTOR, ".video-item, .video-card")
    STATUS_BADGE = (By.CSS_SELECTOR, ".status-badge, .badge")
    
    def open(self, base_url):
        """Open the tutoring page"""
        self.driver.get(f"{base_url}/tutoring")
    
    def is_upload_form_visible(self):
        """Check if upload form is visible"""
        try:
            wait_visible(self.driver, self.UPLOAD_FORM)
            return True
        except:
            return False
    
    def upload_video(self, file_path, title, description, module):
        """Upload a video with given details"""
        # Select file
        file_input = wait_visible(self.driver, self.VIDEO_FILE_INPUT)
        file_input.send_keys(file_path)
        
        # Fill form
        wait_visible(self.driver, self.TITLE_INPUT).send_keys(title)
        wait_visible(self.driver, self.DESCRIPTION_INPUT).send_keys(description)
        
        # Select module
        module_select = wait_visible(self.driver, self.MODULE_SELECT)
        module_select.click()
        module_option = self.driver.find_element(By.XPATH, f"//option[contains(text(), '{module}')]")
        module_option.click()
        
        # Submit
        wait_visible(self.driver, self.SUBMIT_BTN).click()
    
    def get_my_videos(self):
        """Get list of user's videos"""
        return wait_all_visible(self.driver, self.VIDEO_LIST_ITEMS)
    
    def get_video_status(self, video_index=0):
        """Get status of a specific video"""
        videos = self.get_my_videos()
        if videos and len(videos) > video_index:
            try:
                return videos[video_index].find_element(*self.STATUS_BADGE).text
            except:
                return None
        return None
    
    def is_my_videos_section_visible(self):
        """Check if My Videos section is visible"""
        try:
            wait_visible(self.driver, self.MY_VIDEOS_SECTION)
            return True
        except:
            return False 
    # Upload elements
    UPLOAD_BTN = (By.CSS_SELECTOR, "[data-testid='upload-video-btn']")
    FILE_INPUT = (By.CSS_SELECTOR, "input[type='file']")
    TITLE_INPUT = (By.CSS_SELECTOR, "input[name='title']")
    DESCRIPTION_INPUT = (By.CSS_SELECTOR, "textarea[name='description']")
    MODULE_SELECT = (By.CSS_SELECTOR, "select[name='module']")
    SUBMIT_UPLOAD_BTN = (By.CSS_SELECTOR, "[data-testid='submit-upload-btn']")
    
    # Video list elements
    MY_VIDEOS_SECTION = (By.CSS_SELECTOR, ".my-videos")
    VIDEO_ITEM = (By.CSS_SELECTOR, ".video-item")
    VIDEO_TITLE = (By.CSS_SELECTOR, ".video-title")
    VIDEO_STATUS = (By.CSS_SELECTOR, ".video-status")
    EDIT_BTN = (By.CSS_SELECTOR, ".edit-video-btn")
    DELETE_BTN = (By.CSS_SELECTOR, ".delete-video-btn")
    
    # Status badges
    DRAFT_STATUS = (By.CSS_SELECTOR, ".status-draft")
    PUBLISHED_STATUS = (By.CSS_SELECTOR, ".status-published")
    PENDING_STATUS = (By.CSS_SELECTOR, ".status-pending")
    
    # Upload progress
    UPLOAD_PROGRESS = (By.CSS_SELECTOR, ".upload-progress")
    UPLOAD_SUCCESS = (By.CSS_SELECTOR, ".upload-success")
    UPLOAD_ERROR = (By.CSS_SELECTOR, ".upload-error")
    
    def __init__(self, driver, base_url):
        super().__init__(driver, base_url)
    
    def open(self):
        self.driver.get(f"{self.base_url}/tutoring")
    
    def click_upload_video(self):
        self.driver.find_element(*self.UPLOAD_BTN).click()
    
    def select_video_file(self, file_path):
        file_input = self.driver.find_element(*self.FILE_INPUT)
        file_input.send_keys(file_path)
    
    def enter_video_title(self, title):
        self.driver.find_element(*self.TITLE_INPUT).send_keys(title)
    
    def enter_video_description(self, description):
        self.driver.find_element(*self.DESCRIPTION_INPUT).send_keys(description)
    
    def select_module(self, module_code):
        module_select = self.driver.find_element(*self.MODULE_SELECT)
        module_select.click()
        # Find and click the option
        option = self.driver.find_element(By.CSS_SELECTOR, f"option[value='{module_code}']")
        option.click()
    
    def submit_upload(self):
        self.driver.find_element(*self.SUBMIT_UPLOAD_BTN).click()
    
    def upload_video(self, file_path, title, description, module_code):
        self.click_upload_video()
        self.select_video_file(file_path)
        self.enter_video_title(title)
        self.enter_video_description(description)
        self.select_module(module_code)
        self.submit_upload()
    
    def get_my_videos(self):
        return self.driver.find_elements(*self.VIDEO_ITEM)
    
    def get_video_titles(self):
        titles = []
        for video in self.get_my_videos():
            try:
                title = video.find_element(*self.VIDEO_TITLE).text
                titles.append(title)
            except:
                continue
        return titles
    
    def get_video_statuses(self):
        statuses = []
        for video in self.get_my_videos():
            try:
                status = video.find_element(*self.VIDEO_STATUS).text
                statuses.append(status)
            except:
                continue
        return statuses
    
    def edit_first_video(self):
        videos = self.get_my_videos()
        if videos:
            videos[0].find_element(*self.EDIT_BTN).click()
            return True
        return False
    
    def delete_first_video(self):
        videos = self.get_my_videos()
        if videos:
            videos[0].find_element(*self.DELETE_BTN).click()
            return True
        return False
    
    def wait_for_upload_complete(self, timeout=60):
        try:
            WebDriverWait(self.driver, timeout).until(
                EC.any_of(
                    EC.visibility_of_element_located(self.UPLOAD_SUCCESS),
                    EC.visibility_of_element_located(self.UPLOAD_ERROR)
                )
            )
            return True
        except:
            return False
    
    def is_upload_successful(self):
        return len(self.driver.find_elements(*self.UPLOAD_SUCCESS)) > 0
    
    def get_upload_error(self):
        try:
            return self.driver.find_element(*self.UPLOAD_ERROR).text
        except:
            return None 