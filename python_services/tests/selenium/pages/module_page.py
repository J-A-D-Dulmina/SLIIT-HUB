from selenium.webdriver.common.by import By
import time

class ModulePage:
    VIDEO_CARD = (By.CSS_SELECTOR, ".video-card")

    def __init__(self, driver, base_url, module_code):
        self.driver = driver
        self.base_url = base_url
        self.module_code = module_code

    def open(self):
        self.driver.get(f"{self.base_url}/module/{self.module_code}")
        time.sleep(1)

    def get_video_cards(self):
        return self.driver.find_elements(*self.VIDEO_CARD)

    def open_first_video(self):
        cards = self.get_video_cards()
        if not cards:
            return False
        cards[0].click()
        return True