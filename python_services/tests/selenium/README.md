# Selenium Test Suite

This directory contains automated Selenium tests for the SLIIT HUB application.

## Test Structure

```
tests/selenium/
├── config/                 # Test configuration
│   ├── test_config.py     # Centralized test configuration
│   ├── .env              # Environment variables (create this)
│   └── env_template.txt  # Template for environment variables
├── helpers/               # Test utilities
│   └── waits.py          # Custom wait functions
├── pages/                 # Page Object Models
│   ├── base_page.py      # Base page class
│   ├── login_page.py     # Login page interactions
│   ├── dashboard_page.py # Dashboard page interactions
│   └── admin_dashboard_page.py # Admin dashboard interactions
├── suites/                # Test suites
│   ├── test_smoke.py     # Basic smoke tests
│   ├── test_login_flows.py # Login functionality tests
│   ├── test_dashboard_navigation.py # Dashboard navigation tests
│   └── ...               # Other test suites
├── conftest.py           # Pytest configuration and fixtures
├── debug_tests.py        # Debug script for troubleshooting
└── README.md            # This file
```

## Quick Start

### 1. Setup Environment

```bash
# Navigate to python_services directory
cd python_services

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Unix/Linux/Mac:
source venv/bin/activate

# Install dependencies (if not already installed)
pip install -r requirements.txt
```

### 2. Configure Test Environment

Create a `.env` file in `tests/selenium/config/`:

```bash
# Copy template
cp tests/selenium/config/env_template.txt tests/selenium/config/.env

# Edit the .env file with your test data
```

Example `.env` content:
```env
BASE_URL=http://localhost:3000
API_BASE_URL=http://localhost:5000
STUDENT_ID=ST001
STUDENT_NAME=John Doe
STUDENT_PASSWORD=password123
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=admin123
HEADLESS=false
```

### 3. Start the Application

Make sure both the React app and backend server are running:

```bash
# Terminal 1: Start React app
cd client
npm start

# Terminal 2: Start backend server
cd server
npm start
```

### 4. Run Tests

Use the test runner script:

```bash
# Run smoke tests (default)
python run_tests.py

# Run all tests
python run_tests.py --all

# Run specific test file
python run_tests.py --test test_dashboard_navigation.py

# Run with verbose output
python run_tests.py --test test_dashboard_navigation.py --verbose

# Run debug test to check login simulation
python run_tests.py --debug

# Check prerequisites only
python run_tests.py --check
```

## Troubleshooting Failing Tests

### Common Issues After Login

If tests are failing after login but work manually, here are the most common causes and solutions:

#### 1. Authentication Issues

**Problem**: Tests fail because the React app expects real API responses but tests are using mocked data.

**Solution**: The updated test fixtures now properly mock the `/api/protected` endpoint and set up localStorage correctly.

**Debug**: Run the debug test to see what's happening:
```bash
python run_tests.py --debug
```

#### 2. Element Not Found Errors

**Problem**: Tests can't find elements because the page structure has changed or elements load asynchronously.

**Solution**: 
- Check the CSS selectors in page objects match the actual React components
- Add proper wait conditions for dynamic content
- Use the debug script to inspect the page structure

#### 3. Timing Issues

**Problem**: Tests run too fast and don't wait for elements to load.

**Solution**: The updated page objects now include proper wait conditions and fallback mechanisms.

### Debugging Steps

#### Step 1: Run Debug Test

```bash
python run_tests.py --debug
```

This will:
- Open a browser window
- Show the login simulation process
- Display what elements are found/not found
- Wait for you to inspect the page

#### Step 2: Check Page Structure

If the debug test shows elements are missing, inspect the actual React components:

1. Open the React app in your browser
2. Log in manually
3. Use browser dev tools to inspect the elements
4. Update the CSS selectors in the page objects if needed

#### Step 3: Check Console Errors

Look for JavaScript errors in the browser console that might indicate:
- API call failures
- Authentication issues
- Missing dependencies

#### Step 4: Verify Test Data

Make sure the test configuration matches your application:

```python
# Check test_config.py
from tests.selenium.config.test_config import TestConfig

print(TestConfig.get_student_user_data())
print(TestConfig.get_local_storage_data('student'))
```

### Manual Testing vs Automated Testing

If tests fail but manual testing works, the issue is likely:

1. **Different test data**: Manual tests use real data, automated tests use mock data
2. **Timing differences**: Manual testing is slower, automated testing is faster
3. **Browser state**: Manual testing starts with a clean browser, automated testing might have cached data
4. **API responses**: Manual testing uses real API, automated testing uses mocked responses

### Fixing Specific Issues

#### Issue: "Side menu not found"

**Cause**: The React app hasn't loaded the dashboard properly or authentication failed.

**Solution**:
1. Check if the React app is running on the correct port
2. Verify the authentication mock is working
3. Add longer wait times for page load
4. Check for JavaScript errors in console

#### Issue: "Navigation failed"

**Cause**: The navigation links don't match the actual React router paths.

**Solution**:
1. Check the actual routes in `client/src/routes.js`
2. Update the navigation methods in page objects
3. Verify the URL patterns match

#### Issue: "Element not clickable"

**Cause**: Element is present but not yet clickable (overlay, loading state, etc.)

**Solution**:
1. Add explicit waits for element to be clickable
2. Check for loading spinners or overlays
3. Add retry logic for flaky elements

## Test Configuration

### Environment Variables

Key environment variables in `tests/selenium/config/.env`:

- `BASE_URL`: URL of the React app (default: http://localhost:3000)
- `API_BASE_URL`: URL of the backend API (default: http://localhost:5000)
- `STUDENT_ID`, `STUDENT_NAME`, `STUDENT_PASSWORD`: Test student credentials
- `ADMIN_EMAIL`, `ADMIN_PASSWORD`: Test admin credentials
- `HEADLESS`: Run browser in headless mode (true/false)

### Test Data

Test data is centralized in `TestConfig` class:

```python
from tests.selenium.config.test_config import TestConfig

# Get student data
student_data = TestConfig.get_student_user_data()

# Get admin data
admin_data = TestConfig.get_admin_user_data()

# Get localStorage setup
storage_data = TestConfig.get_local_storage_data('student')
```

## Best Practices

1. **Use Page Objects**: All page interactions should go through page objects
2. **Add Proper Waits**: Don't use `time.sleep()`, use explicit waits
3. **Handle Errors Gracefully**: Add try-catch blocks and fallback mechanisms
4. **Keep Tests Independent**: Each test should be able to run independently
5. **Use Descriptive Assertions**: Make test failures easy to understand
6. **Mock External Dependencies**: Don't rely on real API calls in tests

## Running Tests in CI/CD

For continuous integration, set these environment variables:

```bash
HEADLESS=true
BASE_URL=http://your-test-server:3000
API_BASE_URL=http://your-test-server:5000
```

## Support

If you're still having issues:

1. Run the debug test and check the output
2. Compare the test behavior with manual testing
3. Check the browser console for errors
4. Verify all prerequisites are met
5. Update the page objects if the React app structure has changed