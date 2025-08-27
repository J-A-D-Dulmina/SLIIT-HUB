from selenium.webdriver.common.by import By
from .base_page import BasePage
from ..helpers.waits import wait_visible, wait_all_visible

class MeetingsPage(BasePage):
    """Page Object for Meetings Page"""
    
    # Locators
    CREATE_MEETING_FORM = (By.CSS_SELECTOR, ".create-meeting-form, form")
    MEETING_TITLE_INPUT = (By.CSS_SELECTOR, "input[name='title'], input[placeholder*='title']")
    MEETING_DATE_INPUT = (By.CSS_SELECTOR, "input[type='date']")
    MEETING_TIME_INPUT = (By.CSS_SELECTOR, "input[type='time']")
    MEETING_TYPE_SELECT = (By.CSS_SELECTOR, "select[name='type'], select")
    MEETING_DESCRIPTION_INPUT = (By.CSS_SELECTOR, "textarea[name='description'], textarea[placeholder*='description']")
    CREATE_BTN = (By.CSS_SELECTOR, "button[type='submit'], .create-btn")
    MEETINGS_LIST = (By.CSS_SELECTOR, ".meetings-list, .meeting-list")
    MEETING_ITEMS = (By.CSS_SELECTOR, ".meeting-item, .meeting-card")
    JOIN_BTN = (By.CSS_SELECTOR, ".join-btn, button[onclick*='join']")
    EDIT_BTN = (By.CSS_SELECTOR, ".edit-btn, button[onclick*='edit']")
    DELETE_BTN = (By.CSS_SELECTOR, ".delete-btn, button[onclick*='delete']")
    
    def open(self, base_url):
        """Open the meetings page"""
        self.driver.get(f"{base_url}/meetings")
    
    def is_create_form_visible(self):
        """Check if create meeting form is visible"""
        try:
            wait_visible(self.driver, self.CREATE_MEETING_FORM)
            return True
        except:
            return False
    
    def create_meeting(self, title, date, time, meeting_type, description):
        """Create a new meeting with given details"""
        # Fill form
        wait_visible(self.driver, self.MEETING_TITLE_INPUT).send_keys(title)
        wait_visible(self.driver, self.MEETING_DATE_INPUT).send_keys(date)
        wait_visible(self.driver, self.MEETING_TIME_INPUT).send_keys(time)
        
        # Select meeting type
        type_select = wait_visible(self.driver, self.MEETING_TYPE_SELECT)
        type_select.click()
        type_option = self.driver.find_element(By.XPATH, f"//option[contains(text(), '{meeting_type}')]")
        type_option.click()
        
        # Fill description
        wait_visible(self.driver, self.MEETING_DESCRIPTION_INPUT).send_keys(description)
        
        # Submit
        wait_visible(self.driver, self.CREATE_BTN).click()
    
    def get_meetings_list(self):
        """Get list of meetings"""
        return wait_all_visible(self.driver, self.MEETING_ITEMS)
    
    def join_first_meeting(self):
        """Join the first meeting in the list"""
        meetings = self.get_meetings_list()
        if meetings:
            try:
                meetings[0].find_element(*self.JOIN_BTN).click()
                return True
            except:
                return False
        return False
    
    def edit_first_meeting(self):
        """Edit the first meeting in the list"""
        meetings = self.get_meetings_list()
        if meetings:
            try:
                meetings[0].find_element(*self.EDIT_BTN).click()
                return True
            except:
                return False
        return False
    
    def delete_first_meeting(self):
        """Delete the first meeting in the list"""
        meetings = self.get_meetings_list()
        if meetings:
            try:
                meetings[0].find_element(*self.DELETE_BTN).click()
                return True
            except:
                return False
        return False
    
    def is_meetings_list_visible(self):
        """Check if meetings list is visible"""
        try:
            wait_visible(self.driver, self.MEETINGS_LIST)
            return True
        except:
            return False 
    # Meeting creation elements
    CREATE_MEETING_BTN = (By.CSS_SELECTOR, "[data-testid='create-meeting-btn']")
    MEETING_TITLE_INPUT = (By.CSS_SELECTOR, "input[name='title']")
    MEETING_DESCRIPTION_INPUT = (By.CSS_SELECTOR, "textarea[name='description']")
    MEETING_DATE_INPUT = (By.CSS_SELECTOR, "input[name='date']")
    MEETING_TIME_INPUT = (By.CSS_SELECTOR, "input[name='time']")
    MEETING_DURATION_INPUT = (By.CSS_SELECTOR, "input[name='duration']")
    MEETING_TYPE_SELECT = (By.CSS_SELECTOR, "select[name='meetingType']")
    SUBMIT_MEETING_BTN = (By.CSS_SELECTOR, "[data-testid='submit-meeting-btn']")
    
    # Meeting list elements
    MEETINGS_LIST = (By.CSS_SELECTOR, ".meetings-list")
    MEETING_ITEM = (By.CSS_SELECTOR, ".meeting-item")
    MEETING_TITLE = (By.CSS_SELECTOR, ".meeting-title")
    MEETING_DATE = (By.CSS_SELECTOR, ".meeting-date")
    MEETING_TIME = (By.CSS_SELECTOR, ".meeting-time")
    MEETING_STATUS = (By.CSS_SELECTOR, ".meeting-status")
    
    # Meeting actions
    JOIN_MEETING_BTN = (By.CSS_SELECTOR, ".join-meeting-btn")
    EDIT_MEETING_BTN = (By.CSS_SELECTOR, ".edit-meeting-btn")
    DELETE_MEETING_BTN = (By.CSS_SELECTOR, ".delete-meeting-btn")
    
    # Meeting status
    UPCOMING_STATUS = (By.CSS_SELECTOR, ".status-upcoming")
    ONGOING_STATUS = (By.CSS_SELECTOR, ".status-ongoing")
    COMPLETED_STATUS = (By.CSS_SELECTOR, ".status-completed")
    
    # Meeting creation success/error
    MEETING_SUCCESS = (By.CSS_SELECTOR, ".meeting-success")
    MEETING_ERROR = (By.CSS_SELECTOR, ".meeting-error")
    
    def __init__(self, driver, base_url):
        super().__init__(driver, base_url)
    
    def open(self):
        self.driver.get(f"{self.base_url}/meetings")
    
    def click_create_meeting(self):
        self.driver.find_element(*self.CREATE_MEETING_BTN).click()
    
    def enter_meeting_title(self, title):
        self.driver.find_element(*self.MEETING_TITLE_INPUT).send_keys(title)
    
    def enter_meeting_description(self, description):
        self.driver.find_element(*self.MEETING_DESCRIPTION_INPUT).send_keys(description)
    
    def enter_meeting_date(self, date):
        self.driver.find_element(*self.MEETING_DATE_INPUT).send_keys(date)
    
    def enter_meeting_time(self, time):
        self.driver.find_element(*self.MEETING_TIME_INPUT).send_keys(time)
    
    def enter_meeting_duration(self, duration):
        self.driver.find_element(*self.MEETING_DURATION_INPUT).send_keys(duration)
    
    def select_meeting_type(self, meeting_type):
        type_select = self.driver.find_element(*self.MEETING_TYPE_SELECT)
        type_select.click()
        option = self.driver.find_element(By.CSS_SELECTOR, f"option[value='{meeting_type}']")
        option.click()
    
    def submit_meeting(self):
        self.driver.find_element(*self.SUBMIT_MEETING_BTN).click()
    
    def create_meeting(self, title, description, date, time, duration, meeting_type):
        self.click_create_meeting()
        self.enter_meeting_title(title)
        self.enter_meeting_description(description)
        self.enter_meeting_date(date)
        self.enter_meeting_time(time)
        self.enter_meeting_duration(duration)
        self.select_meeting_type(meeting_type)
        self.submit_meeting()
    
    def get_meetings(self):
        return self.driver.find_elements(*self.MEETING_ITEM)
    
    def get_meeting_titles(self):
        titles = []
        for meeting in self.get_meetings():
            try:
                title = meeting.find_element(*self.MEETING_TITLE).text
                titles.append(title)
            except:
                continue
        return titles
    
    def get_meeting_dates(self):
        dates = []
        for meeting in self.get_meetings():
            try:
                date = meeting.find_element(*self.MEETING_DATE).text
                dates.append(date)
            except:
                continue
        return dates
    
    def get_meeting_statuses(self):
        statuses = []
        for meeting in self.get_meetings():
            try:
                status = meeting.find_element(*self.MEETING_STATUS).text
                statuses.append(status)
            except:
                continue
        return statuses
    
    def join_first_meeting(self):
        meetings = self.get_meetings()
        if meetings:
            meetings[0].find_element(*self.JOIN_MEETING_BTN).click()
            return True
        return False
    
    def edit_first_meeting(self):
        meetings = self.get_meetings()
        if meetings:
            meetings[0].find_element(*self.EDIT_MEETING_BTN).click()
            return True
        return False
    
    def delete_first_meeting(self):
        meetings = self.get_meetings()
        if meetings:
            meetings[0].find_element(*self.DELETE_MEETING_BTN).click()
            return True
        return False
    
    def wait_for_meeting_creation(self, timeout=10):
        try:
            WebDriverWait(self.driver, timeout).until(
                EC.any_of(
                    EC.visibility_of_element_located(self.MEETING_SUCCESS),
                    EC.visibility_of_element_located(self.MEETING_ERROR)
                )
            )
            return True
        except:
            return False
    
    def is_meeting_created_successfully(self):
        return len(self.driver.find_elements(*self.MEETING_SUCCESS)) > 0
    
    def get_meeting_creation_error(self):
        try:
            return self.driver.find_element(*self.MEETING_ERROR).text
        except:
            return None 