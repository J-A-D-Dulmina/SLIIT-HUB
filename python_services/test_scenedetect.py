#!/usr/bin/env python3
"""
Test script to verify PySceneDetect installation and API compatibility
"""

import sys
import os

def test_scenedetect_imports():
    """Test if PySceneDetect can be imported correctly"""
    try:
        print("Testing PySceneDetect imports...")
        
        from scenedetect import detect, ContentDetector, AdaptiveDetector, ThresholdDetector
        print("✅ Basic detectors and detect function imported successfully")
        
        from scenedetect.scene_manager import SceneManager
        from scenedetect.stats_manager import StatsManager
        print("✅ Scene and stats managers imported successfully")
        
        return True
        
    except ImportError as e:
        print(f"❌ Import error: {e}")
        return False
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        return False

def test_detect_function():
    """Test the modern detect function"""
    try:
        print("\nTesting modern detect function...")
        
        from scenedetect import detect, ContentDetector, AdaptiveDetector, ThresholdDetector
        
        # Test if we can create detectors
        content_detector = ContentDetector(threshold=27.0)
        adaptive_detector = AdaptiveDetector()
        threshold_detector = ThresholdDetector(threshold=12)
        
        print("✅ All detector types created successfully")
        
        # Test if detect function exists and is callable
        if callable(detect):
            print("✅ detect function is callable")
        else:
            print("❌ detect function is not callable")
            return False
        
        return True
        
    except Exception as e:
        print(f"❌ Detect function test failed: {e}")
        return False

def test_scene_detector():
    """Test our custom SceneDetector class"""
    try:
        print("\nTesting custom SceneDetector...")
        
        from scene_detection.scene_detector import SceneDetector
        
        detector = SceneDetector()
        print("✅ SceneDetector instance created successfully")
        
        # Test timestamp conversion methods
        timestamp = detector._seconds_to_timestamp(125)
        print(f"✅ Timestamp conversion: 125s -> {timestamp}")
        
        seconds = detector._timestamp_to_seconds("02:05")
        print(f"✅ Timestamp conversion: 02:05 -> {seconds}s")
        
        return True
        
    except Exception as e:
        print(f"❌ SceneDetector test failed: {e}")
        return False

def test_ffprobe_availability():
    """Test if ffprobe is available for video info"""
    try:
        print("\nTesting ffprobe availability...")
        
        import subprocess
        
        # Test if ffprobe is available
        result = subprocess.run(['ffprobe', '-version'], capture_output=True, text=True)
        if result.returncode == 0:
            print("✅ ffprobe is available")
            return True
        else:
            print("❌ ffprobe is not available")
            return False
            
    except FileNotFoundError:
        print("❌ ffprobe not found in PATH")
        return False
    except Exception as e:
        print(f"❌ ffprobe test failed: {e}")
        return False

def main():
    """Run all tests"""
    print("PySceneDetect Compatibility Test")
    print("=" * 40)
    
    # Test imports
    if not test_scenedetect_imports():
        print("\n❌ Import tests failed. Please check PySceneDetect installation.")
        return False
    
    # Test detect function
    if not test_detect_function():
        print("\n❌ Detect function tests failed.")
        return False
    
    # Test our custom SceneDetector
    if not test_scene_detector():
        print("\n❌ SceneDetector tests failed.")
        return False
    
    # Test ffprobe availability
    if not test_ffprobe_availability():
        print("\n⚠️  ffprobe not available - video info may not work properly")
        print("   Install FFmpeg to enable video metadata extraction")
    
    print("\n✅ All tests passed! PySceneDetect is working correctly.")
    return True

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1) 