"""
Test configuration for Selenium tests
Provides consistent test data and environment settings
"""

import os
from dotenv import load_dotenv

# Load environment variables
env_path = os.path.join(os.path.dirname(__file__), '.env')
if not os.path.exists(env_path):
    env_path = os.path.join(os.path.dirname(__file__), 'env_template.txt')
load_dotenv(env_path)

class TestConfig:
    """Configuration class for Selenium tests"""
    
    # Base URLs
    BASE_URL = os.getenv('BASE_URL', 'http://localhost:3000')
    API_BASE_URL = os.getenv('API_BASE_URL', 'http://localhost:5000')
    
    # Test user credentials
    STUDENT_ID = os.getenv('STUDENT_ID', 'ST001')
    STUDENT_NAME = os.getenv('STUDENT_NAME', 'John Doe')
    STUDENT_PASSWORD = os.getenv('STUDENT_PASSWORD', 'password123')
    STUDENT_EMAIL = os.getenv('STUDENT_EMAIL', 'student@example.com')
    
    ADMIN_EMAIL = os.getenv('ADMIN_EMAIL', 'admin@example.com')
    ADMIN_PASSWORD = os.getenv('ADMIN_PASSWORD', 'admin123')
    ADMIN_NAME = os.getenv('ADMIN_NAME', 'Admin User')
    
    LECTURER_ID = os.getenv('LECTURER_ID', 'L001')
    LECTURER_NAME = os.getenv('LECTURER_NAME', 'Dr. Jane Smith')
    LECTURER_PASSWORD = os.getenv('LECTURER_PASSWORD', 'lecturer123')
    LECTURER_EMAIL = os.getenv('LECTURER_EMAIL', 'lecturer@example.com')
    
    # Test data
    MODULE_CODE = os.getenv('MODULE_CODE', 'CS101')
    DEGREE_ID = os.getenv('DEGREE_ID', 'D001')
    YEAR_ID = os.getenv('YEAR_ID', 'Y001')
    
    # Browser settings
    HEADLESS = os.getenv('HEADLESS', 'false').lower() == 'true'
    BROWSER_TIMEOUT = int(os.getenv('BROWSER_TIMEOUT', '30'))
    IMPLICIT_WAIT = int(os.getenv('IMPLICIT_WAIT', '10'))
    
    # Test settings
    SCREENSHOT_ON_FAILURE = os.getenv('SCREENSHOT_ON_FAILURE', 'true').lower() == 'true'
    VIDEO_RECORDING = os.getenv('VIDEO_RECORDING', 'false').lower() == 'true'
    
    @classmethod
    def get_student_user_data(cls):
        """Get student user data for testing"""
        return {
            'id': cls.STUDENT_ID,
            'name': cls.STUDENT_NAME,
            'email': cls.STUDENT_EMAIL,
            'userType': 'student',
            'studentId': cls.STUDENT_ID,
            'password': cls.STUDENT_PASSWORD
        }
    
    @classmethod
    def get_admin_user_data(cls):
        """Get admin user data for testing"""
        return {
            'id': 'ADMIN001',
            'name': cls.ADMIN_NAME,
            'email': cls.ADMIN_EMAIL,
            'userType': 'admin',
            'password': cls.ADMIN_PASSWORD
        }
    
    @classmethod
    def get_lecturer_user_data(cls):
        """Get lecturer user data for testing"""
        return {
            'id': cls.LECTURER_ID,
            'name': cls.LECTURER_NAME,
            'email': cls.LECTURER_EMAIL,
            'userType': 'lecturer',
            'lecturerId': cls.LECTURER_ID,
            'password': cls.LECTURER_PASSWORD
        }
    
    @classmethod
    def get_mock_api_response(cls, user_type='student'):
        """Get mock API response for authentication"""
        if user_type == 'student':
            user_data = cls.get_student_user_data()
        elif user_type == 'admin':
            user_data = cls.get_admin_user_data()
        elif user_type == 'lecturer':
            user_data = cls.get_lecturer_user_data()
        else:
            user_data = cls.get_student_user_data()
        
        return {
            'ok': True,
            'status': 200,
            'json': lambda: {
                'user': user_data
            }
        }
    
    @classmethod
    def get_local_storage_data(cls, user_type='student'):
        """Get localStorage data for testing"""
        if user_type == 'student':
            user_data = cls.get_student_user_data()
        elif user_type == 'admin':
            user_data = cls.get_admin_user_data()
        elif user_type == 'lecturer':
            user_data = cls.get_lecturer_user_data()
        else:
            user_data = cls.get_student_user_data()
        
        return {
            'userInfo': user_data,
            'userType': user_data['userType'],
            'token': 'fake-token-for-testing'
        }







