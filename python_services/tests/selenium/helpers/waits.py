from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.by import By
from selenium.common.exceptions import TimeoutException, NoSuchElementException

def wait_visible(driver, locator, timeout=10):
    """Wait for element to be visible and return it"""
    try:
        wait = WebDriverWait(driver, timeout)
        return wait.until(EC.visibility_of_element_located(locator))
    except TimeoutException:
        print(f"Timeout waiting for element: {locator}")
        raise

def wait_clickable(driver, locator, timeout=10):
    """Wait for element to be clickable and return it"""
    try:
        wait = WebDriverWait(driver, timeout)
        return wait.until(EC.element_to_be_clickable(locator))
    except TimeoutException:
        print(f"Timeout waiting for clickable element: {locator}")
        raise

def wait_all_visible(driver, locator, timeout=10):
    """Wait for all elements to be visible and return them"""
    try:
        wait = WebDriverWait(driver, timeout)
        return wait.until(EC.visibility_of_all_elements_located(locator))
    except TimeoutException:
        print(f"Timeout waiting for all elements: {locator}")
        raise

def safe_find_element(driver, locator, timeout=5):
    """Safely find an element, return None if not found"""
    try:
        wait = WebDriverWait(driver, timeout)
        return wait.until(EC.presence_of_element_located(locator))
    except TimeoutException:
        return None

def safe_find_elements(driver, locator, timeout=5):
    """Safely find elements, return empty list if not found"""
    try:
        wait = WebDriverWait(driver, timeout)
        return wait.until(EC.presence_of_all_elements_located(locator))
    except TimeoutException:
        return []