#!/usr/bin/env python3
"""
Test script to verify video file access from server uploads directory
"""

import requests
import os
import sys

def test_video_file_access():
    """Test accessing video files from the server uploads directory"""
    
    # Server configuration
    SERVER_URL = "http://localhost:5000"
    VIDEO_ID = "1750982251814-685619044"
    
    # Test patterns
    test_patterns = [
        f"{SERVER_URL}/uploads/videos/videoFile-{VIDEO_ID}.mp4",
        f"{SERVER_URL}/uploads/videos/{VIDEO_ID}.mp4",
        f"{SERVER_URL}/uploads/videos/video-{VIDEO_ID}.mp4"
    ]
    
    print("🔍 Testing video file access from server uploads directory...")
    print(f"Server URL: {SERVER_URL}")
    print(f"Video ID: {VIDEO_ID}")
    print()
    
    success = False
    
    for i, pattern in enumerate(test_patterns, 1):
        print(f"Test {i}: {pattern}")
        try:
            response = requests.head(pattern, timeout=10)
            if response.status_code == 200:
                print(f"✅ SUCCESS: Video file found!")
                print(f"   Content-Length: {response.headers.get('content-length', 'Unknown')} bytes")
                print(f"   Content-Type: {response.headers.get('content-type', 'Unknown')}")
                success = True
                break
            else:
                print(f"❌ FAILED: Status code {response.status_code}")
        except requests.exceptions.RequestException as e:
            print(f"❌ ERROR: {e}")
        print()
    
    if not success:
        print("❌ All video file access tests failed!")
        print("\nTroubleshooting:")
        print("1. Make sure the Node.js server is running on port 5000")
        print("2. Check that video files exist in server/uploads/videos/")
        print("3. Verify the server is serving static files correctly")
        return False
    
    print("🎉 Video file access test completed successfully!")
    return True

def test_python_service_health():
    """Test if the Python AI service is running"""
    
    PYTHON_SERVICE_URL = "http://localhost:5001"
    
    print("\n🔍 Testing Python AI service health...")
    print(f"Service URL: {PYTHON_SERVICE_URL}")
    print()
    
    try:
        response = requests.get(f"{PYTHON_SERVICE_URL}/health", timeout=5)
        if response.status_code == 200:
            print("✅ Python AI service is running!")
            return True
        else:
            print(f"❌ Python AI service returned status {response.status_code}")
            return False
    except requests.exceptions.RequestException as e:
        print(f"❌ Python AI service is not running: {e}")
        print("\nTo start the Python service:")
        print("cd python_services")
        print("venv\\Scripts\\activate.bat")
        print("python api.py")
        return False

def main():
    """Run all tests"""
    
    print("🚀 SLIIT-HUB Video File Access Test")
    print("=" * 50)
    
    # Test video file access
    video_access_ok = test_video_file_access()
    
    # Test Python service
    python_service_ok = test_python_service_health()
    
    print("\n" + "=" * 50)
    print("📊 Test Results Summary:")
    print(f"Video File Access: {'✅ PASS' if video_access_ok else '❌ FAIL'}")
    print(f"Python AI Service: {'✅ PASS' if python_service_ok else '❌ FAIL'}")
    
    if video_access_ok and python_service_ok:
        print("\n🎉 All tests passed! Your system is ready for AI video processing.")
        print("\nNext steps:")
        print("1. Start the React frontend: cd client && npm start")
        print("2. Navigate to a video list page")
        print("3. Click AI generation buttons on video cards")
    else:
        print("\n⚠️  Some tests failed. Please check the issues above.")
        return 1
    
    return 0

if __name__ == "__main__":
    sys.exit(main()) 