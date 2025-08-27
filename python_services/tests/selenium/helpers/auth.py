def set_student_local_storage(driver, student_id, student_name):
    """Set localStorage to simulate student login"""
    driver.execute_script("""
        localStorage.setItem('user', JSON.stringify({
            id: arguments[0],
            name: arguments[1],
            role: 'student',
            email: 'student@example.com'
        }));
        localStorage.setItem('token', 'fake-token-for-testing');
    """, student_id, student_name)